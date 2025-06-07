pkill waybar
hyprctl reload

# Will fail if not executed in a Wayland/Hyprland session
waybar -c ~/.config/waybar/waybar.jsonc -s ~/.config/waybar/style.css & disown