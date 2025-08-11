"""
Data Export Service
Phase 3: Advanced UI Features - Backend service for comprehensive data export

Features:
- Multiple format support (CSV, JSON, PDF, Excel, XML)
- Advanced data processing and formatting
- Large dataset handling with streaming
- Export templates and customization
- Progress tracking and async processing
"""

import csv
import json
import logging
import tempfile
from datetime import datetime
from io import BytesIO, StringIO
from typing import Any, Dict, List, Optional, Union
import asyncio
import uuid

# Optional dependencies for different formats
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False

try:
    import xml.etree.ElementTree as ET
    XML_AVAILABLE = True
except ImportError:
    XML_AVAILABLE = False

from pydantic import BaseModel
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class ExportField(BaseModel):
    key: str
    label: str
    type: str  # 'string', 'number', 'date', 'boolean', 'object'
    format: Optional[str] = None
    required: Optional[bool] = False

class ExportOptions(BaseModel):
    format: str  # 'csv', 'json', 'pdf', 'excel', 'xml'
    fields: List[str]
    filters: Dict[str, Any] = {}
    sorting: Dict[str, str] = {"field": "created_at", "direction": "desc"}
    pagination: Dict[str, Optional[int]] = {"limit": None, "offset": 0}
    formatting: Dict[str, Any] = {
        "date_format": "YYYY-MM-DD",
        "number_format": "0.00",
        "include_headers": True,
        "include_metadata": True
    }
    customization: Dict[str, Optional[str]] = {
        "filename": None,
        "title": None,
        "description": None,
        "watermark": None
    }

class ExportProgress(BaseModel):
    export_id: str
    status: str  # 'pending', 'processing', 'completed', 'failed'
    progress: int  # 0-100
    total_records: int
    processed_records: int
    created_at: str
    completed_at: Optional[str] = None
    file_path: Optional[str] = None
    error_message: Optional[str] = None

