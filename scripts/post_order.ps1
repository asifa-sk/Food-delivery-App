$body = Get-Content -Raw 'order-test.json'
$resp = Invoke-RestMethod -Uri 'http://localhost:8081/api/orders' -Method Post -ContentType 'application/json' -Body $body
$resp | ConvertTo-Json -Depth 10
