import os
import json

def scan_files(base_path):
    file_list = []
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith((".ts", ".tsx", ".py")):
                file_list.append(os.path.join(root, file))
    return file_list

if __name__ == "__main__":
    frontend_path = "/home/ubuntu/A1Betting7-13.2/frontend/src"
    backend_path = "/home/ubuntu/A1Betting7-13.2/backend"

    all_files = []
    if os.path.exists(frontend_path):
        all_files.extend(scan_files(frontend_path))
    if os.path.exists(backend_path):
        all_files.extend(scan_files(backend_path))

    with open("/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/scanned_files.json", "w") as f:
        json.dump(all_files, f, indent=4)

    print(f"Scanned {len(all_files)} files. List saved to scanned_files.json")


