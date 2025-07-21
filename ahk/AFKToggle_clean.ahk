; AFKToggle.ahk - Multi-round prompt cycler for LM Studio
#Requires AutoHotkey v2.0
SetTitleMatchMode "2"

; === File paths and session state ===
global logsDir := A_ScriptDir "\logs"
if !DirExist(logsDir) {
    try {
        DirCreate(logsDir)
    } catch {
        MsgBox "Error: Could not create logs directory at '" logsDir "'. Exiting."
        ExitApp
    }
}
global logFile := ""
global sessionStateFile := A_ScriptDir "\session_state.json"

global isRunning := false
global isPaused := false
global roundCount := 1
global selectedRound := 1
global totalRoundsSent := 0
global sessionStartTime := ""
global intervalMinutes := 4
global consecutiveWindowErrors := 0
global errorCount := 0
global lastSendTime := ""
global promptSetFile := ""
global sessionStartTick := 0

global roundMessages := Map(
    1, "Initiate a high-level review using sequential thinking. Determine the current development goal and scan all open files, code, and comments. Ensure you're aligning with the vision of robust, complete, and well-designed software.",
    2, "Deconstruct the current goal into logical, ordered subtasks. Clearly explain what you plan to do, why it matters, and how it contributes to the full robustness of the application.",
    3, "Begin work on the first subtask. Implement with clarity, using best practices, and add inline comments explaining complex logic. Ensure changes are atomic and commit-worthy.",
    4, "Review your latest change: Are there edge cases? Is it testable? Are there inconsistencies or inefficiencies? Perform a quick self-assessment and adjust if needed.",
    5, "Update README, changelogs, or inline documentation to reflect the work just completed. Make sure instructions or dependencies are clear for other developers or future automation.",
    6, "Now begin the next subtask in sequence. Reassess the current state and continue the development cycle with full awareness of previous context and priorities.",
    7, "Pause to reassess the broader state of the codebase. Are you still working on the most valuable area? Is there technical debt emerging? Do you need to shift focus before continuing?",
    8, "Identify one area of the codebase that could be refactored for performance, clarity, or maintainability. Apply small, high-value improvements in alignment with project style.",
    9, "Conduct a visual/aesthetic review. Does the UI feel clean and cohesive? Are spacing, contrast, and responsiveness considered? Suggest and apply any design-level improvements.",
    10, "Summarize what has been accomplished in this cycle. If appropriate, write a commit message, update changelogs, and prep for the next cycle. Re-enter Round 1 afterward."
)

; === GUI ===
global myGui := Gui("+AlwaysOnTop +Resize", "Prompt Cycle Automation")
myGui.SetFont("s10", "Segoe UI")

mainGroup := myGui.Add("GroupBox", "w600 h500", "Automation Controls")
btnToggle := myGui.Add("Button", "x30 y40 w120 vBtnToggle", "Start Automation")
btnToggle.OnEvent("Click", (*) => ToggleRunning())

btnPause := myGui.Add("Button", "x170 y40 w120 vBtnPause", "Pause")
btnPause.OnEvent("Click", (*) => TogglePause())
btnPause.Enabled := false

; Round Selector
roundList := []
Loop roundMessages.Count
    roundList.Push("Round " A_Index)
ddlRound := myGui.Add("DropDownList", "x310 y40 w120 vRoundSelector", roundList)
ddlRound.Value := roundCount
ddlRound.OnEvent("Change", (*) => OnRoundSelect())

btnSend := myGui.Add("Button", "x440 y40 w60 vBtnSend", "Send")
btnSend.OnEvent("Click", (*) => SendSelectedRound())

btnLog := myGui.Add("Button", "x390 y80 w80", "Show Log")
btnLog.OnEvent("Click", (*) => ShowLog())

btnOpenLogs := myGui.Add("Button", "x390 y120 w80 vBtnOpenLogs", "Open Logs")
btnOpenLogs.OnEvent("Click", (*) => OpenLogsDir())

