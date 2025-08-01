#!/bin/bash
set -e

# Get script directory and source utilities
SCRIPT_DIR=$(dirname "$(realpath "$0")")
cd "$SCRIPT_DIR" || { echo "Failed to change directory to $SCRIPT_DIR"; exit 1; }

# Source utility functions
source "$SCRIPT_DIR/utils.sh" || { echo "utils.sh not found. Run from the script directory."; exit 1; }

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