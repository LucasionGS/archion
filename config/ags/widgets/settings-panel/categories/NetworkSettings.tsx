import { Astal, Gtk } from "astal/gtk4"
import { bind, Variable } from "astal"
import Network from "gi://AstalNetwork"

export default function NetworkSettings() {
    const network = Network.get_default()
    
    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Wi-Fi" />
                
                {network?.wifi && (
                    <>
                        <box className="setting-item">
                            <box vertical>
                                <label label="Wi-Fi" />
                                <label className="setting-description" label="Enable wireless networking" />
                            </box>
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <switch
                                        active={bind(network.wifi, "enabled")}
                                        onButtonPressEvent={() => network.wifi.enabled = !network.wifi.enabled}
                                    />
                                ]}
                            </box>
                        </box>

                        <box className="setting-item">
                            <label label="Connected Network" />
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <label label={network.wifi.ssid || "Not connected"} />
                                ]}
                            </box>
                        </box>
                    </>
                )}
                
                {!network?.wifi ? (
                    <box className="setting-item">
                        {[
                            <label label="Wi-Fi not available" />
                        ]}
                    </box>
                ): undefined!}
                {/* what */}
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Ethernet" />
                
                <box className="setting-item">
                    <label label="Wired Connection" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <label label={
                                bind(network.wired, "state").as(state => 
                                    state === Network.DeviceState.ACTIVATED ? "Connected" : "Disconnected"
                                )
                            } />
                        ]}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Network Options" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Airplane Mode" />
                        <label className="setting-description" label="Disable all wireless connections" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Mobile Hotspot" />
                        <label className="setting-description" label="Share internet connection" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>
            </box>
        </box>
    )
}
