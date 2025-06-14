# Ask for file path from Nautilus
FILE_PATHS=$(zenity --file-selection --multiple --title="Select a Wallpaper Image(s)" --file-filter="*.jpg *.jpeg *.png *.gif" --separator="|")

# Check if the user selected any files
if [ -z "$FILE_PATHS" ]; then
  exit 1
fi

# Convert the selected file paths into an array
IFS='|' read -r -a FILE_ARRAY <<< "$FILE_PATHS"
# Select the first file from the array
FILE_PATH="${FILE_ARRAY[0]}"

if [ -n "$FILE_PATH" ]; then
  # Set the wallpaper using swww
  swww img "$FILE_PATH"
fi