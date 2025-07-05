#!/usr/bin/env bash
# Full setup going through live-setup.sh, global-setup.sh, graphics-driver-setup.sh, and environment-setup.sh for the initial user.

loadkeys dk
UMOUNT=false sudo bash live-setup.sh && \
arch-chroot /mnt bash /archion/global-setup.sh && \
arch-chroot /mnt bash /archion/graphics-driver-setup.sh && \
prompt "Username for primary user: " USERNAME && \
arch-chroot /mnt bash -c "sudo -u $USERNAME bash /archion/environment-setup.sh"