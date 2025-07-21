#Requires AutoHotkey v2.0
SetTitleMatchMode "2"

global isRunning := false
global roundCount := LoadRoundCount()
global logFile := A_ScriptDir "\log.txt"
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

F8:: ; Toggle auto action on/off
{
    global isRunning
    isRunning := !isRunning
    if isRunning
    {
        ToolTip "✅ Auto action started..."
        SetTimer AutoClickAndType, 240000
        AutoClickAndType()
    }
    else
    {
        ToolTip "⛔ Auto action stopped."
        SetTimer AutoClickAndType, 0
    }
    SetTimer () => ToolTip(), -1500
}

AutoClickAndType()
{
    global roundCount, roundMessages, logFile

    hwnd := WinGetID("A")
    procName := WinGetProcessName(hwnd)
    className := WinGetClass(hwnd)

    if !(procName = "cursor.exe" || procName = "Code.exe") or className != "Chrome_WidgetWin_1"
    {
        ToolTip "⏸ Not in supported window. Skipping."
        SoundBeep 1000, 150
        SetTimer () => ToolTip(), -1500
        return
    }

    if (procName = "Code.exe")
    {
        ; VS Code Copilot input box coords from Window Spy
        MouseMove 1531, 914
    }
    else if (procName = "cursor.exe")
    {
        ; Cursor app click coords
        MouseMove 1400, 909
    }
    else
    {
        ToolTip "⏸ Unsupported app. Skipping."
        SoundBeep 1000, 150
        SetTimer () => ToolTip(), -1500
        return
    }

    Click
    Sleep 500

    message := roundMessages.Has(roundCount) ? roundMessages[roundCount] : "Proceed"
    Send message
    Send "{Enter}"

    AppendLog("Round " roundCount ": " message)
    SoundBeep 1500, 150

    roundCount := (roundCount >= 10) ? 1 : roundCount + 1
    SaveRoundCount(roundCount)
}

LoadRoundCount()
{
    file := A_ScriptDir "\round_state.txt"
    if FileExist(file)
    {
        content := FileRead(file)
        val := Trim(content)
        return IsInteger(val) ? Integer(val) : 1
    }
    return 1
}

SaveRoundCount(count)
{
    file := A_ScriptDir "\round_state.txt"
    if FileExist(file)
        FileDelete(file)
    FileAppend count, file
}

AppendLog(entry)
{
    global logFile
    FileAppend Format("{1} - {2}`n", FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss"), entry), logFile
}
