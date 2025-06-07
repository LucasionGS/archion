need() {
  command -v "$1" &>/dev/null || { echo "Error: $1 not found" >&2; exit 1; };
}

confirm() {
  read -rp "$1 [y/N]: " ans; [[ ${ans,,} =~ ^(y|yes)$ ]];
}

header() {
  echo -e "\n=== $* ===\n";
}

error() {
  echo -e "\e[31mError:\e[0m $1" >&2; exit 1;
}

prompt() {
  read -rp "$1" "$2";
}

prompt_password() {
  read -rsp "$1" "$2"
  echo
}

pause() {
  read -p "Press [Enter] to continue..."
}