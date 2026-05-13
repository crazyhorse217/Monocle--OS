#!/usr/bin/env bash
# ============================================================
#  Monocle OS — Full Production Package Builder v1.0
#  Builds: Linux AppImage, Windows NSIS Installer (.exe)
#  Run from the project root:
#    bash releases/BUILD-MONOCLE-OS.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GRN='\033[0;32m'; CYN='\033[0;36m'; YLW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${CYN}[BUILD]${NC} $1"; }
ok()   { echo -e "${GRN}[  OK ]${NC} $1"; }
warn() { echo -e "${YLW}[ WARN]${NC} $1"; }
err()  { echo -e "${RED}[FAIL ]${NC} $1"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
OUT="$ROOT/releases/electron"
mkdir -p "$OUT"

echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYN}║   Monocle OS — Production Package Builder       ║${NC}"
echo -e "${CYN}║   v$VERSION · Electron + Express                   ║${NC}"
echo -e "${CYN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
log "Checking prerequisites…"
command -v node  >/dev/null 2>&1 || err "Node.js not found"
command -v npm   >/dev/null 2>&1 || err "npm not found"
ok "Node $(node --version) / npm $(npm --version)"

# ── 2. Install deps ───────────────────────────────────────────────────────────
log "Installing dependencies…"
npm ci --silent 2>/dev/null || npm install --silent
ok "Dependencies ready"

# ── 3. Convert icon PNG → ICO (needed for NSIS installer) ────────────────────
log "Generating icon.ico…"
node -e "
const { default: pngToIco } = require('png-to-ico');
const fs = require('fs');
pngToIco(['electron/icon.png'])
  .then(b => { fs.writeFileSync('electron/icon.ico', b); console.log('icon.ico ready'); })
  .catch(e => { console.warn('Warning: png-to-ico failed:', e.message); });
" || warn "icon.ico generation failed — installer may use default icon"

# ── 4. Full production build (Vite + esbuild server bundle) ──────────────────
log "Building production bundle…"
npm run build
ok "Production build complete → dist/"

# ── 5. Desktop — Windows NSIS installer (.exe) ────────────────────────────────
log "Building Windows installer (.exe)…"
if npx electron-builder --win nsis --publish never 2>&1 | tail -8; then
  EXE=$(find "$OUT" -name "*.exe" | head -1)
  if [ -n "$EXE" ]; then
    ok "Windows installer → $EXE"
  else
    warn "Installer .exe not found in output — check electron-builder logs"
  fi
else
  warn "Windows .exe build failed — continuing"
fi

# ── 6. Desktop — Linux AppImage ───────────────────────────────────────────────
log "Building Linux AppImage…"
if npx electron-builder --linux AppImage --publish never 2>&1 | tail -8; then
  APPIMAGE=$(find "$OUT" -name "*.AppImage" | head -1)
  if [ -n "$APPIMAGE" ]; then
    ok "Linux AppImage → $APPIMAGE"
  else
    warn "AppImage not found — check electron-builder logs"
  fi
else
  warn "Linux AppImage build failed — continuing"
fi

# ── 7. SHA256 checksums ───────────────────────────────────────────────────────
log "Generating checksums…"
cd "$OUT"
find . -type f \( -name "*.exe" -o -name "*.AppImage" \) \
  -exec sha256sum {} \; > SHA256SUMS.txt 2>/dev/null || true
ok "SHA256SUMS.txt generated"
cd "$ROOT"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GRN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GRN}║          BUILD COMPLETE  ✓                      ║${NC}"
echo -e "${GRN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Output directory:  releases/electron/"
echo "  ├── MonocleOS-Setup-$VERSION.exe   Windows NSIS installer"
echo "  ├── MonocleOS-$VERSION.AppImage    Linux AppImage"
echo "  └── SHA256SUMS.txt                Integrity checksums"
echo ""
