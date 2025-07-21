; AutoHotKey script to paste clipboard into VS Code Copilot/Cursor chat and send it
; Adjust window title/class as needed for your VS Code/Cursor setup

SetTitleMatchMode, 2 ; Allow partial match for window title
WinActivate, Visual Studio Code
WinWaitActive, Visual Studio Code, , 3
if !WinActive("Visual Studio Code") {
    MsgBox, Could not activate VS Code window.
    ExitApp
}
; Paste clipboard (Ctrl+V) and send Enter
Send, ^v
Sleep, 100 ; Wait for paste
Send, {Enter}
ExitApp
