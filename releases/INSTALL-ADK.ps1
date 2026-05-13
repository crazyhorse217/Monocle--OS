# =============================================================
#  Monocle OS — Windows ADK + WinPE Add-on Silent Installer
#  Run as Administrator before running BUILD-USB-IMAGE.ps1
#
#  Usage:
#    pwsh -ExecutionPolicy Bypass -File releases\INSTALL-ADK.ps1
# =============================================================
[CmdletBinding()]param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Log  ($m) { Write-Host "[SETUP] $m" -ForegroundColor Cyan }
function Ok   ($m) { Write-Host "[  OK ] $m" -ForegroundColor Green }
function Err  ($m) { Write-Host "[FAIL ] $m" -ForegroundColor Red; exit 1 }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Err "Must run as Administrator" }

$TEMP_DIR = "$env:TEMP\monocle-adk-install"
New-Item -ItemType Directory -Force -Path $TEMP_DIR | Out-Null

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Monocle OS — ADK + WinPE Prerequisite Setup  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Download Windows ADK ──────────────────────────────────────────────────
$adkInstaller = "$TEMP_DIR\adksetup.exe"
if (-not (Test-Path $adkInstaller)) {
    Log "Downloading Windows ADK installer (~1.5 MB downloader, then ~700 MB)..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest `
        -Uri "https://go.microsoft.com/fwlink/?linkid=2289980" `
        -OutFile $adkInstaller
    Ok "ADK downloader saved: $adkInstaller"
} else {
    Ok "ADK downloader already present"
}

# ── 2. Install ADK — Deployment Tools only (includes oscdimg, copype) ────────
Log "Installing ADK (Deployment Tools)... this takes several minutes"
$adkArgs = "/quiet /norestart /features OptionId.DeploymentTools"
$proc = Start-Process $adkInstaller -ArgumentList $adkArgs -Wait -PassThru
if ($proc.ExitCode -notin @(0, 3010)) {
    Err "ADK install failed with exit code: $($proc.ExitCode)"
}
Ok "ADK installed"

# ── 3. Download WinPE Add-on ─────────────────────────────────────────────────
$winpeInstaller = "$TEMP_DIR\winpeaddon-setup.exe"
if (-not (Test-Path $winpeInstaller)) {
    Log "Downloading WinPE add-on installer..."
    Invoke-WebRequest `
        -Uri "https://go.microsoft.com/fwlink/?linkid=2289981" `
        -OutFile $winpeInstaller
    Ok "WinPE add-on downloader saved"
} else {
    Ok "WinPE add-on downloader already present"
}

# ── 4. Install WinPE Add-on ──────────────────────────────────────────────────
Log "Installing WinPE Add-on... this takes several minutes"
$proc2 = Start-Process $winpeInstaller -ArgumentList "/quiet /norestart" -Wait -PassThru
if ($proc2.ExitCode -notin @(0, 3010)) {
    Err "WinPE add-on install failed with exit code: $($proc2.ExitCode)"
}
Ok "WinPE Add-on installed"

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ADK + WinPE Add-on Ready  ✓                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Now run the ISO builder (as Admin):" -ForegroundColor Yellow
Write-Host "    pwsh -ExecutionPolicy Bypass -File releases\BUILD-USB-IMAGE.ps1" -ForegroundColor White
Write-Host ""
if ($proc.ExitCode -eq 3010 -or $proc2.ExitCode -eq 3010) {
    Write-Host "  NOTE: A reboot is recommended before building the ISO." -ForegroundColor Yellow
    Write-Host ""
}
