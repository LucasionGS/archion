#!/usr/bin/env fish

# FSSH - Fish SSH Connection Manager
# A comprehensive SSH connection management tool

set -g FSSH_CONFIG_DIR "$HOME/.config/fssh"
set -g FSSH_CONNECTIONS_FILE "$FSSH_CONFIG_DIR/connections.json"
set -g FSSH_VERSION "1.0.0"

# Ensure config directory exists
mkdir -p $FSSH_CONFIG_DIR

# Initialize connections file if it doesn't exist
if not test -f $FSSH_CONNECTIONS_FILE
    echo '{}' > $FSSH_CONNECTIONS_FILE
end

function fssh_help
    echo "FSSH - Fish SSH Connection Manager v$FSSH_VERSION"
    echo ""
    echo "Usage: fssh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  connect, c <name>           Connect to a saved connection"
    echo "  add, a <name>               Add a new SSH connection"
    echo "  list, ls                    List all saved connections"
    echo "  edit, e <name>              Edit an existing connection"
    echo "  remove, rm <name>           Remove a connection"
    echo "  show, s <name>              Show connection details"
    echo "  copy, cp <src> <dest>       Copy a connection"
    echo "  keygen, k [options]         Generate RSA key pair"
    echo "  keylist, kl                 List SSH keys"
    echo "  test, t <name>              Test connection"
    echo "  import, i <file>            Import connections from file"
    echo "  export, x [file]            Export connections to file"
    echo "  search, find <pattern>      Search connections"
    echo "  help, h                     Show this help"
    echo ""
    echo "Examples:"
    echo "  fssh add myserver"
    echo "  fssh connect myserver"
    echo "  fssh list"
    echo "  fssh keygen -b 4096"
    echo "  fssh test myserver"
end

function fssh_add_connection
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    # Check if connection already exists
    if fssh_connection_exists $name
        echo "Error: Connection '$name' already exists. Use 'fssh edit $name' to modify it."
        return 1
    end

    echo "Adding new SSH connection: $name"
    echo ""
    
    read -P "Host/IP: " host
    if test -z "$host"
        echo "Error: Host is required"
        return 1
    end

    read -P "Username: " username
    if test -z "$username"
        set username (whoami)
    end

    read -P "Port (22): " port
    if test -z "$port"
        set port 22
    end

    read -P "SSH Key path (optional): " keypath
    read -P "Description (optional): " description

    # Save connection
    set connection_data (printf '{"host":"%s","username":"%s","port":%d,"keypath":"%s","description":"%s","created":"%s"}' \
        $host $username $port $keypath $description (date -Iseconds))
    
    # Add to connections file
    set temp_file (mktemp)
    jq --arg name "$name" --argjson data "$connection_data" '. + {($name): $data}' $FSSH_CONNECTIONS_FILE > $temp_file
    mv $temp_file $FSSH_CONNECTIONS_FILE

    echo "Connection '$name' added successfully!"
end

function fssh_connect
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    if not fssh_connection_exists $name
        echo "Error: Connection '$name' not found"
        return 1
    end

    # Get connection details
    set connection (jq -r --arg name "$name" '.[$name]' $FSSH_CONNECTIONS_FILE)
    set host (echo $connection | jq -r '.host')
    set username (echo $connection | jq -r '.username')
    set port (echo $connection | jq -r '.port')
    set keypath (echo $connection | jq -r '.keypath')

    # Build SSH command
    set ssh_cmd "ssh"
    
    if test "$keypath" != "null" -a -n "$keypath"
        set ssh_cmd $ssh_cmd "-i" $keypath
    end
    
    set ssh_cmd $ssh_cmd "-p" $port "$username@$host"

    echo "Connecting to $name ($username@$host:$port)..."
    eval $ssh_cmd
end

