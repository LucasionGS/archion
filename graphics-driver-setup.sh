#!/usr/bin/env bash
# Enhanced GPU/VM graphics driver installer for Arch Linux

set -euo pipefail

# Get script directory and source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || error "Failed to change directory to $SCRIPT_DIR"

# Source utility functions
source ./utils.sh || error "utils.sh not found. Run from the script directory."

# Show banner
show_banner "Graphics Driver Setup" "2.0"

# Root check with better formatting
[[ $EUID -eq 0 ]] || error "This script must be run as root (use sudo)."

# Ensure pacman is available
need pacman

section "System Preparation"
step "Updating package databases..."
execute_with_progress "pacman -Sy --noconfirm" "Package database update"

section "GPU Detection"
info "Scanning system for graphics hardware..."

VGA_INFO=$(lspci -nnk | grep -EA3 'VGA|3D|Display' || true)
VENDOR="unknown"

if echo "$VGA_INFO" | grep -qi nvidia; then 
  VENDOR="nvidia"
elif echo "$VGA_INFO" | grep -qi "amd\|ati"; then 
  VENDOR="amd"
elif echo "$VGA_INFO" | grep -qi intel; then 
  VENDOR="intel"
elif systemd-detect-virt -q; then 
  VENDOR="vm"
fi

echo
info "Detected graphics hardware:"
echo "$VGA_INFO"
echo

if [[ "$VENDOR" != "unknown" ]]; then
  success "Auto-detected: $VENDOR"
  info "You can override this selection in the menu below"
else
  warning "Could not auto-detect graphics vendor"
fi

section "Driver Selection"
info "Please select the appropriate driver for your system:"
echo
echo "  1) NVIDIA    - NVIDIA GeForce/Quadro/Tesla cards"
echo "  2) AMD       - AMD Radeon/RDNA cards"  
echo "  3) Intel     - Intel integrated graphics"
echo "  4) Virtual   - Virtual machine graphics"
echo "  5) Quit      - Exit without installing"
echo

while true; do
  prompt "Choose driver type [1-5]:" REPLY
  case $REPLY in
    1|N|n|nvidia|NVIDIA)    MODE="nvidia"; break;;
    2|A|a|amd|AMD)          MODE="amd"; break;;
    3|I|i|intel|Intel)      MODE="intel"; break;;
    4|V|v|vm|VM|virtual)    MODE="vm"; break;;
    5|Q|q|quit|Quit)        warning "Exiting without changes."; exit 0;;
    *) warning "Invalid choice. Please select 1-5.";;
  esac
done

success "Selected driver type: $MODE"
echo

if ! confirm "Proceed with $MODE driver installation?"; then
  warning "Installation cancelled by user."
  exit 0
fi

# Driver installation functions
install_nvidia() {
  section "NVIDIA Driver Installation"
  info "Installing NVIDIA proprietary driver stack..."
  
  step "Installing core NVIDIA packages..."
  install_packages "pacman" nvidia nvidia-utils nvidia-settings
  
  if confirm "Does your system also use the linux-lts kernel?" "N"; then
    step "Installing NVIDIA LTS kernel support..."
    install_packages "pacman" nvidia-lts
  fi
  
  if confirm "Enable DRM modeset for tear-free consoles?" "Y"; then
    step "Configuring DRM modeset..."
    if grep -q "nvidia-drm.modeset=1" /etc/default/grub; then
      info "DRM modeset already configured"
    else
      sed -i '/^GRUB_CMDLINE_LINUX=/ s/"$/ nvidia-drm.modeset=1"/' /etc/default/grub
      execute_with_progress "grub-mkconfig -o /boot/grub/grub.cfg" "GRUB configuration update"
      success "DRM modeset enabled"
    fi
  fi
  
  step "Rebuilding initramfs..."
  execute_with_progress "mkinitcpio -P" "Initramfs rebuild"
  
  success "NVIDIA drivers installed successfully!"
  warning "A reboot is required to load the new drivers."
}

