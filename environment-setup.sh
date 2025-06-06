#!/bin/bash
# Must run as root
set -e
if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root"
  exit 1
fi

pacman -Syu hyprland hyprpaper waybar hypridle hyprlock wofi mako openssh kitty

# Install yay
git clone https://aur.archlinux.org/yay.git /tmp/yay
cd /tmp/yay
makepkg -si --noconfirm

cd -

