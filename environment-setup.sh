#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run as a normal user with sudo privileges."
  exit 1
fi

# Make sure the user can run sudo
if ! sudo -n true; then
  echo "You need to be able to run sudo on this user for this script to work."
  exit 1
fi

sudo pacman -Syu \
  hyprland hyprpaper waybar hypridle hyprlock wofi mako kitty \
  base-devel openssh

# Install yay
git clone https://aur.archlinux.org/yay.git /tmp/yay
cd /tmp/yay
makepkg -si --noconfirm

cd -

