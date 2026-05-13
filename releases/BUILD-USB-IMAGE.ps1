# =============================================================
#  Monocle OS — Bootable WinPE USB Image Builder
#  Produces: releases/MonocleOS-v1.0.0-bootable.iso
#
#  Requirements:
#    · Windows 10/11 x64
#    · Windows ADK — https://learn.microsoft.com/en-us/windows-hardware/get-started/adk-install
#    · WinPE add-on for the ADK (same page)
#    · Run as Administrator
#
#  Usage (from project root):
#    pwsh -ExecutionPolicy Bypass -File releases\BUILD-USB-IMAGE.ps1
#
#  Optional — point to a custom win-unpacked folder:
#    pwsh ... -AppSource "D:\my-build\win-unpacked"
# =============================================================
[CmdletBinding()]
param(
    [string]$AppSource = "",
    [string]$Version   = "1.0.0"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Log  ($m) { Write-Host "[BUILD] $m" -ForegroundColor Cyan }
function Ok   ($m) { Write-Host "[  OK ] $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "[ WARN] $m" -ForegroundColor Yellow }
function Err  ($m) { Write-Host "[FAIL ] $m" -ForegroundColor Red; exit 1 }

# Resolve project root (works whether run from project root or the releases/ subdir)
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT       = (Resolve-Path (Join-Path $SCRIPT_DIR "..")).Path
$OUT_ISO    = Join-Path $ROOT "releases\MonocleOS-v$Version-bootable.iso"
$WORK_DIR   = Join-Path $env:TEMP "monocle-winpe-$(New-Guid)"

# Locate win-unpacked — try several candidate paths
if ($AppSource -eq "") {
    $candidates = @(
        (Join-Path $ROOT        "win-unpacked"),                # project root
        (Join-Path $ROOT        "..\win-unpacked"),             # sibling of project
        (Join-Path $ROOT        "..\..\..\win-unpacked"),       # main repo when in worktree
        (Join-Path $ROOT        "releases\electron\win-unpacked")
    )
    foreach ($c in $candidates) {
        if (Test-Path (Join-Path $c "Monocle OS.exe")) { $AppSource = (Resolve-Path $c).Path; break }
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Monocle OS — WinPE Bootable ISO Builder       ║" -ForegroundColor Cyan
Write-Host "║   v$Version · x64 · Windows PE 10.0               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Administrator check ──────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Err "Must run as Administrator (DISM requires elevated privileges)" }
Ok "Running as Administrator"

# ── 2. Locate Windows ADK + WinPE addon ────────────────────────────────────────
Log "Locating Windows ADK..."
$adkRoots = @(
    "C:\Program Files (x86)\Windows Kits\10\Assessment and Deployment Kit",
    "C:\Program Files\Windows Kits\10\Assessment and Deployment Kit"
)
$ADK = $adkRoots | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $ADK) {
    Write-Host ""
    Write-Host "  Windows ADK not found." -ForegroundColor Red
    Write-Host "  Run the prerequisite installer first (as Admin):" -ForegroundColor Yellow
    Write-Host "    pwsh -ExecutionPolicy Bypass -File releases\INSTALL-ADK.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or install manually:" -ForegroundColor Yellow
    Write-Host "    1. Windows ADK:           https://learn.microsoft.com/en-us/windows-hardware/get-started/adk-install" -ForegroundColor White
    Write-Host "    2. WinPE add-on for ADK:  same page, second download link" -ForegroundColor White
    Write-Host "  Select only 'Deployment Tools' during ADK setup." -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Ok "ADK: $ADK"

$WINPE_ROOT = "$ADK\Windows Preinstallation Environment"
if (-not (Test-Path $WINPE_ROOT)) {
    Err "WinPE add-on not found at:`n  $WINPE_ROOT`nInstall the 'Windows PE add-on for the ADK'."
}

$COPYPE  = "$WINPE_ROOT\copype.cmd"
$OSCDIMG = @(
    "$ADK\Deployment Tools\x86\Oscdimg\oscdimg.exe",
    "$ADK\Deployment Tools\amd64\Oscdimg\oscdimg.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path $COPYPE))  { Err "copype.cmd missing: $COPYPE" }
if (-not $OSCDIMG)             { Err "oscdimg.exe not found — re-run ADK installer and select Deployment Tools" }
Ok "copype:  $COPYPE"
Ok "oscdimg: $OSCDIMG"

# ── 3. Verify Monocle OS source ─────────────────────────────────────────────────
Log "Checking Monocle OS source..."
if ($AppSource -eq "" -or -not (Test-Path $AppSource)) {
    Err @"
win-unpacked directory not found. Either:
  a) Run 'npm run electron:build:win' to build it first, or
  b) Pass -AppSource explicitly:
       pwsh ... -AppSource "C:\path\to\win-unpacked"
"@
}
$EXE = Join-Path $AppSource "Monocle OS.exe"
if (-not (Test-Path $EXE)) { Err "'Monocle OS.exe' not found in: $AppSource" }
$appSizeMB = [math]::Round(
    (Get-ChildItem $AppSource -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 1)
Ok "App source: $AppSource  ($appSizeMB MB)"

# ── 4. Create WinPE working copy ────────────────────────────────────────────────
Log "Creating WinPE working directory (this takes ~1-2 min)..."
if (Test-Path $WORK_DIR) { Remove-Item $WORK_DIR -Recurse -Force }
$copyOut = cmd /c "`"$COPYPE`" amd64 `"$WORK_DIR`"" 2>&1
if (-not (Test-Path "$WORK_DIR\media")) {
    Write-Host $copyOut
    Err "copype failed — check ADK installation"
}
Ok "WinPE base ready: $WORK_DIR"

# ── 5. Mount boot.wim ───────────────────────────────────────────────────────────
$WIM   = "$WORK_DIR\media\sources\boot.wim"
$MOUNT = "$WORK_DIR\mount"
New-Item -ItemType Directory -Force -Path $MOUNT | Out-Null
Log "Mounting WinPE image..."
dism /Mount-Image /ImageFile:"$WIM" /Index:1 /MountDir:"$MOUNT" | Out-Host
Ok "Mounted at: $MOUNT"

# Track mount for cleanup on failure
$mounted = $true
function Cleanup-OnFailure {
    if ($mounted) {
        Write-Host "[ WARN] Attempting to clean up mounted image..." -ForegroundColor Yellow
        dism /Unmount-Image /MountDir:"$MOUNT" /Discard 2>&1 | Out-Null
    }
    if (Test-Path $WORK_DIR) { Remove-Item $WORK_DIR -Recurse -Force -ErrorAction SilentlyContinue }
}
trap { Cleanup-OnFailure; break }

# ── 6. Add optional WinPE packages ─────────────────────────────────────────────
Log "Adding WinPE optional packages..."
$PKG_DIR  = "$WINPE_ROOT\amd64\WinPE_OCs"
$PACKAGES = @("WinPE-HTA", "WinPE-Scripting", "WinPE-WMI", "WinPE-NetFX")
foreach ($pkg in $PACKAGES) {
    $cab = "$PKG_DIR\$pkg.cab"
    if (Test-Path $cab) {
        dism /Image:"$MOUNT" /Add-Package /PackagePath:"$cab" /Quiet 2>&1 | Out-Null
        Ok "  + $pkg"
    } else {
        Warn "  ~ $pkg not found in ADK, skipping"
    }
}

# ── 7. Copy Monocle OS into the WinPE image ─────────────────────────────────────
Log "Copying Monocle OS into WinPE image..."
$appDest = "$MOUNT\monocle"
New-Item -ItemType Directory -Force -Path $appDest | Out-Null
Copy-Item "$AppSource\*" $appDest -Recurse -Force
Ok "Monocle OS copied → X:\monocle\ (inside WinPE)"

# ── 8. Write startnet.cmd (runs automatically on WinPE boot) ────────────────────
Log "Writing startup script..."
# NOTE: WinPE often needs --no-sandbox because there is no user session sandbox.
# --disable-gpu forces software rendering (WinPE has minimal GPU drivers).
# On machines with good GPU drivers this flag can be removed for hardware accel.
$startnet = @'
@echo off
wpeinit

rem ── Wait for hardware enumeration ──────────────────────────────────────────
ping -n 4 127.0.0.1 >nul

rem ── Maximize console window before we hand off ────────────────────────────
mode con cols=220 lines=55

rem ── Launch Monocle OS ──────────────────────────────────────────────────────
rem     --kiosk            : fullscreen, no chrome
rem     --disable-gpu      : WinPE-safe software rendering (remove if GPU works)
rem     --no-sandbox       : required in WinPE (no user profile / sandbox dirs)
rem     --disable-gpu-sandbox : companion to --no-sandbox for renderer process
start /wait "" "X:\monocle\Monocle OS.exe" ^
    --kiosk ^
    --disable-gpu ^
    --no-sandbox ^
    --disable-gpu-sandbox ^
    --disable-features=OutOfBlinkCors

rem ── Reboot when the app exits ─────────────────────────────────────────────
wpeutil Reboot
'@
$startnet | Out-File -FilePath "$MOUNT\Windows\System32\startnet.cmd" -Encoding ASCII -Force
Ok "startnet.cmd written"

# ── 9. Set WinPE window title / background color ────────────────────────────────
Log "Setting WinPE registry defaults..."
# Dark background to match Monocle OS aesthetic while the app loads
$HKLM_MOUNTED = "HKLM\MOUNTED_WINPE_SYSTEM_TEMP_$(New-Guid)"
& reg load $HKLM_MOUNTED "$MOUNT\Windows\System32\config\SYSTEM" 2>&1 | Out-Null
& reg add "$HKLM_MOUNTED\ControlSet001\Control\Terminal Server\WinStations\Console" `
    /v "ColorTable00" /t REG_DWORD /d 0x00120d0a /f 2>&1 | Out-Null
& reg unload $HKLM_MOUNTED 2>&1 | Out-Null
Ok "Registry defaults applied"

# ── 10. Unmount and commit ───────────────────────────────────────────────────────
Log "Committing WinPE image (this takes ~1-2 min)..."
dism /Unmount-Image /MountDir:"$MOUNT" /Commit | Out-Host
$mounted = $false
Ok "Image committed"

# ── 11. Create dual-boot (BIOS + UEFI) ISO ──────────────────────────────────────
Log "Building bootable ISO..."
$BIOS_BOOT = "$WINPE_ROOT\amd64\Media\boot\etfsboot.com"
# efisys_noprompt = UEFI boot without "press any key" prompt
$EFI_BOOT  = "$WORK_DIR\media\efi\microsoft\boot\efisys_noprompt.bin"
if (-not (Test-Path $EFI_BOOT)) {
    $EFI_BOOT = "$WORK_DIR\media\efi\microsoft\boot\efisys.bin"
}

if (-not (Test-Path $BIOS_BOOT)) { Warn "etfsboot.com not found — BIOS (legacy) boot will not work; UEFI only" }

New-Item -ItemType Directory -Force -Path (Split-Path $OUT_ISO) | Out-Null

if (Test-Path $BIOS_BOOT) {
    # Dual-boot: BIOS (MBR) + UEFI
    & $OSCDIMG `
        -m -o -u2 -udfver102 `
        "-bootdata:2#p0,e,b`"$BIOS_BOOT`"#pEF,e,b`"$EFI_BOOT`"" `
        "$WORK_DIR\media" `
        "$OUT_ISO" | Out-Host
} else {
    # UEFI only
    & $OSCDIMG `
        -m -o -u2 -udfver102 `
        "-bootdata:1#pEF,e,b`"$EFI_BOOT`"" `
        "$WORK_DIR\media" `
        "$OUT_ISO" | Out-Host
}

if (-not (Test-Path $OUT_ISO)) { Err "ISO creation failed — check oscdimg output above" }
$isoMB = [math]::Round((Get-Item $OUT_ISO).Length / 1MB, 1)
Ok "ISO ready: $OUT_ISO  ($isoMB MB)"

# ── 12. SHA256 checksum ──────────────────────────────────────────────────────────
Log "Computing SHA256..."
$hash = (Get-FileHash $OUT_ISO -Algorithm SHA256).Hash
"$hash  MonocleOS-v$Version-bootable.iso" |
    Out-File -FilePath (Join-Path (Split-Path $OUT_ISO) "MonocleOS-v$Version-bootable.sha256") -Encoding ASCII
Ok "SHA256: $hash"

# ── 13. Cleanup ──────────────────────────────────────────────────────────────────
Log "Cleaning up temp directory..."
Remove-Item $WORK_DIR -Recurse -Force -ErrorAction SilentlyContinue
Ok "Cleanup complete"

# ── Done ─────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          BUILD COMPLETE  ✓                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  ISO:      $OUT_ISO" -ForegroundColor White
Write-Host "  Size:     $isoMB MB" -ForegroundColor White
Write-Host "  SHA256:   $hash" -ForegroundColor Gray
Write-Host ""
Write-Host "  ── Flash to USB with Rufus (recommended) ─────────────────────" -ForegroundColor Yellow
Write-Host "     1. Open Rufus → select the ISO above" -ForegroundColor White
Write-Host "     2. Partition scheme: GPT  |  Target system: UEFI (non CSM)" -ForegroundColor White
Write-Host "     3. For older BIOS machines: MBR + BIOS (or UEFI-CSM)" -ForegroundColor White
Write-Host "     4. Click START" -ForegroundColor White
Write-Host ""
Write-Host "  ── Flash to USB with PowerShell (Admin) ──────────────────────" -ForegroundColor Yellow
Write-Host "     pwsh -ExecutionPolicy Bypass -File releases\WRITE-USB.ps1 ``" -ForegroundColor White
Write-Host "          -ISO `"$OUT_ISO`" -Drive E:" -ForegroundColor White
Write-Host ""
