## TODO

- [ ] Investigate and fix ComboBox model population issue in `AFKToggle.ahk` (models from LM Studio are not appearing in the dropdown, despite correct script output and no errors). See debug logs and code for details. (2025-07-14)

# AI Prompt Automation Toolkit

This toolkit automates prompt generation, context injection, and clipboard pasting for ChatGPT or LM Studio.

## Included Files

| File                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `generate_prompt.py` | Runs model, builds prompt, copies to clipboard, logs |
| `context_logger.py`  | Extracts Git diff and saves JSON logs                |
| `AFKToggle.ahk`      | AutoHotkey script to paste prompt and press Enter    |
| `logs/`              | Saved sessions and Copilot replies                   |

## Usage

1. **Prepare your Git diff:**
   ```bash
   git add <files>
   # Stage your changes
   ```
2. **Extract context and log:**
   ```bash
   python context_logger.py 1
   # This saves the diff and prints it for use as context
   ```
3. **Generate and send prompt:**
   ```bash
   python generate_prompt.py 1 "Improve error boundaries in payment flow"
   # This will:
   # 1. Pull Git diff (if integrated)
   # 2. Send the prompt to LM Studio
   # 3. Paste it into ChatGPT or LM Studio via AHK
   # 4. Save everything to /logs
   ```

## Customization

- Edit `AFKToggle.ahk` to change coordinates or target platform.
- Edit `generate_prompt.py` to change model or API endpoint.

## Requirements

- Python 3.x
- AutoHotkey v2
- LM Studio or ChatGPT (web)
- `pyperclip`, `requests` Python packages

## Logging

- All sessions and Copilot replies are saved in `/logs/session_<round>_<timestamp>.json`.

---

**Optional Enhancements:**

- Live OCR mode for reply capture
- One-click `.bat` or `.ps1` launcher
- Better format/context extraction

Let me know if you want any of these added!
