#!/bin/bash
set -e

# Get script directory and source utilities
SCRIPT_DIR=$(dirname "$(realpath "$0")")
cd "$SCRIPT_DIR" || { echo "Failed to change directory to $SCRIPT_DIR"; exit 1; }

# Source utility functions
source "$SCRIPT_DIR/utils.sh" || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# Show banner
show_banner "User Environment Setup" "2.0"

# User check with better formatting
if [[ $EUID == 0 ]]; then
  error "This script cannot be run as root. Please run as a normal user with sudo privileges."
fi

USER=$(whoami)
info "Setting up environment for user: $USER"

# Development mode check
# To enable development mode, set: export ARCHION_DEV=true
if [[ "${ARCHION_DEV:-false}" == "true" ]]; then
  warning "Running in development mode - configurations will be symlinked instead of copied"
  info "Development mode: Changes to config files will be reflected immediately"
fi

echo
info "This script will install AUR packages, configure your desktop environment,"
info "and set up development tools. You may be prompted for your password"
info "during the installation process if you don't have passwordless sudo configured."
echo

if ! confirm "Do you want to proceed with the environment setup?"; then
  warning "Setup cancelled by user."
  exit 0
fi

section "Directory Setup"
CONFIG_DIR="$HOME/.config"
APP_DIR="$HOME/.apps"

step "Creating configuration directories..."
mkdir -p "$CONFIG_DIR" "$APP_DIR"
success "Configuration directories created"

section "Configuration Files Setup"
if [[ "${ARCHION_DEV:-false}" == "true" ]]; then
  info "Development mode: Creating symbolic links to configuration files..."
  
  step "Linking configuration directories..."
  ln -sf "$SCRIPT_DIR/config/archion"    "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/hypr"       "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/ags"        "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/kitty"      "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/waybar"     "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/anyrun"     "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/wleave"     "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/fish"       "$CONFIG_DIR/."
  ln -sf "$SCRIPT_DIR/config/gtk-3.0"    "$CONFIG_DIR/."
  success "Configuration files linked (development mode)"
else
  info "Production mode: Copying configuration files..."
  
  step "Copying configuration directories..."
  cp -r "$SCRIPT_DIR/config/archion"    "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/hypr"       "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/ags"        "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/kitty"      "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/waybar"     "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/anyrun"     "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/wleave"     "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/fish"       "$CONFIG_DIR/."
  cp -r "$SCRIPT_DIR/config/gtk-3.0"    "$CONFIG_DIR/."
  success "Configuration files copied"
fi

step "Creating autogen configuration files..."
mkdir -p "$CONFIG_DIR/hypr/configs/autogen"
create_autogen "$CONFIG_DIR/hypr/configs/autogen/monitors.conf"

section "AUR Helper Installation"
if [[ ! -d /tmp/yay ]]; then
  step "Installing yay AUR helper..."
  info "This will allow us to install packages from the Arch User Repository"
  
  if git clone https://aur.archlinux.org/yay.git /tmp/yay; then
    cd /tmp/yay
    if makepkg -si --noconfirm; then
      success "Yay AUR helper installed successfully"
    else
      error "Failed to build and install yay"
    fi
    cd "$SCRIPT_DIR"
    rm -rf /tmp/yay
  else
    error "Failed to clone yay repository"
  fi
else
  info "Yay installation directory already exists, skipping..."
fi

section "System Update"
step "Updating system packages with yay..."
execute_with_progress "yay -Syu --noconfirm" "System update"

section "Development Environment"
step "Setting up Rust toolchain..."
if rustup default stable; then
  success "Rust toolchain configured"
else
  warning "Failed to configure Rust toolchain"
fi

section "AUR Package Installation"
info "Installing essential AUR packages for desktop experience..."

declare -a aur_packages=(
  "anyrun-git"
  "swww"
  "snap"
  "snapd"
  "neofetch"
  "rofi"
  "libcava"
  "clipse"
)

step "Installing AUR packages..."
for package in "${aur_packages[@]}"; do
  info "Installing: $package"
  if yay -S --needed --noconfirm "$package"; then
    success "Installed: $package"
  else
    warning "Failed to install: $package"
  fi
done

section "Service Configuration"
step "Enabling snapd service..."
if sudo systemctl enable snapd.socket; then
  success "Snapd service enabled"
else
  warning "Failed to enable snapd service"
fi

SNAP_STARTED=false
step "Starting snapd service..."
if sudo systemctl start snapd.socket; then
  success "Snapd service started successfully"
  SNAP_STARTED=true
else
  warning "Failed to start snapd service (not critical - can be started manually later)"
  SNAP_STARTED=false
fi

section "Neofetch Configuration"
step "Setting up neofetch..."
mkdir -p "$CONFIG_DIR/neofetch"

# Run neofetch once to generate initial config
if neofetch; then
  success "Neofetch initial configuration created"
