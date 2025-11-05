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
sessionStateFile := ""

global isRunning := false
global isPaused := false
; --- Round tracking using round_state.txt ---
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

; --- On script start, restore roundCount ---
global roundCount := LoadRoundCount()
global selectedRound := roundCount
global totalRoundsSent := 0
global sessionStartTime := ""
global intervalMinutes := 4
global consecutiveWindowErrors := 0
global errorCount := 0
global lastSendTime := ""
global promptSetFile := ""
global sessionStartTick := 0

; --- Modular, profile-driven round system ---
global profiles := Map(
    "General", Map(
        1, "You are an expert AI coding assistant. Summarize the current development objective, step by step, using clear, direct language. Context: {context_summary}. Output a concise summary and list any open questions.",
        2, "Proceed with best practice approach.",
        3, "Proceed with best practice approach.",
        4, "Proceed with best practice approach.",
        5, "Break down the goal into atomic, logical subtasks. Use a numbered list, provide a one-sentence rationale for each, and ensure each step is actionable.",
        6, "Proceed with best practice approach.",
        7, "Proceed with best practice approach.",
        8, "Proceed with best practice approach.",
        9, "Implement the highest-priority subtask. Think out loud before coding, then provide the code. Use best practices, comment complex logic, and output only the code block and a brief summary of changes.",
        10, "Proceed with best practice approach.",
        11, "Proceed with best practice approach.",
        12, "Proceed with best practice approach.",
        13, "Review your last change for edge cases, testability, and consistency. List risks and self-critique in a checklist. Use clear, direct language.",
        14, "Proceed with best practice approach.",
        15, "Proceed with best practice approach.",
        16, "Proceed with best practice approach.",
        17, "Update README, changelogs, or inline docs to reflect recent changes. Output a markdown diff or summary of documentation changes. Use bullet points for clarity.",
        18, "Proceed with best practice approach.",
        19, "Proceed with best practice approach.",
        20, "Proceed with best practice approach.",
        21, "Scan for vulnerabilities, secrets, or unsafe patterns. List findings in order of severity, suggest fixes, and use a table for output.",
        22, "Proceed with best practice approach.",
        23, "Proceed with best practice approach.",
        24, "Proceed with best practice approach.",
        25, "Profile for slow code or bottlenecks. Identify, measure, and suggest optimizations. Output a before/after performance summary and next steps.",
        26, "Proceed with best practice approach.",
        27, "Proceed with best practice approach.",
        28, "Proceed with best practice approach.",
        29, "Is the UI accessible and inclusive? Check color contrast, keyboard navigation, ARIA labels, etc. Output a list of issues and recommended fixes.",
        30, "Proceed with best practice approach.",
        31, "Proceed with best practice approach.",
        32, "Proceed with best practice approach.",
        33, "Lint and style all files. List inconsistencies and suggest fixes. Output a summary of lint results and a plan to resolve them.",
        34, "Proceed with best practice approach.",
        35, "Proceed with best practice approach.",
        36, "Proceed with best practice approach.",
        37, "Add or update automated tests for new/changed code. What needs testing, what cases are missing, and how to cover them? Output a test plan and any missing cases.",
        38, "Proceed with best practice approach.",
        39, "Proceed with best practice approach.",
        40, "Proceed with best practice approach.",
        41, "Propose a refactor for clarity, maintainability, or performance. Output a before/after code snippet and rationale.",
        42, "Proceed with best practice approach.",
        43, "Proceed with best practice approach.",
        44, "Proceed with best practice approach.",
        45, "Review user-facing documentation. Is it clear, accurate, and up to date? Output a list of improvements and a sample revised section.",
        46, "Proceed with best practice approach.",
        47, "Proceed with best practice approach.",
        48, "Proceed with best practice approach.",
        49, "Is the project ready for release? Check dependencies, version, and packaging. Output a release checklist and any blockers.",
        50, "Proceed with best practice approach.",
        51, "Proceed with best practice approach.",
        52, "Proceed with best practice approach.",
        53, "What went well this cycle? What could be improved? Summarize lessons learned. Output as a bullet list and propose a next action.",
        54, "Proceed with best practice approach.",
        55, "Proceed with best practice approach.",
        56, "Proceed with best practice approach.",
        57, "Suggest a radical simplification or creative improvement for this module. Output a proposal and a brief justification.",
        58, "Proceed with best practice approach.",
        59, "Proceed with best practice approach.",
        60, "Proceed with best practice approach.",
        61, "{intermission_prompt}"
    ),
    "Security", Map(
        1, "Summarize the current security objective. Context: {context_summary}. Output as a concise paragraph and list any open questions.",
        2, "List all potential security risks in the current codebase or change. Output as a table with risk level and mitigation.",
        3, "Scan for secrets, credentials, or unsafe patterns. Suggest and apply fixes. Output a table of findings and actions taken.",
        4, "Check for dependency vulnerabilities and outdated packages. Output a list of issues and update recommendations.",
        5, "Review authentication and authorization logic for weaknesses. Output a summary of findings and next steps.",
        6, "Suggest improvements for input validation and sanitization. Output a checklist and code examples.",
        7, "Propose a security test or audit for the most critical area. Output a test plan and expected results.",
        8, "Summarize security findings and next steps. Output as a bullet list and propose a next action.",
        9, "{intermission_prompt}"
    ),
    "Performance", Map(
        1, "Summarize the current performance objective. Context: {context_summary}. Output as a concise paragraph and list any open questions.",
        2, "Profile the code for bottlenecks or slow areas. Output a table of slow functions and their impact.",
        3, "Suggest and apply optimizations for the slowest function/module. Output before/after code and performance metrics.",
        4, "Review memory usage and propose improvements. Output a summary and a plan for optimization.",
        5, "Check for unnecessary computations or redundant code. Output a list of candidates for removal and rationale.",
        6, "Suggest caching or parallelization opportunities. Output a proposal and expected impact.",
        7, "Summarize performance findings and next steps. Output as a bullet list and propose a next action.",
        8, "{intermission_prompt}"
    ),
    "Documentation", Map(
        1, "Summarize the current documentation objective. Context: {context_summary}. Output as a concise paragraph and list any open questions.",
        2, "Review README and onboarding docs for clarity and completeness. Output a list of improvements and a sample revision.",
        3, "Check inline code comments for accuracy and helpfulness. Output a table of issues and suggested changes.",
        4, "Update changelogs to reflect recent changes. Output a markdown diff or summary.",
        5, "Review user-facing documentation for accuracy and completeness. Output a list of improvements and a sample revision.",
        6, "Suggest improvements for API or developer docs. Output a checklist and sample changes.",
        7, "Summarize documentation findings and next steps. Output as a bullet list and propose a next action.",
        8, "{intermission_prompt}"
    ),
    "Advancer", Map(
        1, "Continue/Proceed"
    )
)

