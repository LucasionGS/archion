#!/usr/bin/env fish

# FSSH Installation Script
# This script sets up FSSH for Fish shell

set FSSH_DIR (realpath (dirname (status --current-filename)))
if string match -q "$HOME/*" $FSSH_DIR
  set FSSH_DIR (string replace "$HOME" "~" $FSSH_DIR)
end
set FSSH_SCRIPT "$FSSH_DIR/fssh.fish"
set FISH_CONFIG "$HOME/.config/fish/config.fish"

echo "FSSH Installation Script"
echo "========================"
echo ""

# Check if Fish config directory exists
if not test -d (dirname $FISH_CONFIG)
    echo "Creating Fish config directory..."
    mkdir -p (dirname $FISH_CONFIG)
end

# Check if Fish config file exists
if not test -f $FISH_CONFIG
    echo "Creating Fish config file..."
    touch $FISH_CONFIG
end

# Check if jq is installed
if not command -v jq >/dev/null
    echo "⚠️  Warning: 'jq' is not installed."
    echo "   FSSH requires jq for JSON processing."
    echo "   Please install it with your package manager:"
    echo "   • Arch Linux: sudo pacman -S jq"
    echo "   • Ubuntu/Debian: sudo apt install jq"
    echo "   • macOS: brew install jq"
    echo ""
end

# Check if already installed
if grep -q "source.*fssh.fish" $FISH_CONFIG
    echo "✓ FSSH is already installed in your Fish configuration."
    read -P "Do you want to reinstall/update? [y/N]: " confirm
    if test "$confirm" != "y" -a "$confirm" != "Y"
        echo "Installation cancelled."
        exit 0
    end
    
    # Remove existing entries
    sed -i '/source.*fssh\.fish/d' $FISH_CONFIG
end

# Add FSSH to Fish configuration
echo "Adding FSSH to Fish configuration..."
echo "" >> $FISH_CONFIG
echo "# FSSH - Fish SSH Connection Manager" >> $FISH_CONFIG
echo "source $FSSH_SCRIPT" >> $FISH_CONFIG

echo ""
echo "✓ FSSH has been installed successfully!"
echo ""
echo "To start using FSSH:"
echo "1. Restart your Fish shell or run: source ~/.config/fish/config.fish"
echo "2. Type 'fssh help' to see available commands"
echo "3. Start with 'fssh add <connection_name>' to add your first connection"
echo ""
echo "Example usage:"
echo "  fssh add myserver    # Add a new connection"
echo "  fssh list           # List all connections"
echo "  fssh connect myserver # Connect to saved connection"
echo ""
echo "For detailed documentation, see: $FSSH_DIR/README.md"
