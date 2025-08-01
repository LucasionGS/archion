#!/usr/bin/env bash
# Enhanced Arch Linux installation script for use from the official live ISO.
# ⚠️  DISCLAIMER: THIS SCRIPT WILL ERASE DATA ON SELECTED DISKS/PARTITIONS ⚠️

set -euo pipefail

# Source utility functions
source ./utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# Show banner
show_banner "Arch Linux Installer" "2.0"

# Enhanced need function
need() { 
  command -v "$1" >/dev/null || error "Required tool '$1' not found. Cannot proceed with installation."
}

# Function to get proper partition name based on disk type
get_partition() {
  local disk="$1"
  local part_num="$2"
  if [[ $disk =~ [0-9]$ ]]; then
    echo "${disk}p${part_num}"
  else
    echo "${disk}${part_num}"
  fi
}

section "Pre-flight Checks"
step "Verifying installation environment..."

# Root check
[[ $EUID -eq 0 ]] || error "This script must be run as root from the live ISO."

# Check required tools
step "Checking required installation tools..."
need pacstrap
need genfstab  
need lsblk
need partprobe
success "All required tools are available"

# Network connectivity check
section "Network Connectivity"
step "Testing network connection..."
if ping -c 2 archlinux.org >/dev/null 2>&1; then
  success "Network connection established"
else
  error "Network is not connected. Please connect to Wi-Fi or Ethernet.\nUse 'iwctl' for Wi-Fi or check your Ethernet connection."
fi

section "Installation Mode Selection"
warning "⚠️  DATA LOSS WARNING ⚠️"
echo "This installer will modify your disk. Please ensure you have backups!"
echo

info "Available installation modes:"
echo "  1) Full disk installation    - Completely wipes the selected disk"
echo "  2) Dual boot installation    - Preserves existing partitions"
echo

while true; do
  prompt "Select installation mode [1/2]:" INSTALL_MODE
  case $INSTALL_MODE in
    1) 
      DUAL_BOOT=false
      warning "Full disk mode will COMPLETELY ERASE the selected disk!"
      break;;
    2) 
      DUAL_BOOT=true
      info "Dual boot mode will preserve existing partitions."
      break;;
    *) 
      warning "Invalid selection. Please choose 1 or 2."
      ;;
  esac
done

if [[ $DUAL_BOOT == false ]]; then
  echo
  warning "⚠️  FINAL WARNING: Full disk installation will:"
  echo "   • Destroy ALL data on the selected disk"
  echo "   • Remove ALL existing partitions"  
  echo "   • Create a new partition table"
  echo
  if ! confirm "I understand this will erase all data and want to continue" "N"; then
    error "Installation cancelled for safety."
  fi
fi

success "Installation mode: $([ $DUAL_BOOT == true ] && echo "Dual boot" || echo "Full disk")"

section "Disk Selection"
info "Available storage devices:"
echo
lsblk -d -o NAME,SIZE,MODEL,TYPE | head -20
echo

while true; do
  prompt "Enter target disk (e.g. /dev/sda, /dev/nvme0n1):" DISK
  if [[ -b "$DISK" ]]; then
    success "Selected disk: $DISK"
    break
  else
    warning "Block device '$DISK' not found. Please check the device name."
  fi
done

section "Current Disk Layout"
info "Current partition table for $DISK:"
echo
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT "$DISK"
echo

if [[ $DUAL_BOOT == true ]]; then
  section "Dual Boot Configuration"
  info "Dual boot mode requirements:"
  echo "  • An existing EFI System Partition (recommended)"
  echo "  • Sufficient free space for Arch Linux (minimum 20GB)"
  echo "  • Backup of important data"
  echo
  
  step "EFI partition configuration..."
  prompt "Enter existing EFI partition (e.g. ${DISK}1) or leave empty to create new:" EFI_PART
  
  step "Root partition configuration..."
  prompt "Enter partition for Arch root (e.g. ${DISK}3) or leave empty to use free space:" ROOT_PART
  
  if [[ -z "$ROOT_PART" ]]; then
    info "Will create new root partition in available free space"
    CREATE_ROOT=true
  else
    if [[ -b "$ROOT_PART" ]]; then
      warning "⚠️  This will FORMAT partition $ROOT_PART"
      if ! confirm "Continue and format $ROOT_PART?"; then
        error "Installation aborted by user."
      fi
      CREATE_ROOT=false
    else
      error "Root partition $ROOT_PART not found."
    fi
  fi
