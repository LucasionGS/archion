import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync } from "astal"
import Battery from "gi://AstalBattery"
import Network from "gi://AstalNetwork"
import Wp from "gi://AstalWp"

interface SystemMenuAction {
    icon: string
    label: string
    action: () => void
    className?: string
}

function SystemMenuButton({ icon, label, action, className = "" }: SystemMenuAction) {
    return (
        <button className={`system-menu-button ${className}`} onClicked={action}
            child={
                <box vertical>
                    <icon icon={icon} iconSize={32} />
                    <label label={label} />
                </box>
            }
        />
    )
}

function SystemMenuGrid(props: { systemVisible: Variable<boolean> }) {
    const { systemVisible } = props
    const battery = Battery.get_default()
    const network = Network.get_default()
    const speaker = Wp.get_default()?.audio.defaultSpeaker

    // Define system actions in groups of 3 for grid layout
    const systemActions: SystemMenuAction[][] = [
        // Power row
        [
            {
                icon: "system-shutdown-symbolic",
                label: "Shutdown",
                action: () => execAsync("systemctl poweroff"),
                className: "power-button"
            },
            {
                icon: "system-reboot-symbolic", 
                label: "Restart",
                action: () => execAsync("systemctl reboot"),
                className: "power-button"
            },
            {
                icon: "system-log-out-symbolic",
                label: "Logout",
                action: () => execAsync("wleave"),
                className: "power-button"
            }
        ],
        // Lock and session row
        [
            {
                icon: "system-lock-screen-symbolic",
                label: "Lock",
                action: () => execAsync("hyprlock"),
                className: "session-button"
            },
            {
                icon: "weather-clear-night-symbolic",
                label: "Sleep",
                action: () => execAsync("systemctl suspend"),
                className: "session-button"
            },
            {
                icon: "preferences-system-symbolic",
                label: "Settings",
                action: () => execAsync("astal settings show"),
                className: "settings-button"
            }
        ],
        // Applications row
        [
            {
                icon: "folder-symbolic",
                label: "Files",
                action: () => execAsync("nemo"),
                className: "app-button"
            },
            {
                icon: "utilities-terminal-symbolic",
                label: "Terminal",
                action: () => execAsync("kitty"),
                className: "app-button"
            },
            {
                icon: "system-run-symbolic",
                label: "Run",
                action: () => execAsync("anyrun"),
                className: "app-button"
            }
        ],
        // System controls row
        [
            {
                icon: network.wifi?.enabled ? "network-wireless-symbolic" : "network-wireless-offline-symbolic",
                label: "WiFi",
                action: () => {
                    if (network.wifi) {
                        network.wifi.enabled = !network.wifi.enabled
                    }
                },
                className: network.wifi?.enabled ? "toggle-active" : "toggle-inactive"
            },
            {
                icon: speaker?.mute ? "audio-volume-muted-symbolic" : "audio-volume-high-symbolic",
                label: "Audio",
                action: () => {
                    if (speaker) {
                        speaker.mute = !speaker.mute
                    }
                },
                className: speaker?.mute ? "toggle-inactive" : "toggle-active"
            },
            {
                icon: "preferences-desktop-display-symbolic",
                label: "Display",
                action: () => execAsync("gnome-control-center display"),
                className: "settings-button"
            }
        ]
    ]

    return (
        <box className="system-menu-grid" vertical>
            {systemActions.map((row, rowIndex) => (
                <box className="system-menu-row" homogeneous>
                    {row.map((action, buttonIndex) => (
                        <SystemMenuButton
                            icon={action.icon}
                            label={action.label}
                            action={() => {
                                action.action();
                                // Hide the menu after action
                                systemVisible.set(false);
                            }}
                            className={action.className}
                        />
                    ))}
                </box>
            ))}
        </box>
    )
}

function SystemStatus() {
    const battery = Battery.get_default()
    const network = Network.get_default()
    const speaker = Wp.get_default()?.audio.defaultSpeaker

    return (
        <box className="system-status" vertical>
            <label className="status-header" label="System Status" />
            <box className="status-items" vertical>
                {battery.isPresent ? (
                    <box className="status-item">
                        <icon icon={bind(battery, "batteryIconName")} />
                        <label label={bind(battery, "percentage").as(p => 
                            `Battery: ${Math.floor(p * 100)}%`
                        )} />
                    </box> 
                ) : (
                    <box className="status-item">
                        <icon icon="battery-empty-symbolic" />
                        <label label="Battery: Not Present" />
                    </box>
                )}
                
                <box className="status-item">
                    {/* <icon icon={network.wifi?.enabled ? "network-wireless-symbolic" : "network-wired-symbolic"} /> */}
                    {/* <icon icon={bind(network.wired, "iconName")} /> */}
                    {[<label label={
                        network.wifi?.ssid ? `WiFi: ${network.wifi.ssid}` : 
                        network.wired.state === Network.DeviceState.ACTIVATED ? "Wired Connected" : "Disconnected"
                    } />]}
                </box>

                {speaker ? (
                    <box className="status-item">
                        <icon icon={bind(speaker, "volumeIcon")} />
                        <label label={bind(speaker, "volume").as(v => 
                            `Volume: ${Math.floor(v * 100)}%`
                        )} />
                    </box>
                ) : (
                    <box className="status-item">
                        <icon icon="audio-volume-muted-symbolic" />
                        <label label="Audio: Not Available" />
                    </box>
                )}
            </box>
        </box>
    )
}

export default function SystemMenu(show: Variable<boolean>) {
    return (
        <box visible={show()} className="SystemMenu" vertical>
            <SystemStatus />
            <SystemMenuGrid systemVisible={show} />
        </box>
    );
}
