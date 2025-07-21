
#Requires AutoHotkey v2.0
SetTitleMatchMode "2"

global scriptDir := "C:\Users\bcmad\Downloads\A1Betting7-13.2\ahk"
global modelList := []
global selectedModel := ""
global logsDir := "C:\Users\bcmad\Downloads\A1Betting7-13.2\logs"
global logFile := "" ; No longer used for LLM output
global roundFile := scriptDir "\round_state.txt"

global isRunning := false
global myGui := ""
global automationWindows := [] ; List of window handles for Code.exe/cursor.exe
global defaultMessages := Map(
roundCount := LoadRoundCount()
    1, "Start high-level review. Scan files & goals.",
    2, "Break down tasks logically and explain the plan.",
    3, "Implement first subtask with clarity and comments.",
    4, "Review changes for edge cases and testability.",
    5, "Update documentation and changelogs.",
    6, "Proceed to next subtask with full context.",
    7, "Pause and reassess technical debt and priorities.",
    8, "Identify refactor opportunities for clarity.",
    9, "Review UI aesthetics and usability.",
    10,"Summarize progress and prep commit messages."
)

myGui := Gui("+AlwaysOnTop +Resize", "Dev Assistant Control")
myGui.Add("Button", "w120 vBtnToggle", "Start Automation").OnEvent("Click", (*) => ToggleRunning())
myGui.Add("Button", "w120", "Send Next Message").OnEvent("Click", (*) => ManualStep())
myGui.Add("Button", "w120", "Show Log File").OnEvent("Click", (*) => ShowLog())
myGui.Add("ComboBox", "w400 vModelComboBox", ["Loading models..."])
myGui.Add("Edit", "w400 h100 vCustomMessage")
myGui.Add("Button", "w120", "Send Custom Message").OnEvent("Click", (*) => SendCustom())
myGui.Add("Text", "w400 vStatusText", "Status: Idle")
myGui.Show("AutoSize Center")
LoadModelList()
LoadModelList()
{
    global scriptDir, modelList, myGui
    try {
        ; Log the Python version and path
        pythonVersion := RunWaitOneShot('python --version')
        pythonWhere := RunWaitOneShot('where python')
        FileAppend("[DEBUG] Python version: " pythonVersion "\n", logsDir "\afk_debug.log")
        FileAppend("[DEBUG] Python path: " pythonWhere "\n", logsDir "\afk_debug.log")
        cmd := Format('python "{}"', scriptDir "\get_models.py")
        FileAppend("[DEBUG] Running command: " cmd "\n", logsDir "\afk_debug.log")
        output := RunWaitOneShot(cmd)
        FileAppend("[DEBUG] Output (raw from Python): '" output "'\n", logsDir "\afk_debug.log")
        ; Write output to a temp file for manual inspection
        tmpInspect := logsDir "\model_output_inspect.txt"
        FileDelete(tmpInspect)
        FileAppend(output, tmpInspect)
        ; Show output in a message box if empty or suspicious
        if (StrLen(Trim(output)) = 0) {
            MsgBox "Python get_models.py output is empty!\nCheck: " cmd "\nPython version: " pythonVersion "\nPython path: " pythonWhere
        }
        ; Try splitting on both `n and \n for robustness
        modelList := []
        ; Normalize line endings to `n, then split
        output := StrReplace(output, "\r\n", "`n")
        output := StrReplace(output, "\r", "`n")
        splitList := StrSplit(output, "`n")
        FileAppend("[DEBUG] StrSplit(`n) result: " splitList.Length " items\n", logsDir "\afk_debug.log")
        for i, item in splitList {
            FileAppend("[DEBUG] Split item " i ": '" item "'\n", logsDir "\afk_debug.log")
            trimmed := Trim(item)
            if (StrLen(trimmed) > 0)
                modelList.Push(trimmed)
        }
        FileAppend("[DEBUG] Final modelList: " modelList.Length " items\n", logsDir "\afk_debug.log")
        for i, m in modelList {
            FileAppend("[DEBUG] modelList[" i "]: type=" Type(m) ", value='" m "'\n", logsDir "\afk_debug.log")
        }
        FileAppend("[DEBUG] Deleting ComboBox items\n", logsDir "\afk_debug.log")
        combo := myGui["ModelComboBox"]
        combo.Delete()
        combo.Value := ""
        if (modelList.Length > 0) {
            for idx, model in modelList {
                FileAppend("[DEBUG] Adding model to ComboBox: idx=" idx ", type=" Type(model) ", value='" model "'\n", logsDir "\afk_debug.log")
                combo.Add(model)
            }
            combo.Value := 1
            FileAppend("[DEBUG] ComboBox update complete, set value to 1, current value: '" combo.Value "', item count: " modelList.Length "\n", logsDir "\afk_debug.log")
        } else {
            FileAppend("[DEBUG] No models found, adding fallback (single string)\n", logsDir "\afk_debug.log")
            combo.Add("No models found")
            combo.Value := 1
            ; Test static ComboBox population to isolate GUI issue
            MsgBox "Populating ComboBox with static test data. If you see this, Python output was empty or invalid."
            combo.Delete()
            combo.Add(["STATIC-TEST-1", "STATIC-TEST-2", "STATIC-TEST-3"])
            combo.Value := 1
        }
    } catch as e {
        FileAppend("[DEBUG] Exception in LoadModelList (catch block entered)\n", logsDir "\afk_debug.log")
        try FileAppend("[DEBUG] Exception (raw): " e "\n", logsDir "\afk_debug.log")
        try FileAppend("[DEBUG] Exception type: " Type(e) ", is object: " IsObject(e) "\n", logsDir "\afk_debug.log")
        if IsObject(e) {
            if ObjHasOwnProp(e, "Message") {
                try FileAppend("[DEBUG] Exception message: " e.Message "\n", logsDir "\afk_debug.log")
            } else {
                try FileAppend("[DEBUG] Exception object (no Message property): " e "\n", logsDir "\afk_debug.log")
            }
        } else {
            try FileAppend("[DEBUG] Exception (not an object): " e "\n", logsDir "\afk_debug.log")
        }
        hasCombo := false
        try hasCombo := (myGui["ModelComboBox"] != "")
        try FileAppend("[DEBUG] myGui type in catch: " Type(myGui) ", is object: " IsObject(myGui) ", has ModelComboBox: " (hasCombo ? "yes" : "no") "\n", logsDir "\afk_debug.log")
        try myGui["ModelComboBox"].Delete()
        FileAppend("[DEBUG] Fallback Add param type (catch): " Type("Error loading models") ", value: 'Error loading models'\n", logsDir "\afk_debug.log")
        try myGui["ModelComboBox"].Add("Error loading models")
        try myGui["ModelComboBox"].Value := 1
        ; Test static ComboBox population in catch block
        MsgBox "Exception occurred. Populating ComboBox with static test data."
        try myGui["ModelComboBox"].Delete()
        try myGui["ModelComboBox"].Add(["STATIC-ERR-1", "STATIC-ERR-2", "STATIC-ERR-3"])
        try myGui["ModelComboBox"].Value := 1
    }
}

