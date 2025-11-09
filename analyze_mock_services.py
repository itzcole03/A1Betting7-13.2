import os
import re
from pathlib import Path

# Services directory
services_dir = Path("/home/ubuntu/A1Betting7-13.2/backend/services")

# Pattern to find mock/random data usage
mock_patterns = [
    r'random\.(randint|choice|uniform)',
    r'np\.random\.',
    r'def.*mock.*\(',
    r'mock_data\s*=',
    r'Mock\w+\(',
]

services_with_mock = {}

for py_file in services_dir.glob("*.py"):
    if py_file.name.startswith("__"):
        continue
    
    try:
        content = py_file.read_text()
        matches = []
        
        for pattern in mock_patterns:
            found = re.findall(pattern, content, re.IGNORECASE)
            if found:
                matches.extend(found)
        
        if matches:
            # Count occurrences
            count = len(matches)
            services_with_mock[py_file.name] = count
    except Exception as e:
        print(f"Error reading {py_file.name}: {e}")

# Sort by count
sorted_services = sorted(services_with_mock.items(), key=lambda x: x[1], reverse=True)

print("=" * 80)
print("SERVICES WITH MOCK/RANDOM DATA (sorted by occurrence count)")
print("=" * 80)
print(f"\nTotal services with mock data: {len(sorted_services)}\n")

for service, count in sorted_services[:30]:  # Top 30
    print(f"{service:60} {count:4} occurrences")

print("\n" + "=" * 80)
