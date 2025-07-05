#!/usr/bin/env bash
# Full setup going through live-setup.sh, global-setup.sh, graphics-driver-setup.sh, and environment-setup.sh for the initial user.

loadkeys dk
sudo bash live-setup.sh && \
USERNAME="$(cat /tmp/initial_archion_username)"

echo "Username: $USERNAME"

# Run on arch-chroot
arch-chroot /mnt bash /home/$USERNAME/archion/global-setup.sh
arch-chroot /mnt bash /home/$USERNAME/archion/graphics-driver-setup.sh

# Run environment-setup.sh for the initial user
arch-chroot /mnt bash -c "sudo -u $USERNAME bash /home/$USERNAME/archion/environment-setup.sh"