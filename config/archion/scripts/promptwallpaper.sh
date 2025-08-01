#!/bin/bash
ARCHION_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/archion"

SWWW_ARGS="--transition-type=wave --transition-duration=2 --transition-fps=60 --transition-step=255"

clean_cache() {
  # Remove old wallpapers from the active directory
  rm -f $ARCHION_DIR/.wallpapers_active/*
}

mkdir -p "$HOME/Pictures/Wallpapers"
mkdir -p "$ARCHION_DIR/.wallpapers_active"

# Ask for file path
FILE_PATHS=$(zenity --file-selection --multiple --title="Select a Wallpaper Image(s)" --file-filter="*.jpg *.jpeg *.png *.gif" --separator="|" --filename="$HOME/Pictures/Wallpapers/" --width=800 --height=600)

# Check if the user selected any files
if [ -z "$FILE_PATHS" ]; then
  exit 1
fi

# Convert the selected file paths into an array
IFS='|' read -r -a FILE_ARRAY <<< "$FILE_PATHS"
# Select the first file from the array
FILE_PATH="${FILE_ARRAY[0]}"

# If multiple files were selected, copy them to the active wallpapers directory
if [ ${#FILE_ARRAY[@]} -gt 0 ]; then
  clean_cache
  for file in "${FILE_ARRAY[@]}"; do
    cp "$file" "$ARCHION_DIR/.wallpapers_active/"
  done
# else
#   # If only one file was selected, copy it to the active wallpapers directory
#   cp "$FILE_PATH" "$ARCHION_DIR/.wallpapers_active/"
fi

if [ -n "$FILE_PATH" ]; then
  # Set the wallpaper using swww
  swww img $SWWW_ARGS "$FILE_PATH"
fi