F8::ToggleRunning()

ToggleRunning()
{
    global isRunning, myGui, automationWindows
    if !isRunning {
        ; Scan for all VS Code and Cursor windows
        automationWindows := []
        idList := WinGetList() ; Get all windows
        found := 0
        for idx, hwnd in idList {
            proc := WinGetProcessName(hwnd)
            if (proc = "Code.exe" || proc = "cursor.exe") {
                automationWindows.Push(hwnd)
                found++
            }
        }
        if (found = 0) {
            UpdateStatus("No VS Code or Cursor windows found. Automation not started.")
            SoundBeep(800, 300)
            return
        }
        UpdateStatus("Automation started. Targeting " found " window(s).")
        myGui["BtnToggle"].Text := "Stop Automation"
        isRunning := true
        SetTimer(AutoClickAndType, 240000)
        AutoClickAndType()
    } else {
        isRunning := false
        myGui["BtnToggle"].Text := "Start Automation"
        UpdateStatus("Automation stopped.")
        SetTimer(AutoClickAndType, 0)
    }
}

UpdateStatus(text)
{
    global myGui
    myGui["StatusText"].Value := "Status: " text
}

ManualStep()
{
    global roundCount
    context := GetGitContext()
    message := GenerateLLMMessage(roundCount, context)
    ; No longer log to log.txt for LLM output
    if !message {
        UpdateStatus("[ERROR] LLM output empty. Check LM Studio/Python script.")
        SoundBeep(800, 300)
        return
    }
    SendMessageToCopilot(message)
    ; Optionally: log to a different file if needed
}

SendCustom()
{
    global myGui
    message := myGui["CustomMessage"].Value
    if (StrLen(message) < 1) {
        UpdateStatus("Custom message empty.")
        return
    }
    SendMessageToCopilot(message)
    AppendLog("Custom message sent: " message)
}

ShowLog()
{
    global logsDir
    ; Find the most recent log file in logsDir
    latestLog := ""
    latestTime := 0
    Loop Files, logsDir "\*.log", "F" {
        if (A_LoopFileTimeModified > latestTime) {
            latestTime := A_LoopFileTimeModified
            latestLog := A_LoopFileFullPath
        }
    }
    if (latestLog != "") {
        Run(latestLog)
    } else {
        MsgBox "No log files found in 'logs' directory."
    }
}

AutoClickAndType(isManual := false)
{
    global roundCount, defaultMessages
    context := GetGitContext()
    message := GenerateLLMMessage(roundCount, context)
    ; No longer log to log.txt for LLM output
    if !message {
        UpdateStatus("[ERROR] LLM output empty. Check LM Studio/Python script.")
        SoundBeep(800, 300)
        return
    }
    SendMessageToCopilot(message)
    ; Optionally: log to a different file if needed
    roundCount := (roundCount >= 10) ? 1 : roundCount + 1
    SaveRoundCount(roundCount)
}