function fssh_list_connections
    if not test -f $FSSH_CONNECTIONS_FILE
        echo "No connections found."
        return
    end

    set connections (jq -r 'keys[]' $FSSH_CONNECTIONS_FILE 2>/dev/null)
    if test -z "$connections"
        echo "No connections found."
        return
    end

    echo "Saved SSH Connections:"
    echo "====================="
    printf "%-15s %-20s %-15s %-6s %s\n" "NAME" "HOST" "USERNAME" "PORT" "DESCRIPTION"
    echo "-------------------------------------------------------------------------------"
    
    for name in $connections
        set connection (jq -r --arg name "$name" '.[$name]' $FSSH_CONNECTIONS_FILE)
        set host (echo $connection | jq -r '.host')
        set username (echo $connection | jq -r '.username')
        set port (echo $connection | jq -r '.port')
        set description (echo $connection | jq -r '.description // ""')
        
        printf "%-15s %-20s %-15s %-6s %s\n" $name $host $username $port $description
    end
end

function fssh_show_connection
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    if not fssh_connection_exists $name
        echo "Error: Connection '$name' not found"
        return 1
    end

    set connection (jq -r --arg name "$name" '.[$name]' $FSSH_CONNECTIONS_FILE)
    echo "Connection Details: $name"
    echo "====================="
    echo "Host:        "(echo $connection | jq -r '.host')
    echo "Username:    "(echo $connection | jq -r '.username')
    echo "Port:        "(echo $connection | jq -r '.port')
    echo "Key Path:    "(echo $connection | jq -r '.keypath // "None"')
    echo "Description: "(echo $connection | jq -r '.description // "None"')
    echo "Created:     "(echo $connection | jq -r '.created // "Unknown"')
end

function fssh_edit_connection
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    if not fssh_connection_exists $name
        echo "Error: Connection '$name' not found"
        return 1
    end

    # Get current connection details
    set connection (jq -r --arg name "$name" '.[$name]' $FSSH_CONNECTIONS_FILE)
    set current_host (echo $connection | jq -r '.host')
    set current_username (echo $connection | jq -r '.username')
    set current_port (echo $connection | jq -r '.port')
    set current_keypath (echo $connection | jq -r '.keypath // ""')
    set current_description (echo $connection | jq -r '.description // ""')

    echo "Editing connection: $name"
    echo "Current values shown in brackets. Press Enter to keep current value."
    echo ""

    read -P "Host/IP [$current_host]: " host
    if test -z "$host"
        set host $current_host
    end

    read -P "Username [$current_username]: " username
    if test -z "$username"
        set username $current_username
    end

    read -P "Port [$current_port]: " port
    if test -z "$port"
        set port $current_port
    end

    read -P "SSH Key path [$current_keypath]: " keypath
    if test -z "$keypath"
        set keypath $current_keypath
    end

    read -P "Description [$current_description]: " description
    if test -z "$description"
        set description $current_description
    end

    # Update connection
    set connection_data (printf '{"host":"%s","username":"%s","port":%s,"keypath":"%s","description":"%s","created":"%s","modified":"%s"}' \
        $host $username $port $keypath $description (echo $connection | jq -r '.created // ""') (date -Iseconds))
    
    set temp_file (mktemp)
    jq --arg name "$name" --argjson data "$connection_data" '.[$name] = $data' $FSSH_CONNECTIONS_FILE > $temp_file
    mv $temp_file $FSSH_CONNECTIONS_FILE

    echo "Connection '$name' updated successfully!"
end

function fssh_remove_connection
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    if not fssh_connection_exists $name
        echo "Error: Connection '$name' not found"
        return 1
    end

    read -P "Are you sure you want to remove connection '$name'? [y/N]: " confirm
    if test "$confirm" = "y" -o "$confirm" = "Y"
        set temp_file (mktemp)
        jq --arg name "$name" 'del(.[$name])' $FSSH_CONNECTIONS_FILE > $temp_file
        mv $temp_file $FSSH_CONNECTIONS_FILE
        echo "Connection '$name' removed successfully!"
    else
        echo "Operation cancelled."
    end
end

function fssh_copy_connection
    set src $argv[1]
    set dest $argv[2]
    
    if test -z "$src" -o -z "$dest"
        echo "Error: Source and destination names are required"
        return 1
    end

    if not fssh_connection_exists $src
        echo "Error: Source connection '$src' not found"
        return 1
    end

    if fssh_connection_exists $dest
        echo "Error: Destination connection '$dest' already exists"
        return 1
    end

    # Copy connection
    set connection (jq -r --arg name "$src" '.[$name]' $FSSH_CONNECTIONS_FILE)
    set temp_file (mktemp)
    jq --arg src "$src" --arg dest "$dest" --argjson data "$connection" '. + {($dest): ($data | .created = now | strftime("%Y-%m-%dT%H:%M:%S%z"))}' $FSSH_CONNECTIONS_FILE > $temp_file
    mv $temp_file $FSSH_CONNECTIONS_FILE

    echo "Connection '$src' copied to '$dest' successfully!"
