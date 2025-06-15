#!/bin/bash
ARCHION_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/archion"
WALLPAPER_DIR="$ARCHION_DIR/.wallpapers_active"

# Get info about the current wallpaper
CURRENT_WALLPAPER=$(realpath $(swww query | grep -oP '(?<=image: ).*'))

# Get all wallpapers except the current one
ALL_WALLPAPERS=($(find "$WALLPAPER_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) | while read -r file; do
  if [ "$(realpath "$file")" != "$CURRENT_WALLPAPER" ]; then
    echo "$file"
  fi
done | shuf))

if [ ${#ALL_WALLPAPERS[@]} -eq 0 ]; then
  echo "No alternative wallpapers found in $WALLPAPER_DIR"
  exit 1
fi

# Select a random wallpaper (guaranteed to be different from current)
RANDOM_WALLPAPER=$(realpath "${ALL_WALLPAPERS[0]}")

# Set the wallpaper using swww
swww img "$RANDOM_WALLPAPER"
# Notify the user
# notify-send "Wallpaper Changed" "New wallpaper set: $(basename "$RANDOM_WALLPAPER")" -t 2000

# Cron job to run this script 1 minute
# $ crontab -e
# Add the following line to run the script every minute
# * * * * * bash ~/.config/archion/cron/cycle-wallpaper.sh >/dev/null 2>&1