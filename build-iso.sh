#!/usr/bin/env bash
set -euo pipefail

# Minimal Archion ISO builder
# Purpose: produce a bootable Arch ISO that includes this repo under /root/archion
# Requirements: archiso package installed

ISO_NAME="archion-$(date +%Y%m%d)"
PROFILE_SRC="/usr/share/archiso/configs/releng"   # releng profile (the one used for official ISO)
PROFILE_DIR="archion-releng"                      # local mutable copy
WORK_DIR="work"                                   # mkarchiso work dir
OUT_DIR="out"                                     # output directory for ISO
EXTRA_PKGS_FILE="extra-packages.txt"              # optional file (one pkg per line) to append

echo "==> Archion minimal ISO build"

if [[ $EUID -ne 0 ]]; then
  echo "[ERROR] Run as root (sudo)." >&2
  exit 1
fi

if ! command -v mkarchiso >/dev/null 2>&1; then
  echo "==> Installing archiso..."
  pacman -Sy --noconfirm archiso || { echo "Failed to install archiso" >&2; exit 1; }
fi

echo "==> Cleaning previous artifacts"
rm -rf "$PROFILE_DIR" "$WORK_DIR" "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "==> Copying releng profile"
cp -a "$PROFILE_SRC" "$PROFILE_DIR"

# Optional: trim packages or append a few; keep it simple.
PKG_LIST="$PROFILE_DIR/packages.x86_64"

echo "==> Appending a few desktop packages (hyprland, waybar, kitty, fish)"
{
  echo "";
  echo "# Archion additions";
  echo "git";
  echo "fish";
} >> "$PKG_LIST"

if [[ -f $EXTRA_PKGS_FILE ]]; then
  echo "==> Appending packages from $EXTRA_PKGS_FILE"
  # Filter comments & blanks
  grep -Ev '^[[:space:]]*(#|$)' "$EXTRA_PKGS_FILE" >> "$PKG_LIST"
fi

echo "==> Embedding this repository under /root/archion in the ISO"
AIROOTFS_DIR="$PROFILE_DIR/airootfs"
mkdir -p "$AIROOTFS_DIR/root"
rsync -a --exclude "$PROFILE_DIR" --exclude "$WORK_DIR" --exclude "$OUT_DIR" ./ "$AIROOTFS_DIR/root/archion/"

echo "==> Creating simple motd"
cat > "$AIROOTFS_DIR/etc/motd" <<'MOTD'
Archion Live ISO
================

Repo is available at /root/archion
Quick start:
  cd /root/archion
  bash live-setup.sh   # guided install script

Have fun!
MOTD

echo "==> Building ISO (this can take a while)"
mkarchiso -v -w "$WORK_DIR" -o "$OUT_DIR" "$PROFILE_DIR"

ISO_PATH=$(find "$OUT_DIR" -maxdepth 1 -type f -name '*.iso' -printf '%T@ %p\n' | sort -nr | head -1 | awk '{print $2}')

if [[ -f "$ISO_PATH" ]]; then
  echo "==> ISO created: $ISO_PATH"
  echo "==> Write to USB (example):"
  echo "     sudo dd if=$ISO_PATH of=/dev/sdX bs=4M status=progress oflag=sync"
else
  echo "[ERROR] ISO build appears to have failed (no ISO found)." >&2
  exit 1
fi

echo "==> Done"
