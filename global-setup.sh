#!/bin/bash
set -e

# Source utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh" || { echo "utils.sh not found. Run from the script directory."; exit 1; }

# Show banner
show_banner "Global System Setup" "2.0"

# Root check with better formatting
if [[ $EUID != 0 ]]; then
  error "This script must be run as root. Please use sudo or switch to root user."
fi

# Change to script directory
cd "$SCRIPT_DIR" || error "Failed to change directory to $SCRIPT_DIR"

info "Starting global system setup..."
info "This script will install and configure essential system packages and services."
echo

if ! confirm "Do you want to proceed with the global system setup?"; then
  warning "Setup cancelled by user."
  exit 0
fi

section "System Update"
step "Updating package databases and system..."
execute_with_progress "pacman --noconfirm -Syu" "System update"

section "Essential Packages Installation"
info "Installing core desktop environment and development tools..."

# Core packages grouped by category
step "Installing Hyprland and window manager components..."
install_packages "pacman" sudo uwsm hyprland xorg-xwayland hyprpaper hyprpicker waybar hypridle hyprlock hyprutils hyprlang hyprgraphics wofi kitty xdotool

step "Installing development tools..."
install_packages "pacman" base-devel rustup openssh inetutils cmake meson cpio pkg-config gcc

step "Installing audio system..."
install_packages "pacman" pipewire wireplumber

step "Installing desktop portals..."
install_packages "pacman" xdg-desktop-portal-hyprland xdg-desktop-portal-wlr xdg-desktop-portal-gnome xdg-desktop-portal-gtk

step "Installing file management and utilities..."
# install_packages "pacman" wget less yazi jq fd 7zip fzf nautilus nautilus-image-converter nautilus-share zenity thunar nemo nemo-fileroller nemo-share nemo-terminal
install_packages "pacman" wget less yazi jq fd 7zip fzf zenity nemo nemo-fileroller nemo-share nemo-terminal

step "Installing system monitoring tools..."
install_packages "pacman" btop

step "Installing text editors..."
install_packages "pacman" neovim

step "Installing shell and development environment..."
install_packages "pacman" fish fisher

step "Installing language support and libraries..."
install_packages "pacman" gjs go typescript esbuild gtk3 gtk-layer-shell json-glib gvfs vala valadoc wireplumber brightnessctl gobject-introspection

step "Installing authentication and desktop services..."
install_packages "pacman" greetd greetd-gtkgreet polkit hyprpolkitagent

step "Installing applications..."
install_packages "pacman" thunderbird gparted cava man-db cronie blueman flatpak vlc

section "Service Configuration"
info "Enabling and configuring system services..."

step "Enabling cron service..."
manage_service "enable" "cronie.service"

section "System Configuration"
info "Installing custom configurations and settings..."

step "Setting up greetd configuration..."
mkdir -p /etc/greetd
if cp -r ./etc/greetd/* /etc/greetd/ 2>/dev/null; then
  success "Greetd configuration installed"
else
  warning "Some greetd files may not have been copied"
fi

step "Setting up gtkgreet configuration..."
mkdir -p /etc/gtkgreet
if cp -r ./etc/gtkgreet/* /etc/gtkgreet/ 2>/dev/null; then
  success "Gtkgreet configuration installed"
else
  info "No gtkgreet configuration files found (this is normal)"
fi

step "Setting up greeter background images..."
mkdir -p /etc/gtkgreet/images
if cp -r ./etc/gtkgreet/images/* /etc/gtkgreet/images/ 2>/dev/null; then
  success "Greeter images installed"
else
  info "No greeter images found (this is normal)"
fi

step "Installing polkit rules..."
mkdir -p /etc/polkit-1/rules.d
if cp -r ./etc/polkit-1/rules.d/* /etc/polkit-1/rules.d/ 2>/dev/null; then
  success "Polkit rules installed"
else
  info "No custom polkit rules found (this is normal)"
fi

step "Finalizing display manager setup..."
manage_service "enable" "polkit.service"
manage_service "enable" "greetd.service"

if systemctl set-default graphical.target >/dev/null 2>&1; then
  success "Set default target to graphical"
else
  warning "Failed to set graphical target as default"
fi

section "Development Environment Setup"
step "Configuring Rust toolchain..."
if rustup default stable >/dev/null 2>&1; then
  success "Rust toolchain configured (stable channel)"
else
  warning "Failed to configure Rust toolchain"
fi

section "Font Installation"
info "Installing essential fonts for better desktop experience..."
step "Installing programming and system fonts..."
install_packages "pacman" ttf-hack ttf-jetbrains-mono ttf-roboto ttf-roboto-mono ttf-dejavu ttf-dejavu-nerd ttf-liberation ttf-liberation-mono-nerd ttf-opensans noto-fonts

section "Audio System Enhancement"
info "Installing additional audio drivers and compatibility layers..."
step "Installing audio firmware and utilities..."
install_packages "pacman" sof-firmware alsa-firmware alsa-utils pipewire-pulse

header "Global Setup Complete!"
success "All packages have been installed successfully!"
success "All services have been configured!"
success "System is ready for user environment setup!"

echo
info "Next steps:"
echo "  1. Run the environment setup script as a regular user"
echo "  2. Install your graphics drivers if needed, with \"sudo archion-graphics\""
echo "  3. Reboot your system to apply all changes and start using your new setup!"
echo

if confirm "Would you like to reboot now to apply all changes?" "N"; then
  info "Rebooting system in 5 seconds..."
  sleep 5
  reboot
else
  warning "Please remember to reboot before proceeding with user setup!"
fi