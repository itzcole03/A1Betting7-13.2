"""
Persistence Lite PR: File Audit Store

Provides NDJSON file-based storage for inference audit data with automatic
flushing on SIGTERM signals for graceful shutdowns.
"""

import asyncio
import json
import os
import signal
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, TextIO
from dataclasses import asdict

from backend.utils.log_context import get_contextual_logger
from backend.utils.trace_utils import trace_span, add_span_tag, add_span_log
from backend.services.inference_service import PredictionResult

logger = get_contextual_logger(__name__)


class FileAuditStore:
    """
    File-based audit storage using NDJSON format with signal handling.
    
    Features:
    - NDJSON (Newline Delimited JSON) format for streaming writes
    - Automatic file rotation based on size or time
    - SIGTERM/SIGINT signal handling for graceful shutdown
    - Thread-safe append operations
    - Configurable flush intervals
    """

    def __init__(
        self,
        base_directory: Optional[str] = None,
        max_file_size_mb: int = 50,
        flush_interval_seconds: int = 30,
        auto_flush_on_signal: bool = True
    ):
        """
        Initialize file audit store.
        
        Args:
            base_directory: Base directory for audit files. Defaults to ./audit_logs
            max_file_size_mb: Maximum file size before rotation in MB
            flush_interval_seconds: Automatic flush interval
            auto_flush_on_signal: Enable SIGTERM/SIGINT flush handling
        """
        self.base_directory = Path(base_directory or "./audit_logs")
        self.max_file_size_mb = max_file_size_mb
        self.flush_interval_seconds = flush_interval_seconds
        self.auto_flush_on_signal = auto_flush_on_signal
        
        # Thread safety
        self._write_lock = threading.Lock()
        self._shutdown_event = threading.Event()
        
        # Current file tracking
        self._current_file: Optional[Path] = None
        self._current_file_handle: Optional[TextIO] = None
        self._records_in_current_file = 0
        
        # Buffer for pending writes
        self._write_buffer: List[str] = []
        self._max_buffer_size = 1000
        
        # Initialize storage
        self._initialize_storage()
        
        # Setup signal handlers
        if self.auto_flush_on_signal:
            self._setup_signal_handlers()
            
        # Start background flush task
        self._flush_task: Optional[asyncio.Task] = None
        self._start_flush_task()

    def _initialize_storage(self) -> None:
        """Initialize storage directory and current file."""
        with trace_span(
            "file_audit_init",
            service_name="audit_store",
            operation_name="initialize_storage"
        ) as span_id:
            try:
                # Create base directory
                self.base_directory.mkdir(parents=True, exist_ok=True)
                add_span_tag(span_id, "base_directory", str(self.base_directory))
                
                # Initialize current file
                self._rotate_file()
                
                add_span_tag(span_id, "initialization_success", True)
                logger.info(
                    "FileAuditStore initialized",
                    extra={
                        "base_directory": str(self.base_directory),
                        "max_file_size_mb": self.max_file_size_mb,
                        "flush_interval_seconds": self.flush_interval_seconds
                    }
                )
                
            except Exception as e:
                add_span_tag(span_id, "initialization_success", False)
                add_span_tag(span_id, "error", str(e))
                logger.error(f"Failed to initialize FileAuditStore: {e}")
                raise

    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(signum: int, frame) -> None:
            signal_name = "SIGTERM" if signum == signal.SIGTERM else "SIGINT"
            logger.info(f"Received {signal_name}, flushing audit store...")
            
            with trace_span(
                "signal_flush",
                service_name="audit_store",
                operation_name="signal_handler"
            ) as span_id:
                add_span_tag(span_id, "signal", signal_name)
                add_span_tag(span_id, "signal_number", signum)
                
                try:
                    self._shutdown_event.set()
                    self.flush()
                    self.close()
                    
                    add_span_tag(span_id, "flush_success", True)
                    logger.info(f"Audit store flushed successfully on {signal_name}")
                    
                except Exception as e:
                    add_span_tag(span_id, "flush_success", False)
                    add_span_tag(span_id, "error", str(e))
                    logger.error(f"Failed to flush audit store on {signal_name}: {e}")

        # Register signal handlers
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        
        logger.info("Signal handlers registered for graceful audit store shutdown")

    def _start_flush_task(self) -> None:
        """Start background flush task."""
        async def flush_loop():
            while not self._shutdown_event.is_set():
                try:
                    await asyncio.sleep(self.flush_interval_seconds)
                    if not self._shutdown_event.is_set():
                        await asyncio.get_event_loop().run_in_executor(None, self.flush)
                except Exception as e:
                    logger.error(f"Error in flush loop: {e}")

        try:
            loop = asyncio.get_event_loop()
            self._flush_task = loop.create_task(flush_loop())
            logger.debug("Background flush task started")
        except RuntimeError:
            # No event loop running, skip background flushing
            logger.debug("No event loop available, background flushing disabled")

    def _generate_filename(self) -> str:
        """Generate filename with timestamp."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        return f"inference_audit_{timestamp}.ndjson"

    def _rotate_file(self) -> None:
        """Rotate to a new audit file."""
        # Close current file if open
        if self._current_file_handle:
            self._current_file_handle.close()
            
        # Generate new filename
        new_filename = self._generate_filename()
        self._current_file = self.base_directory / new_filename
        
        # Open new file
        self._current_file_handle = open(self._current_file, 'a', encoding='utf-8')
        self._records_in_current_file = 0
        
        logger.info(
            "Audit file rotated",
            extra={
                "new_file": str(self._current_file),
                "file_size_limit_mb": self.max_file_size_mb
            }
        )

    def _should_rotate_file(self) -> bool:
        """Check if file should be rotated based on size."""
        if not self._current_file or not self._current_file.exists():
            return True
            
        file_size_mb = self._current_file.stat().st_size / (1024 * 1024)
        return file_size_mb >= self.max_file_size_mb

    def record_inference(self, result: PredictionResult) -> None:
        """
        Record inference result to file.
        
        Args:
            result: PredictionResult to record
        """
        with trace_span(
            "file_audit_record",
            service_name="audit_store",
            operation_name="record_inference"
        ) as span_id:
            add_span_tag(span_id, "request_id", result.request_id)
            add_span_tag(span_id, "model_version", result.model_version)
            
            try:
                # Convert to dictionary for JSON serialization
                record_dict = asdict(result)
                
                # Add file-specific metadata
                record_dict["recorded_at"] = datetime.utcnow().isoformat()
                record_dict["file_store_version"] = "1.0"
                
                # Convert to NDJSON line
                json_line = json.dumps(record_dict, separators=(',', ':'))
                
                with self._write_lock:
                    # Check if file rotation needed
                    if self._should_rotate_file():
                        self._rotate_file()
                    
                    # Buffer the write
                    self._write_buffer.append(json_line)
                    
                    # Flush if buffer is full
                    if len(self._write_buffer) >= self._max_buffer_size:
                        self._flush_buffer()
                
                add_span_tag(span_id, "record_success", True)
                add_span_tag(span_id, "buffer_size", len(self._write_buffer))
                
            except Exception as e:
                add_span_tag(span_id, "record_success", False)
                add_span_tag(span_id, "error", str(e))
                logger.error(
                    f"Failed to record inference to file: {e}",
                    extra={"request_id": result.request_id}
                )
                raise

    def _flush_buffer(self) -> None:
        """Flush write buffer to file (must be called with lock held)."""
        if not self._write_buffer or not self._current_file_handle:
            return
            
        try:
            # Write all buffered lines
            for line in self._write_buffer:
                self._current_file_handle.write(line + '\n')
                
            # Flush file handle
            self._current_file_handle.flush()
            os.fsync(self._current_file_handle.fileno())  # Force OS flush
            
            # Update counters
            self._records_in_current_file += len(self._write_buffer)
            records_written = len(self._write_buffer)
            
            # Clear buffer
            self._write_buffer.clear()
            
            logger.debug(
                f"Flushed {records_written} records to audit file",
                extra={
                    "records_written": records_written,
                    "total_records_in_file": self._records_in_current_file,
                    "current_file": str(self._current_file)
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to flush buffer to file: {e}")
            raise

    def flush(self) -> None:
        """
        Force flush all pending writes to disk.
        """
        with trace_span(
            "file_audit_flush",
            service_name="audit_store", 
            operation_name="flush"
        ) as span_id:
            with self._write_lock:
                try:
                    buffer_size = len(self._write_buffer)
                    add_span_tag(span_id, "buffer_size", buffer_size)
                    
                    if buffer_size > 0:
                        self._flush_buffer()
                        add_span_log(span_id, f"Flushed {buffer_size} records", "info")
                    
                    add_span_tag(span_id, "flush_success", True)
                    
                except Exception as e:
                    add_span_tag(span_id, "flush_success", False)
                    add_span_tag(span_id, "error", str(e))
                    logger.error(f"Failed to flush audit store: {e}")
                    raise

    def close(self) -> None:
        """
        Close the audit store and cleanup resources.
        """
        with trace_span(
            "file_audit_close",
            service_name="audit_store",
            operation_name="close"
        ) as span_id:
            try:
                # Set shutdown event
                self._shutdown_event.set()
                
                # Cancel flush task
                if self._flush_task and not self._flush_task.done():
                    self._flush_task.cancel()
                
                # Final flush
                self.flush()
                
                # Close file handle
                if self._current_file_handle:
                    self._current_file_handle.close()
                    self._current_file_handle = None
                
                add_span_tag(span_id, "close_success", True)
                logger.info("FileAuditStore closed successfully")
                
            except Exception as e:
                add_span_tag(span_id, "close_success", False)
                add_span_tag(span_id, "error", str(e))
                logger.error(f"Error closing FileAuditStore: {e}")

    def get_audit_files(self) -> List[Dict[str, Any]]:
        """
        Get list of audit files with metadata.
        
        Returns:
            List of audit file information dictionaries
        """
        audit_files = []
        
        try:
            for file_path in self.base_directory.glob("*.ndjson"):
                stat = file_path.stat()
                
                # Count lines in file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        line_count = sum(1 for _ in f)
                except Exception:
                    line_count = -1  # Error reading file
                
                audit_files.append({
                    "filename": file_path.name,
                    "full_path": str(file_path),
                    "size_bytes": stat.st_size,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "record_count": line_count
                })
                
        except Exception as e:
            logger.error(f"Error listing audit files: {e}")
            
        return sorted(audit_files, key=lambda x: x["created_at"], reverse=True)

    def read_records_from_file(
        self, 
        filename: str, 
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Read records from a specific audit file.
        
        Args:
            filename: Name of the audit file to read
            limit: Maximum number of records to read
            offset: Number of records to skip from the beginning
            
        Returns:
            List of inference record dictionaries
        """
        file_path = self.base_directory / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Audit file not found: {filename}")
        
        records = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # Skip offset lines
                for _ in range(offset):
                    next(f, None)
                
                # Read records up to limit
                for i, line in enumerate(f):
                    if limit and i >= limit:
                        break
                        
                    try:
                        record = json.loads(line.strip())
                        records.append(record)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON line in {filename}: {e}")
                        
        except Exception as e:
            logger.error(f"Error reading audit file {filename}: {e}")
            raise
            
        return records


