#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run without sudo, but as a normal user who has sudo privileges."
  exit 1
fi

CONFIG_DIR="$HOME/.config"

# Move .config files to the user's home directory
if [[ ! -d $CONFIG_DIR ]]; then
  mkdir -p $CONFIG_DIR
fi

# Copy configuration files
cp -r ./config/archion $CONFIG_DIR/archion
cp -r ./config/hypr $CONFIG_DIR/hypr
cp -r ./config/hyprpaper $CONFIG_DIR/hyprpaper
cp -r ./config/kitty $CONFIG_DIR/kitty
cp -r ./config/waybar $CONFIG_DIR/waybar
cp -r ./config/anyrun $CONFIG_DIR/anyrun

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

# Install swww
yay -S --noconfirm \
  swww

systemctl enable --now swww.service

# Install snap
yay --noconfirm -S snapd
# Enable snapd service
sudo systemctl enable --now snapd.socket

# Install oh-my-fish
curl https://raw.githubusercontent.com/oh-my-fish/oh-my-fish/master/bin/install | fish

# Install fish theme
omf install bobthefish 
omf theme bobthefish