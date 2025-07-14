#!/bin/bash
# Archion Utility Functions
# Enhanced bash utilities for better user experience

# Enable strict mode for better error detection
set -euo pipefail

# ========== Color Definitions ==========
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly NC='\033[0m' # No Color

# ========== Icons and Symbols ==========
readonly CHECKMARK="✓"
readonly CROSS="✗"
readonly ARROW="➤"
readonly INFO="ℹ"
readonly WARNING="⚠"
readonly ROCKET="🚀"
readonly GEAR="⚙"
readonly PACKAGE="📦"

# ========== Core Utility Functions ==========

# Print colored output with optional prefix
print_color() {
  local color="$1"
  local message="$2"
  local prefix="$3"
  
  if [[ -n "$prefix" ]]; then
    echo -e "${color}${prefix}${NC} ${message}"
  else
    echo -e "${color}${message}${NC}"
  fi
}

# Success message
success() {
  print_color "$GREEN" "$1" "$CHECKMARK"
}

# Error message and exit
error() {
  print_color "$RED" "$1" "$CROSS" >&2
  exit 1
}

# Warning message
warning() {
  print_color "$YELLOW" "$1" "$WARNING"
}

# Info message
info() {
  print_color "$CYAN" "$1" "$INFO"
}

# Step message (for showing progress)
step() {
  print_color "$BLUE" "$1" "$ARROW"
}

