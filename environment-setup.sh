#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run without sudo, but as a normal user who has sudo privileges."
  exit 1
fi

USER=$(whoami)

# --–– utility helpers -----
source ./utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# Inform the user that it is possible they have to type in their password if they don't use passwordless sudo
echo "You may be prompted for your password during the installation process if you do not have passwordless sudo configured."
pause

CONFIG_DIR="$HOME/.config"

# Move .config files to the user's home directory
if [[ ! -d $CONFIG_DIR ]]; then
  mkdir -p $CONFIG_DIR
fi

# Copy configuration files
cp -r ./config/archion $CONFIG_DIR/archion
cp -r ./config/hypr $CONFIG_DIR/hypr
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

# Install snap
yay --noconfirm -S snapd
# Enable snapd service
sudo systemctl enable --now snapd.socket

# Install oh-my-fish
OMG_INSTALL_FILE="/tmp/omf-`whoami`-install"
wget https://raw.githubusercontent.com/oh-my-fish/oh-my-fish/master/bin/install -O $OMG_INSTALL_FILE
chmod +x $OMG_INSTALL_FILE
fish -c "$OMG_INSTALL_FILE --noninteractive --yes"
# Clean
rm -f $OMG_INSTALL_FILE

# Install fish theme
fish -c "omf install bobthefish "
fish -c "omf theme bobthefish"

# Install nvm for managing Node.js versions for fish shell
fish -c "fisher install jorgebucaran/nvm.fish"

# Neovim setup (Will be set up when launched later)
if [[ ! -d $CONFIG_DIR/nvim ]]; then
  # Install Neovim
  git clone https://github.com/LucasionGS/nvim-nvchad $CONFIG_DIR/nvim || true # If it already exists, it will not clone again
else
  echo "Neovim configuration already exists in $CONFIG_DIR/nvim. Skipping clone."
fi


# Visual studio code (Microsoft's version)
# Note: This is the official version from Microsoft, not the open-source version. I like this one best
yay -S --noconfirm visual-studio-code-bin
# If unhappy with the official version, you can use the open-source version:
# sudo pacman -S --noconfirm code


# Install Pyprland
yay -S --noconfirm \
  pyprland

# Install logout manager
yay -S --nocomfirm wleave-git


# Install Astal / AGS for widgets
yay -S --noconfirm libastal-meta
yay -S --noconfirm aylurs-gtk-shell






# Finished
echo "--------------------- Installation complete! ---------------------"
echo "Installation complete! Please reboot your system to apply changes."
echo "--------------------- Installation complete! ---------------------"