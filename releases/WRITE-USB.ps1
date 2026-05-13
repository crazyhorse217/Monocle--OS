# =============================================================
#  Monocle OS — Write Bootable ISO to USB Drive
#
#  Usage (run as Administrator):
#    pwsh -ExecutionPolicy Bypass -File releases\WRITE-USB.ps1 `
#         -ISO "releases\MonocleOS-v1.0.0-bootable.iso" `
#         -Drive E:
#
#  WARNING: ALL DATA ON THE TARGET DRIVE WILL BE ERASED.
# =============================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ISO,
    [Parameter(Mandatory)][string]$Drive   # e.g. "E:" or "E"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Log  ($m) { Write-Host "[WRITE] $m" -ForegroundColor Cyan }
function Ok   ($m) { Write-Host "[  OK ] $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "[ WARN] $m" -ForegroundColor Yellow }
function Err  ($m) { Write-Host "[FAIL ] $m" -ForegroundColor Red; exit 1 }

# ── Normalize drive letter ───────────────────────────────────────────────────────
$Drive = $Drive.TrimEnd(':').ToUpper()
$DrivePath = "${Drive}:"

# ── Administrator check ─────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Err "Must run as Administrator" }

# ── Validate ISO ────────────────────────────────────────────────────────────────
if (-not (Test-Path $ISO)) { Err "ISO not found: $ISO" }
$isoMB = [math]::Round((Get-Item $ISO).Length / 1MB, 1)
Log "ISO: $ISO  ($isoMB MB)"

# ── Identify target disk via drive letter ────────────────────────────────────────
Log "Identifying disk for $DrivePath..."
$vol = Get-Volume -DriveLetter $Drive -ErrorAction SilentlyContinue
if (-not $vol) { Err "Drive $DrivePath not found. Plug in the USB and check the letter." }

$partition = Get-Partition | Where-Object { $_.DriveLetter -eq $Drive } | Select-Object -First 1
if (-not $partition) { Err "Cannot find partition for $DrivePath" }

$diskNum  = $partition.DiskNumber
$diskInfo = Get-Disk -Number $diskNum
$diskGB   = [math]::Round($diskInfo.Size / 1GB, 1)

Write-Host ""
Write-Host "  Target disk : Disk $diskNum — $($diskInfo.FriendlyName)" -ForegroundColor White
Write-Host "  Drive letter: $DrivePath" -ForegroundColor White
Write-Host "  Disk size   : $diskGB GB" -ForegroundColor White
Write-Host "  ISO size    : $isoMB MB" -ForegroundColor White
Write-Host ""

if ($diskInfo.IsBoot -or $diskInfo.IsSystem) {
    Err "Disk $diskNum is the system/boot disk. Refusing to erase it."
}
if ($isoMB -gt ($diskInfo.Size / 1MB)) {
    Err "USB drive ($diskGB GB) is too small for the ISO ($isoMB MB)"
}

# ── Final confirmation ───────────────────────────────────────────────────────────
Write-Host "  !! ALL DATA ON DISK $diskNum ($($diskInfo.FriendlyName)) WILL BE ERASED !!" `
    -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "  Type YES to continue"
if ($confirm -ne "YES") { Write-Host "Aborted."; exit 0 }

# ── Prepare disk with diskpart ──────────────────────────────────────────────────
Log "Preparing USB disk $diskNum (clean + FAT32 partition)..."
$dpScript = @"
select disk $diskNum
clean
convert mbr
create partition primary
select partition 1
active
format fs=fat32 quick label="MonocleOS"
assign letter=$Drive
exit
"@
$dpFile = [System.IO.Path]::GetTempFileName()
$dpScript | Out-File $dpFile -Encoding ASCII
diskpart /s $dpFile | Out-Host
Remove-Item $dpFile -Force
Ok "Disk prepared"

# ── Mount the ISO and copy files ─────────────────────────────────────────────────
Log "Mounting ISO..."
$mountResult = Mount-DiskImage -ImagePath (Resolve-Path $ISO).Path -PassThru
$isoVol      = ($mountResult | Get-Volume)
$isoLetter   = $isoVol.DriveLetter
Ok "ISO mounted as ${isoLetter}:"

Log "Copying boot files to USB (this may take several minutes)..."
$src = "${isoLetter}:\"
$dst = "$DrivePath\"
# Use robocopy for reliable large-file copy with progress
robocopy $src $dst /E /NFL /NDL /NJH /NJS /nc /ns /np
Ok "Files copied"

# ── Unmount ISO ─────────────────────────────────────────────────────────────────
Dismount-DiskImage -ImagePath (Resolve-Path $ISO).Path | Out-Null
Ok "ISO unmounted"

# ── Done ─────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       USB READY — SAFE TO EJECT  ✓             ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Boot order: set USB first in BIOS/UEFI firmware settings." -ForegroundColor White
Write-Host "  Monocle OS will launch automatically after WinPE initializes." -ForegroundColor White
Write-Host ""
