#!/usr/bin/env bash
# Guided Arch Linux installation script for use from the official live ISO.
# Disclaimer: THIS SCRIPT WILL ERASE DATA ON THE SELECTED DISK (or selected partitions in dual boot mode).

set -euo pipefail

# --–– utility helpers -----
source ./utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }

need() { command -v "$1" >/dev/null || error "$1 not found."; }

# ---- pre-flight checks ----
[[ $EUID -eq 0 ]] || error "Run as root from the live ISO."
need pacstrap
need genfstab
need lsblk
need partprobe

clear
header "Arch Linux Guided Installer"
echo

# ---- ensure network is up ----
if ! ping -c 1 archlinux.org &>/dev/null; then
  echo "Network is not connected. Please connect to Wi-Fi or Ethernet."
  echo "Use 'iwctl' for Wi-Fi or check Ethernet connection."
  exit 1
fi
echo "Network is connected. Proceeding with installation."

# ---- installation mode selection ----
echo "Installation modes:"
echo "1. Full disk installation (WIPES ENTIRE DISK)"
echo "2. Dual boot installation (preserves existing partitions)"
echo
prompt "Select installation mode [1/2]: " INSTALL_MODE

case $INSTALL_MODE in
  1) DUAL_BOOT=false ;;
  2) DUAL_BOOT=true ;;
  *) error "Invalid selection. Choose 1 or 2." ;;
esac

# ---- user inputs ----
lsblk -d -o NAME,SIZE,MODEL
prompt "Enter target disk (e.g. /dev/sda, /dev/nvme0n1): " DISK
[[ -b $DISK ]] || error "Block device $DISK not found."

echo
echo "Current partition table:"
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT "$DISK"
echo

if [[ $DUAL_BOOT == true ]]; then
  echo "Dual boot mode selected."
  echo "Please ensure you have:"
  echo "  • An existing EFI System Partition (if UEFI system)"
  echo "  • Sufficient free space for Arch Linux root partition"
  echo
  lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT "$DISK"
  echo
  prompt "Enter EFI partition (e.g. ${DISK}1, leave empty to create new): " EFI_PART
  prompt "Enter partition for Arch root (e.g. ${DISK}3, leave empty to use free space): " ROOT_PART
  
  if [[ -z $ROOT_PART ]]; then
    echo "Will create new partition in available free space."
    CREATE_ROOT=true
  else
    [[ -b $ROOT_PART ]] || error "Root partition $ROOT_PART not found."
    CREATE_ROOT=false
    confirm "This will FORMAT $ROOT_PART. Continue?" || error "Installation aborted."
  fi
else
  echo "The script will create:"
  echo "  • GPT partition table"
  echo "  • 550 MiB EFI System Partition (FAT32)"
  echo "  • Remaining space for root (ext4)"
  echo "  • Swap file will be created inside root FS."
  confirm "Proceed and WIPE ${DISK}?" || error "Installation aborted."
fi

prompt "Hostname for the new system: " HOSTNAME
prompt "Username for primary user: " USERNAME
prompt_password "Password for ${USERNAME}: " USERPASS;
prompt_password "Password for root: " ROOTPASS;
prompt "Timezone (e.g. Europe/Copenhagen): " TIMEZONE
prompt "Locale (e.g. en_US.UTF-8): " LOCALE

# ---- partitioning ----
if [[ $DUAL_BOOT == false ]]; then
  echo "Partitioning $DISK ..."
  wipefs -af "$DISK"
  sgdisk -Z "$DISK"
  sgdisk -n1:0:+550MiB -t1:ef00 -c1:"EFI System Partition" "$DISK"
  sgdisk -n2:0:0     -t2:8300 -c2:"Arch Linux root" "$DISK"
  partprobe "$DISK"

  EFI_PART="${DISK}1"
  ROOT_PART="${DISK}2"
