# FSSH - Fish SSH Connection Manager

A comprehensive SSH connection management tool for Fish shell that simplifies handling SSH connections, managing saved connections, and SSH key operations.

## Features

- **Connection Management**: Add, edit, remove, list, and connect to saved SSH connections
- **SSH Key Management**: Generate RSA/Ed25519/ECDSA key pairs and list existing keys
- **Connection Testing**: Test connectivity before connecting
- **Search & Organization**: Search connections by name, host, username, or description
- **Import/Export**: Backup and restore connection configurations
- **Tab Completion**: Full Fish shell tab completion support

## Installation

1. Source the script in your Fish configuration:
   ```fish
   echo "source /home/ion/archion/apps/fssh/fssh.fish" >> ~/.config/fish/config.fish
   ```

2. Reload your Fish configuration:
   ```fish
   source ~/.config/fish/config.fish
   ```

## Quick Start

```fish
# Add a new connection
fssh add myserver

# List all connections
fssh list

# Connect to a saved connection
fssh connect myserver

# Generate SSH key pair
fssh keygen -t rsa -b 4096

# Test a connection
fssh test myserver
```

## Commands

### Connection Management
- `fssh add <name>` - Add a new SSH connection interactively
- `fssh connect <name>` - Connect to a saved connection
- `fssh list` - List all saved connections in a table format
- `fssh show <name>` - Show detailed information about a connection
- `fssh edit <name>` - Edit an existing connection
- `fssh remove <name>` - Remove a connection (with confirmation)
- `fssh copy <src> <dest>` - Copy a connection to a new name

### SSH Key Management
- `fssh keygen [options]` - Generate SSH key pairs
  - `-t, --type <type>` - Key type (rsa, ed25519, ecdsa)
  - `-b, --bits <bits>` - Key bits for RSA (1024, 2048, 4096)
  - `-f, --file <file>` - Output file path
  - `-C, --comment <comment>` - Key comment
- `fssh keylist` - List all SSH keys in ~/.ssh/

### Utilities
- `fssh test <name>` - Test connection without connecting
- `fssh search <pattern>` - Search connections by name, host, username, or description
- `fssh export [file]` - Export connections to JSON file
- `fssh import <file>` - Import connections from JSON file
- `fssh help` - Show help information

## Configuration

Connections are stored in `~/.config/fssh/connections.json` in JSON format. Each connection contains:

```json
{
  "connection_name": {
    "host": "example.com",
    "username": "user",
    "port": 22,
    "keypath": "/path/to/private/key",
    "description": "My server description",
    "created": "2025-06-10T00:53:52+02:00"
  }
}
```

## Examples

### Adding a Connection
```fish
fssh add production
# Follow the interactive prompts:
# Host/IP: prod.example.com
# Username: admin
# Port (22): 2222
# SSH Key path (optional): ~/.ssh/id_rsa
# Description (optional): Production server
```

### Connecting with Key Authentication
```fish
# The script automatically uses the specified key path
fssh connect production
```

### Generating SSH Keys
```fish
# Generate 4096-bit RSA key
fssh keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_production

# Generate Ed25519 key (more secure, faster)
fssh keygen -t ed25519 -f ~/.ssh/id_ed25519_production
```

### Searching Connections
```fish
# Search by any field
fssh search prod        # Finds connections with "prod" in name, host, etc.
fssh search example.com # Finds connections to example.com
```

### Backup and Restore
```fish
# Export all connections
fssh export backup_20250610.json

# Import connections from backup
fssh import backup_20250610.json
```

## Tab Completion

The script provides comprehensive tab completion:
- Command completion for all fssh commands
- Connection name completion for relevant commands
- Automatic completion of saved connection names

## Dependencies

- `jq` - For JSON processing
- `ssh` and `ssh-keygen` - Standard SSH tools
- Fish shell 3.0+ recommended

## File Structure

```
~/.config/fssh/
└── connections.json    # Saved connections database
```

## Security Notes

- SSH private keys are referenced by path only, not stored in the configuration
- Connection passwords are never stored - use SSH keys for authentication
- The connections file contains connection metadata only
- Use proper file permissions on your SSH keys (600 for private keys)

## Troubleshooting

### jq not found
Install jq package:
```fish
# On Arch Linux
sudo pacman -S jq

# On Ubuntu/Debian
sudo apt install jq
```

### Connection test fails
- Check if the host is reachable: `ping <hostname>`
- Verify SSH service is running on the target port
- Check firewall settings
- Ensure SSH key permissions are correct (600 for private keys)

### Tab completion not working
Ensure the script is properly sourced in your Fish configuration and restart your shell.
