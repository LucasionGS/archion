# Environment variables
set -gx EDITOR nvim

# bobthefish settings
set -g theme_display_docker_machine yes

# Path
set -gx PATH $HOME/.local/bin $PATH
set -gx PATH /var/lib/snapd/snap/bin $PATH


if status is-interactive
    # Commands to run in interactive sessions can go here
    set fish_greeting
end
# FSSH - Fish SSH Connection Manager
source ~/.apps/fssh/fssh.fish