else
  echo "Setting up dual boot partitions ..."
  
  if [[ -z $EFI_PART ]]; then
    echo "Creating new EFI partition ..."
    # Find next available partition number
    PART_NUM=$(sgdisk -p "$DISK" | tail -n +8 | wc -l)
    PART_NUM=$((PART_NUM + 1))
    sgdisk -n${PART_NUM}:0:+550MiB -t${PART_NUM}:ef00 -c${PART_NUM}:"EFI System Partition" "$DISK"
    EFI_PART="${DISK}${PART_NUM}"
  fi
  
  if [[ $CREATE_ROOT == true ]]; then
    echo "Creating new root partition in free space ..."
    PART_NUM=$(sgdisk -p "$DISK" | tail -n +8 | wc -l)
    PART_NUM=$((PART_NUM + 1))
    sgdisk -n${PART_NUM}:0:0 -t${PART_NUM}:8300 -c${PART_NUM}:"Arch Linux root" "$DISK"
    ROOT_PART="${DISK}${PART_NUM}"
  fi
  
  partprobe "$DISK"
fi

# Confirm partition layout
echo "Using partitions:"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT "$DISK"
echo "  EFI: $EFI_PART"
echo "  Root: $ROOT_PART"

# ---- formatting ----
echo "Formatting partitions ..."
if [[ $DUAL_BOOT == false ]] || [[ -z $(lsblk -no FSTYPE "$EFI_PART") ]]; then
  echo "Formatting EFI partition ..."
  mkfs.fat -F32 "$EFI_PART"
fi
echo "Formatting root partition ..."
mkfs.ext4 -F "$ROOT_PART"

# ---- mounting ----
echo "Mounting filesystems ..."
mount "$ROOT_PART" /mnt
mkdir -p /mnt/boot
mount "$EFI_PART" /mnt/boot

# ---- pacstrap ----
echo "Installing base system (this may take a while) ..."
if [[ $DUAL_BOOT == true ]]; then
  pacstrap -K /mnt base linux linux-firmware nano git vim networkmanager sudo grub efibootmgr os-prober
else
  pacstrap -K /mnt base linux linux-firmware nano git vim networkmanager sudo grub efibootmgr
fi

# ---- fstab ----
genfstab -U /mnt >> /mnt/etc/fstab

# ---- chroot configuration ----
arch-chroot /mnt /bin/bash <<EOF
set -e
ln -sf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
hwclock --systohc

sed -i "s/^#${LOCALE}/${LOCALE}/" /etc/locale.gen
locale-gen
echo "LANG=${LOCALE}" > /etc/locale.conf
echo "KEYMAP=dk" > /etc/vconsole.conf

echo "${HOSTNAME}" > /etc/hostname
echo "127.0.0.1 localhost" >> /etc/hosts
echo "127.0.1.1 ${HOSTNAME}.localdomain ${HOSTNAME}" >> /etc/hosts

echo "root:${ROOTPASS}" | chpasswd
groupadd sudo
useradd -m -G sudo,network -s /bin/bash ${USERNAME}
echo "${USERNAME}:${USERPASS}" | chpasswd
echo "%sudo ALL=(ALL) ALL" > /etc/sudoers.d/99_sudo

systemctl enable NetworkManager

# Configure GRUB for dual boot if needed
if [[ $DUAL_BOOT == true ]]; then
  echo "GRUB_DISABLE_OS_PROBER=false" >> /etc/default/grub
fi

grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
EOF

# ---- swap file ----
echo "Creating 2G swap file ..."
fallocate -l 2G /mnt/swapfile
chmod 600 /mnt/swapfile
mkswap /mnt/swapfile
echo "/swapfile none swap defaults 0 0" >> /mnt/etc/fstab

# Copy over the repository to the default user's home directory
echo "Copying repository files to ${USERNAME}'s home directory ..."
mkdir -p /mnt/home/${USERNAME}/archion

# Get dir of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -d "$SCRIPT_DIR" ]]; then
  echo "Copying files from $SCRIPT_DIR to /mnt/home/${USERNAME}/archion"
  cp -r "$SCRIPT_DIR"/* /mnt/home/${USERNAME}/archion
else
  echo "Script directory not found. Skipping file copy."
fi

# ---- finish ----
echo "Installation complete! Unmounting ..."
umount -R /mnt

if [[ $DUAL_BOOT == true ]]; then
  echo "Dual boot setup complete!"
  echo "GRUB should automatically detect other operating systems."
  echo "If other OS entries don't appear, run 'sudo grub-mkconfig -o /boot/grub/grub.cfg' after reboot."
fi

echo "You can now reboot into your new Arch Linux system."
