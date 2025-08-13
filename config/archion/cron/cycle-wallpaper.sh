#!/bin/bash
ARCHION_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/archion"
WALLPAPER_DIR="$ARCHION_DIR/.wallpapers_active"
SWWW_ARGS="--transition-type=wave --transition-duration=2 --transition-fps=60 --transition-step=255"

# Get info about the current wallpaper (only use the first one from multiple displays)
CURRENT_WALLPAPER=$(realpath $(swww query | grep -oP '(?<=image: ).*' | head -n 1))

# Get all wallpapers except the current one
ALL_WALLPAPERS=($(find "$WALLPAPER_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) | while read -r file; do
  if [ "$(realpath "$file")" != "$CURRENT_WALLPAPER" ]; then
    echo "$file"
  fi
done))

if [ ${#ALL_WALLPAPERS[@]} -eq 0 ]; then
  echo "No alternative wallpapers found in $WALLPAPER_DIR"
  exit 1
fi

# Shuffle the array and select the first one for true randomness
SHUFFLED_WALLPAPERS=($(printf '%s\n' "${ALL_WALLPAPERS[@]}" | shuf))
RANDOM_WALLPAPER=$(realpath "${SHUFFLED_WALLPAPERS[0]}")

# Set the wallpaper using swww
swww img $SWWW_ARGS "$RANDOM_WALLPAPER"
# Notify the user
# notify-send "Wallpaper Changed" "New wallpaper set: $(basename "$RANDOM_WALLPAPER")" -t 2000

# Cron job to run this script 1 minute
# $ crontab -e
# Add the following line to run the script every minute
# * * * * * hyprctl -i 0 dispatch exec "bash ~/.config/archion/cron/cycle-wallpaper.sh" >/dev/null