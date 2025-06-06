# Ask for file path from Nautilus
FILE_PATH=$(zenity --file-selection --title="Select a Wallpaper Image")

if [ -n "$FILE_PATH" ]; then
  # Set the wallpaper using swww
  swww img "$FILE_PATH"
# else
#   zenity --error --text="No file selected. Please select a valid image file."
fi