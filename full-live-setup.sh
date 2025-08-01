#!/usr/bin/env bash
# Full setup going through live-setup.sh, global-setup.sh, graphics-driver-setup.sh, and environment-setup.sh for the initial user.

loadkeys dk
source ./utils.sh || { echo "utils.sh not found. Run from the script directory."; exit 1; }
sudo bash live-setup.sh --no-umount && \
arch-chroot /mnt bash /archion/global-setup.sh && \
arch-chroot /mnt bash /archion/graphics-driver-setup.sh 
# && \
# prompt "What was the username you set for primary user?: " USERNAME && \
# arch-chroot /mnt bash -c "sudo -u $USERNAME bash /archion/environment-setup.sh"

# restart live boot into system
echo "Setup complete. Rebooting..."
sleep 2
umount -R /mnt || { echo "Failed to unmount /mnt"; }
reboot