global currentProfile := "General"
global roundMessages := profiles[currentProfile]

global profileList := []
for k, v in profiles
    profileList.Push(k)

global intermissionTypes := [
    "Context Refresh",
    "AI Self-Assessment",
    "Team Sync"
]
global intermissionPrompts := Map(
    "Context Refresh", "Intermission: Summarize the last cycle, refresh context, and prepare for the next. If any context or memory is missing, restore it now.",
    "AI Self-Assessment", "Intermission: Critically assess the AI's performance in the last cycle. What could be improved? What should be repeated? Refresh context and prepare for the next cycle.",
    "Team Sync", "Intermission: Summarize the last cycle for the team. Are there any blockers or questions for human collaborators? Refresh context and prepare for the next cycle."
)
global currentIntermissionType := intermissionTypes[1]

SetCurrentRound(newRound) {
    global roundCount, selectedRound, ddlRound, roundList
    maxIdx := roundList.Length
    if (newRound < 1 || newRound > maxIdx)
        newRound := 1
    roundCount := newRound
    selectedRound := newRound
    if ddlRound && maxIdx >= 1 && newRound >= 1 && newRound <= maxIdx {
        ddlRound.Value := newRound
    }
    UpdatePromptPreview(newRound)
    UpdateRoundLabel(newRound)
    SaveRoundCount(newRound)
}

OnIntermissionTypeSelect() {
    global intermissionCombo, intermissionTypes, intermissionPrompts, profiles, currentProfile, roundMessages
    idx := intermissionCombo.Value
    if idx >= 1 && idx <= intermissionTypes.Length {
        selectedType := intermissionTypes[idx]
        currentIntermissionType := selectedType
        ; Update the intermission prompt for the current profile
        if profiles.Has(currentProfile) {
            rounds := profiles[currentProfile]
            if rounds.Has(rounds.Count) {
                rounds[rounds.Count] := intermissionPrompts[selectedType]
                roundMessages := rounds
            }
        }
    }
}

EditSelectedPrompt() {
    global promptListView, roundMessages
    idx := promptListView.Value
    if !idx || !roundMessages.Has(idx)
        return
    newPrompt := InputBox("Edit Prompt", "Edit the selected prompt:", roundMessages[idx])
    if newPrompt.Result = "OK" && Trim(newPrompt.Value) != "" {
        roundMessages[idx] := Trim(newPrompt.Value)
        UpdatePromptListBox()
        promptListView.Value := idx
        UpdatePromptPreview(idx)
        UpdateRoundLabel(idx)
        SetCurrentRound(idx)
    }
}

