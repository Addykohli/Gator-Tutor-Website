# Stop SSH Tunnel Script for Team 08 (Windows)

$LocalPort = 3306

Write-Host "Stopping Team 08 Database Tunnel..." -ForegroundColor Yellow

$TcpConnection = Get-NetTCPConnection -LocalPort $LocalPort -ErrorAction SilentlyContinue

if ($TcpConnection) {
    $TargetPid = $TcpConnection.OwningProcess
    $Process = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
    
    if ($Process.ProcessName -eq "ssh") {
        Write-Host "Found SSH tunnel (PID: $TargetPid). Stopping..."
        Stop-Process -Id $TargetPid -Force
        Write-Host "Tunnel stopped successfully." -ForegroundColor Green
    } else {
        Write-Host "Port $LocalPort is used by $($Process.ProcessName), NOT ssh. Skipping." -ForegroundColor Red
    }
} else {
    Write-Host "No tunnel found on port $LocalPort." -ForegroundColor Green
}