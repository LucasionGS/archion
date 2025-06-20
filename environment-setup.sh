#!/bin/bash
set -e
if [[ $EUID == 0 ]]; then
  echo "This script cannot be run as root. Please run without sudo, but as a normal user who has sudo privileges."
  exit 1
fi

USER=$(whoami)
SCRIPT_DIR=$(dirname "$(realpath "$0")")

# --–– utility helpers -----
source $SCRIPT_DIR/utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# Inform the user that it is possible they have to type in their password if they don't use passwordless sudo
echo "You may be prompted for your password during the installation process if you do not have passwordless sudo configured."
pause

CONFIG_DIR="$HOME/.config"
APP_DIR="$HOME/.apps"

if [[ ! -d $CONFIG_DIR ]]; then mkdir -p $CONFIG_DIR; fi
if [[ ! -d $APP_DIR ]]; then mkdir -p $APP_DIR; fi

if [[ $ARCHION_DEV == "true" ]]; then
  echo "Running in development mode. Linking configuration files instead of copying them..."
  sleep 2
  # Link configuration files for development mode
  ln -sf $SCRIPT_DIR/config/archion    $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/hypr       $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/hyprshell  $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/ags        $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/kitty      $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/waybar     $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/anyrun     $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/rofi       $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/wleave     $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/fish       $CONFIG_DIR/.
  ln -sf $SCRIPT_DIR/config/gtk-3.0    $CONFIG_DIR/.
else
  # Copy configuration files
  cp -r $SCRIPT_DIR/config/archion    $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/hypr       $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/hyprshell  $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/ags        $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/kitty      $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/waybar     $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/anyrun     $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/rofi       $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/wleave     $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/fish       $CONFIG_DIR/.
  cp -r $SCRIPT_DIR/config/gtk-3.0    $CONFIG_DIR/.
fi

# Create autogen files
mkdir -p        "$CONFIG_DIR/hypr/configs/autogen"
create_autogen  "$CONFIG_DIR/hypr/configs/autogen/monitors.conf"

if [[ ! -d /tmp/yay ]]; then
  # Install yay
  git clone https://aur.archlinux.org/yay.git /tmp/yay
  cd /tmp/yay
  makepkg -si --noconfirm
  
  cd /
  
  # Clean up yay directory
  rm -rf /tmp/yay
fi

# Update the system packages
yay -Syu --noconfirm

# Install Rust toolchain for compiling
rustup default stable

# Install anyrun (https://github.com/anyrun-org/anyrun), swww, snap, neofetch, rofi, cava, and clipse
yay -S --noconfirm \
  anyrun-git \
  swww \
  snap \
  snapd \
  neofetch \
  rofi \
  libcava \
  clipse

# Enable snapd service
sudo systemctl enable --now snapd.socket

# Apply partial config to neofetch
CONFIG_DIR="$HOME/.config"
if [[ ! -d $CONFIG_DIR/neof1h ]]; then
  mkdir -p $CONFIG_DIR/neofetch
fi

# Run once
neofetch

## If the config already contains ### ARCHION CONFIG ###, we will not overwrite it
if grep -q "### ARCHION CONFIG ###" "$CONFIG_DIR/neofetch/config.conf"; then
  echo "Neofetch configuration already contains Archion settings. Skipping update."
else
  echo "" >> $CONFIG_DIR/neofetch/config.conf # Ensure there's a newline at the end of the file
  cat $SCRIPT_DIR/config/neofetch/partial-config.conf >> $CONFIG_DIR/neofetch/config.conf
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
# Use the real zoxide as its compatible with fish
curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh

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
  aylurs-gtk-shell

# Install FSSH (Fish SSH Connection Manager) from local
if [[ $ARCHION_DEV == "true" ]]; then
  echo "Running in development mode. Linking FSSH application directory..."
  ln -sf $SCRIPT_DIR/apps/fssh $APP_DIR/fssh
else
  if [[ ! -d $APP_DIR/fssh ]]; then
    mkdir -p $APP_DIR/fssh
  fi
fi

# Install FSSH
# fish $APP_DIR/fish/install.fish

# Install beekeeper
if [[ command -v beekeeper-studio &> /dev/null ]]; then
  echo "Beekeeper Studio is already installed."
else
  echo "Installing Beekeeper Studio..."
  sudo snap install beekeeper-studio
fi

if [[ command -v google-chrome-stable &> /dev/null ]]; then
  echo "Google Chrome is already installed."
else
  echo "Installing Google Chrome..."
  yay -S --noconfirm google-chrome
fi

# Install hyprshell
# https://github.com/H3rmt/hyprswitch
cargo install hyprshell

# For a sexy settings panel (should customize it???)
yay -S --noconfirm better-control-git

# Install Hyprshot for screenshots
yay -S --noconfirm hyprshot-git

# Install deno
wget https://deno.land/install.sh -O /tmp/deno-install.sh
sh /tmp/deno-install.sh -y
# Clean up the deno install script
rm -f /tmp/deno-install.sh

# Finished
echo "--------------------- Installation complete! ---------------------"
echo "Installation complete! Please reboot your system to apply changes."
echo "--------------------- Installation complete! ---------------------"