DeleteSelectedPrompt() {
    global promptListView, roundMessages, roundList, ddlRound
    idx := promptListView.Value
    if !idx || !roundMessages.Has(idx)
        return
    if MsgBox("Are you sure you want to delete this prompt?", "Confirm Delete", 4) != "Yes"
        return
    roundMessages.Delete(idx)
    roundList.RemoveAt(idx)
    ddlRound.Delete(idx)
    UpdatePromptListBox()
    UpdatePromptPreview(1)
    UpdateRoundLabel(1)
    SetCurrentRound(1)
}

MoveSelectedPrompt(direction) {
    global promptListView, roundMessages, roundList, ddlRound
    idx := promptListView.Value
    if !idx || !roundMessages.Has(idx)
        return
    newIdx := idx + direction
    if newIdx < 1 || newIdx > roundMessages.Count
        return
    ; Swap prompts
    temp := roundMessages[idx]
    roundMessages[idx] := roundMessages[newIdx]
    roundMessages[newIdx] := temp
    ; Swap in roundList and ddlRound
    tempLabel := roundList[idx]
    roundList[idx] := roundList[newIdx]
    roundList[newIdx] := tempLabel
    ddlRound.Delete(idx)
    ddlRound.Insert(idx, roundList[idx])
    ddlRound.Delete(newIdx)
    ddlRound.Insert(newIdx, roundList[newIdx])
    UpdatePromptListBox()
    promptListView.Value := newIdx
    UpdatePromptPreview(newIdx)
    UpdateRoundLabel(newIdx)
    SetCurrentRound(newIdx)
    ; Disable move buttons if at top/bottom
    btnMoveUpPrompt.Enabled := newIdx > 1
    btnMoveDownPrompt.Enabled := newIdx < roundMessages.Count
}

; === BEGIN: Fix all initialization, function, and GUI assignment issues ===

; --- Ensure all global variables are initialized before use ---
global maxContextLines := 1000
global customSoundFile := ""
global roundList := []
global errorLabel := ""
global slider := ""
global intervalLabel := ""
global contextLineSlider := ""
global contextLineLabel := ""

; --- Define all referenced functions as stubs if not implemented ---
OnProfileSelect(*) {
    global profileCombo, profiles, roundMessages, roundList, ddlRound, promptListView
    idx := profileCombo.Value
    selectedProfile := profileCombo.GetText(idx)
    if profiles.Has(selectedProfile) {
        ; 1. Build roundMessages for Advancer or use profile's own
        if selectedProfile = "Advancer" {
            roundMessages := Map()
            for i in 1..20
                roundMessages[i] := "Continue/Proceed"
        } else {
            roundMessages := profiles[selectedProfile]
        }
        ; 2. Clear and rebuild roundList and ddlRound
        roundList := []
        ddlRound.Delete()
        for k, v in roundMessages {
            roundList.Push("Round " k)
            ddlRound.Add("Round " k)
        }
        ; 3. Clear and repopulate promptListView
        promptListView.Delete()
        for k, v in roundMessages {
            promptListView.Add(k, v)
        }
        ; 4. Set current round to 1 and update all GUI elements
        SetCurrentRound(1)
        UpdatePromptPreview(1)
        UpdateRoundLabel(1)
        ; 5. Visual feedback
        ToolTip "Profile switched to: " selectedProfile
        SetTimer () => ToolTip(), -1500
        UpdateStatus("Active profile: " selectedProfile)
    }
}
OnContextLineChange(*) {
    ; TODO: Implement context line slider logic
}
PreviewContext(*) {
    ; TODO: Implement context preview logic
}
OnSoundSelect(*) {
    ; TODO: Implement sound selection logic
}
GetContextSummary(file, lines) {
    return "(context summary placeholder)"
}

; --- Populate roundList from roundMessages before GUI creation ---
global roundMessages := profiles[currentProfile]
roundList := []
for k, v in roundMessages
    roundList.Push("Round " k)

; === Modernized GUI Layout (corrected assignments) ===
myGui := Gui("+AlwaysOnTop +Resize", "A1Betting Prompt Cycle Automation")
myGui.SetFont("s10", "Segoe UI")
myGui.BackColor := 0xF7F7F7 ; Light background

