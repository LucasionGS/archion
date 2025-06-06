#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run as a normal user with sudo privileges."
  exit 1
fi

if [[ ! -d /tmp/yay ]]; then
  # Install yay
  git clone https://aur.archlinux.org/yay.git /tmp/yay
  cd /tmp/yay
  makepkg -si --noconfirm
  
  cd /
  
  # Clean up yay directory
  rm -rf /tmp/yay
fi

# Install Rust toolchain for compiling
rustup default stable

# Install anyrun (https://github.com/anyrun-org/anyrun)
yay -S --noconfirm \
  anyrun-git