# Global file audit store instance  
_file_audit_store: Optional[FileAuditStore] = None


def get_file_audit_store() -> FileAuditStore:
    """
    Get the global file audit store instance.
    
    Returns:
        FileAuditStore singleton instance
    """
    global _file_audit_store
    if _file_audit_store is None:
        # Configure from environment
        base_dir = os.getenv("A1_AUDIT_BASE_DIR", "./audit_logs")
        max_size_mb = int(os.getenv("A1_AUDIT_MAX_FILE_SIZE_MB", "50"))
        flush_interval = int(os.getenv("A1_AUDIT_FLUSH_INTERVAL_SEC", "30"))
        
        _file_audit_store = FileAuditStore(
            base_directory=base_dir,
            max_file_size_mb=max_size_mb,
            flush_interval_seconds=flush_interval
        )
    
    return _file_audit_store


def initialize_file_audit_store(
    base_directory: Optional[str] = None,
    max_file_size_mb: int = 50,
    flush_interval_seconds: int = 30
) -> FileAuditStore:
    """
    Initialize file audit store with custom configuration.
    
    Args:
        base_directory: Base directory for audit files
        max_file_size_mb: Maximum file size before rotation
        flush_interval_seconds: Automatic flush interval
        
    Returns:
        Configured FileAuditStore instance
    """
    global _file_audit_store
    _file_audit_store = FileAuditStore(
        base_directory=base_directory,
        max_file_size_mb=max_file_size_mb,
        flush_interval_seconds=flush_interval_seconds
    )
    return _file_audit_store