; --- Group: Profile & Round Selection ---
grpProfile := myGui.Add("GroupBox", "x20 y20 w320 h100", "Profile & Round")
profileCombo := myGui.Add("ComboBox", "x40 y50 w180", profileList)
profileCombo.Value := 1
profileCombo.OnEvent("Change", (*) => OnProfileSelect())
profileCombo.ToolTip := "Select a prompt profile."

intermissionCombo := myGui.Add("ComboBox", "x230 y50 w100", intermissionTypes)
intermissionCombo.Value := 1
intermissionCombo.OnEvent("Change", (*) => OnIntermissionTypeSelect())
intermissionCombo.ToolTip := "Select intermission type."

; --- Add Log Name Label ---
logNameLabel := myGui.Add("Text", "x360 y20 w540 vLogNameLabel", "Log: (none)")

; --- Add Round Label ---
roundLabel := myGui.Add("Text", "x360 y50 w540 vRoundLabel", "Current Round: 1 | ...")

; --- Add Prompt Preview ---
promptPreview := myGui.Add("Edit", "x360 y80 w540 h40 ReadOnly vPromptPreview", "")

; --- Group: Round Selector ---
grpRound := myGui.Add("GroupBox", "x20 y130 w320 h80", "Round Selector")
ddlRound := myGui.Add("DropDownList", "x40 y160 w180 vRoundSelector", roundList)
ddlRound.Value := roundCount
maxIdx := roundList.Length
if (roundCount < 1 || roundCount > maxIdx)
    roundCount := 1
ddlRound.OnEvent("Change", (*) => OnRoundSelect())
ddlRound.ToolTip := "Select the current round."
btnSend := myGui.Add("Button", "x230 y160 w80 vBtnSend", "Send →")
btnSend.OnEvent("Click", (*) => SendSelectedRound())
btnSend.ToolTip := "Send the selected round prompt."

; --- Add Copy Prompt Button ---
copyPromptBtn := myGui.Add("Button", "x360 y130 w120 vCopyPromptBtn", "Copy Prompt")
copyPromptBtn.OnEvent("Click", (*) => CopyCurrentPrompt())
copyPromptBtn.ToolTip := "Copy the current prompt to clipboard."

; --- Add Automation Controls ---
btnToggle := myGui.Add("Button", "x500 y130 w120 vBtnToggle", "Start Automation")
btnToggle.OnEvent("Click", (*) => ToggleRunning())
btnToggle.ToolTip := "Start or stop automation."
btnPause := myGui.Add("Button", "x640 y130 w120 vBtnPause", "Pause")
btnPause.OnEvent("Click", (*) => TogglePause())
btnPause.ToolTip := "Pause or resume automation."

; --- Group: Prompt Management ---
grpPrompt := myGui.Add("GroupBox", "x360 y180 w540 h260", "Prompt Management")
promptListView := myGui.Add("ListView", "x380 y210 w500 h160 -Multi", ["#", "Prompt Preview"])
promptListView.OnEvent("DoubleClick", (*) => EditSelectedPrompt())
promptListView.ToolTip := "Double-click to edit. Select to move or delete."

btnEditPrompt := myGui.Add("Button", "x900 y210 w80", "✏️ Edit")
btnEditPrompt.OnEvent("Click", (*) => EditSelectedPrompt())
btnEditPrompt.ToolTip := "Edit the selected prompt."

btnDeletePrompt := myGui.Add("Button", "x900 y250 w80", "🗑️ Delete")
btnDeletePrompt.OnEvent("Click", (*) => DeleteSelectedPrompt())
btnDeletePrompt.ToolTip := "Delete the selected prompt."

btnMoveUpPrompt := myGui.Add("Button", "x900 y290 w80", "↑ Up")
btnMoveUpPrompt.OnEvent("Click", (*) => MoveSelectedPrompt(-1))
btnMoveUpPrompt.ToolTip := "Move the selected prompt up."

btnMoveDownPrompt := myGui.Add("Button", "x900 y330 w80", "↓ Down")
btnMoveDownPrompt.OnEvent("Click", (*) => MoveSelectedPrompt(1))
btnMoveDownPrompt.ToolTip := "Move the selected prompt down."

btnExport := myGui.Add("Button", "x380 y380 w100", "Export Prompts")
btnExport.OnEvent("Click", (*) => ExportPrompts())
btnExport.ToolTip := "Export all or selected prompts."
btnImport := myGui.Add("Button", "x490 y380 w100", "Import Prompts")
btnImport.OnEvent("Click", (*) => ImportPrompts())
btnImport.ToolTip := "Import prompts from a file."

