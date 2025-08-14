#!/usr/bin/env python3
"""
WebSocket Envelope Pattern Converter
Converts WebSocket routes to use standardized envelope pattern
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class WebSocketEnvelopeConverter:
    """Converts WebSocket routes to use envelope pattern"""
    
    def __init__(self):
        self.envelope_template = """
# WebSocket envelope pattern utilities
def create_websocket_envelope(
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None,
    timestamp: str = None
) -> Dict[str, Any]:
    \"\"\"Create standardized WebSocket message envelope\"\"\"
    envelope = {
        "type": message_type,
        "status": status,
        "timestamp": timestamp or datetime.utcnow().isoformat()
    }
    
    if data is not None:
        envelope["data"] = data
    
    if error:
        envelope["error"] = error
        envelope["status"] = "error"
    
    return envelope

def send_websocket_message(
    websocket: WebSocket,
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None
) -> str:
    \"\"\"Send standardized WebSocket message\"\"\"
    envelope = create_websocket_envelope(message_type, data, status, error)
    return json.dumps(envelope)
"""
    
    def convert_file(self, file_path: Path) -> bool:
        """Convert a WebSocket file to use envelope pattern"""
        print(f"Converting: {file_path.name}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return False
        
        original_content = content
        changes_made = []
        
        # Add envelope utilities import if not present
        if 'create_websocket_envelope' not in content:
            # Add envelope utilities after existing imports
            lines = content.split('\n')
            import_end_index = 0
            
            for i, line in enumerate(lines):
                if line.strip().startswith('from ') or line.strip().startswith('import '):
                    import_end_index = i + 1
            
            # Insert envelope utilities
            lines.insert(import_end_index + 1, "")
            lines.insert(import_end_index + 2, "# WebSocket envelope pattern utilities")
            envelope_lines = self._get_envelope_utilities().split('\n')
            for j, env_line in enumerate(envelope_lines):
                lines.insert(import_end_index + 3 + j, env_line)
            
            content = '\n'.join(lines)
            changes_made.append("Added envelope utilities")
        
        # Convert direct json.dumps calls to envelope pattern
        content = self._convert_json_dumps_to_envelope(content)
        if content != '\n'.join(original_content.split('\n')):
            changes_made.append("Converted direct JSON messages to envelope pattern")
        
        # Convert error responses to envelope pattern
        content = self._convert_error_responses_to_envelope(content)
        
        # Add connection cleanup to finally blocks
        content = self._ensure_proper_cleanup(content)
        if "finally:" in content and "finally:" not in original_content:
            changes_made.append("Added connection cleanup")
        
        # Write the file if changes were made
        if content != original_content:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"✅ Converted {file_path.name}")
                if changes_made:
                    print(f"   Changes: {', '.join(changes_made)}")
                return True
            except Exception as e:
                print(f"❌ Error writing {file_path}: {e}")
                return False
        else:
            print(f"⏭️  No changes needed for {file_path.name}")
            return False
    
    def _get_envelope_utilities(self) -> str:
        """Get the envelope utility functions"""
        return '''
def create_websocket_envelope(
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None,
    timestamp: str = None
) -> Dict[str, Any]:
    """Create standardized WebSocket message envelope"""
    from datetime import datetime
    
    envelope = {
        "type": message_type,
        "status": status,
        "timestamp": timestamp or datetime.utcnow().isoformat()
    }
    
    if data is not None:
        envelope["data"] = data
    
    if error:
        envelope["error"] = error
        envelope["status"] = "error"
    
    return envelope

async def send_websocket_message(
    websocket: WebSocket,
    message_type: str,
    data: Any = None,
    status: str = "success",
    error: str = None
):
    """Send standardized WebSocket message"""
    envelope = create_websocket_envelope(message_type, data, status, error)
    await websocket.send_text(json.dumps(envelope))
'''
    
    def _convert_json_dumps_to_envelope(self, content: str) -> str:
        """Convert json.dumps calls to use envelope pattern"""
        
        # Pattern 1: Direct json.dumps with dict
        pattern1 = r'json\.dumps\(\s*\{\s*"type":\s*"([^"]*)"([^}]*)\}\s*\)'
        
        def replace_direct_envelope(match):
            message_type = match.group(1)
            rest_content = match.group(2)
            
            # Extract other fields if present
            data_match = re.search(r'"data":\s*([^,}]+)', rest_content)
            error_match = re.search(r'"error":\s*([^,}]+)', rest_content)
            status_match = re.search(r'"status":\s*([^,}]+)', rest_content)
            
            args = [f'"{message_type}"']
            
            if data_match:
                args.append(f"data={data_match.group(1)}")
            
            if status_match:
                args.append(f"status={status_match.group(1)}")
            
            if error_match:
                args.append(f"error={error_match.group(1)}")
            
            return f'json.dumps(create_websocket_envelope({", ".join(args)}))'
        
        content = re.sub(pattern1, replace_direct_envelope, content)
        
        # Pattern 2: Simple dict construction
        pattern2 = r'await\s+websocket\.send_text\(\s*json\.dumps\(\s*\{\s*([^}]*)\s*\}\s*\)\s*\)'
        
        def replace_send_text(match):
            dict_content = match.group(1)
            
            # Try to extract type from dict content
            type_match = re.search(r'"type":\s*"([^"]*)"', dict_content)
            if type_match:
                message_type = type_match.group(1)
                
                # Build send_websocket_message call
                data_match = re.search(r'"(?!type"|status"|error"|timestamp")([^"]+)":\s*([^,}]+)', dict_content)
                error_match = re.search(r'"error":\s*([^,}]+)', dict_content)
                status_match = re.search(r'"status":\s*([^,}]+)', dict_content)
                
                args = [f'websocket', f'"{message_type}"']
                
                if data_match:
                    # Extract all data fields
                    remaining_content = dict_content
                    remaining_content = re.sub(r'"type":\s*"[^"]*",?\s*', '', remaining_content)
                    remaining_content = re.sub(r'"status":\s*[^,}]+,?\s*', '', remaining_content)
                    remaining_content = re.sub(r'"error":\s*[^,}]+,?\s*', '', remaining_content)
                    remaining_content = re.sub(r'"timestamp":\s*[^,}]+,?\s*', '', remaining_content)
                    
                    if remaining_content.strip().rstrip(','):
                        args.append(f"data={{{remaining_content}}}")
                
                if status_match:
                    args.append(f"status={status_match.group(1)}")
                
                if error_match:
                    args.append(f"error={error_match.group(1)}")
                
                return f'await send_websocket_message({", ".join(args)})'
            
            return match.group(0)  # Return unchanged if no type found
        
        content = re.sub(pattern2, replace_send_text, content)
        
        return content
    
    def _convert_error_responses_to_envelope(self, content: str) -> str:
        """Convert error responses to use envelope pattern"""
        
        # Pattern for error messages
        error_pattern = r'await\s+websocket\.send_text\(\s*json\.dumps\(\s*\{\s*"error":\s*([^,}]+)([^}]*)\}\s*\)\s*\)'
        
        def replace_error_response(match):
            error_value = match.group(1)
            rest_content = match.group(2)
            
            # Check if type is present
            type_match = re.search(r'"type":\s*"([^"]*)"', rest_content)
            message_type = type_match.group(1) if type_match else "error"
            
            return f'await send_websocket_message(websocket, "{message_type}", error={error_value})'
        
        content = re.sub(error_pattern, replace_error_response, content)
        
        return content
    
    def _ensure_proper_cleanup(self, content: str) -> str:
        """Ensure proper connection cleanup in finally blocks"""
        
        # Look for WebSocket endpoints without finally blocks
        websocket_functions = re.findall(r'async def (websocket_[^(]*)\([^)]*\):', content)
        
        for func_name in websocket_functions:
            func_pattern = rf'(async def {func_name}\([^)]*\):.*?)(?=\n\nasync def|\n\n@|\nclass|\Z)'
            func_match = re.search(func_pattern, content, re.DOTALL)
            
            if func_match:
                func_content = func_match.group(1)
                
                # Check if it has finally block
                if 'finally:' not in func_content:
                    # Add finally block before the end of the function
                    lines = func_content.split('\n')
                    
                    # Find the last except block or try block
                    insert_index = len(lines) - 1
                    indent = "    "  # Default indent
                    
                    for i in range(len(lines) - 1, -1, -1):
                        if lines[i].strip().startswith('except '):
                            insert_index = i + 2  # After except block
                            # Get indent from except line
                            indent = lines[i][:lines[i].find('except')]
                            break
                        elif lines[i].strip() == 'try:':
                            insert_index = len(lines)
                            indent = lines[i][:lines[i].find('try')]
                            break
                    
                    # Add finally block
                    finally_lines = [
                        f"{indent}finally:",
                        f"{indent}    if connection_id:",
                        f"{indent}        await notification_service.remove_connection(connection_id)",
                        f"{indent}        logger.info(f\"WebSocket disconnected: {{connection_id}}\")"
                    ]
                    
                    # Insert finally block
                    for j, finally_line in enumerate(finally_lines):
                        lines.insert(insert_index + j, finally_line)
                    
                    # Replace the function in content
                    new_func_content = '\n'.join(lines)
                    content = content.replace(func_content, new_func_content)
        
        return content

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python websocket_envelope_converter.py <file1> [file2] ...")
        sys.exit(1)
    
    files_to_convert = sys.argv[1:]
    converted_count = 0
    
    print("Starting WebSocket Envelope Pattern Conversion...")
    print("=" * 60)
    
    converter = WebSocketEnvelopeConverter()
    
    for file_path in files_to_convert:
        if Path(file_path).exists():
            if converter.convert_file(Path(file_path)):
                converted_count += 1
        else:
            print(f"❌ File not found: {file_path}")
    
    print("\n" + "=" * 60)
    print(f"Conversion complete! {converted_count}/{len(files_to_convert)} files converted.")

if __name__ == "__main__":
    main()