else
  warning "Failed to run neofetch initially"
fi

# Apply custom Archion configuration
if grep -q "### ARCHION CONFIG ###" "$CONFIG_DIR/neofetch/config.conf" 2>/dev/null; then
  info "Neofetch already has Archion configuration"
else
  step "Applying Archion neofetch configuration..."
  if [[ -f "$SCRIPT_DIR/config/neofetch/partial-config.conf" ]]; then
    echo "" >> "$CONFIG_DIR/neofetch/config.conf"
    cat "$SCRIPT_DIR/config/neofetch/partial-config.conf" >> "$CONFIG_DIR/neofetch/config.conf"
    success "Neofetch configuration updated with Archion settings"
  else
    warning "Archion neofetch configuration file not found"
  fi
fi

section "Fish Shell Setup"
info "Installing and configuring Fish shell with Oh My Fish..."

step "Installing Oh My Fish framework..."
OMG_INSTALL_FILE="/tmp/omf-$(whoami)-install"
if wget -q https://raw.githubusercontent.com/oh-my-fish/oh-my-fish/master/bin/install -O "$OMG_INSTALL_FILE"; then
  chmod +x "$OMG_INSTALL_FILE"
  if fish -c "$OMG_INSTALL_FILE --noninteractive --yes"; then
    success "Oh My Fish installed successfully"
  else
    warning "Failed to install Oh My Fish"
  fi
  rm -f "$OMG_INSTALL_FILE"
else
  warning "Failed to download Oh My Fish installer"
fi

step "Installing Fish theme and plugins..."
if fish -c "omf install bobthefish"; then
  success "Bobthefish theme installed"
else
  warning "Failed to install bobthefish theme"
fi

if fish -c "omf theme bobthefish"; then
  success "Bobthefish theme activated"
else
  warning "Failed to activate bobthefish theme"
fi

step "Installing Node.js version manager for Fish..."
if fish -c "fisher install jorgebucaran/nvm.fish"; then
  success "NVM for Fish installed"
else
  warning "Failed to install NVM for Fish"
fi

step "Installing zoxide (smart directory navigation)..."
if curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh; then
  success "Zoxide installed successfully"
else
  warning "Failed to install zoxide"
fi

section "Neovim Configuration"
step "Setting up Neovim with NvChad..."
if [[ ! -d "$CONFIG_DIR/nvim" ]]; then
  if git clone https://github.com/LucasionGS/nvim-nvchad "$CONFIG_DIR/nvim"; then
    success "Neovim configuration cloned successfully"
    info "Neovim will be configured when first launched"
  else
    warning "Failed to clone Neovim configuration"
  fi
else
  info "Neovim configuration already exists, skipping clone"
fi

section "Development Tools"
step "Installing Visual Studio Code..."
info "Installing Microsoft's official version (visual-studio-code-bin)"
if yay -S --needed --noconfirm visual-studio-code-bin; then
  success "Visual Studio Code installed"
else
  warning "Failed to install Visual Studio Code"
fi

section "Desktop Environment Extensions"
info "Installing additional desktop environment tools..."

declare -a desktop_packages=(
  "pyprland"
  "wleave-git"
  "libastal-meta"
  "aylurs-gtk-shell"
)

for package in "${desktop_packages[@]}"; do
  step "Installing: $package"
  if yay -S --needed --noconfirm "$package"; then
    success "Installed: $package"
  else
    warning "Failed to install: $package"
  fi
done

section "Local Applications Setup"
step "Installing FSSH (Fish SSH Connection Manager)..."
if [[ "${ARCHION_DEV:-false}" == "true" ]]; then
  info "Development mode: Linking FSSH application directory..."
  ln -sf "$SCRIPT_DIR/apps/fssh" "$APP_DIR/fssh"
  success "FSSH linked (development mode)"
else
  info "Production mode: Copying FSSH application..."
  if [[ ! -d "$APP_DIR/fssh" ]]; then
    cp -r "$SCRIPT_DIR/apps/fssh" "$APP_DIR/fssh"
    success "FSSH installed"
  else
    info "FSSH already installed"
  fi
fi

section "Snap Package Installation"
if [[ $SNAP_STARTED == "true" ]]; then
  info "Installing snap packages..."
  
  step "Installing Beekeeper Studio..."
  if command -v beekeeper-studio &> /dev/null; then
    info "Beekeeper Studio is already installed"
  else
    if sudo snap install beekeeper-studio; then
      success "Beekeeper Studio installed"
    else
      warning "Failed to install Beekeeper Studio"
    fi
  fi

  step "Installing Snap Store..."
  if command -v snap-store &> /dev/null; then
    info "Snap Store is already installed"
  else
    if sudo snap install snap-store; then
      success "Snap Store installed"
    else
      warning "Failed to install Snap Store"
    fi
  fi