; --- Group: Custom Prompt Entry ---
grpCustom := myGui.Add("GroupBox", "x20 y220 w320 h80", "Add Custom Prompt")
customPromptEdit := myGui.Add("Edit", "x40 y250 w220", "")
btnAddPrompt := myGui.Add("Button", "x270 y250 w50", "+")
btnAddPrompt.OnEvent("Click", (*) => AddCustomPrompt())
btnAddPrompt.ToolTip := "Add a new custom prompt."

; --- Group: Context File ---
grpContext := myGui.Add("GroupBox", "x20 y320 w320 h120", "Context File")
contextFileBtn := myGui.Add("Button", "x40 y350 w120", "Select Context File")
contextFileBtn.OnEvent("Click", (*) => PickContextFile())
contextFileBtn.ToolTip := "Select a context file."
contextFileLabel := myGui.Add("Text", "x170 y350 w150", "Context: (none)")
contextLineSlider := myGui.Add("Slider", "x40 y380 w180 Range100-5000", maxContextLines)
contextLineSlider.OnEvent("Change", (*) => OnContextLineChange())
contextLineLabel := myGui.Add("Text", "x230 y380 w100", maxContextLines " lines")
previewContextBtn := myGui.Add("Button", "x40 y410 w120", "Preview Context")
previewContextBtn.OnEvent("Click", (*) => PreviewContext())
contextPreviewBox := myGui.Add("Edit", "x360 y450 w540 h80 ReadOnly", "")

; --- Group: Sound/Notification ---
grpSound := myGui.Add("GroupBox", "x20 y460 w320 h80", "Sound & Notification")
soundCombo := myGui.Add("ComboBox", "x40 y490 w120", ["Default", "Chime", "Beep", "None", "Custom..."])
soundCombo.Value := 1
soundCombo.OnEvent("Change", (*) => OnSoundSelect())
customSoundLabel := myGui.Add("Text", "x170 y490 w150", "")
notifyCheck := myGui.Add("CheckBox", "x40 y520 w180", "Windows Notification")
notifyCheck.Value := false

; --- Analytics & Status Bar ---
analyticsLabel := myGui.Add("Text", "x360 y540 w540 vAnalyticsLabel", "Rounds sent: 0 | Errors: 0 | Duration: 0:00 | Last send: -")
statusBar := myGui.Add("Text", "x20 y560 w880 vStatusText", "Status: Idle")

; --- Add errorLabel, slider, intervalLabel for completeness ---
errorLabel := myGui.Add("Text", "x20 y590 w880", "")
slider := myGui.Add("Slider", "x40 y600 w180 Range1-10", intervalMinutes)
slider.OnEvent("Change", (*) => OnIntervalChange())
intervalLabel := myGui.Add("Text", "x230 y600 w100", intervalMinutes " min")

myGui.Show("w1100 h700 Center")

; === END: Fix all initialization, function, and GUI assignment issues ===

F8::ToggleRunning()

; === GLOBAL PANIC HOTKEY ===
F12::ExitApp ; Press F12 at any time to immediately exit the script

; === Automation Lock ===
global autoClickLock := false

; === Main Logic and Event Handlers ===
ToggleRunning() {
    global isRunning, isPaused, myGui, logFile, logsDir, roundCount, selectedRound, totalRoundsSent, sessionStartTime, consecutiveWindowErrors, errorCount, lastSendTime, sessionStartTick, intervalMinutes
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
        myGui["BtnPause"].Text := "Pause"
        isPaused := false
        consecutiveWindowErrors := 0
        errorLabel.Text := ""
        UpdateStatus("Automation started.")
        ; --- Enforce minimum interval of 10 seconds ---
        minInterval := Max(intervalMinutes, 0.167) ; 0.167 min = 10 sec
        SetTimer(AutoClickAndType, minInterval * 60000)
        AutoClickAndType()
    } else {
        SetTimer(AutoClickAndType, 0)
        myGui["BtnToggle"].Text := "Start Automation"
        myGui["BtnPause"].Enabled := false
        myGui["BtnPause"].Text := "Pause"
        UpdateStatus("Automation stopped.")
        LogSessionSummary()
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
        minInterval := Max(intervalMinutes, 0.167) ; 0.167 min = 10 sec
        SetTimer(AutoClickAndType, minInterval * 60000)
        myGui["BtnPause"].Text := "Pause"
        UpdateStatus("Automation resumed.")
        AppendLog("Automation resumed.")
        AutoClickAndType()
    }
}

OnIntervalChange() {
    global slider, intervalLabel, intervalMinutes, isRunning, isPaused
    intervalMinutes := slider.Value
    intervalLabel.Text := intervalMinutes " min"
    if isRunning && !isPaused {
        minInterval := Max(intervalMinutes, 0.167) ; 0.167 min = 10 sec
        SetTimer(AutoClickAndType, minInterval * 60000)
    }
}

