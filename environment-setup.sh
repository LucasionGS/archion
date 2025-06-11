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
APP_DIR="$HOME/.apps"

if [[ ! -d $CONFIG_DIR ]]; then mkdir -p $CONFIG_DIR; fi
if [[ ! -d $APP_DIR ]]; then mkdir -p $APP_DIR; fi

# Copy configuration files
cp -r ./config/archion    $CONFIG_DIR/archion
cp -r ./config/hypr       $CONFIG_DIR/hypr
cp -r ./config/ags        $CONFIG_DIR/ags
cp -r ./config/kitty      $CONFIG_DIR/kitty
cp -r ./config/waybar     $CONFIG_DIR/waybar
cp -r ./config/anyrun     $CONFIG_DIR/anyrun
cp -r ./config/rofi       $CONFIG_DIR/rofi
cp -r ./config/wleave     $CONFIG_DIR/wleave
cp -r ./config/fish       $CONFIG_DIR/fish
cp -r ./config/gtk-3.0    $CONFIG_DIR/gtk-3.0

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

# Install anyrun (https://github.com/anyrun-org/anyrun), swww, snap, neofetch, and rofi
yay -S --noconfirm \
  anyrun-git \
  swww \
  snap \
  snapd \
  neofetch \
  rofi \
  libcava

# Enable snapd service
sudo systemctl enable --now snapd.socket

# Apply partial config to neofetch
CONFIG_DIR="$HOME/.config"
if [[ ! -d $CONFIG_DIR/neofetch ]]; then
  mkdir -p $CONFIG_DIR/neofetch
fi

## If the config already contains ### ARCHION CONFIG ###, we will not overwrite it
if grep -q "### ARCHION CONFIG ###" "$CONFIG_DIR/neofetch/config.conf"; then
  echo "Neofetch configuration already contains Archion settings. Skipping update."
else
  echo "" >> $CONFIG_DIR/neofetch/config.conf # Ensure there's a newline at the end of the file
  cat ./config/neofetch/partial-config.conf >> $CONFIG_DIR/neofetch/config.conf
  echo "Neofetch configuration updated with Archion settings."
fi

# Refresh the hyprland packages
# hyprpm update


# Install oh-my-fish
OMG_INSTALL_FILE="/tmp/omf-`whoami`-install"
wget https://raw.githubusercontent.com/oh-my-fish/oh-my-fish/master/bin/install -O $OMG_INSTALL_FILE
chmod +x $OMG_INSTALL_FILE
fish -c "$OMG_INSTALL_FILE --noninteractive --yes"
# Clean
rm -f $OMG_INSTALL_FILE

# Install fish theme
fish -c "omf install bobthefish"
fish -c "omf theme bobthefish"

# Install nvm for managing Node.js versions for fish shell
fish -c "fisher install jorgebucaran/nvm.fish"
# Install z for Working directory shortcuts
fish -c "fisher install jethrokuan/z"

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


# Install Pyprland, wleave, Astal / AGS for widgets, Hyprshell for Window switcher
yay -S --noconfirm \
  pyprland \
  wleave-git \
  libastal-meta \
  aylurs-gtk-shell \
  hyprshell

# Install FSSH (Fish SSH Connection Manager) from local
cp -r ./apps/fssh $APP_DIR/fssh
# Install FSSH
fish $APP_DIR/fssh


# Install beekeeper
sudo snap install beekeeper-studio

# Finished
echo "--------------------- Installation complete! ---------------------"
echo "Installation complete! Please reboot your system to apply changes."
echo "--------------------- Installation complete! ---------------------"