else
  warning "Snapd service is not running - skipping snap package installations"
  info "You can start snapd later with: sudo systemctl start snapd.socket"
fi

section "Web Browser Installation"
step "Installing Google Chrome..."
if command -v google-chrome-stable &> /dev/null; then
  info "Google Chrome is already installed"
else
  if yay -S --needed --noconfirm google-chrome; then
    success "Google Chrome installed"
  else
    warning "Failed to install Google Chrome"
  fi
fi

section "Additional Desktop Tools"
step "Installing Better Control (enhanced settings panel)..."
if yay -S --needed --noconfirm better-control-git; then
  success "Better Control installed"
else
  warning "Failed to install Better Control"
fi

step "Installing Hyprshot (screenshot tool)..."
if yay -S --needed --noconfirm hyprshot-git; then
  success "Hyprshot installed"
else
  warning "Failed to install Hyprshot"
fi

section "Runtime Installation"
step "Installing Deno runtime..."
if wget -q https://deno.land/install.sh -O /tmp/deno-install.sh; then
  if sh /tmp/deno-install.sh -y; then
    success "Deno runtime installed"
  else
    warning "Failed to install Deno runtime"
  fi
  rm -f /tmp/deno-install.sh
else
  warning "Failed to download Deno installer"
fi

section "Hyprland Plugin Management"
step "Setting up HyprPM and plugins..."
if hyprpm update; then
  success "HyprPM updated"
else
  warning "Failed to update HyprPM"
fi

step "Installing Hyprspace plugin..."
if hyprpm add https://github.com/KZDKM/Hyprspace; then
  if hyprpm enable Hyprspace; then
    success "Hyprspace plugin installed and enabled"
  else
    warning "Hyprspace plugin installed but failed to enable"
  fi
else
  warning "Failed to install Hyprspace plugin"
fi

step "Installing official Hyprland plugins..."
if hyprpm add https://github.com/hyprwm/hyprland-plugins; then
  success "Official Hyprland plugins installed"
else
  warning "Failed to install official Hyprland plugins"
fi

section "Rofi Customization"
step "Installing custom Rofi themes..."
info "Downloading and installing Rofi theme collection from adi1090x..."
if git clone --depth=1 https://github.com/adi1090x/rofi.git /tmp/rofi-custom; then
  cd /tmp/rofi-custom
  if chmod +x setup.sh && bash setup.sh; then
    success "Custom Rofi themes installed"
    
    # Set Type 3 launcher to use Style 2
    if [[ -f "$CONFIG_DIR/rofi/launchers/type-3/launcher.sh" ]]; then
      sed -i "s/theme=\'style-10'/theme='style-2'/" "$CONFIG_DIR/rofi/launchers/type-3/launcher.sh"
      success "Rofi launcher style configured"
    fi
  else
    warning "Failed to install Rofi themes"
  fi
  cd "$SCRIPT_DIR"
  rm -rf /tmp/rofi-custom
else
  warning "Failed to download Rofi theme collection"
fi

section "Final Application Setup"
step "Installing WebKit prerequisites..."
if yay -S --needed --noconfirm webkit2gtk-4.1; then
  success "WebKit prerequisites installed"
else
  warning "Failed to install WebKit prerequisites"
fi
step "Installing Archion Settings application..."
info "Building custom Hyprland settings application..."
if git clone https://github.com/LucasionGS/hypr-settings.git /tmp/archion-settings; then
  cd /tmp/archion-settings
  if chmod +x build.sh && bash build.sh; then
    success "Archion Settings application built and installed"
  else
    warning "Failed to build Archion Settings application"
  fi
  cd "$SCRIPT_DIR"
  rm -rf /tmp/archion-settings
else
  warning "Failed to download Archion Settings source"
fi

header "Environment Setup Complete!"
success "🎉 All packages have been installed successfully!"
success "🔧 Desktop environment has been configured!"
success "🚀 Development tools are ready to use!"

echo
info "Installation Summary:"
echo "  ✓ AUR packages installed"
echo "  ✓ Desktop environment configured"
echo "  ✓ Fish shell with Oh My Fish setup"
echo "  ✓ Neovim with NvChad configuration"
echo "  ✓ Visual Studio Code installed"
echo "  ✓ Hyprland plugins configured"
echo "  ✓ Custom applications installed"

echo
info "Next steps:"
echo "  1. Log out and log back in to apply shell changes"
echo "  2. Launch Hyprland to test the desktop environment"
echo "  3. Open Neovim to complete its initial setup"
echo "  4. Configure your monitors and displays as needed"

echo
if confirm "Would you like to view the installation log?" "N"; then
  if [[ -f /tmp/archion_install.log ]]; then
    less /tmp/archion_install.log
  else
    info "No installation log found"
  fi
fi

success "🏛️ Welcome to Archion! Your Arch Linux environment is ready! 🏛️"
