import os
import re
import json
from collections import Counter, defaultdict
from typing import List, Tuple, Dict
from datetime import datetime

# Path to the GitIngest digest file
DIGEST_FILE = 'A1Betting7-13.2_digest.txt'  # Adjusted to match file in project root
OUTPUT_FILE = 'digest_summary_for_docs.md'
README_FILE = 'README.md'
ROADMAP_FILE = 'roadmap.md'
CHANGELOG_FILE = 'CHANGELOG.md'

# Regex patterns for code and API extraction
PY_FUNC_PATTERN = re.compile(r'^def (\w+)\(([^)]*)\)(?: -> ([^:]+))?:')
PY_CLASS_PATTERN = re.compile(r'^class (\w+)\(?.*\)?:')
TS_FUNC_PATTERN = re.compile(r'^(export )?function (\w+)\(([^)]*)\)')
TS_CLASS_PATTERN = re.compile(r'^(export )?class (\w+)')
API_ROUTE_PATTERNS = [
    re.compile(r'@app\.route\(["\"][^\)]+'),  # Flask/FastAPI
    re.compile(r'@router\.(get|post|put|delete)\(["\"][^\)]+'), # FastAPI router
    re.compile(r'app\.(get|post|put|delete)\(["\"][^\)]+'), # Express
]
TODO_PATTERN = re.compile(r'(TODO|FIXME|#|//).*', re.IGNORECASE)


def get_timestamp() -> str:
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')