# Header with decorative border
header() {
  local title="$1"
  local width=60
  local padding=$(( (width - ${#title} - 4) / 2 ))
  local border=$(printf '=%.0s' $(seq 1 $width))
  
  echo
  echo -e "${BLUE}${border}${NC}"
  printf "${BLUE}|${NC}%*s${BOLD}%s${NC}%*s${BLUE}|${NC}\n" $padding "" "$title" $padding ""
  echo -e "${BLUE}${border}${NC}"
  echo
}

# Section header (smaller than main header)
section() {
  local title="$1"
  local line=$(printf '─%.0s' $(seq 1 $((${#title} + 3))))
  echo
  echo -e "${PURPLE}${BOLD}▶ $title${NC}"
  echo -e "${PURPLE}${line}${NC}"
}

# Check if command exists
need() {
  local cmd="$1"
  if ! command -v "$cmd" &>/dev/null; then
    error "Required command '$cmd' not found. Please install it first."
  fi
}

# Enhanced confirmation with better formatting
confirm() {
  local message="$1"
  local default="${2:-N}"
  local prompt_text
  
  if [[ "$default" == "Y" || "$default" == "y" ]]; then
    prompt_text="[Y/n]"
  else
    prompt_text="[y/N]"
  fi
  
  echo -e "${YELLOW}${INFO}${NC} ${message}"
  read -rp "$(echo -e "${BOLD}Continue? ${prompt_text}:${NC} ")" response
  
  case "$response" in
    [Yy]|[Yy][Ee][Ss]) return 0 ;;
    [Nn]|[Nn][Oo]) return 1 ;;
    "") [[ "$default" == "Y" || "$default" == "y" ]] && return 0 || return 1 ;;
    *) 
      warning "Please answer yes or no."
      confirm "$message" "$default"
      ;;
  esac
}

# Enhanced prompt with better formatting
prompt() {
  local message="$1"
  local var_name="$2"
  local default="${3:-}"
  
  if [[ -n "$default" ]]; then
    echo -e "${CYAN}${INFO}${NC} ${message}"
    read -rp "$(echo -e "${BOLD}[Default: ${default}]:${NC} ")" response
    if [[ -z "$response" ]]; then
      response="$default"
    fi
  else
    echo -e "${CYAN}${INFO}${NC} ${message}"
    read -rp "$(echo -e "${BOLD}Enter value:${NC} ")" response
  fi
  
  if [[ -n "$var_name" ]]; then
    declare -g "$var_name=$response"
  else
    echo "$response"
  fi
}

# Enhanced password prompt
prompt_password() {
  local message="$1"
  local var_name="${2:-}"
  local password
  local confirm_password
  
  while true; do
    echo -e "${CYAN}${INFO}${NC} ${message}"
    read -rsp "$(echo -e "${BOLD}Password:${NC} ")" password
    echo
    read -rsp "$(echo -e "${BOLD}Confirm password:${NC} ")" confirm_password
    echo
    
    if [[ "$password" == "$confirm_password" ]]; then
      if [[ ${#password} -lt 4 ]]; then
        warning "Password must be at least 4 characters long."
        continue
      fi
      break
    else
      warning "Passwords do not match. Please try again."
    fi
  done
  
  if [[ -n "$var_name" ]]; then
    declare -g "$var_name=$password"
  fi
}

# Enhanced pause with better formatting
pause() {
  local message="${1:-Press [Enter] to continue...}"
  echo -e "${DIM}${message}${NC}"
  read -r
}

# Progress indicator
show_progress() {
  local current="$1"
  local total="$2"
  local description="$3"
  local percentage=$((current * 100 / total))
  local completed=$((percentage / 2))
  local remaining=$((50 - completed))
  
  printf "\r${BLUE}[${NC}"
  printf "%${completed}s" | tr ' ' '█'
  printf "%${remaining}s" | tr ' ' '░'
  printf "${BLUE}]${NC} ${percentage}%% - ${description}"
  
  if [[ $current -eq $total ]]; then
    echo
  fi
}

# Spinner for long-running operations
spinner() {
  local pid="$1"
  local message="${2:-Processing}"
  local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  
  echo -ne "${CYAN}${message}${NC} "
  while kill -0 "$pid" 2>/dev/null; do
    i=$(( (i+1) %10 ))
    printf "\r${CYAN}${message}${NC} ${spin:$i:1}"
    sleep .1
  done
  printf "\r${CYAN}${message}${NC} ${GREEN}${CHECKMARK}${NC}\n"
}

# Execute command with progress indication
execute_with_progress() {
  local cmd="$1"
  local description="${2:-Running command}"
  local log_file="${3:-/tmp/archion_install.log}"
  
  step "$description"
  
  if eval "$cmd" >> "$log_file" 2>&1; then
    success "Completed: $description"
    return 0
  else
    error "Failed: $description (check $log_file for details)"
    return 1
  fi
}

# Package installation with better feedback
install_packages() {
  local package_manager="$1"
  shift
  local packages=("$@")
  local total=${#packages[@]}
  
  section "Installing ${total} packages"
  
  for i in "${!packages[@]}"; do
    local package="${packages[$i]}"
    show_progress $((i+1)) $total "Installing: $package"
    
    case "$package_manager" in
      "pacman")
        if ! pacman -S --needed --noconfirm "$package"; then
          warning "Failed to install: $package"
        fi
        ;;
      "yay")
        if ! yay -S --needed --noconfirm "$package"; then
          warning "Failed to install: $package"
        fi
        ;;
    esac
  done
  
  success "Package installation completed"
}

# Create autogen file with better formatting
create_autogen() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    cat > "$file" << 'EOF'
#################################################################
##                                                             ##
##              ⚠  DO NOT EDIT THIS FILE! ⚠                   ##
##                                                             ##
##      This file is automatically generated by Archion.      ##
##      Any manual changes will be overwritten.               ##
##                                                             ##
#################################################################
EOF
    success "Created autogen file: $file"
  else
    info "Autogen file already exists: $file"
  fi
}

# Service management with feedback
manage_service() {
  local action="$1"
  local service="$2"
  
  case "$action" in
    "enable")
      if systemctl enable "$service"; then
        success "Enabled service: $service"
      else
        warning "Failed to enable service: $service"
      fi
      ;;
    "start")
      if systemctl start "$service"; then
        success "Started service: $service"
      else
        warning "Failed to start service: $service"
      fi
      ;;
    "enable-start")
      manage_service "enable" "$service"
      manage_service "start" "$service"
      ;;
  esac
}

# Display script banner
show_banner() {
  local script_name="$1"
  local version="${2:-1.0}"
  
  clear
  echo -e "${BLUE}"
  cat << 'EOF'
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║                      🏛️  ARCHION  🏛️                      ║
    ║                                                           ║
    ║            Advanced Arch Linux Setup System              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
  
  if [[ -n "$script_name" ]]; then
    header "$script_name v$version"
  fi
}

# Cleanup function for safe exits
cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    echo
    error "Script execution failed with exit code: $exit_code"
  fi
  exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT