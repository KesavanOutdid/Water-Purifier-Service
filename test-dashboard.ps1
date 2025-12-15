$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2JlOWVkMmUzYjZmNzA0OGVlNzIwNSIsInJvbGVzIjpbNF0sInVzZXJfaWQiOiJiMWVlNTZkOS03NGEyLTQ5OTEtODk4Ni04YjQwYzU5ODdjNmYiLCJlbWFpbCI6InNhaWVuZ0BnbWFpbC5jb20iLCJpYXQiOjE3NjU2Mjg5NDMsImV4cCI6MTc2ODIyMDk0M30.5YMbcqOeQTulvMw2bA5OQvbohlLI9Cb5cxqBErfuaeY"
}

Write-Host "====================================="
Write-Host "TESTING WITH MOCK DATA (2024 & 2025)"
Write-Host "====================================="
$mockResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/app/engineer/b1ee56d9-74a2-4991-8986-8b40c5987c6f/dashboard?useMock=true" -Headers $headers

Write-Host "`n=== CURRENT DAY ==="
$mockResponse.data.current_day | ConvertTo-Json -Depth 10

Write-Host "`n=== CURRENT WEEK ==="
$mockResponse.data.current_week | ConvertTo-Json -Depth 10

Write-Host "`n=== CURRENT YEAR (2025) ==="
$mockResponse.data.current_year | ConvertTo-Json -Depth 10

Write-Host "`n=== YEARLY DATA (2024 & 2025) ==="
$mockResponse.data.yearly | ConvertTo-Json

Write-Host "`n`n====================================="
Write-Host "TESTING WITH REAL DATA"
Write-Host "====================================="
$realResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/app/engineer/b1ee56d9-74a2-4991-8986-8b40c5987c6f/dashboard" -Headers $headers

Write-Host "`n=== CURRENT YEAR ==="
$realResponse.data.current_year | ConvertTo-Json

Write-Host "`n=== YEARLY DATA ==="
$realResponse.data.yearly | ConvertTo-Json
