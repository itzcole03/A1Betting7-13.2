# Simple bet record test
$betData = @{
    stake = 50.0
    odds = 2.10
    bet_type = "moneyline"
    selection = "Yankees"
    sportsbook = "FanDuel"
    market = "MLB"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/bankroll/bet-record" -Method Post -Body $betData -ContentType "application/json"
$response | ConvertTo-Json -Depth 10