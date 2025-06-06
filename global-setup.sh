set -e
if [[ $EUID != 0 ]]; then
  echo "This script must be run as root. Please use sudo or switch to root user."
  exit 1
fi

pacman --noconfirm -Syu \
  hyprland hyprpaper waybar hypridle hyprlock wofi mako kitty \
  base-devel rustup openssh \
  pipewire wireplumber xdg-desktop-portal-hyprland
rustup default stable

# Fonts
pacman --noconfirm -S \
  ttf-jetbrains-mono ttf-roboto ttf-roboto-mono