class DataExportService:
    """Service for handling data exports in multiple formats"""
    
    def __init__(self):
        self.active_exports: Dict[str, ExportProgress] = {}
        self.temp_dir = tempfile.gettempdir()
    
    async def create_export(
        self,
        data: List[Dict[str, Any]],
        available_fields: List[ExportField],
        options: ExportOptions
    ) -> str:
        """Create a new export job and return export ID"""
        
        export_id = str(uuid.uuid4())
        
        # Initialize progress tracking
        progress = ExportProgress(
            export_id=export_id,
            status="pending",
            progress=0,
            total_records=len(data),
            processed_records=0,
            created_at=datetime.now().isoformat()
        )
        
        self.active_exports[export_id] = progress
        
        # Start export process asynchronously
        asyncio.create_task(self._process_export(export_id, data, available_fields, options))
        
        return export_id
    
    async def _process_export(
        self,
        export_id: str,
        data: List[Dict[str, Any]],
        available_fields: List[ExportField],
        options: ExportOptions
    ):
        """Process the export asynchronously"""
        
        try:
            progress = self.active_exports[export_id]
            progress.status = "processing"
            
            # Filter and prepare data
            prepared_data = await self._prepare_data(data, available_fields, options, export_id)
            
            # Generate export file
            file_content = await self._generate_export_file(prepared_data, available_fields, options, export_id)
            
            # Save file to temp location
            filename = self._generate_filename(options)
            file_path = f"{self.temp_dir}/{export_id}_{filename}"
            
            if isinstance(file_content, bytes):
                with open(file_path, 'wb') as f:
                    f.write(file_content)
            else:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
            
            # Update progress
            progress.status = "completed"
            progress.progress = 100
            progress.completed_at = datetime.now().isoformat()
            progress.file_path = file_path
            
        except Exception as e:
            logger.error(f"Export {export_id} failed: {e}")
            progress = self.active_exports.get(export_id)
            if progress:
                progress.status = "failed"
                progress.error_message = str(e)
    
    async def _prepare_data(
        self,
        data: List[Dict[str, Any]],
        available_fields: List[ExportField],
        options: ExportOptions,
        export_id: str
    ) -> List[Dict[str, Any]]:
        """Prepare and filter data for export"""
        
        progress = self.active_exports[export_id]
        field_map = {f.key: f for f in available_fields}
        
        # Filter fields
        selected_fields = [f for f in available_fields if f.key in options.fields]
        
        prepared_data = []
        
        for i, record in enumerate(data):
            # Apply filters if any
            if options.filters and not self._record_matches_filters(record, options.filters):
                continue
            
            # Select and format fields
            prepared_record = {}
            for field in selected_fields:
                value = record.get(field.key)
                if value is not None:
                    prepared_record[field.key] = self._format_field_value(value, field, options)
                else:
                    prepared_record[field.key] = ""
            
            prepared_data.append(prepared_record)
            
            # Update progress every 100 records
            if i % 100 == 0:
                progress.processed_records = i
                progress.progress = min(int((i / len(data)) * 80), 80)  # 80% for data prep
        
        # Apply sorting
        if options.sorting["field"] in [f.key for f in selected_fields]:
            reverse = options.sorting.get("direction", "asc") == "desc"
            prepared_data.sort(
                key=lambda x: x.get(options.sorting["field"], ""),
                reverse=reverse
            )
        
        # Apply pagination
        start_idx = options.pagination.get("offset", 0)
        limit = options.pagination.get("limit")
        if limit:
            prepared_data = prepared_data[start_idx:start_idx + limit]
        elif start_idx > 0:
            prepared_data = prepared_data[start_idx:]
        
        progress.processed_records = len(prepared_data)
        progress.progress = 85
        
        return prepared_data
    
    def _record_matches_filters(self, record: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if a record matches the applied filters"""
        # Simple filter implementation - can be expanded
        for filter_key, filter_value in filters.items():
            if filter_key not in record:
                continue
                
            record_value = record[filter_key]
            
            # Handle different filter types
            if isinstance(filter_value, dict):
                # Range filter: {"min": 10, "max": 100}
                if "min" in filter_value and record_value < filter_value["min"]:
                    return False
                if "max" in filter_value and record_value > filter_value["max"]:
                    return False
            elif isinstance(filter_value, list):
                # Include filter: record value must be in list
                if record_value not in filter_value:
                    return False
            else:
                # Exact match filter
                if record_value != filter_value:
                    return False
        
        return True
    
    def _format_field_value(self, value: Any, field: ExportField, options: ExportOptions) -> str:
        """Format a field value based on its type and format options"""
        
        if value is None:
            return ""
        
        if field.type == "date":
            if isinstance(value, str):
                try:
                    date_obj = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    return str(value)
            elif isinstance(value, datetime):
                date_obj = value
            else:
                return str(value)
            
            date_format = options.formatting.get("date_format", "YYYY-MM-DD")
            if date_format == "YYYY-MM-DD":
                return date_obj.strftime("%Y-%m-%d")
            elif date_format == "MM/DD/YYYY":
                return date_obj.strftime("%m/%d/%Y")
            elif date_format == "DD/MM/YYYY":
                return date_obj.strftime("%d/%m/%Y")
            elif date_format == "YYYY-MM-DD HH:mm:ss":
                return date_obj.strftime("%Y-%m-%d %H:%M:%S")
            else:
                return date_obj.isoformat()
        
        elif field.type == "number":
            if isinstance(value, (int, float)):
                number_format = options.formatting.get("number_format", "0.00")
                if number_format == "0.00":
                    return f"{value:.2f}"
                elif number_format == "0":
                    return str(int(value))
                else:
                    return str(value)
            return str(value)
        
        elif field.type == "boolean":
            return "Yes" if value else "No"
        
        elif field.type == "object":
            return json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        
        else:
            return str(value)
    
    async def _generate_export_file(
        self,
        data: List[Dict[str, Any]],
        available_fields: List[ExportField],
        options: ExportOptions,
        export_id: str
    ) -> Union[str, bytes]:
        """Generate the export file in the requested format"""
        
        progress = self.active_exports[export_id]
        selected_fields = [f for f in available_fields if f.key in options.fields]
        
        if options.format == "csv":
            return self._generate_csv(data, selected_fields, options)
        elif options.format == "json":
            return self._generate_json(data, selected_fields, options)
        elif options.format == "pdf":
            return self._generate_pdf(data, selected_fields, options)
        elif options.format == "excel":
            return self._generate_excel(data, selected_fields, options)
        elif options.format == "xml":
            return self._generate_xml(data, selected_fields, options)
        else:
            raise ValueError(f"Unsupported export format: {options.format}")
    
    def _generate_csv(self, data: List[Dict[str, Any]], fields: List[ExportField], options: ExportOptions) -> str:
        """Generate CSV export"""
        
        output = StringIO()
        fieldnames = [f.key for f in fields]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        
        # Write headers if requested
        if options.formatting.get("include_headers", True):
            # Use field labels as headers
            header_row = {f.key: f.label for f in fields}
            writer.writerow(header_row)
        
        # Write data
        for record in data:
            writer.writerow(record)
        
        return output.getvalue()
    
    def _generate_json(self, data: List[Dict[str, Any]], fields: List[ExportField], options: ExportOptions) -> str:
        """Generate JSON export"""
        
        export_data = {
            "data": data,
            "metadata": {
                "total_records": len(data),
                "fields": [{"key": f.key, "label": f.label, "type": f.type} for f in fields],
                "export_date": datetime.now().isoformat(),
                "options": options.dict()
            } if options.formatting.get("include_metadata", True) else None
        }
        
        if not options.formatting.get("include_metadata", True):
            export_data = data
        
        return json.dumps(export_data, indent=2, default=str)
    
    def _generate_pdf(self, data: List[Dict[str, Any]], fields: List[ExportField], options: ExportOptions) -> bytes:
        """Generate PDF export"""
        
        if not REPORTLAB_AVAILABLE:
            raise HTTPException(status_code=500, detail="PDF export not available - reportlab not installed")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = options.customization.get("title", "Data Export")
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        elements.append(Paragraph(title, title_style))
        
        # Description
        description = options.customization.get("description", "")
        if description:
            elements.append(Paragraph(description, styles['Normal']))
            elements.append(Spacer(1, 12))
        
        # Prepare table data
        table_data = []
        
        # Headers
        if options.formatting.get("include_headers", True):
            headers = [f.label for f in fields]
            table_data.append(headers)
        
        # Data rows
        for record in data:
            row = [str(record.get(f.key, "")) for f in fields]
            table_data.append(row)
        
        # Create table
        if table_data:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        
        # Metadata
        if options.formatting.get("include_metadata", True):
            elements.append(Spacer(1, 20))
            metadata_style = ParagraphStyle(
                'Metadata',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.grey
            )
            metadata_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Total records: {len(data)}"
            elements.append(Paragraph(metadata_text, metadata_style))
        
        doc.build(elements)
        return buffer.getvalue()
    
    def _generate_excel(self, data: List[Dict[str, Any]], fields: List[ExportField], options: ExportOptions) -> bytes:
        """Generate Excel export"""
        
        if not XLSXWRITER_AVAILABLE:
            # Fallback to CSV if xlsxwriter not available
            csv_content = self._generate_csv(data, fields, options)
            return csv_content.encode('utf-8')
        
        buffer = BytesIO()
        workbook = xlsxwriter.Workbook(buffer, {'in_memory': True})
        worksheet = workbook.add_worksheet('Data')
        
        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D7E4BC',
            'border': 1
        })
        
        data_format = workbook.add_format({
            'border': 1
        })
        
        # Write headers
        if options.formatting.get("include_headers", True):
            for col, field in enumerate(fields):
                worksheet.write(0, col, field.label, header_format)
            start_row = 1
        else:
            start_row = 0
        
        # Write data
        for row_idx, record in enumerate(data):
            for col_idx, field in enumerate(fields):
                value = record.get(field.key, "")
                
                # Try to convert numbers for proper Excel formatting
                if field.type == "number" and isinstance(value, str):
                    try:
                        value = float(value)
                    except:
                        pass
                
                worksheet.write(start_row + row_idx, col_idx, value, data_format)
        
        # Auto-adjust column widths
        for col_idx, field in enumerate(fields):
            max_length = max(len(field.label), 10)
            worksheet.set_column(col_idx, col_idx, min(max_length, 30))
        
        workbook.close()
        return buffer.getvalue()
    
    def _generate_xml(self, data: List[Dict[str, Any]], fields: List[ExportField], options: ExportOptions) -> str:
        """Generate XML export"""
        
        if not XML_AVAILABLE:
            raise HTTPException(status_code=500, detail="XML export not available")
        
        # Create root element
        root = ET.Element("export")
        
        # Add metadata if requested
        if options.formatting.get("include_metadata", True):
            metadata = ET.SubElement(root, "metadata")
            ET.SubElement(metadata, "total_records").text = str(len(data))
            ET.SubElement(metadata, "export_date").text = datetime.now().isoformat()
            ET.SubElement(metadata, "format").text = "xml"
            
            fields_elem = ET.SubElement(metadata, "fields")
            for field in fields:
                field_elem = ET.SubElement(fields_elem, "field")
                field_elem.set("key", field.key)
                field_elem.set("type", field.type)
                field_elem.text = field.label
        
        # Add data
        data_elem = ET.SubElement(root, "data")
        
        for record in data:
            record_elem = ET.SubElement(data_elem, "record")
            for field in fields:
                field_elem = ET.SubElement(record_elem, field.key.replace(" ", "_"))
                field_elem.text = str(record.get(field.key, ""))
        
        # Convert to string
        tree = ET.ElementTree(root)
        xml_str = ET.tostring(root, encoding='unicode', xml_declaration=True)
        
        return xml_str
    
    def _generate_filename(self, options: ExportOptions) -> str:
        """Generate filename for export"""
        
        custom_filename = options.customization.get("filename")
        if custom_filename:
            return f"{custom_filename}.{options.format}"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"export_{timestamp}.{options.format}"
    
    async def get_export_progress(self, export_id: str) -> Optional[ExportProgress]:
        """Get export progress by ID"""
        return self.active_exports.get(export_id)
    
    async def get_export_file(self, export_id: str) -> Optional[bytes]:
        """Get the exported file content"""
        progress = self.active_exports.get(export_id)
        if not progress or progress.status != "completed" or not progress.file_path:
            return None
        
        try:
            with open(progress.file_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read export file {progress.file_path}: {e}")
            return None
    
    async def cleanup_old_exports(self, max_age_hours: int = 24):
        """Clean up old export files and progress tracking"""
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        
        expired_exports = []
        for export_id, progress in self.active_exports.items():
            created_time = datetime.fromisoformat(progress.created_at).timestamp()
            if created_time < cutoff_time:
                expired_exports.append(export_id)
        
        for export_id in expired_exports:
            progress = self.active_exports.pop(export_id, None)
            if progress and progress.file_path:
                try:
                    import os
                    os.remove(progress.file_path)
                except Exception as e:
                    logger.error(f"Failed to delete export file {progress.file_path}: {e}")

# Global service instance
export_service = DataExportService()

async def get_export_service() -> DataExportService:
    """Get the global export service instance"""
    return export_service