; Interval slider (2–10 min)
myGui.Add("Text", "x30 y260 w120", "Interval (min):")
slider := myGui.Add("Slider", "x150 y260 w200 vIntervalSlider Range2-10 ToolTip", intervalMinutes)
slider.OnEvent("Change", (*) => OnIntervalChange())
intervalLabel := myGui.Add("Text", "x370 y260 w80 vIntervalLabel", intervalMinutes " min")

; === Analytics Panel ===
myGui.Add("Text", "x30 y320 w120", "Session Analytics:")
analyticsLabel := myGui.Add("Text", "x30 y340 w540 vAnalyticsLabel", "Rounds sent: 0 | Errors: 0 | Duration: 0:00 | Last send: -")

; === Custom Prompt Entry ===
myGui.Add("Text", "x30 y370 w120", "Add Custom Prompt:")
customPromptEdit := myGui.Add("Edit", "x150 y370 w300 vCustomPromptEdit", "")
btnAddPrompt := myGui.Add("Button", "x470 y370 w40 vBtnAddPrompt", "+")
btnAddPrompt.OnEvent("Click", (*) => AddCustomPrompt())

; === Export/Import Prompts ===
btnExport := myGui.Add("Button", "x30 y410 w80 vBtnExport", "Export Prompts")
btnExport.OnEvent("Click", (*) => ExportPrompts())
btnImport := myGui.Add("Button", "x120 y410 w80 vBtnImport", "Import Prompts")
btnImport.OnEvent("Click", (*) => ImportPrompts())

; === Sound/Notification Customization ===
myGui.Add("Text", "x220 y410 w120", "Sound:")
soundCombo := myGui.Add("ComboBox", "x280 y410 w100 vSoundCombo", ["Default", "Chime", "Beep", "None"])
soundCombo.Value := 1
notifyCheck := myGui.Add("CheckBox", "x400 y410 w120 vNotifyCheck", "Windows Notification")
notifyCheck.Value := false

; === Prompt Preview Enhancements ===
promptPreview := myGui.Add("Edit", "x30 y450 w440 h80 vPromptPreview ReadOnly", "")
btnCopyPrompt := myGui.Add("Button", "x480 y450 w80 vBtnCopyPrompt", "Copy Prompt")
btnCopyPrompt.OnEvent("Click", (*) => CopyCurrentPrompt())
UpdatePromptPreview(roundCount)

; === Other GUI Elements ===
roundLabel := myGui.Add("Text", "x30 y90 w440 vRoundLabel", "Current Round: " roundCount)
statusBar := myGui.Add("Text", "x30 y120 w440 vStatusText", "Status: Idle")
logNameLabel := myGui.Add("Text", "x30 y140 w440 vLogNameLabel", "Log: (none)")
errorLabel := myGui.Add("Text", "x30 y300 w440 vErrorLabel cRed", "")

myGui.Show("AutoSize Center")

F8::ToggleRunning()

; === Main Logic and Event Handlers ===
ToggleRunning() {
    global isRunning, isPaused, myGui, logFile, logsDir, roundCount, selectedRound, totalRoundsSent, sessionStartTime, consecutiveWindowErrors, errorCount, lastSendTime, sessionStartTick
    isRunning := !isRunning
    if isRunning {
        roundCount := selectedRound
        totalRoundsSent := 0
        errorCount := 0
        sessionStartTime := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
        sessionStartTick := A_TickCount
        logFile := logsDir "\session_" FormatTime(A_Now, "yyyyMMdd_HHmmss") ".log"
        UpdateLogNameLabel()
        myGui["BtnToggle"].Text := "Stop Automation"
        myGui["BtnPause"].Enabled := true
        isPaused := false
        consecutiveWindowErrors := 0
        errorLabel.Text := ""
        UpdateStatus("Automation started.")
        SetTimer(AutoClickAndType, intervalMinutes * 60000)
        AutoClickAndType()
        SaveSessionState()
    } else {
        SetTimer(AutoClickAndType, 0)
        myGui["BtnToggle"].Text := "Start Automation"
        myGui["BtnPause"].Enabled := false
        UpdateStatus("Automation stopped.")
        LogSessionSummary()
        SaveSessionState()
        RunSessionEndAction()
    }
}

