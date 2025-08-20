import json
import os
import requests

# --- CONFIG ---
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = "A1Betting7-13.2"  # format: "owner/repo"
ISSUES_FILE = "issues.json"
# --------------

if not GITHUB_TOKEN:
    raise RuntimeError("No GITHUB_TOKEN found in environment variables")

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json"
}

with open(ISSUES_FILE, "r", encoding="utf-8") as f:
    issues = json.load(f)

for issue in issues:
    payload = {
        "title": issue["title"],
        "body": issue["body"],
        "labels": issue.get("labels", []),
        "assignees": issue.get("assignees", [])
    }
    url = f"https://api.github.com/repos/{REPO}/issues"
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code == 201:
        print(f"✅ Created issue: {issue['title']}")
    else:
        print(f"❌ Failed to create {issue['title']} ({r.status_code}): {r.text}")