install_amd() {
  section "AMD Driver Installation"
  info "Installing AMD open-source driver stack (AMDGPU)..."
  
  step "Installing AMD graphics drivers..."
  install_packages "pacman" mesa lib32-mesa libva-mesa-driver lib32-libva-mesa-driver mesa-vdpau lib32-mesa-vdpau vulkan-radeon lib32-vulkan-radeon xf86-video-amdgpu
  
  success "AMD drivers installed successfully!"
}

install_intel() {
  section "Intel Driver Installation"
  info "Installing Intel open-source driver stack..."
  
  step "Installing Intel graphics drivers..."
  install_packages "pacman" mesa lib32-mesa vulkan-intel lib32-vulkan-intel intel-media-driver intel-gpu-tools mesa-vdpau lib32-mesa-vdpau
  
  if confirm "Install legacy xf86-video-intel DDX driver for Xorg?" "N"; then
    step "Installing legacy Intel DDX driver..."
    install_packages "pacman" xf86-video-intel
    warning "Legacy DDX driver may cause issues on newer systems."
  fi
  
  success "Intel drivers installed successfully!"
}

install_vm() {
  section "Virtual Machine Graphics"
  info "Please select your virtualization platform:"
  echo
  echo "  1) QEMU with Spice/QXL"
  echo "  2) QEMU with VirtIO-GPU/VirGL"  
  echo "  3) VMware Workstation/ESXi"
  echo "  4) VirtualBox"
  echo "  5) Back to main menu"
  echo
  
  while true; do
    prompt "Select VM platform [1-5]:" VMREPLY
    case $VMREPLY in
      1) 
        step "Installing QEMU Spice/QXL drivers..."
        install_packages "pacman" xf86-video-qxl qemu-guest-agent spice-vdagent
        success "QEMU Spice/QXL drivers installed!"
        break;;
      2) 
        step "Installing VirtIO-GPU/VirGL drivers..."
        install_packages "pacman" mesa virglrenderer qemu-guest-agent spice-vdagent
        success "VirtIO-GPU/VirGL drivers installed!"
        break;;
      3) 
        step "Installing VMware tools..."
        install_packages "pacman" open-vm-tools xf86-video-vmware
        manage_service "enable" "vmtoolsd"
        success "VMware tools installed and enabled!"
        break;;
      4) 
        step "Installing VirtualBox guest additions..."
        install_packages "pacman" virtualbox-guest-utils
        manage_service "enable" "vboxservice"
        success "VirtualBox guest additions installed and enabled!"
        break;;
      5) return;;
      *) warning "Invalid choice. Please select 1-5.";;
    esac
  done
}

section "Driver Installation"
case $MODE in
  nvidia) install_nvidia;;
  amd)    install_amd;;
  intel)  install_intel;;
  vm)     install_vm;;
  *)      error "Invalid driver mode: $MODE";;
esac

header "Graphics Driver Setup Complete!"
success "🎮 Graphics drivers have been installed successfully!"
echo

info "Next steps:"
case $MODE in
  nvidia)
    echo "  • Reboot your system to load the NVIDIA drivers"
    echo "  • Use 'nvidia-settings' to configure display settings"
    echo "  • Check driver status with: nvidia-smi"
    ;;
  amd)
    echo "  • Reboot to ensure all components are loaded"
    echo "  • AMD drivers should work out of the box"
    echo "  • Use your desktop environment's display settings"
    ;;
  intel)
    echo "  • Intel graphics should work immediately"
    echo "  • Use your desktop environment's display settings"
    echo "  • Hardware acceleration should be available"
    ;;
  vm)
    echo "  • Restart your virtual machine"
    echo "  • Enable 3D acceleration in VM settings if available"
    echo "  • Install guest additions in your host system"
    ;;
esac

echo
if confirm "Would you like to reboot now to apply the changes?" "N"; then
  info "Rebooting system in 5 seconds..."
  sleep 5
  reboot
else
  warning "Remember to reboot your system to fully activate the new drivers!"
fi
