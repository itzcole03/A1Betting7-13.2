$body = @{ email = 'ncr@a1betting.com'; new_password = 'A1Betting1337!' } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri http://127.0.0.1:8000/dev/auth/set-password -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Output $resp
} catch {
    Write-Output "Request failed: $($_.Exception.Message)"
}
