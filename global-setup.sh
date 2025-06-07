set -e
if [[ $EUID != 0 ]]; then
  echo "This script must be run as root. Please use sudo or switch to root user."
  exit 1
fi

pacman --noconfirm -Syu \
  hyprland hyprpaper waybar hypridle hyprlock wofi mako kitty \
  base-devel rustup openssh \
  pipewire wireplumber xdg-desktop-portal-hyprland \
  less yazi jq fd 7zip fzf \
  nautilus nautilus-image-converter nautilus-share zenity \
  htop \
  neovim code \
  fish fisher \
  cmake meson cpio pkg-config gcc \
  gjs go typescript esbuild gtk3 gtk-layer-shell json-glib

# Refresh the hyprland packages
hyprpm update

rustup default stable

# Fonts
pacman --noconfirm -S \
  ttf-hack ttf-jetbrains-mono ttf-roboto ttf-roboto-mono