TogglePause() {
    global isPaused, isRunning, myGui
    if !isRunning
        return
    isPaused := !isPaused
    if isPaused {
        SetTimer(AutoClickAndType, 0)
        myGui["BtnPause"].Text := "Resume"
        UpdateStatus("Automation paused.")
        AppendLog("Automation paused.")
    } else {
        SetTimer(AutoClickAndType, intervalMinutes * 60000)
        myGui["BtnPause"].Text := "Pause"
        UpdateStatus("Automation resumed.")
        AppendLog("Automation resumed.")
        AutoClickAndType()
    }
    SaveSessionState()
}

OnIntervalChange() {
    global slider, intervalLabel, intervalMinutes, isRunning, isPaused
    intervalMinutes := slider.Value
    intervalLabel.Text := intervalMinutes " min"
    if isRunning && !isPaused {
        SetTimer(AutoClickAndType, intervalMinutes * 60000)
    }
    SaveSessionState()
}

OnRoundSelect() {
    global ddlRound, selectedRound
    selectedRound := ddlRound.Value
    UpdatePromptPreview(selectedRound)
    UpdateRoundLabel(selectedRound)
    SaveSessionState()
}

SendSelectedRound() {
    global selectedRound
    AutoClickAndType(true, selectedRound)
}

ShowLog() {
    global logFile
    if logFile != "" && FileExist(logFile) {
        Run "notepad.exe " logFile
    } else {
        MsgBox "No log file for this session yet. Start automation to create one."
    }
}

OpenLogsDir() {
    global logsDir
    if DirExist(logsDir) {
        Run logsDir
    } else {
        MsgBox "Logs directory not found!"
    }
}

UpdateStatus(text) {
    global myGui
    myGui["StatusText"].Text := "Status: " text
}

UpdateLogNameLabel() {
    global myGui, logFile
    name := logFile != "" ? SubStr(logFile, -39) : "(none)"
    myGui["LogNameLabel"].Text := "Log: " name
}

UpdateRoundLabel(roundNum := "") {
    global myGui, roundCount, roundMessages
    if !roundNum
        roundNum := roundCount
    message := roundMessages.Has(roundNum) ? roundMessages[roundNum] : "Proceed"
    shortMsg := (StrLen(message) > 60) ? SubStr(message, 1, 60) "..." : message
    myGui["RoundLabel"].Text := "Current Round: " roundNum " | " shortMsg
}

UpdatePromptPreview(roundNum := "") {
    global myGui, roundCount, roundMessages
    if !roundNum
        roundNum := roundCount
    message := roundMessages.Has(roundNum) ? roundMessages[roundNum] : "Proceed"
    myGui["PromptPreview"].Value := message
    myGui["PromptPreview"].ToolTip := message
}

CopyCurrentPrompt() {
    global roundCount, roundMessages, selectedRound
    roundToCopy := selectedRound ? selectedRound : roundCount
    message := roundMessages.Has(roundToCopy) ? roundMessages[roundToCopy] : "Proceed"
    Clipboard := message
    ToolTip "Prompt copied!"
    SetTimer () => ToolTip(), -1000
}

AddCustomPrompt() {
    global customPromptEdit, roundMessages, myGui, ddlRound
    newPrompt := Trim(customPromptEdit.Value)
    if (newPrompt = "") {
        ToolTip "Prompt cannot be empty."
        SetTimer () => ToolTip(), -1000
        return
    }
    roundMessages[roundMessages.Count+1] := newPrompt
    ddlRound.Add("Round " roundMessages.Count)
    customPromptEdit.Value := ""
    ToolTip "Prompt added!"
    SetTimer () => ToolTip(), -1000
    SaveSessionState()
}

