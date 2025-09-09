# Test Bankroll API endpoints
$baseUrl = "http://127.0.0.1:8000/api/bankroll"

# Test Kelly calculation
Write-Host "Testing Kelly calculation..."
$kellyData = @{
    fair_probability = 0.55
    market_odds = 1.91
} | ConvertTo-Json

$kellyResult = Invoke-RestMethod -Uri "$baseUrl/kelly-calculation" -Method Post -Body $kellyData -ContentType "application/json"
Write-Host "Kelly Result:" $kellyResult

# Test bankroll summary
Write-Host "`nTesting bankroll summary..."
$summaryResult = Invoke-RestMethod -Uri "$baseUrl/summary" -Method Get
Write-Host "Summary Result:" $summaryResult