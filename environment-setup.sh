#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run as a normal user with sudo privileges."
  exit 1
fi

BUILDDIR=~/.builds

mkdir -p $BUILDDIR

sudo pacman --noconfirm -Syu \
  hyprland hyprpaper waybar hypridle hyprlock wofi mako kitty \
  base-devel openssh || { echo "Failed to install required packages. Check your network connection or sudo privileges."; exit 1; }

if [[ ! -d /tmp/yay ]]; then
  # Install yay
  git clone https://aur.archlinux.org/yay.git /tmp/yay
  cd /tmp/yay
  makepkg -si --noconfirm
  
  cd $BUILDDIR
  
  # Clean up yay directory
  rm -rf /tmp/yay
fi

cd $BUILDDIR

# Install anyrun (https://github.com/anyrun-org/anyrun)
# Install Rust toolchain
sudo pacman -S --noconfirm rustup
rustup default stable

git clone https://github.com/anyrun-org/anyrun && cd anyrun
cargo build --release
cargo install --path $BUILDDIR/anyrun/
mkdir -p ~/.config/anyrun/plugins
cp target/release/*.so ~/.config/anyrun/plugins
cp examples/config.ron ~/.config/anyrun/config.ron
