# PowerShell Script for Team 08 Database Access
# Usage: .\start-db-tunnel.ps1 [ssh_username]

param (
    [string]$SshUser = $env:USERNAME
)

$ErrorActionPreference = "Stop"

# Configuration
$ServerIp = "3.101.155.82"
$LocalPort = 3306
$RemotePort = 3306
$SshKeyPath = "$HOME\.ssh\csc648-team-08-key.pem"

Write-Host "Team 08 Database SSH Tunnel (Windows)" -ForegroundColor Yellow
Write-Host "======================================="
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "ERROR: SSH key not found at $SshKeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure you have the team SSH key installed."
    Write-Host "Copy the key from credentials/access_keys to your .ssh folder."
    Write-Host ""
    Write-Host "Command to copy (run from repo root):"
    Write-Host "  copy credentials\access_keys\csc648-team-08-key.pem $HOME\.ssh\"
    exit 1
}

# Check if port is in use
$TcpConnection = Get-NetTCPConnection -LocalPort $LocalPort -ErrorAction SilentlyContinue

if ($TcpConnection) {
    $Pid = $TcpConnection.OwningProcess
    $Process = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    $ProcessName = if ($Process) { $Process.ProcessName } else { "Unknown" }

    Write-Host "WARNING: Port $LocalPort is already in use by process: $ProcessName (PID: $Pid)" -ForegroundColor Yellow

    if ($ProcessName -like "*mysqld*") {
        Write-Host "CRITICAL ERROR: Local MySQL server is running!" -ForegroundColor Red
        Write-Host "You MUST stop your local MySQL service for the tunnel to work."
        Write-Host ""
        Write-Host "To stop it:"
        Write-Host "  1. Open 'Services' app (Win+R, type 'services.msc')"
        Write-Host "  2. Find 'MySQL'"
        Write-Host "  3. Right-click -> Stop"
        exit 1
    } else {
        Write-Host "It looks like an old tunnel or random process. Killing it..."
        Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

Write-Host "Establishing SSH tunnel..." -ForegroundColor Green
Write-Host "Server: $SshUser@$ServerIp"
Write-Host "Local Port: $LocalPort -> Remote Port: $RemotePort"
Write-Host ""
Write-Host "Press Ctrl+C to close the tunnel" -ForegroundColor Yellow
Write-Host ""

# Start SSH tunnel
# Note: Windows 10/11 has built-in OpenSSH client
ssh -N `
    -L ${LocalPort}:127.0.0.1:${RemotePort} `
    -i "$SshKeyPath" `
    -o ServerAliveInterval=60 `
    -o ServerAliveCountMax=3 `
    -o StrictHostKeyChecking=no `
    ${SshUser}@${ServerIp}