end

function fssh_generate_key
    set -l key_type "rsa"
    set -l key_bits "2048"
    set -l key_file ""
    set -l key_comment ""

    # Parse arguments
    set -l i 1
    while test $i -le (count $argv)
        switch $argv[$i]
            case -t --type
                set i (math $i + 1)
                if test $i -le (count $argv)
                    set key_type $argv[$i]
                end
            case -b --bits
                set i (math $i + 1)
                if test $i -le (count $argv)
                    set key_bits $argv[$i]
                end
            case -f --file
                set i (math $i + 1)
                if test $i -le (count $argv)
                    set key_file $argv[$i]
                end
            case -C --comment
                set i (math $i + 1)
                if test $i -le (count $argv)
                    set key_comment $argv[$i]
                end
            case -h --help
                echo "Usage: fssh keygen [options]"
                echo "Options:"
                echo "  -t, --type <type>       Key type (rsa, ed25519, ecdsa) [default: rsa]"
                echo "  -b, --bits <bits>       Key bits for RSA (1024, 2048, 4096) [default: 2048]"
                echo "  -f, --file <file>       Output file path [default: ~/.ssh/id_<type>]"
                echo "  -C, --comment <comment> Key comment [default: user@hostname]"
                echo "  -h, --help              Show this help"
                return 0
        end
        set i (math $i + 1)
    end

    if test -z "$key_file"
        set key_file "$HOME/.ssh/id_$key_type"
    end

    if test -z "$key_comment"
        set key_comment (whoami)"@"(hostname)
    end

    echo "Generating $key_type SSH key pair..."
    echo "Key type: $key_type"
    if test "$key_type" = "rsa"
        echo "Key bits: $key_bits"
    end
    echo "Output file: $key_file"
    echo "Comment: $key_comment"
    echo ""

    # Build ssh-keygen command
    set keygen_cmd "ssh-keygen" "-t" $key_type
    
    if test "$key_type" = "rsa"
        set keygen_cmd $keygen_cmd "-b" $key_bits
    end
    
    set keygen_cmd $keygen_cmd "-f" "$key_file" "-C" "$key_comment"

    eval $keygen_cmd
    
    if test $status -eq 0
        echo ""
        echo "SSH key pair generated successfully!"
        echo "Private key: $key_file"
        echo "Public key:  $key_file.pub"
        echo ""
        echo "To add this key to an SSH agent:"
        echo "ssh-add $key_file"
        echo ""
        echo "To copy the public key to a server:"
        echo "ssh-copy-id -i $key_file.pub user@hostname"
    end
end

function fssh_list_keys
    echo "SSH Keys in ~/.ssh/:"
    echo "==================="
    
    set key_files (find ~/.ssh -name "*.pub" 2>/dev/null)
    if test -z "$key_files"
        echo "No SSH public keys found."
        return
    end

    for key_file in $key_files
        set key_info (ssh-keygen -lf $key_file 2>/dev/null)
        if test $status -eq 0
            echo "File: "(basename $key_file)
            echo "Info: $key_info"
            echo "Path: $key_file"
            echo ""
        end
    end
end

function fssh_test_connection
    set name $argv[1]
    if test -z "$name"
        echo "Error: Connection name is required"
        return 1
    end

    if not fssh_connection_exists $name
        echo "Error: Connection '$name' not found"
        return 1
    end

    # Get connection details
    set connection (jq -r --arg name "$name" '.[$name]' $FSSH_CONNECTIONS_FILE)
    set host (echo $connection | jq -r '.host')
    set username (echo $connection | jq -r '.username')
    set port (echo $connection | jq -r '.port')
    set keypath (echo $connection | jq -r '.keypath')

    echo "Testing connection to $name ($username@$host:$port)..."

    # Build SSH command for testing
    set ssh_cmd "ssh" "-o" "ConnectTimeout=10" "-o" "BatchMode=yes"
    
    if test "$keypath" != "null" -a -n "$keypath"
        set ssh_cmd $ssh_cmd "-i" $keypath
    end
    
    set ssh_cmd $ssh_cmd "-p" $port "$username@$host" "echo 'Connection successful'"

    if eval $ssh_cmd >/dev/null 2>&1
        echo "✓ Connection test successful!"
    else
        echo "✗ Connection test failed!"
        return 1
    end
