#!/usr/bin/env bash
# gpu-driver-helper.sh — Guided GPU/VM graphics driver installer for Arch Linux

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || { echo "Failed to change directory to $SCRIPT_DIR"; exit 1; }

# --–– utility helpers -----
source ./utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# --–– pre‑flight -----
[[ $EUID -eq 0 ]] || { echo "Run as root." >&2; exit 1; }
need pacman

header "Updating package databases"
pacman -Sy --noconfirm

# --–– GPU detection -----
VGA_INFO=$(lspci -nnk | grep -EA3 'VGA|3D|Display' || true)
VENDOR="unknown"
if   echo "$VGA_INFO" | grep -qi nvidia;       then VENDOR="nvidia";
elif echo "$VGA_INFO" | grep -qi "amd\|ati"; then VENDOR="amd";
elif echo "$VGA_INFO" | grep -qi intel;        then VENDOR="intel";
elif systemd-detect-virt -q;                   then VENDOR="vm"; fi

header "Detected: $VENDOR (override with menu if wrong)"

# --–– menu -----
PS3="Choose the driver type to install: "
select CHOICE in NVIDIA AMD Intel VirtualMachine Quit; do
  case $REPLY in
    1|N|n|nvidia|NVIDIA)    MODE="nvidia"; break;;
    2|A|a|amd|AMD)          MODE="amd"; break;;
    3|I|i|intel|Intel)      MODE="intel"; break;;
    4|V|v|vm|VM)            MODE="vm"; break;;
    5|Q|q|quit|Quit)        echo "Bye."; exit 0;;
    *) echo "Invalid choice";;
  esac
done

echo "Selected: $MODE"
confirm "Proceed with installation?" || exit 0

# --–– install functions -----
install_nvidia() {
  header "Installing NVIDIA proprietary driver stack"
  pacman -S --needed --noconfirm nvidia nvidia-utils nvidia-settings
  if confirm "System uses linux‑lts kernel as well?"; then pacman -S --needed --noconfirm nvidia-lts; fi
  if confirm "Enable DRM modeset for tear‑free consoles?"; then
    sed -i '/^GRUB_CMDLINE_LINUX=/ s/"$/ nvidia-drm.modeset=1"/' /etc/default/grub
    grub-mkconfig -o /boot/grub/grub.cfg
  fi
  mkinitcpio -P
}

install_amd() {
  header "Installing AMD open‑source stack (AMDGPU)"
  pacman -S --needed --noconfirm mesa lib32-mesa libva-mesa-driver lib32-libva-mesa-driver mesa-vdpau lib32-mesa-vdpau vulkan-radeon lib32-vulkan-radeon xf86-video-amdgpu
}

install_intel() {
  header "Installing Intel open‑source stack"
  pacman -S --needed --noconfirm mesa lib32-mesa vulkan-intel lib32-vulkan-intel \
                      intel-media-driver intel-gpu-tools mesa-vdpau lib32-mesa-vdpau
  if confirm "Install legacy xf86-video-intel DDX for Xorg?"; then pacman -S --needed --noconfirm xf86-video-intel; fi
}

install_vm() {
  header "Virtual machine options"
  PS3="Select VM platform: "
  select VMCHOICE in QEMU-Spice/QXL VirtioGPU VMware VirtualBox Back; do
    case $REPLY in
      1) header "QEMU Spice/QXL drivers";
         pacman -S --needed --noconfirm xf86-video-qxl qemu-guest-agent spice-vdagent; break;;
      2) header "VirtioGPU / VirGL";
         pacman -S --needed --noconfirm mesa virglrenderer qemu-guest-agent spice-vdagent; break;;
      3) header "VMware open-vm-tools";
         pacman -S --needed --noconfirm open-vm-tools xf86-video-vmware; systemctl enable vmtoolsd; break;;
      4) header "VirtualBox guest additions";
         pacman -S --needed --noconfirm virtualbox-guest-utils; systemctl enable vboxservice; break;;
      5) return;;
      *) echo "Invalid";;
    esac
  done
}

case $MODE in
  nvidia) install_nvidia;;
  amd)    install_amd;;
  intel)  install_intel;;
  vm)     install_vm;;
  *)      echo "No valid mode"; exit 1;;
esac

echo -e "\nAll done! Reboot to load the new drivers."