OnRoundSelect() {
    global ddlRound, selectedRound
    selectedRound := ddlRound.Value
    UpdatePromptPreview(selectedRound)
    UpdateRoundLabel(selectedRound)
}

SendSelectedRound() {
    global selectedRound, roundCount, isRunning, roundMessages, roundList
    if isRunning && selectedRound != roundCount {
        SetCurrentRound(selectedRound)
    }
    AutoClickAndType(true, selectedRound)
    if isRunning {
        ; After manual send, increment round only if automation is running
        nextRound := roundCount + 1
        if (nextRound > roundList.Length)
            nextRound := 1
        SetCurrentRound(nextRound)
    } else {
        ; If not running, keep round selector in sync
        SetCurrentRound(selectedRound)
    }
    UpdateAnalytics()
    ToolTip "Manual send: advanced to round " roundCount
    SetTimer () => ToolTip(), -1000
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

; --- CopyCurrentPrompt always uses selectedRound or roundCount ---
CopyCurrentPrompt() {
    global roundCount, roundMessages, selectedRound
    roundToCopy := selectedRound ? selectedRound : roundCount
    message := roundMessages.Has(roundToCopy) ? roundMessages[roundToCopy] : "Proceed"
    Clipboard := message
    ToolTip "Prompt copied!"
    SetTimer () => ToolTip(), -1000
}

AddCustomPrompt() {
    global customPromptEdit, roundMessages, myGui, ddlRound, roundList
    newPrompt := Trim(customPromptEdit.Value)
    if (newPrompt = "") {
        ToolTip "Prompt cannot be empty."
        SetTimer () => ToolTip(), -1000
        return
    }
    roundMessages[roundMessages.Count+1] := newPrompt
    ddlRound.Add("Round " roundMessages.Count)
    roundList.Push("Round " roundMessages.Count)
    customPromptEdit.Value := ""
    ToolTip "Prompt added!"
    SetTimer () => ToolTip(), -1000
}

ExportPrompts() {
    global roundMessages, promptListView
    file := FileSelect(1, "", "Save Prompt Set", "Text Files (*.txt)")
    if !file
        return
    out := ""
    if promptListView.Value {
        ; Export only selected prompt
        idx := promptListView.Value
        if roundMessages.Has(idx)
            out := roundMessages[idx] "`n---`n"
    } else {
        ; Export all
        for k, v in roundMessages
            out .= v "`n---`n"
    }
    FileDelete(file)
    FileAppend(out, file)
    MsgBox "Prompts exported successfully!"
}

ImportPrompts() {
    global roundMessages, ddlRound, myGui, roundList, promptListView
    file := FileSelect(2, "", "Import Prompt Set", "Text Files (*.txt)")
    if !file
        return
    content := FileRead(file)
    prompts := StrSplit(content, "`n---`n")
    previewList := []
    for _, prompt in prompts {
        if Trim(prompt) != "" {
            previewList.Push(Trim(prompt))
        }
    }
    if previewList.Length = 0 {
        MsgBox "No valid prompts found in file!"
        return
    }
    ; Show preview dialog
    previewGui := Gui("+AlwaysOnTop", "Preview Imported Prompts")
    previewGui.SetFont("s10", "Segoe UI")
    previewGui.Add("Text", "w400", "Preview of imported prompts:")
    previewBox := previewGui.Add("ListBox", "w400 h200", previewList)
    btnOverwrite := previewGui.Add("Button", "x10 y220 w120", "Overwrite")
    btnAppend := previewGui.Add("Button", "x150 y220 w120", "Append")
    btnCancel := previewGui.Add("Button", "x290 y220 w80", "Cancel")
    result := ""
    btnOverwrite.OnEvent("Click", (*) => (result := "overwrite", previewGui.Destroy()))
    btnAppend.OnEvent("Click", (*) => (result := "append", previewGui.Destroy()))
    btnCancel.OnEvent("Click", (*) => (result := "cancel", previewGui.Destroy()))
    previewGui.Show("AutoSize Center")
    while (result = "")
        Sleep 100
    if result = "cancel"
        return
    if result = "overwrite" {
        roundMessages := Map()
        ddlRound.Delete()
        roundList := []
        for idx, prompt in previewList {
            roundMessages[idx] := prompt
            ddlRound.Add("Round " idx)
            roundList.Push("Round " idx)
        }
    } else if result = "append" {
        startIdx := roundMessages.Count + 1
        for i, prompt in previewList {
            idx := startIdx + i - 1
            roundMessages[idx] := prompt
            ddlRound.Add("Round " idx)
            roundList.Push("Round " idx)
        }
    }
    UpdatePromptListBox()
    SetCurrentRound(1)
    MsgBox "Prompts imported successfully!"
}

ExportRounds() {
    global roundMessages
    file := FileSelect(1, "", "Export Round Set", "Text Files (*.txt)")
    if !file
        return
    out := ""
    for k, v in roundMessages
        out .= k ": " v "`n---`n"
    FileDelete(file)
    FileAppend(out, file)
    ToolTip "Rounds exported!"
    SetTimer () => ToolTip(), -1000
}

ImportRounds() {
    global profiles, roundMessages, ddlRound, myGui, profileCombo, roundList
    file := FileSelect(2, "", "Import Round Set", "Text Files (*.txt)")
    if !file
        return
    content := FileRead(file)
    rounds := StrSplit(content, "`n---`n")
    customMap := Map()
    idx := 1
    for _, line in rounds {
        if Trim(line) != "" {
            parts := StrSplit(line, ": ",, 2)
            if parts.Length = 2 {
                customMap[idx] := parts[2]
                idx++
            }
        }
    }
    if customMap.Count > 0 {
        profiles["Custom"] := customMap
        roundMessages := profiles["Custom"]
        ddlRound.Delete()
        roundList := []
        for k, v in roundMessages {
            ddlRound.Add("Round " k)
            roundList.Push("Round " k)
        }
        profileCombo.Add("Custom")
        profileCombo.Value := profileCombo.GetCount() ; Select Custom
        ToolTip "Rounds imported as 'Custom'!"
        SetTimer () => ToolTip(), -1000
    }
}

IsCopilotReady() {
    x1 := 1810, y1 := 846, x2 := 1830, y2 := 866  ; Adjust as needed
    imagePath := A_ScriptDir "\copilot_ready.png"
    ; Add color variation tolerance
    result := ImageSearch(&foundX, &foundY, x1, y1, x2, y2, "*20 " imagePath)
    ToolTip "ImageSearch: result=" result " | x1=" x1 " y1=" y1 " x2=" x2 " y2=" y2
    SetTimer () => ToolTip(), -1000
    if (result = 0) {
        ; Optionally log found coordinates
        ; AppendLog("Copilot icon found at: " foundX ", " foundY)
        return true
    }
    return false
}

; --- In AutoClickAndType, add lock and context sanitization ---
AutoClickAndType(isManual := false, customRound := "") {
    global roundCount, roundMessages, myGui, logFile, isRunning, isPaused, totalRoundsSent, consecutiveWindowErrors, errorLabel, errorCount, lastSendTime, soundCombo, notifyCheck, contextFile, maxContextLines, intermissionPrompts, currentIntermissionType, autoClickLock, roundList
    if autoClickLock {
        AppendLog("AutoClickAndType: Skipped due to lock.")
        return
    }
    autoClickLock := true
    try {
        if (!isRunning && !isManual)
            return
        if isPaused
            return

        result := EnsureWindowActive()
        if (result != false) {
            hwnd := result.hwnd
            procName := result.procName  ; Assign procName here
            if (procName = "Code.exe") {
                MouseMove 1584, 919
            } else if (procName = "cursor.exe") {
                MouseMove 1400, 909
            } else {
                UpdateStatus("Unsupported app. Skipping.")
                AppendLog("Unsupported app. Skipping.")
                SoundNotify("error")
                autoClickLock := false
                return
            }
            Click
            Sleep 500
            MouseGetPos &mx, &my
            Send "^+;" ; Try Copilot chat shortcut
            Sleep 200

            roundToSend := customRound ? customRound : roundCount
            message := roundMessages.Has(roundToSend) ? roundMessages[roundToSend] : "Proceed"
            ; Inject context summary and intermission prompt
            contextSummary := contextFile ? GetContextSummary(contextFile, maxContextLines) : "(no context)"
            contextSummary := RegExReplace(contextSummary, "[\{\}\^%~#!]", " ")
            if (StrLen(contextSummary) > 2000)
                contextSummary := SubStr(contextSummary, 1, 2000) "... (truncated)"
            intermissionPrompt := intermissionPrompts.Has(currentIntermissionType) ? intermissionPrompts[currentIntermissionType] : "Intermission"
            message := StrReplace(message, "{context_summary}", contextSummary)
            message := StrReplace(message, "{intermission_prompt}", intermissionPrompt)
            UpdatePromptPreview(roundToSend)
            UpdateRoundLabel(roundToSend)
            AppendLog("Preparing to send round " roundToSend ": " message)

            ; New chat logic when looping to round 1
            if !customRound {
                nextRound := roundCount + 1
                if (nextRound > roundList.Length)
                    nextRound := 1
                SetCurrentRound(nextRound)
            }
            Click
            Sleep 300
            Send "^n"
            Sleep 500
            SetTimer () => ToolTip(), -1000
            AppendLog("Round " roundToSend ": " message)
            SoundNotify("success")
            totalRoundsSent++
            lastSendTime := FormatTime(A_Now, "HH:mm:ss")
            UpdateAnalytics()
            AppendLog("Attempting to send message: " message)
            if WinActive("ahk_id " hwnd) {
                WinActivate("ahk_id " hwnd)
                Sleep 500  ; Delay for focus
                try {
                    Send "{Raw}" message
                    AppendLog("Message sent successfully via Send.")
                } catch as e {
                    AppendLog("Send failed: " e.Message " - Using clipboard fallback.")
                    ClipSaved := ClipboardAll()  ; Save current clipboard
                    Clipboard := message
                    Sleep 100
                    Send "^v"
                    Sleep 100
                    Clipboard := ClipSaved  ; Restore clipboard
                    AppendLog("Message pasted via clipboard fallback.")
                }
            } else {
                AppendLog("Window lost focus; skipping send.")
            }
            if WinActive("ahk_id " hwnd) {
                Sleep 500  ; Delay before Enter
                Send "{Enter}"
                AppendLog("Enter key sent.")
            } else {
                AppendLog("Window lost focus; skipping Enter.")
            }
        } else {
            ; Handle error as before
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
            autoClickLock := false
            return
        }
    } catch as e {
        AppendLog("ERROR in AutoClickAndType: " e.Message)
    } finally {
        autoClickLock := false
    }
}
; Add the new subroutine
EnsureWindowActive() {
    hwnd := WinGetID("ahk_exe Code.exe")
    if !hwnd
        hwnd := WinGetID("ahk_exe cursor.exe")
    if hwnd {
        WinActivate("ahk_id " hwnd)
        Sleep 500  ; Ensure activation
        procName := WinGetProcessName(hwnd)
        className := WinGetClass(hwnd)
        if (procName = "cursor.exe" || procName = "Code.exe") && className = "Chrome_WidgetWin_1" {
            return {hwnd: hwnd, procName: procName}  ; Return as an object
        }
    }
    return false
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
    global soundCombo, customSoundFile
    sound := soundCombo.Text
    if sound = "None"
        return
    if sound = "Custom..." && customSoundFile {
        try {
            SoundPlay customSoundFile, "Wait"
        } catch {
            SoundBeep 1000, 150 ; fallback
        }
        return
    }
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

AppendLog(entry) {
    global logFile, logsDir
    if logFile = "" {
        logFile := logsDir "\manual_" FormatTime(A_Now, "yyyyMMdd_HHmmss") ".log"
        UpdateLogNameLabel()
    }
    FileAppend Format("{1} - {2}`n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), entry), logFile
}

; === Minimal JSON stub to bypass previous parsing errors ===
Jxon_Dump(obj, indent := "", lvl := 1) {
    ; Temporary stub: simply return an empty string or a serialized placeholder
    return "{}" ; TODO: Replace with full implementation once syntax issues resolved
}

Jxon_Load(json) {
    ; Temporary stub: return an empty Map() to satisfy callers
    return Map()
}

; --- Original complex Jxon implementation is commented out below ---
/*
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
*/
; === End Jxon JSON library ===

SkipRound() {
    global roundCount, roundList
    nextRound := roundCount + 1
    if (nextRound > roundList.Length)
        nextRound := 1
    SetCurrentRound(nextRound)
}

RepeatRound() {
    global roundCount
    SetCurrentRound(roundCount)
}

global maxContextLines := 1000

UpdatePromptListBox() {
    global promptListView, roundMessages, roundCount
    promptListView.Delete()
    for k, v in roundMessages {
        label := k ". " v
        promptListView.Add(k, v)
    }
    ; Highlight current round
    if roundCount >= 1 && roundCount <= roundMessages.Count
        promptListView.Value := roundCount
}

PickContextFile() {
    global contextFile, contextFileLabel, myGui
    myGui.Opt("-AlwaysOnTop", false) ; Remove always-on-top
    file := FileSelect(2, "", "Select Context File", "Text Files (*.txt)")
    myGui.Opt("+AlwaysOnTop", true) ; Restore always-on-top
    if !file
        return
    contextFile := file
    contextFileLabel.Text := "Context: " file
}

