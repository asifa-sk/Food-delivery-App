param(
  [int]$Port = 8081
)

$existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

if ($existing) {
  Write-Host "Port $Port is in use by PID $existing. Stopping process..." -ForegroundColor Yellow
  Stop-Process -Id $existing -Force
  Write-Host "Stopped PID $existing" -ForegroundColor Green
} else {
  Write-Host "Port $Port is free." -ForegroundColor Green
}

Write-Host "Starting Spring Boot on port $Port..." -ForegroundColor Cyan
$env:PORT = "$Port"
mvn spring-boot:run -DskipTests
