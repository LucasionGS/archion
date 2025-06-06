#!/usr/bin/env bash
# auto-arch-install.sh
# Guided Arch Linux installation script for use from the official live ISO.
# Disclaimer: THIS SCRIPT WILL ERASE DATA ON THE SELECTED DISK.
# Read and understand before running. Tested 2025‑06 against Arch ISO 2025.05.01.

set -euo pipefail

# ---- helper functions ----
error() { echo -e "\e[31mError:\e[0m $1" >&2; exit 1; }
prompt() { read -rp "$1" "$2"; }
confirm() {
  read -rp "$1 [y/N]: " ans
  [[ ${ans,,} == y || ${ans,,} == yes ]]
}

need() { command -v "$1" >/dev/null || error "$1 not found."; }

# ---- pre-flight checks ----
[[ $EUID -eq 0 ]] || error "Run as root from the live ISO."
need pacstrap
need genfstab
need lsblk
need partprobe

clear
echo "Arch Linux Guided Installer"
echo "==========================="
echo

# ---- ensure network is up ----
if ! ping -c 1 archlinux.org &>/dev/null; then
  echo "Network is not connected. Please connect to Wi-Fi or Ethernet."
  echo "Use 'iwctl' for Wi-Fi or check Ethernet connection."
  exit 1
fi
echo "Network is connected. Proceeding with installation."

# ---- user inputs ----
lsblk -d -o NAME,SIZE,MODEL
prompt "Enter target disk (e.g. /dev/sda, /dev/nvme0n1): " DISK
[[ -b $DISK ]] || error "Block device $DISK not found."

echo
echo "The script will create:"
echo "  • GPT partition table"
echo "  • 550 MiB EFI System Partition (FAT32)"
echo "  • Remaining space for root (ext4)"
echo "  • Swap file will be created inside root FS."
confirm "Proceed and WIPE ${DISK}?" || error "Installation aborted."

prompt "Hostname for the new system: " HOSTNAME
prompt "Username for primary user: " USERNAME
read -rsp "Password for ${USERNAME}: " USERPASS; echo
read -rsp "Password for root: " ROOTPASS; echo
prompt "Timezone (e.g. Europe/Copenhagen): " TIMEZONE
prompt "Locale (e.g. en_US.UTF-8): " LOCALE

# ---- partitioning ----
echo "Partitioning $DISK ..."
wipefs -af "$DISK"
sgdisk -Z "$DISK"
sgdisk -n1:0:+550MiB -t1:ef00 -c1:"EFI System Partition" "$DISK"
sgdisk -n2:0:0     -t2:8300 -c2:"Arch Linux root" "$DISK"
partprobe "$DISK"

EFI_PART="${DISK}1"
ROOT_PART="${DISK}2"

# Confirm partition layout
echo "Created partitions:"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT "$DISK"
echo "  1: $EFI_PART (EFI System Partition)"
echo "  2: $ROOT_PART (Arch Linux root)"

# ---- formatting ----
echo "Formatting partitions ..."
mkfs.fat -F32 "$EFI_PART"
mkfs.ext4 -F "$ROOT_PART"

# ---- mounting ----
echo "Mounting filesystems ..."
mount "$ROOT_PART" /mnt
mkdir -p /mnt/boot
mount "$EFI_PART" /mnt/boot

# ---- pacstrap ----
echo "Installing base system (this may take a while) ..."
pacstrap -K /mnt base linux linux-firmware nano vim networkmanager sudo grub efibootmgr

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

echo "${HOSTNAME}" > /etc/hostname
echo "127.0.0.1 localhost" >> /etc/hosts
echo "127.0.1.1 ${HOSTNAME}.localdomain ${HOSTNAME}" >> /etc/hosts

echo "root:${ROOTPASS}" | chpasswd
useradd -m -G sudo,network -s /bin/bash ${USERNAME}
echo "${USERNAME}:${USERPASS}" | chpasswd
echo "%sudo ALL=(ALL) ALL" > /etc/sudoers.d/99_sudo

systemctl enable NetworkManager

grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
EOF

# ---- swap file ----
echo "Creating 2G swap file ..."
fallocate -l 2G /mnt/swapfile
chmod 600 /mnt/swapfile
mkswap /mnt/swapfile
echo "/swapfile none swap defaults 0 0" >> /mnt/etc/fstab

# ---- finish ----
echo "Installation complete! Unmounting ..."
umount -R /mnt
echo "You can now reboot into your new Arch Linux system."