end

function fssh_search_connections
    set pattern $argv[1]
    if test -z "$pattern"
        echo "Error: Search pattern is required"
        return 1
    end

    set connections (jq -r --arg pattern "$pattern" 'to_entries[] | select(.key | contains($pattern) or .value.host | contains($pattern) or .value.username | contains($pattern) or .value.description | contains($pattern)) | .key' $FSSH_CONNECTIONS_FILE 2>/dev/null)
    
    if test -z "$connections"
        echo "No connections found matching pattern: $pattern"
        return
    end

    echo "Connections matching '$pattern':"
    echo "==============================="
    for name in $connections
        fssh_show_connection $name
        echo ""
    end
end

function fssh_export_connections
    set output_file $argv[1]
    if test -z "$output_file"
        set output_file "fssh_connections_"(date +%Y%m%d_%H%M%S)".json"
    end

    cp $FSSH_CONNECTIONS_FILE $output_file
    echo "Connections exported to: $output_file"
end

function fssh_import_connections
    set input_file $argv[1]
    if test -z "$input_file"
        echo "Error: Input file is required"
        return 1
    end

    if not test -f "$input_file"
        echo "Error: File '$input_file' not found"
        return 1
    end

    # Validate JSON
    if not jq empty $input_file >/dev/null 2>&1
        echo "Error: Invalid JSON file"
        return 1
    end

    read -P "This will merge connections from '$input_file'. Continue? [y/N]: " confirm
    if test "$confirm" = "y" -o "$confirm" = "Y"
        set temp_file (mktemp)
        jq -s '.[0] * .[1]' $FSSH_CONNECTIONS_FILE $input_file > $temp_file
        mv $temp_file $FSSH_CONNECTIONS_FILE
        echo "Connections imported successfully!"
    else
        echo "Import cancelled."
    end
end

function fssh_connection_exists
    set name $argv[1]
    jq -e --arg name "$name" 'has($name)' $FSSH_CONNECTIONS_FILE >/dev/null 2>&1
end

# Main function
function fssh
    if test (count $argv) -eq 0
        fssh_help
        return
    end

    switch $argv[1]
        case connect c
            fssh_connect $argv[2..-1]
        case add a
            fssh_add_connection $argv[2..-1]
        case list ls
            fssh_list_connections
        case edit e
            fssh_edit_connection $argv[2..-1]
        case remove rm delete del
            fssh_remove_connection $argv[2..-1]
        case show s
            fssh_show_connection $argv[2..-1]
        case copy cp
            fssh_copy_connection $argv[2..-1]
        case keygen k
            fssh_generate_key $argv[2..-1]
        case keylist kl keys
            fssh_list_keys
        case test t
            fssh_test_connection $argv[2..-1]
        case search find
            fssh_search_connections $argv[2..-1]
        case export x
            fssh_export_connections $argv[2..-1]
        case import i
            fssh_import_connections $argv[2..-1]
        case help h --help -h
            fssh_help
        case '*'
            echo "Unknown command: $argv[1]"
            echo "Run 'fssh help' for usage information."
            return 1
    end
end

# Tab completion for fssh
complete -c fssh -n '__fish_use_subcommand' -a 'connect add list edit remove show copy keygen keylist test search export import help'
complete -c fssh -n '__fish_use_subcommand' -a 'c a ls e rm s cp k kl t find x i h'

# Connection name completion for relevant commands
complete -c fssh -n '__fish_seen_subcommand_from connect c edit e remove rm delete del show s test t' -a '(jq -r "keys[]" ~/.config/fssh/connections.json 2>/dev/null)'

echo "FSSH loaded! Type 'fssh help' for usage information."