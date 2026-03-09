import type { PanelDefinition } from "./types"
import { SshPanel } from "./ssh/SshPanel"
import { VpnPanel } from "./vpn/VpnPanel"
import { Astal } from "ags/gtk3"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

const panels: PanelDefinition[] = [
  {
    id: "ssh",
    anchor: TOP | BOTTOM | LEFT | RIGHT,
    keymode: Astal.Keymode.ON_DEMAND,
    exclusivity: Astal.Exclusivity.NORMAL,
    layer: Astal.Layer.OVERLAY,
    setup: SshPanel,
  },
  {
    id: "vpn",
    anchor: TOP | BOTTOM | LEFT | RIGHT,
    keymode: Astal.Keymode.ON_DEMAND,
    exclusivity: Astal.Exclusivity.NORMAL,
    layer: Astal.Layer.OVERLAY,
    setup: VpnPanel,
  },
]

export default panels