SendMessageToCopilot(message)
{
    global automationWindows, logFile
    if !IsSet(automationWindows) || automationWindows.Length = 0 {
        UpdateStatus("No automation windows available. Please restart automation.")
        SoundBeep(800, 300)
        return
    }
    for idx, hwnd in automationWindows {
        procName := WinGetProcessName(hwnd)
        className := WinGetClass(hwnd)
        if !(procName = "cursor.exe" || procName = "Code.exe") or className != "Chrome_WidgetWin_1" {
            continue
        }
        ; Activate window and wait
        WinActivate("ahk_id " hwnd)
        Sleep 300
        ; Try keyboard shortcut to focus chat input
        if (procName = "Code.exe") {
            Send("^+;") ; VS Code Copilot chat: Ctrl+Shift+;
        } else if (procName = "cursor.exe") {
            Send("^+;") ; Cursor Copilot chat: adjust if needed
        }
        Sleep 200
        ; Fallback: MouseClick at known coordinates if needed (customize for your layout)
        if (procName = "Code.exe") {
            MouseClick("left", 1531, 914)
        } else if (procName = "cursor.exe") {
            MouseClick("left", 1400, 909)
        }
        Sleep 200
        ; Log mouse position and window info before paste
        MouseGetPos(&mx, &my)
        FileAppend(Format("[{}] SendMessageToCopilot: message value: {}\n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), message), logFile)
        FileAppend(Format("[{}] Pasting to {} (hwnd: {}) at mouse ({}, {})\n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), procName, hwnd, mx, my), logFile)
        oldClip := ClipboardAll()
        FileAppend(Format("[{}] Clipboard before overwrite: {}\n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), Clipboard), logFile)
        Clipboard := message
        Sleep 100
        ; Clipboard verification and fallback
        retries := 0
        while (Clipboard != message && retries < 3) {
            Clipboard := message
            Sleep 100
            retries++
        }
        FileAppend(Format("[{}] Clipboard after overwrite: {}\n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), Clipboard), logFile)
        Send("^v")
        Sleep 100
        Send("{Enter}")
        Sleep 100
        Clipboard := oldClip
        FileAppend(Format("[{}] Clipboard restored: {}\n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), Clipboard), logFile)
        if (StrLen(message) < 1) {
            UpdateStatus("[ERROR] Empty or failed prompt. Check generate_prompt.py output.")
            SoundBeep(800, 300)
        } else {
            UpdateStatus("Message sent to " procName " (" hwnd ")")
            SoundBeep(1500, 100)
        }
    }
}

GetGitContext()
{
    try {
        cmd := Format('git -C "{}" status -s', "C:\Users\bcmad\Downloads\A1Betting7-13.2")
        return RunWaitOneShot(cmd)
    } catch {
        return ""
    }
}

GenerateLLMMessage(roundCount, gitContext)
{
    global myGui
    try {
        escapedContext := StrReplace(gitContext, "`"", "'")
        combo := myGui["ModelComboBox"]
        selectedModel := combo.Text  ; Get the actual string, not the index
        modelArg := (StrLen(selectedModel) > 0 && selectedModel != "No models found" && selectedModel != "Error loading models") ? Format('--model "{}"', selectedModel) : ""
        cmd := Format('python "{}\\generate_prompt.py" {} {} "{}"', scriptDir, roundCount, modelArg, escapedContext)
        return RunWaitOneShot(cmd)
    } catch {
        return ""
    }
}

RunWaitOneShot(cmd)
{
    tmpFile := A_Temp "\ahk_git_tmp.txt"
    RunWait(A_ComSpec ' /c ' cmd ' > "' tmpFile '" 2>&1', , "Hide")
    output := FileRead(tmpFile)
    FileDelete(tmpFile)
    return output
}

GenerateMessage(roundCount, gitContext)
{
    global defaultMessages

    if StrLen(gitContext) > 5 {
        if InStr(gitContext, "ui", false)
            return "Detected UI code changes. Please review UI components and responsiveness."
        else if InStr(gitContext, ".js", false)
            return "JavaScript files modified. Consider testing logic and edge cases."
        else if InStr(gitContext, ".md", false)
            return "Documentation updates detected. Verify clarity and completeness."
    }
    return defaultMessages.Has(roundCount) ? defaultMessages[roundCount] : "Proceed with development."
}

LoadRoundCount()
{
    global roundFile
    if FileExist(roundFile) {
        content := FileRead(roundFile)
        val := Trim(content)
        return IsInteger(val) ? Integer(val) : 1
    }
    return 1
}

SaveRoundCount(count)
{
    global roundFile
    if FileExist(roundFile)
        FileDelete(roundFile)
    FileAppend(count, roundFile)
}

AppendLog(entry)
{
    global logFile
    FileAppend(Format("{1} - {2}`n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), entry), logFile)
}