ExportPrompts() {
    global roundMessages
    file := FileSelect("S", "", "Save Prompt Set", "Text Files (*.txt)")
    if !file
        return
    out := ""
    for k, v in roundMessages
        out .= v "`n---`n"
    FileDelete(file)
    FileAppend(out, file)
    ToolTip "Prompts exported!"
    SetTimer () => ToolTip(), -1000
}

ImportPrompts() {
    global roundMessages, ddlRound, myGui
    file := FileSelect("O", "", "Import Prompt Set", "Text Files (*.txt)")
    if !file
        return
    content := FileRead(file)
    prompts := StrSplit(content, "`n---`n")
    roundMessages := Map()
    ddlRound.Delete()
    for idx, prompt in prompts {
        if Trim(prompt) != "" {
            roundMessages[idx] := Trim(prompt)
            ddlRound.Add("Round " idx)
        }
    }
    ToolTip "Prompts imported!"
    SetTimer () => ToolTip(), -1000
    SaveSessionState()
}

AutoClickAndType(isManual := false, customRound := "") {
    global roundCount, roundMessages, myGui, logFile, isRunning, isPaused, totalRoundsSent, consecutiveWindowErrors, errorLabel, errorCount, lastSendTime, soundCombo, notifyCheck
    if (!isRunning || isPaused)
        return
    hwnd := WinGetID("ahk_exe Code.exe")
    if !hwnd
        hwnd := WinGetID("ahk_exe cursor.exe")
    if !hwnd {
        consecutiveWindowErrors++
        errorCount++
        UpdateStatus("No supported window found. Will retry next cycle.")
        AppendLog("No supported window found. Will retry next cycle.")
        if consecutiveWindowErrors >= 3 {
            errorLabel.Text := "⚠️  Copilot/VS Code/Cursor not found for 3+ cycles!"
            AppendLog("WARNING: Copilot/VS Code/Cursor not found for 3+ cycles!")
            if notifyCheck.Value {
                TrayTip "Copilot Automation", "Copilot/VS Code/Cursor not found for 3+ cycles!", 1
            }
        }
        SoundNotify("error")
        return
    } else {
        if consecutiveWindowErrors >= 3 {
            errorLabel.Text := "Auto-resume: Window found!"
            AppendLog("Auto-resume: Window found after error.")
            if notifyCheck.Value {
                TrayTip "Copilot Automation", "Auto-resume: Window found!", 1
            }
        }
        consecutiveWindowErrors := 0
        errorLabel.Text := ""
    }
    WinActivate("ahk_id " hwnd)
    Sleep 500
    procName := WinGetProcessName(hwnd)
    className := WinGetClass(hwnd)
    if !(procName = "cursor.exe" || procName = "Code.exe") or className != "Chrome_WidgetWin_1" {
        consecutiveWindowErrors++
        errorCount++
        UpdateStatus("Not in supported window after activation. Will retry next cycle.")
        AppendLog("Not in supported window after activation. Will retry next cycle.")
        if consecutiveWindowErrors >= 3 {
            errorLabel.Text := "⚠️  Copilot/VS Code/Cursor not found for 3+ cycles!"
            AppendLog("WARNING: Copilot/VS Code/Cursor not found for 3+ cycles!")
            if notifyCheck.Value {
                TrayTip "Copilot Automation", "Copilot/VS Code/Cursor not found for 3+ cycles!", 1
            }
        }
        SoundNotify("error")
        return
    } else {
        consecutiveWindowErrors := 0
        errorLabel.Text := ""
    }
    if (procName = "Code.exe") {
        MouseMove 1584, 919
    } else if (procName = "cursor.exe") {
        MouseMove 1400, 909
    } else {
        UpdateStatus("Unsupported app. Skipping.")
        AppendLog("Unsupported app. Skipping.")
        SoundNotify("error")
        return
    }
    Click
    Sleep 500
    ; Advanced error handling: try to focus chat input if needed
    MouseGetPos &mx, &my
    Send "^+;" ; Try Copilot chat shortcut
    Sleep 200
    roundToSend := customRound ? customRound : roundCount
    message := roundMessages.Has(roundToSend) ? roundMessages[roundToSend] : "Proceed"
    UpdatePromptPreview(roundToSend)
    UpdateRoundLabel(roundToSend)
    AppendLog("Preparing to send round " roundToSend ": " message)
    Send message
    Send "{Enter}"
    AppendLog("Round " roundToSend ": " message)
    SoundNotify("success")
    totalRoundsSent++
    lastSendTime := FormatTime(A_Now, "HH:mm:ss")
    UpdateAnalytics()
    if !customRound {
        roundCount := (roundCount >= roundMessages.Count) ? 1 : roundCount + 1
        SaveRoundCount(roundCount)
        UpdatePromptPreview(roundCount)
        UpdateRoundLabel(roundCount)
    }
    SaveSessionState()
}

