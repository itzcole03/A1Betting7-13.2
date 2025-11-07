#!/usr/bin/env python3
"""
Script to fix missing methods in RealPerformanceMetrics class
"""

def fix_metrics_class():
    """Fix the RealPerformanceMetrics class by adding missing methods"""
    
    # Read the current file
    with open('ultra_accuracy_engine.py', 'r') as f:
        content = f.read()
    
    # Check if we need to add the calculate_processing_time method
    if 'def calculate_processing_time(self)' not in content:
        # Find where to insert the method (after calculate_average_processing_time)
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            
            # Add the alias method after calculate_average_processing_time
            if 'def calculate_average_processing_time(self) -> float:' in line:
                # Find the end of this method
                j = i + 1
                while j < len(lines) and (lines[j].startswith('        ') or lines[j].strip() == ''):
                    new_lines.append(lines[j])
                    j += 1
                
                # Add the alias method
                new_lines.append('')
                new_lines.append('    def calculate_processing_time(self) -> float:')
                new_lines.append('        """Alias for calculate_average_processing_time for backward compatibility"""')
                new_lines.append('        return self.calculate_average_processing_time()')
                
                # Skip the lines we already added
                i = j - 1
        
        content = '\n'.join(new_lines)
    
    # Check if we need to add recent_predictions_count to real-time performance
    if '"recent_predictions_count"' not in content:
        # Add the field to get_real_time_performance method
        content = content.replace(
            '"predictions_per_hour": predictions_per_hour,',
            '"predictions_per_hour": predictions_per_hour,\n                "recent_predictions_count": len(recent_results),'
        )
    
    # Write the fixed content back
    with open('ultra_accuracy_engine.py', 'w') as f:
        f.write(content)
    
    print("Fixed RealPerformanceMetrics class successfully!")

if __name__ == "__main__":
    fix_metrics_class() 