#Requires AutoHotkey v2.0
SetTitleMatchMode "2"

global isRunning := false
global roundCount := 1  ; Start at round 1

; ----------------------------
; DEFINE ACTION FUNCTION FIRST
; ----------------------------
AutoClickAndType()
{
    global roundCount

    hwnd := WinGetID("A")  ; Get active window
    procName := WinGetProcessName(hwnd)
    className := WinGetClass(hwnd)

    if (procName != "cursor.exe" or className != "Chrome_WidgetWin_1")
    {
        ToolTip "⏸ Not in Cursor editor window. Skipping."
        SetTimer () => ToolTip(), -1500
        return
    }

    ; Move to specified location and act
    MouseMove 1400, 909
    Click
    Sleep 500

    ; Send appropriate message based on round
    if (roundCount = 1)
    {
        Send "Use sequential thinking to review progress and stay on track. (Using everything available in the workspace to enhance, optimize, and ensure full robust, functionality, and aesthetic design of the application.)"
    }
    else
    {
        Send "Proceed"
    }

    Send "{Enter}"

    ; Advance round counter
    roundCount += 1
    if (roundCount > 5)
        roundCount := 1
}

; ----------------------------
; TOGGLE HOTKEY
; ----------------------------
F8::
{
    global isRunning
    isRunning := !isRunning
    if isRunning
    {
        ToolTip "✅ Auto action started..."
        SetTimer AutoClickAndType, 150000  ; Every 2.5 minutes
        AutoClickAndType()  ; Run once immediately
    }
    else
    {
        ToolTip "⛔ Auto action stopped."
        SetTimer AutoClickAndType, 0
    }
    SetTimer () => ToolTip(), -1500
}