else
  section "Full Disk Installation Plan"
  info "The installer will create:"
  echo "  • GPT partition table (replaces existing)"
  echo "  • 550 MiB EFI System Partition (FAT32)"
  echo "  • Remaining space for root partition (ext4)"
  echo "  • Swap file inside root filesystem (2GB)"
  echo
  
  warning "This will completely erase $DISK!"
  if ! confirm "Proceed with full disk installation?"; then
    error "Installation aborted by user."
  fi
fi

section "System Configuration"
info "Please provide system configuration details:"
echo

while true; do
  prompt "Hostname for the new system:" HOSTNAME
  if [[ -n "$HOSTNAME" && "$HOSTNAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
    success "Hostname: $HOSTNAME"
    break
  else
    warning "Invalid hostname. Use only letters, numbers, and hyphens."
  fi
done

while true; do
  prompt "Username for primary user:" USERNAME
  if [[ -n "$USERNAME" && "$USERNAME" =~ ^[a-z_][a-z0-9_-]*$ ]]; then
    success "Username: $USERNAME"
    break
  else
    warning "Invalid username. Use lowercase letters, numbers, underscore, and hyphen."
  fi
done

info "Setting password for user: $USERNAME"
prompt_password "Password for $USERNAME" USERPASS

info "Setting password for root user"
prompt_password "Password for root" ROOTPASS

prompt "Timezone (e.g. Europe/Copenhagen)" TIMEZONE "Europe/Copenhagen"
prompt "Locale (e.g. en_US.UTF-8)" LOCALE "en_US.UTF-8"

# Export USERNAME for use by other scripts
echo "$USERNAME" > /tmp/initial_archion_username

success "System configuration completed"

section "Disk Partitioning"
if [[ $DUAL_BOOT == false ]]; then
  step "Creating full disk partition layout..."
  info "This will completely wipe $DISK and create new partitions"
  
  execute_with_progress "wipefs -af '$DISK'" "Wiping filesystem signatures"
  execute_with_progress "sgdisk -Z '$DISK'" "Zeroing partition table"
  
  step "Creating EFI System Partition (550 MiB)..."
  if sgdisk -n1:0:+550MiB -t1:ef00 -c1:"EFI System Partition" "$DISK"; then
    success "EFI partition created"
  else
    error "Failed to create EFI partition"
  fi
  
  step "Creating root partition (remaining space)..."
  if sgdisk -n2:0:0 -t2:8300 -c2:"Arch Linux root" "$DISK"; then
    success "Root partition created"
  else
    error "Failed to create root partition"
  fi
  
  execute_with_progress "partprobe '$DISK'" "Updating partition table"

  EFI_PART=$(get_partition "$DISK" 1)
  ROOT_PART=$(get_partition "$DISK" 2)
else
  step "Setting up dual boot partitions..."
  
  if [[ -z "$EFI_PART" ]]; then
    step "Creating new EFI partition..."
    # Find next available partition number
    PART_NUM=$(sgdisk -p "$DISK" | tail -n +8 | wc -l)
    PART_NUM=$((PART_NUM + 1))
    
    if sgdisk -n${PART_NUM}:0:+550MiB -t${PART_NUM}:ef00 -c${PART_NUM}:"EFI System Partition" "$DISK" >/dev/null 2>&1; then
      EFI_PART=$(get_partition "$DISK" "$PART_NUM")
      success "EFI partition created: $EFI_PART"
    else
      error "Failed to create EFI partition"
    fi
  fi
  
  if [[ $CREATE_ROOT == true ]]; then
    step "Creating new root partition in free space..."
    PART_NUM=$(sgdisk -p "$DISK" | tail -n +8 | wc -l)
    PART_NUM=$((PART_NUM + 1))
    
    if sgdisk -n${PART_NUM}:0:0 -t${PART_NUM}:8300 -c${PART_NUM}:"Arch Linux root" "$DISK" >/dev/null 2>&1; then
      ROOT_PART=$(get_partition "$DISK" "$PART_NUM")
      success "Root partition created: $ROOT_PART"
    else
      error "Failed to create root partition"
    fi
  fi
  
  execute_with_progress "partprobe '$DISK'" "Updating partition table"
fi

step "Verifying partition layout..."
info "Final partition configuration:"
echo
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT "$DISK"
echo
info "Selected partitions:"
echo "  EFI:  $EFI_PART"
echo "  Root: $ROOT_PART"

section "Filesystem Creation"
step "Formatting partitions..."

# Format EFI partition if needed
if [[ $DUAL_BOOT == false ]] || [[ -z $(lsblk -no FSTYPE "$EFI_PART" 2>/dev/null) ]]; then
  step "Formatting EFI partition as FAT32..."
  if mkfs.fat -F32 "$EFI_PART" >/dev/null 2>&1; then
    success "EFI partition formatted"
  else
    error "Failed to format EFI partition"
  fi
else
  info "EFI partition already formatted, skipping"
fi

step "Formatting root partition as ext4..."
if mkfs.ext4 -F "$ROOT_PART" >/dev/null 2>&1; then
  success "Root partition formatted"
else
  error "Failed to format root partition"
fi

section "Filesystem Mounting"
step "Mounting filesystems..."
if mount "$ROOT_PART" /mnt; then
  success "Root filesystem mounted at /mnt"
else
  error "Failed to mount root filesystem"
fi

if mkdir -p /mnt/boot && mount "$EFI_PART" /mnt/boot; then
  success "EFI filesystem mounted at /mnt/boot"
else
  error "Failed to mount EFI filesystem"
fi

section "Base System Installation"
info "Installing Arch Linux base system..."
warning "This may take several minutes depending on your internet connection"

# Prepare package list based on installation mode
if [[ $DUAL_BOOT == true ]]; then
  PACKAGES="base linux linux-firmware nano git vim networkmanager sudo grub efibootmgr os-prober"
  info "Installing packages with dual boot support"
else
  PACKAGES="base linux linux-firmware nano git vim networkmanager sudo grub efibootmgr"
  info "Installing packages for single boot"
fi

step "Downloading and installing base packages..."
if pacstrap -K /mnt $PACKAGES >/dev/null 2>&1; then
  success "Base system installed successfully"
else
  error "Failed to install base system"
fi

section "System Configuration"
step "Generating filesystem table..."
if genfstab -U /mnt >> /mnt/etc/fstab; then
  success "Filesystem table generated"
else
  error "Failed to generate filesystem table"
fi

step "Configuring system in chroot environment..."
info "Setting up timezone, locale, users, and bootloader..."

arch-chroot /mnt /bin/bash <<EOF
set -e

# Timezone configuration
ln -sf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
hwclock --systohc

# Locale configuration
sed -i "s/^#${LOCALE}/${LOCALE}/" /etc/locale.gen
locale-gen
echo "LANG=${LOCALE}" > /etc/locale.conf
echo "KEYMAP=dk" > /etc/vconsole.conf

# Hostname configuration
echo "${HOSTNAME}" > /etc/hostname
echo "127.0.0.1 localhost" >> /etc/hosts
echo "127.0.1.1 ${HOSTNAME}.localdomain ${HOSTNAME}" >> /etc/hosts

# User configuration
echo "root:${ROOTPASS}" | chpasswd
groupadd sudo
useradd -m -G sudo,network -s /bin/bash ${USERNAME}
echo "${USERNAME}:${USERPASS}" | chpasswd
echo "%sudo ALL=(ALL) ALL" > /etc/sudoers.d/99_sudo

# Enable essential services
systemctl enable NetworkManager

# Configure GRUB for dual boot if needed
if [[ $DUAL_BOOT == true ]]; then
  echo "GRUB_DISABLE_OS_PROBER=false" >> /etc/default/grub
fi

# Install and configure GRUB bootloader
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
EOF

if [[ $? -eq 0 ]]; then
  success "System configuration completed successfully"
else
  error "Failed to configure system in chroot"
fi

section "Swap File Creation"
step "Creating 2GB swap file..."
if fallocate -l 2G /mnt/swapfile && chmod 600 /mnt/swapfile && mkswap /mnt/swapfile >/dev/null 2>&1; then
  echo "/swapfile none swap defaults 0 0" >> /mnt/etc/fstab
  success "Swap file created and configured"
else
  warning "Failed to create swap file (not critical)"
fi
echo "/swapfile none swap defaults 0 0" >> /mnt/etc/fstab

section "Archion Repository Setup"
step "Installing Archion configuration and scripts..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "$SCRIPT_DIR" ]]; then
  info "Copying Archion repository to /archion"
  if cp -r "$SCRIPT_DIR" /mnt/archion; then
    success "Archion repository copied"
    
    # Set proper permissions and create user symlink
    arch-chroot /mnt /bin/bash <<EOF
chown -R root:root /archion
chmod -R 755 /archion
ln -s /archion /home/${USERNAME}/archion
chown -h ${USERNAME}:${USERNAME} /home/${USERNAME}/archion
EOF
    success "Archion repository configured with proper permissions"
  else
    warning "Failed to copy Archion repository"
  fi
else
  warning "Script directory not found - Archion repository not installed"
fi

section "Installation Completion"
# Check for no-umount flag
UMOUNT=true
if [[ "${1:-}" == "--no-umount" ]]; then
  warning "Skipping filesystem unmounting (--no-umount flag detected)"
  UMOUNT=false
fi

if [[ $UMOUNT == false ]]; then
  warning "Filesystems remain mounted - remember to unmount manually:"
  echo "  umount -R /mnt"
else
  step "Unmounting filesystems..."
  if umount -R /mnt; then
    success "Filesystems unmounted successfully"
  else
    warning "Some filesystems may not have unmounted cleanly"
  fi
fi

header "Arch Linux Installation Complete!"
success "🎉 Base system installation successful!"
success "🔧 System configured and ready to boot!"
success "🏛️ Archion repository installed!"

echo
info "Installation Summary:"
echo "  ✓ Partitions created and formatted"
echo "  ✓ Base system installed"
echo "  ✓ User account configured: $USERNAME"
echo "  ✓ GRUB bootloader installed"
echo "  ✓ Network manager enabled"
echo "  ✓ Archion scripts available"

if [[ $DUAL_BOOT == true ]]; then
  echo
  success "Dual boot configuration completed!"
  info "GRUB should automatically detect other operating systems."
  info "If other OS entries don't appear in the boot menu:"
  echo "  sudo grub-mkconfig -o /boot/grub/grub.cfg"
fi

echo
info "Next steps:"
echo "  1. Remove the installation media"
echo "  2. Reboot into your new Arch Linux system"
echo "  3. Log in as '$USERNAME'"
echo "  4. Run the global setup: sudo ~/archion/global-setup.sh"
echo "  5. Run the environment setup: ~/archion/environment-setup.sh"

echo
if confirm "Would you like to reboot now?" "N"; then
  info "Rebooting in 5 seconds..."
  sleep 5
  reboot
else
  success "🏛️ Welcome to Arch Linux! Manual reboot when ready. 🏛️"
fi
