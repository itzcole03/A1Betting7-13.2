# Test recording a bet
$betData = @{
    stake = 50.0
    odds = 2.10
    bet_type = "moneyline"
    selection = "home_team" 
    sportsbook = "FanDuel"
    market = "MLB"
    player_name = "Yankees vs Red Sox"
    fair_probability = 0.55
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/bankroll/bet-record" -Method Post -Body $betData -ContentType "application/json"
$response | ConvertTo-Json -Depth 10