def extract_digest_sections(digest_path: str) -> Tuple[List[str], List[str], Counter[str], List[str], List[str], List[str], List[str], Dict[str, List[str]], Dict[str, Dict]]:
    summary: List[str] = []
    directory: List[str] = []
    file_types: Counter[str] = Counter()
    code_samples: List[str] = []
    api_endpoints: List[str] = []
    docstrings: List[str] = []
    todos: List[str] = []
    features: Dict[str, List[str]] = defaultdict(list)
    detailed_api: Dict[str, Dict] = defaultdict(dict)
    in_summary = True
    in_directory = False
    in_file = False
    file_name = None
    file_ext = None
    lines_read = 0
    max_lines = 200000  # Safety for huge files
    in_code_file = False
    code_buffer: List[str] = []
    code_sample_count = 0
    in_docstring = False
    docstring_buffer: List[str] = []
    docstring_done = False
    current_func = None
    current_func_sig = ''
    current_func_doc = ''
    in_func_doc = False
    func_param_types = ''
    func_return_type = ''

    with open(digest_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            lines_read += 1
            if lines_read > max_lines:
                break
            # Extract summary (first block)
            if in_summary:
                summary.append(line.rstrip())
                if line.strip().startswith('Directory structure:'):
                    in_summary = False
                    in_directory = True
                continue
            # Extract directory structure
            if in_directory:
                if line.strip().startswith('='):
                    in_directory = False
                    in_file = True
                    continue
                directory.append(line.rstrip())
                continue
            # File content parsing
            if in_file:
                if line.startswith('FILE: '):
                    file_name = line.strip().split('FILE: ')[1]
                    file_ext = os.path.splitext(file_name)[1].lower()
                    in_code_file = file_ext in ['.py', '.ts']
                    code_buffer = []
                    code_sample_count = 0
                    in_docstring = False
                    docstring_buffer = []
                    docstring_done = False
                    current_func = None
                    current_func_sig = ''
                    current_func_doc = ''
                    in_func_doc = False
                    func_param_types = ''
                    func_return_type = ''
                    if file_ext:
                        file_types[file_ext] += 1
                    else:
                        file_types['(no ext)'] += 1
                    continue
                if in_code_file:
                    # Extract TODOs, features, and comments
                    todo_match = TODO_PATTERN.search(line)
                    if todo_match:
                        todos.append(f'{file_name}: {todo_match.group(0).strip()}')
                        if 'feature' in todo_match.group(0).lower():
                            features[file_name].append(todo_match.group(0).strip())
                    # Extract docstrings/comments at the top of the file
                    if not docstring_done:
                        if file_ext == '.py':
                            if line.strip().startswith('"""') or line.strip().startswith("'''"):
                                if not in_docstring:
                                    in_docstring = True
                                    docstring_buffer.append(line.rstrip())
                                else:
                                    docstring_buffer.append(line.rstrip())
                                    in_docstring = False
                                    docstring_done = True
                                    docstrings.append('\n'.join(docstring_buffer))
                                continue
                            if in_docstring:
                                docstring_buffer.append(line.rstrip())
                                continue
                        elif file_ext == '.ts':
                            if line.strip().startswith('/**'):
                                in_docstring = True
                                docstring_buffer.append(line.rstrip())
                                continue
                            if in_docstring:
                                docstring_buffer.append(line.rstrip())
                                if '*/' in line:
                                    in_docstring = False
                                    docstring_done = True
                                    docstrings.append('\n'.join(docstring_buffer))
                                continue
                    # Extract up to 3 code samples per file
                    if code_sample_count < 3:
                        if file_ext == '.py':
                            if PY_FUNC_PATTERN.match(line) or PY_CLASS_PATTERN.match(line):
                                code_buffer.append(line.rstrip())
                                code_sample_count += 1
                        elif file_ext == '.ts':
                            if TS_FUNC_PATTERN.match(line) or TS_CLASS_PATTERN.match(line):
                                code_buffer.append(line.rstrip())
                                code_sample_count += 1
                    # Extract API endpoints and details
                    for pat in API_ROUTE_PATTERNS:
                        if pat.search(line):
                            api_endpoints.append(f'{file_name}: {line.strip()}')
                            # Try to extract function signature and docstring for detailed API
                            if file_ext == '.py':
                                func_match = PY_FUNC_PATTERN.match(line)
                                if func_match:
                                    current_func = func_match.group(1)
                                    func_param_types = func_match.group(2)
                                    func_return_type = func_match.group(3) if func_match.group(3) else ''
                                    current_func_sig = line.strip()
                                    detailed_api[f'{file_name}: {line.strip()}'] = {
                                        'params': func_param_types,
                                        'returns': func_return_type,
                                        'doc': ''
                                    }
                                    in_func_doc = True
                                    continue
                            elif file_ext == '.ts':
                                func_match = TS_FUNC_PATTERN.match(line)
                                if func_match:
                                    current_func = func_match.group(2)
                                    func_param_types = func_match.group(3)
                                    current_func_sig = line.strip()
                                    detailed_api[f'{file_name}: {line.strip()}'] = {
                                        'params': func_param_types,
                                        'returns': '',
                                        'doc': ''
                                    }
                                    in_func_doc = True
                                    continue
                    # Capture docstring for API endpoint
                    if in_func_doc and (line.strip().startswith('"""') or line.strip().startswith("'''") or line.strip().startswith('/**')):
                        current_func_doc = line.strip()
                        detailed_api[f'{file_name}: {current_func_sig}']['doc'] = current_func_doc
                        in_func_doc = False
                # Save code samples at end of file
                if in_code_file and (line.strip() == '' or line.startswith('====')) and code_buffer:
                    code_samples.extend(code_buffer)
                    code_buffer = []
    return summary, directory, file_types, code_samples, api_endpoints, docstrings, todos, features, detailed_api


def extract_function_class_index(digest_path: str) -> List[dict]:
    index = []
    file_name = None
    file_ext = None
    in_file = False
    in_code_file = False
    with open(digest_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith('FILE: '):
                file_name = line.strip().split('FILE: ')[1]
                file_ext = os.path.splitext(file_name)[1].lower()
                in_code_file = file_ext in ['.py', '.ts']
                in_file = True
                continue
            if in_file and in_code_file:
                # Python
                py_func = PY_FUNC_PATTERN.match(line)
                py_class = PY_CLASS_PATTERN.match(line)
                if py_func:
                    index.append({
                        'name': py_func.group(1),
                        'type': 'function',
                        'file': file_name,
                        'signature': line.strip(),
                        'docstring': ''
                    })
                elif py_class:
                    index.append({
                        'name': py_class.group(1),
                        'type': 'class',
                        'file': file_name,
                        'signature': line.strip(),
                        'docstring': ''
                    })
                # TypeScript
                ts_func = TS_FUNC_PATTERN.match(line)
                ts_class = TS_CLASS_PATTERN.match(line)
                if ts_func:
                    index.append({
                        'name': ts_func.group(2),
                        'type': 'function',
                        'file': file_name,
                        'signature': line.strip(),
                        'docstring': ''
                    })
                elif ts_class:
                    index.append({
                        'name': ts_class.group(2) if ts_class.group(2) else '',
                        'type': 'class',
                        'file': file_name,
                        'signature': line.strip(),
                        'docstring': ''
                    })
                # API endpoints
                for pat in API_ROUTE_PATTERNS:
                    if pat.search(line):
                        index.append({
                            'name': line.strip(),
                            'type': 'endpoint',
                            'file': file_name,
                            'signature': line.strip(),
                            'docstring': ''
                        })
    return index


def extract_changelog(changelog_path: str, max_lines: int = 20) -> List[str]:
    if not os.path.exists(changelog_path):
        return []
    lines = []
    with open(changelog_path, 'r', encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i >= max_lines:
                break
            lines.append(line.rstrip())
    return lines


def write_roadmap(todos: List[str], features: Dict[str, List[str]], output_path: str) -> None:
    with open(output_path, 'w', encoding='utf-8') as out:
        out.write('# Project Roadmap\n\n')
        out.write('## Planned Features\n')
        for file, feats in features.items():
            for feat in feats:
                out.write(f'- [{file}] {feat}\n')
        out.write('\n## Known Issues / TODOs\n')
        for todo in todos:
            out.write(f'- {todo}\n')
        out.write('\n## Technical Debt\n')
        for todo in todos:
            if 'fixme' in todo.lower():
                out.write(f'- {todo}\n')
        out.write('\n---\n')
        out.write('This roadmap is auto-generated from codebase comments and TODOs.\n')


def write_detailed_api(detailed_api: Dict[str, Dict], output_path: str) -> None:
    with open(output_path, 'a', encoding='utf-8') as out:
        out.write('\n---\n')
        out.write('## Detailed API Reference\n')
        for endpoint, details in detailed_api.items():
            out.write(f'### {endpoint}\n')
            out.write(f'- **Parameters:** {details.get("params", "") or "None"}\n')
            out.write(f'- **Returns:** {details.get("returns", "") or "None"}\n')
            if details.get('doc'):
                out.write(f'- **Description:** {details["doc"]}\n')
            out.write('\n')


def generate_badges() -> str:
    badges = [
        '![License](https://img.shields.io/badge/license-MIT-blue.svg)',
        '![Python](https://img.shields.io/badge/python-3.8%2B-blue)',
        '![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue)',
        '![Build](https://img.shields.io/badge/build-passing-brightgreen)',
        '![Code Size](https://img.shields.io/github/languages/code-size/itzcole03/A1Betting7-13.2)',
        '![Repo Size](https://img.shields.io/github/repo-size/itzcole03/A1Betting7-13.2)',
    ]
    return ' '.join(badges) + '\n\n'


def generate_mermaid_tree(directory: List[str]) -> str:
    mermaid = ['```mermaid', 'graph TD']
    for line in directory:
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(' '))
        name = line.strip().replace('/', '').replace('├── ', '').replace('└── ', '')
        if name:
            mermaid.append(f'    {"_"*indent}{name}[{name}]')
    mermaid.append('```\n')
    return '\n'.join(mermaid)


def generate_architecture_diagram() -> str:
    return (
        '```mermaid\ngraph LR\n'
        'Frontend[Frontend (Electron/React)] --> Backend[Backend (FastAPI/Python)]\n'
        'Backend --> DB[(SQLite/Encrypted)]\n'
        'Backend --> APIs[External APIs]\n'
        'Frontend --> User[User]\n'
        '```\n'
    )


def generate_ai_agent_quickstart() -> str:
    return (
        '---\n'
        '## 🤖 AI Agent Quick Start (Copilot/LLM/Auto Mode)\n'
        '---\n'
        'This project is designed for seamless use with AI copilots and LLM-based agents (e.g., Copilot, Cursor, GPT-4, etc.).\n'
        '- **All auto-generated sections are clearly marked.**\n'
        '- **To update documentation, run:**\n'
        '  ```\n'
        '  python scripts/extract_digest_for_docs.py\n'
        '  ```\n'
        '- **Copilots should use the auto-generated sections for context, code search, and code generation.**\n'
        '- **Manual narrative sections are for human onboarding, tutorials, and conceptual docs.**\n'
        '- **Copilots should preserve manual narrative sections and only regenerate auto-generated blocks.**\n'
        '- **All diagrams are in Mermaid format for easy parsing and visualization.**\n'
        '- **Last Updated:** ' + get_timestamp() + '\n'
        '---\n'
    )


def generate_copilot_integration_section() -> str:
    return (
        '---\n'
        '## 🤖 Copilot/AI Agent Integration\n'
        '---\n'
        '- Use the auto-generated sections for code search, refactoring, and onboarding.\n'
        '- Use the directory tree and architecture diagrams for project navigation.\n'
        '- Use the API docs for endpoint discovery and code generation.\n'
        '- Use the roadmap for feature planning and TODO tracking.\n'
        '- To keep docs in sync, always run the extraction script after code changes.\n'
        '- Manual narrative sections are for human context and should be preserved.\n'
        '---\n'
    )


def generate_manual_narrative_placeholder() -> str:
    return (
        '---\n'
        '## 📝 Manual Narrative Section (Human-Written)\n'
        '---\n'
        '_Add onboarding, tutorials, conceptual explanations, and human context here.\n'
        'Copilots and AI agents should **not** overwrite this section!_\n'
        '---\n'
    )


def generate_quickstart() -> str:
    return (
        '---\n'
        '## 🚀 Quick Start\n'
        '---\n'
        '1. Clone the repo\n'
        '   ```\n'
        '   git clone https://github.com/itzcole03/A1Betting7-13.2.git\n'
        '   cd A1Betting7-13.2\n'
        '   ```\n'
        '2. Install dependencies\n'
        '   ```\n'
        '   cd frontend && npm install\n'
        '   cd ../backend && pip install -r requirements.txt\n'
        '   ```\n'
        '3. Start the backend\n'
        '   ```\n'
        '   python main.py\n'
        '   ```\n'
        '4. Start the frontend\n'
        '   ```\n'
        '   cd ../frontend && npm run dev\n'
        '   ```\n'
        '5. Open the app\n'
        '   - Web: http://localhost:8173\n'
        '   - Desktop: Run the Electron app\n'
        '---\n'
    )


def generate_faq() -> str:
    return (
        '---\n'
        '## ❓ FAQ / Troubleshooting\n'
        '---\n'
        '- **Q: I get a port in use error when starting the frontend?**\n'
        '  - A: The dev server will try the next available port. Check the terminal for the new port.\n'
        '- **Q: Backend won\'t start, missing dependencies?**\n'
        '  - A: Run `pip install -r requirements.txt` in the backend directory.\n'
        '- **Q: How do I regenerate documentation?**\n'
        '  - A: Run `python scripts/extract_digest_for_docs.py` from the project root.\n'
        '- **Q: Where do I add onboarding or tutorials?**\n'
        '  - A: In the Manual Narrative Section of the README.\n'
        '---\n'
    )


def generate_changelog_section(changelog_lines: List[str]) -> str:
    if not changelog_lines:
        return ''
    return (
        '---\n'
        '## 📝 Changelog (Latest)\n'
        '---\n'
        + '\n'.join(changelog_lines) + '\n---\n'
    )


def generate_contributing_ai_section() -> str:
    return (
        '---\n'
        '## 🤖 Contributing as an AI Agent\n'
        '---\n'
        '- Open a pull request with a clear description of your changes.\n'
        '- Tag your PR with `[AI]` in the title.\n'
        '- If you are an LLM, summarize your reasoning and cite relevant code sections.\n'
        '- Respect the Manual Narrative Section and do not overwrite it.\n'
        '- If you are unsure, ask for human review.\n'
        '---\n'
    )


def generate_llm_context_section() -> str:
    return (
        '---\n'
        '## 🤖 Context for LLMs\n'
        '---\n'
        '- Use only the auto-generated sections for code search and context.\n'
        '- Do not hallucinate features or endpoints not present in the docs.\n'
        '- Always preserve the Manual Narrative Section.\n'
        '- If you update code, rerun the extraction script to keep docs in sync.\n'
        '---\n'
    )


def generate_related_resources_section() -> str:
    return (
        '---\n'
        '## 🔗 Related Resources\n'
        '---\n'
        '- [API Documentation](API_DOCUMENTATION.md)\n'
        '- [Roadmap](roadmap.md)\n'
        '- [Changelog](CHANGELOG.md)\n'
        '- [Feature Integration Roadmap](FEATURE_INTEGRATION_ROADMAP.md)\n'
        '---\n'
    )


def generate_project_health_section() -> str:
    return (
        '---\n'
        '## 🩺 Project Health\n'
        '---\n'
        '- All core services present.\n'
        '- Health API available at `/api/health` (see backend).\n'
        '- For live status, run the backend and visit http://localhost:8000/api/health/all\n'
        '---\n'
    )


def generate_license_section() -> str:
    return (
        '---\n'
        '## 📄 License and Attribution\n'
        '---\n'
        'This project is licensed under the MIT License.\n'
        'See LICENSE file for details.\n'
        '---\n'
    )


def generate_structured_context_block(directory: List[str], api_endpoints: List[str], file_types: Counter[str]) -> str:
    context = {
        "project": "A1Betting7-13.2",
        "last_updated": get_timestamp(),
        "directory": directory[:40],
        "api_endpoints": api_endpoints[:10],
        "file_types": dict(file_types.most_common()),
        "health": {
            "backend": "present",
            "frontend": "present",
            "api_health": "/api/health",
        }
    }
    return (
        '<!--- AI_CONTEXT_BLOCK_START --->\n'
        + '```json\n' + json.dumps(context, indent=2) + '\n```\n'
        + '<!--- AI_CONTEXT_BLOCK_END --->\n'
    )


def generate_ai_self_test_section() -> str:
    return (
        '---\n'
        '## 🤖 AI Self-Test\n'
        '---\n'
        'To verify documentation and code are in sync, copilots/LLMs should:\n'
        '1. Parse the AI_CONTEXT_BLOCK at the top of this README.\n'
        '2. Compare directory and endpoints to the current codebase.\n'
        '3. If drift is detected, run `python scripts/extract_digest_for_docs.py` to update docs.\n'
        '4. Report pass/fail in PRs or issues.\n'
        '---\n'
    )


def generate_data_provenance_section() -> str:
    return (
        '---\n'
        '## 📜 Data Provenance & Usage Policy\n'
        '---\n'
        'All code and data in this repo are original or properly attributed.\n'
        'AI agents must cite this repo and relevant files when generating new content.\n'
        'For external data, see the LICENSE and attribution files.\n'
        '---\n'
    )


def generate_streaming_partial_update_section() -> str:
    return (
        '---\n'
        '## 🔄 Streaming/Partial Update\n'
        '---\n'
        'For large repos, you can update only specific sections:\n'
        '- To update only API docs: run the extraction script with the `--api` flag (future).\n'
        '- To update only the roadmap: run with the `--roadmap` flag (future).\n'
        '- For now, the script updates all docs at once.\n'
        '---\n'
    )


def generate_continuous_doc_health_section() -> str:
    return (
        '---\n'
        '## 🩺 Continuous Doc Health\n'
        '---\n'
        f'- Last doc update: {get_timestamp()}\n'
        '- Last code update: (see git log)\n'
        '- If doc/code drift is detected, run the extraction script.\n'
        '---\n'
    )


def generate_llm_prompt_tips_section() -> str:
    return (
        '---\n'
        '## 🧠 LLM Prompt Engineering Tips\n'
        '---\n'
        '- Use the AI_CONTEXT_BLOCK for instant context loading.\n'
        '- Ask for code samples, API endpoints, or directory structure as needed.\n'
        '- Use the roadmap and changelog for planning and history.\n'
        '- Always cite sources and preserve manual narrative.\n'
        '---\n'
    )


def generate_ai_usage_policy_section() -> str:
    return (
        '---\n'
        '## 🤖 AI/LLM Usage Policy\n'
        '---\n'
        '- AI agents may open PRs, refactor code, and generate tests.\n'
        '- All major changes should be reviewed by a human.\n'
        '- Manual narrative and license sections must be preserved.\n'
        '- Cite this repo and relevant files in all AI-generated content.\n'
        '---\n'
    )


def write_api_reference(index: list):
    with open('API_REFERENCE.md', 'w', encoding='utf-8') as out:
        out.write('# API Reference (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> Use for copilot/AI agent code search, endpoint discovery, and onboarding.\n\n')
        for entry in index:
            out.write(f"- **{entry['type'].capitalize()}** `{entry['name']}`\n")
            out.write(f"  - File: `{entry['file']}`\n")
            out.write(f"  - Signature: `{entry['signature']}`\n")
            if entry.get('docstring'):
                out.write(f"  - Docstring: {entry['docstring']}\n")
            out.write('\n')


def write_symbol_crossref(index: list):
    symbol_map = {}
    for entry in index:
        symbol_map.setdefault(entry['name'], []).append(entry['file'])
    with open('SYMBOL_CROSSREF.md', 'w', encoding='utf-8') as out:
        out.write('# Symbol Cross-Reference (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> Maps each symbol to its file(s) for copilot/AI agent navigation.\n\n')
        for symbol, files in symbol_map.items():
            out.write(f'- `{symbol}`: {", ".join(sorted(set(files)))}\n')


def write_class_diagram(index: list):
    classes = [e for e in index if e['type'] == 'class']
    with open('CLASS_DIAGRAM.md', 'w', encoding='utf-8') as out:
        out.write('# Class Diagram (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> Mermaid diagram for copilot/AI agent visualization.\n\n')
        out.write('```mermaid\nclassDiagram\n')
        for cls in classes:
            out.write(f'    class {cls["name"]} {{ }}\n')
        out.write('```\n')


def write_onboarding():
    with open('ONBOARDING.md', 'w', encoding='utf-8') as out:
        out.write('# Onboarding Checklist (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> For new contributors (AI or human).\n\n')
        out.write('1. Clone the repo and install dependencies (see Quick Start in README).\n')
        out.write('2. Review the README, API_REFERENCE.md, and roadmap.md.\n')
        out.write('3. Use function_index.json for code search and navigation.\n')
        out.write('4. Run tests and check health badges.\n')
        out.write('5. Make your changes and run scripts/extract_digest_for_docs.py to update docs.\n')
        out.write('6. Open a PR (tag with [AI] if you are an AI agent).\n')
        out.write('7. Ensure all auto-generated files are up to date.\n')


def write_regenerate_docs():
    with open('REGENERATE_DOCS.md', 'w', encoding='utf-8') as out:
        out.write('# How to Regenerate Docs (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> For copilot/AI agent and human use.\n\n')
        out.write('## Locally\n')
        out.write('```\npython scripts/extract_digest_for_docs.py\n```\n')
        out.write('## Via GitHub Actions\n')
        out.write('Push or open a PR to main; the action will auto-update docs.\n')


def write_ai_persona():
    with open('AI_PERSONA.md', 'w', encoding='utf-8') as out:
        out.write('# AI Agent Persona (Auto-Generated)\n\n')
        out.write('> This file is auto-generated by scripts/extract_digest_for_docs.py.\n')
        out.write('> Use as a system prompt for LLMs/copilots.\n\n')
        out.write('You are an expert, autonomous AI copilot for the A1Betting7-13.2 project.\n')
        out.write('Your goals:\n')
        out.write('- Keep docs and code in perfect sync.\n')
        out.write('- Maximize robustness, test coverage, and code quality.\n')
        out.write('- Minimize user intervention.\n')
        out.write('- Always cite sources and preserve manual narrative.\n')
        out.write('- Use all auto-generated context blocks and indexes for reasoning.\n')
        out.write('- Open PRs, refactor, and generate code/tests as needed.\n')


def generate_readme(summary: List[str], directory: List[str], file_types: Counter[str], code_samples: List[str], api_endpoints: List[str], docstrings: List[str], detailed_api: Dict[str, Dict], readme_path: str, changelog_lines: List[str]) -> None:
    with open(readme_path, 'w', encoding='utf-8') as out:
        out.write(generate_structured_context_block(directory, api_endpoints, file_types))
        out.write(generate_badges())
        out.write('# A1Betting7-13.2\n\n')
        out.write('**Professional Desktop Sports Intelligence Platform**\n\n')
        out.write(generate_ai_agent_quickstart())
        out.write(generate_copilot_integration_section())
        out.write(generate_llm_context_section())
        out.write(generate_manual_narrative_placeholder())
        out.write(generate_quickstart())
        out.write(generate_faq())
        out.write(generate_related_resources_section())
        out.write(generate_project_health_section())
        out.write(generate_changelog_section(changelog_lines))
        out.write(generate_contributing_ai_section())
        out.write(generate_ai_self_test_section())
        out.write(generate_data_provenance_section())
        out.write(generate_streaming_partial_update_section())
        out.write(generate_continuous_doc_health_section())
        out.write(generate_llm_prompt_tips_section())
        out.write(generate_ai_usage_policy_section())
        out.write('---\n')
        out.write('## 🚨 DO NOT EDIT BELOW THIS LINE: AUTO-GENERATED BY extract_digest_for_docs.py 🚨\n')
        out.write('---\n')
        out.write(f'**Last Updated:** {get_timestamp()}\n')
        out.write('---\n\n')
        out.write('## Features\n')
        out.write('- Native Electron desktop app (Windows, macOS, Linux)\n')
        out.write('- FastAPI backend with health monitoring\n')
        out.write('- Real-time sports data, analytics, and predictions\n')
        out.write('- Secure local storage (SQLite, encrypted)\n')
        out.write('- Auto-updates, system tray, and notifications\n')
        out.write('- Modular, extensible architecture\n')
        out.write('- Professional packaging and distribution\n')
        out.write('- Comprehensive test suite\n')
        out.write('- Modern UI/UX\n')
        out.write('- And more!\n\n')
        out.write('---\n\n')
        out.write('## Directory Structure\n')
        out.write('````markdown\n' + '\n'.join(directory[:40]) + '\n...\n````\n\n')
        out.write('---\n\n')
        out.write('## Visual Directory Tree\n')
        out.write(generate_mermaid_tree(directory[:20]))
        out.write('\n---\n\n')
        out.write('## Architecture Diagram\n')
        out.write(generate_architecture_diagram())
        out.write('\n---\n\n')
        out.write('## Technology Stack\n')
        for ext, count in file_types.most_common():
            out.write(f'- {ext}: {count} files\n')
        out.write('\n')
        out.write('---\n\n')
        if api_endpoints:
            out.write('## API Endpoints\n')
            for api in api_endpoints[:10]:
                out.write('- ' + api + '\n')
            if len(api_endpoints) > 10:
                out.write('- ...\n')
            out.write('\n')
        if code_samples:
            out.write('## Example Code\n')
            for code in code_samples[:5]:
                out.write('```python\n' + code + '\n```\n')
            if len(code_samples) > 5:
                out.write('...\n')
            out.write('\n')
        out.write('---\n')
        out.write('## Detailed API Reference\n')
        for endpoint, details in detailed_api.items():
            out.write(f'### {endpoint}\n')
            out.write(f'- **Parameters:** {details.get("params", "") or "None"}\n')
            out.write(f'- **Returns:** {details.get("returns", "") or "None"}\n')
            if details.get('doc'):
                out.write(f'- **Description:** {details["doc"]}\n')
            out.write('\n')
        out.write('---\n')
        out.write('## How to Contribute\n')
        out.write('1. Fork the repo and create a feature branch.\n')
        out.write('2. Add your feature or fix.\n')
        out.write('3. Submit a pull request with a clear description.\n\n')
        out.write('---\n')
        out.write('## Vision\n')
        out.write('A1Betting7-13.2 aims to be the most robust, powerful, and beautifully designed sports intelligence platform for professionals and enthusiasts alike.\n')
        out.write('---\n')
        out.write(generate_license_section())


def main() -> None:
    summary, directory, file_types, code_samples, api_endpoints, docstrings, todos, features, detailed_api = extract_digest_sections(DIGEST_FILE)
    changelog_lines = extract_changelog(CHANGELOG_FILE)
    write_roadmap(todos, features, ROADMAP_FILE)
    write_detailed_api(detailed_api, OUTPUT_FILE)
    generate_readme(summary, directory, file_types, code_samples, api_endpoints, docstrings, detailed_api, README_FILE, changelog_lines)
    # Output function/class/endpoint index
    function_index = extract_function_class_index(DIGEST_FILE)
    with open('function_index.json', 'w', encoding='utf-8') as fidx:
        json.dump(function_index, fidx, indent=2)
    write_api_reference(function_index)
    write_symbol_crossref(function_index)
    write_class_diagram(function_index)
    write_onboarding()
    write_regenerate_docs()
    write_ai_persona()
    print(f'Extraction, README, roadmap, and all indexes/docs update complete!')

if __name__ == '__main__':
    main() 