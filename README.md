# Archion

Archion is a set of scripts and configuration files for setting up a modern Arch Linux desktop environment with Hyprland, AGS widgets, and a curated set of tools and themes.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Overview](#setup-overview)
- [Step-by-step Installation](#step-by-step-installation)
- [Post-installation (User Environment)](#post-installation-user-environment)
- [Graphics Driver Setup](#graphics-driver-setup)
- [Reloading the Environment](#reloading-the-environment)
- [Extra Info & Troubleshooting](#extra-info--troubleshooting)

---

## Features

- Guided Arch Linux installation (with full disk or dual boot)
- Automated graphics driver installation (NVIDIA, AMD, Intel, VM)
- Hyprland Wayland compositor with custom configs
- AGS (Aylur's Gtk Shell) widgets and bar
- Kitty, Nautilus, VS Code, Neovim, and more
- Themed Astal components, AnyRun, and other desktop tools
- Easy reload and update scripts

---

## Prerequisites

- Arch Linux Live ISO (for installation)
- Internet connection
- Familiarity with Linux terminal basics

---

## Setup Overview

1. **Install Arch Linux using the provided guided script**
2. **Reboot into your new system**
3. **Run the global setup as root to install core packages**
4. **Run the environment setup as your user to configure your desktop**
5. **(Optional) Install graphics drivers with the helper script**
6. **Enjoy your new desktop!**

---

## Step-by-step Installation

### 1. Boot Arch ISO and Clone This Repo

```bash
git clone https://github.com/yourusername/archion.git
cd archion
```

### 2. Run the Guided Installer (from the live ISO)

```bash
sudo bash live-setup.sh
```

- **Follow the prompts** to select disk, mode (full/dual boot), user, locale, etc.
- **WARNING:** This will format partitions as selected.

### 3. Reboot Into Your New System

Remove the ISO and boot into your installed Arch Linux.

---

## Post-installation (User Environment)

### 4. Log in as root and run global setup

```bash
sudo bash global-setup.sh
```

- Installs Hyprland, AGS, core tools, fonts, and development utilities.

### 5. Log in as your user and run environment setup

```bash
bash environment-setup.sh
```

- Installs user configs, yay (AUR helper), themes, oh-my-fish, nvm, and more.
- **Follow prompts** for password, etc.

---

## Graphics Driver Setup

If you need to (re)install GPU drivers:

```bash
sudo bash graphics-driver-setup.sh
```

- Detects your GPU and guides you through driver installation for NVIDIA, AMD, Intel, or VMs.

---

## Reloading the Environment

To reload Hyprland and AGS after config changes:

```bash
bash dev/reload.sh
```

---

## Extra Info & Troubleshooting

- **Hyprland config:** `~/.config/hypr/`
- **AGS widgets:** `~/.config/ags/`
- **Kitty config:** `~/.config/kitty/kitty.conf`
- **AnyRun config:** `~/.config/anyrun/`

### Useful Scripts

- `live-setup.sh` — Guided Arch install (run from live ISO)
- `global-setup.sh` — Core system packages (run as root)
- `environment-setup.sh` — User environment (run as user)
- `graphics-driver-setup.sh` — GPU driver helper (run as root)
- `dev/reload.sh` — Reload Hyprland/AGS (run as user)

### Notes

- **For dual boot:** Ensure you select the correct EFI and root partitions.
- **For AUR packages:** `yay` is installed automatically if missing.
- **For AGS bar:** Configs are in `config/ags/`.
- **For wallpapers:** Use the shortcut Ctrl+Super+W when you get into the system and select a wallpaper.

---

## Contributing

PRs and issues welcome!

---

## License

MIT (or specify your license)
