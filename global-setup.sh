set -e
if [[ $EUID != 0 ]]; then
  echo "This script must be run as root. Please use sudo or switch to root user."
  exit 1
fi

pacman --noconfirm -Syu

pacman --noconfirm -Syu \
  sudo hyprland xorg-xwayland hyprpaper waybar hypridle hyprlock hyprutils hyprlang hyprgraphics wofi mako kitty \
  base-devel rustup openssh \
  pipewire wireplumber xdg-desktop-portal-hyprland \
  wget less yazi jq fd 7zip fzf \
  nautilus nautilus-image-converter nautilus-share zenity \
  htop \
  neovim code \
  fish fisher \
  cmake meson cpio pkg-config gcc \
  gjs go typescript esbuild gtk3 gtk-layer-shell json-glib gvfs \
  vala valadoc wireplumber brightnessctl gobject-introspection \
  greetd greetd-gtkgreet polkit \
  thunderbird flameshot clipse


# Upload custom configs
mkdir -p /etc/greetd
cp -r ./etc/greetd/* /etc/greetd/


# Finalize greetd
systemctl enable --now polkit.service || true
systemctl enable greetd.service
systemctl set-default graphical.target

rustup default stable

# Fonts
pacman --noconfirm -S \
  ttf-hack ttf-jetbrains-mono ttf-roboto ttf-roboto-mono
