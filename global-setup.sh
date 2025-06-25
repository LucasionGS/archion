set -e
if [[ $EUID != 0 ]]; then
  echo "This script must be run as root. Please use sudo or switch to root user."
  exit 1
fi

pacman --noconfirm -Syu

pacman --noconfirm -Syu \
  sudo uwsm hyprland xorg-xwayland hyprpaper hyprpicker waybar hypridle hyprlock hyprutils hyprlang hyprgraphics wofi kitty xdotool \
  base-devel rustup openssh inetutils \
  pipewire wireplumber \
  xdg-desktop-portal-hyprland xdg-desktop-portal-wlr xdg-desktop-portal-gnome xdg-desktop-portal-gtk \
  wget less yazi jq fd 7zip fzf \
  nautilus nautilus-image-converter nautilus-share zenity thunar \
  htop btop \
  neovim \
  fish fisher \
  cmake meson cpio pkg-config gcc \
  gjs go typescript esbuild gtk3 gtk-layer-shell json-glib gvfs \
  vala valadoc wireplumber brightnessctl gobject-introspection \
  greetd greetd-gtkgreet polkit hyprpolkitagent \
  thunderbird gparted cava man-db cronie blueman \
  flatpak

# Enable services
systemctl enable --now cronie.service

# Upload custom configs
mkdir -p /etc/greetd
cp -r ./etc/greetd/* /etc/greetd/

# Create gtkgreet config directory
mkdir -p /etc/gtkgreet
cp -r ./etc/gtkgreet/* /etc/gtkgreet/ 2>/dev/null || true

# Create directory for greeter background images
mkdir -p /etc/gtkgreet/images
cp -r ./etc/gtkgreet/images/* /etc/gtkgreet/images/ 2>/dev/null || true


# Finalize greetd
systemctl enable --now polkit.service || true
systemctl enable greetd.service
systemctl set-default graphical.target

rustup default stable

# Fonts
pacman --noconfirm -S \
  ttf-hack ttf-jetbrains-mono ttf-roboto ttf-roboto-mono

# Audio compatibility
pacman --noconfirm -S \
  sof-firmware \
  alsa-firmware \
  alsa-utils \
  pipewire-pulse