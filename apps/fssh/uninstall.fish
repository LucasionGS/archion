#!/usr/bin/env fish

# FSSH Uninstall Script

set FISH_CONFIG "$HOME/.config/fish/config.fish"
set FSSH_CONFIG_DIR "$HOME/.config/fssh"

echo "FSSH Uninstall Script"
echo "====================="
echo ""

# Check if FSSH is installed
if not test -f $FISH_CONFIG
    echo "Fish configuration file not found. FSSH may not be installed."
    exit 1
end

if not grep -q "source.*fssh.fish" $FISH_CONFIG
    echo "FSSH does not appear to be installed in your Fish configuration."
    exit 1
end

echo "This will remove FSSH from your Fish configuration."
read -P "Do you want to continue? [y/N]: " confirm

if test "$confirm" != "y" -a "$confirm" != "Y"
    echo "Uninstall cancelled."
    exit 0
end

# Remove FSSH from Fish configuration
echo "Removing FSSH from Fish configuration..."
sed -i '/# FSSH - Fish SSH Connection Manager/d' $FISH_CONFIG
sed -i '/source.*fssh\.fish/d' $FISH_CONFIG

# Ask about configuration data
if test -d $FSSH_CONFIG_DIR
    echo ""
    echo "FSSH configuration directory found: $FSSH_CONFIG_DIR"
    echo "This contains your saved SSH connections."
    read -P "Do you want to remove the configuration data? [y/N]: " remove_config
    
    if test "$remove_config" = "y" -o "$remove_config" = "Y"
        rm -rf $FSSH_CONFIG_DIR
        echo "✓ Configuration data removed."
    else
        echo "✓ Configuration data preserved in $FSSH_CONFIG_DIR"
    end
end

echo ""
echo "✓ FSSH has been uninstalled successfully!"
echo ""
echo "To complete the removal:"
echo "1. Restart your Fish shell or run: source ~/.config/fish/config.fish"
echo "2. The 'fssh' command will no longer be available"
echo ""
if test -d $FSSH_CONFIG_DIR
    echo "Note: Your connection data is still preserved in $FSSH_CONFIG_DIR"
    echo "      You can reinstall FSSH later without losing your connections."
end
