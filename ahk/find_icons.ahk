#Requires AutoHotkey v2.0
#Include ShinsImageScanClass.ahk

likeIcon    := "like.png"
dislikeIcon := "dislike.png"
copyIcon    := "copy.png"

searchX := 1450
searchY := 697
searchW := 96
searchH := 52

; Set these to the coordinates of the input box you want to focus
inputX := 1418
inputY := 909

imgScan := ShinsImageScanClass()
global isRunning := false

global detectionTimer := 0
global cooldownTimer := 0

F8::ToggleDetection()

ToggleDetection() {
    global isRunning, detectionTimer, cooldownTimer
    isRunning := !isRunning
    if isRunning {
        ToolTip "✅ Detection started (F8 to stop)"
        SetTimer CheckIcons, 2000
    } else {
        ToolTip "⛔ Detection stopped (F8 to start)"
        SetTimer CheckIcons, 0
        SetTimer CooldownResume, 0
    }
    SetTimer () => ToolTip(), -1500
}

CheckIcons() {
    global likeIcon, dislikeIcon, copyIcon, searchX, searchY, searchW, searchH, imgScan, inputX, inputY
    foundLike    := imgScan.ImageRegion(likeIcon, searchX, searchY, searchW, searchH, 20, &xLike, &yLike)
    foundDislike := imgScan.ImageRegion(dislikeIcon, searchX, searchY, searchW, searchH, 20, &xDislike, &yDislike)
    foundCopy    := imgScan.ImageRegion(copyIcon, searchX, searchY, searchW, searchH, 20, &xCopy, &yCopy)
    if foundLike or foundDislike or foundCopy {
        MouseMove inputX, inputY
        Click
        Sleep 200
        Send "Proceed{Enter}"
        ToolTip "▶️ Proceed sent! Pausing for 10s..."
        SetTimer CheckIcons, 0
        SetTimer CooldownResume, -10000
    }
}

CooldownResume() {
    global isRunning
    if isRunning {
        ToolTip "✅ Detection resumed"
        SetTimer CheckIcons, 2000
        SetTimer () => ToolTip(), -1500
    }
}

OnExit(*) {
    ToolTip()
    SetTimer CheckIcons, 0
    SetTimer CooldownResume, 0
} 