UpdateAnalytics() {
    global analyticsLabel, totalRoundsSent, errorCount, sessionStartTime, lastSendTime, isRunning, sessionStartTick
    duration := "0:00"
    if isRunning && sessionStartTick {
        elapsed := (A_TickCount - sessionStartTick) // 1000
        min := elapsed // 60
        sec := Mod(elapsed, 60)
        duration := min ":" (sec < 10 ? "0" sec : sec)
    }
    analyticsLabel.Text := "Rounds sent: " totalRoundsSent " | Errors: " errorCount " | Duration: " duration " | Last send: " (lastSendTime ? lastSendTime : "-")
}

LogSessionSummary() {
    global logFile, totalRoundsSent, sessionStartTime, errorCount
    summary := "Session ended.\nStart: " sessionStartTime "\nEnd: " FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") "\nTotal rounds sent: " totalRoundsSent "\nErrors: " errorCount
    AppendLog(summary)
}

SoundNotify(type) {
    global soundCombo
    sound := soundCombo.Text
    if sound = "None"
        return
    if type = "error" {
        if sound = "Chime"
            SoundBeep 800, 200
        else if sound = "Beep"
            SoundBeep 1000, 100
        else
            SoundBeep 1000, 150
    } else {
        if sound = "Chime"
            SoundBeep 1500, 200
        else if sound = "Beep"
            SoundBeep 1200, 100
        else
            SoundBeep 1500, 150
    }
}

RunSessionEndAction() {
    global logFile
    ; Example: open the log file at session end
    if logFile != "" && FileExist(logFile) {
        Run "notepad.exe " logFile
    }
    ; You can add more actions here (e.g., send email, run script)
}

SaveSessionState() {
    global sessionStateFile, roundCount, selectedRound, totalRoundsSent, sessionStartTime, intervalMinutes, roundMessages
    state := {
        roundCount: roundCount,
        selectedRound: selectedRound,
        totalRoundsSent: totalRoundsSent,
        sessionStartTime: sessionStartTime,
        intervalMinutes: intervalMinutes,
        roundMessages: roundMessages
    }
    FileDelete(sessionStateFile)
    FileAppend(Jxon_Dump(state), sessionStateFile)
}

RestoreSessionState() {
    global sessionStateFile, roundCount, selectedRound, totalRoundsSent, sessionStartTime, intervalMinutes, roundMessages, ddlRound
    if !FileExist(sessionStateFile)
        return
    content := FileRead(sessionStateFile)
    state := Jxon_Load(content)
    roundCount := state.roundCount
    selectedRound := state.selectedRound
    totalRoundsSent := state.totalRoundsSent
    sessionStartTime := state.sessionStartTime
    intervalMinutes := state.intervalMinutes
    roundMessages := state.roundMessages
    ddlRound.Delete()
    for k, v in roundMessages
        ddlRound.Add("Round " k)
}

LoadRoundCount() {
    file := A_ScriptDir "\round_state.txt"
    if FileExist(file) {
        content := FileRead(file)
        val := Trim(content)
        return IsInteger(val) ? Integer(val) : 1
    }
    return 1
}

SaveRoundCount(count) {
    file := A_ScriptDir "\round_state.txt"
    if FileExist(file)
        FileDelete(file)
    FileAppend count, file
}

AppendLog(entry) {
    global logFile, logsDir
    if logFile = "" {
        logFile := logsDir "\manual_" FormatTime(A_Now, "yyyyMMdd_HHmmss") ".log"
        UpdateLogNameLabel()
    }
    FileAppend Format("{1} - {2}`n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), entry), logFile
}

; === Minimal Jxon JSON library for AHK v2 ===
Jxon_Dump(obj, indent := "", lvl := 1) {
    static q := Chr(34)
    if IsObject(obj) {
        if obj is Array {
            out := "["
            for k, v in obj
                out .= (A_Index > 1 ? "," : "") . Jxon_Dump(v, indent, lvl+1)
            return out "]"
        } else {
            out := "{"
            for k, v in obj
                out .= (A_Index > 1 ? "," : "") . q k q ":" . Jxon_Dump(v, indent, lvl+1)
            return out "}"
        }
    } else if IsNumber(obj) {
        return obj
    } else if (Type(obj) = "String") {
        s := obj
        s := StrReplace(s, "\\", "\\\\")
        s := StrReplace(s, '"', '\\"')
        s := StrReplace(s, "\n", "\\n")
        s := StrReplace(s, "\r", "\\r")
        s := StrReplace(s, "\t", "\\t")
        return q s q
    } else if (obj = "true" or obj = "false" or obj = "null") {
        return obj
    } else {
        return q obj q
    }
}

Jxon_Load(json) {
    static fn := Func("Jxon_Parse")
    return %fn%(json)
}

Jxon_Parse(json) {
    static q := Chr(34)
    json := Trim(json)
    if (SubStr(json, 1, 1) = "{") {
        obj := Map()
        json := SubStr(json, 2, -1)
        while (RegExMatch(json, '"' q '([^"\\]*(?:\\.[^"\\]*)*)' q '\s*:\s*', &m)) {
            k := StrReplace(m[1], '\\"', '"')
            json := SubStr(json, m.Pos + m.Len)
            v := Jxon_ParseValue(json)
            obj[k] := v.value
            json := v.rest
            if (SubStr(json, 1, 1) = ",")
                json := SubStr(json, 2)
        }
        return obj
    } else if (SubStr(json, 1, 1) = "[") {
        arr := []
        json := SubStr(json, 2, -1)
        while (json != "") {
            v := Jxon_ParseValue(json)
            arr.Push(v.value)
            json := v.rest
            if (SubStr(json, 1, 1) = ",")
                json := SubStr(json, 2)
        }
        return arr
    } else {
        return Jxon_ParseValue(json).value
    }
}

Jxon_ParseValue(ByRef json) {
    static q := Chr(34)
    json := LTrim(json)
    if (SubStr(json, 1, 1) = q) {
        json := SubStr(json, 2)
        ; Fix: Use InStr to find the next quote
        i := InStr(json, q)
        if i {
            s := SubStr(json, 1, i-1)
            json := SubStr(json, i+1)
        } else {
            s := json
            json := ""
        }
        return {value: s, rest: json}
    } else if (RegExMatch(json, '^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?', &m)) {
        json := SubStr(json, m.Pos + m.Len)
        return {value: m[0]+0, rest: json}
    } else if (SubStr(json, 1, 4) = "true") {
        json := SubStr(json, 5)
        return {value: true, rest: json}
    } else if (SubStr(json, 1, 5) = "false") {
        json := SubStr(json, 6)
        return {value: false, rest: json}
    } else if (SubStr(json, 1, 4) = "null") {
        json := SubStr(json, 5)
        return {value: "", rest: json}
    } else if (SubStr(json, 1, 1) = "{") {
        v := Jxon_Parse(json)
        return {value: v, rest: ""}
    } else if (SubStr(json, 1, 1) = "[") {
        v := Jxon_Parse(json)
        return {value: v, rest: ""}
    } else {
        return {value: "", rest: json}
    }
}

; === End Jxon JSON library ===
