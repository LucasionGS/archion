import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync } from "astal"
import Bluetooth from "gi://AstalBluetooth"

export default function BluetoothSettings() {
    const bluetooth = Bluetooth.get_default()
    
    if (bluetooth.adapter?.powered) {
        bluetooth.adapter.start_discovery()
        setTimeout(() => bluetooth.adapter.stop_discovery(), 10000);
    }
    
    const handleToggleBluetooth = () => {
        if (!bluetooth.adapter) {
            console.warn("Bluetooth adapter not available");
            return;
        }
        bluetooth.adapter.powered = !bluetooth.adapter.powered;
        if (bluetooth.adapter.powered) {
            bluetooth.adapter.start_discovery();
            setTimeout(() => bluetooth.adapter.stop_discovery(), 10000);
        }
    }

    const handleDeviceConnect = (device: any) => {
        device.connect_device();
    }

    const handleDeviceDisconnect = (device: any) => {
        device.disconnect_device();
    }

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Bluetooth" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Bluetooth" />
                        <label className="setting-description" label="Enable Bluetooth connectivity" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch 
                                active={bind(bluetooth, "adapter").as(adapter => adapter?.powered || false)}
                                onButtonPressEvent={() => handleToggleBluetooth()}
                            />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Discoverable" />
                        <label className="setting-description" label="Make this device discoverable" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch 
                                active={bind(bluetooth, "adapter").as(adapter => adapter?.discoverable || false)}
                                onButtonPressEvent={() => bluetooth.adapter.discoverable = !bluetooth.adapter.discoverable}
                            />
                        ]}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Paired Devices" />
                
                <box className="device-list" vertical>
                    {bind(bluetooth, "devices").as(devices => 
                        devices.filter(device => device.paired).map(device => (
                            <box className="device-item">
                                <icon icon={device.icon || "bluetooth-symbolic"} />
                                <box vertical hexpand>
                                    <label 
                                        className="device-name" 
                                        label={device.name || "Unknown Device"} 
                                        halign={Gtk.Align.START}
                                    />
                                    <label 
                                        className="device-status" 
                                        label={device.connected ? "Connected" : "Disconnected"}
                                        halign={Gtk.Align.START}
                                    />
                                </box>
                                <box className="device-controls">
                                    {[device.connected ? (
                                        <button
                                            className="device-button disconnect"
                                            child={<label label="Disconnect" />}
                                            onClicked={() => handleDeviceDisconnect(device)}
                                        />
                                    ) : (
                                        <button
                                            className="device-button connect"
                                            child={<label label="Connect" />}
                                            onClicked={() => handleDeviceConnect(device)}
                                        />
                                    )]}
                                </box>
                            </box>
                        ))
                    )}
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Available Devices" />
                
                <box className="setting-item">
                    {[
                        <button 
                            className="action-button"
                            child={<label label="Scan for Devices" />}
                            onClicked={() => {
                                if (!bluetooth.adapter) {
                                    console.warn("Bluetooth adapter not available");
                                    return;
                                }
                                bluetooth.adapter.start_discovery();
                                setTimeout(() => bluetooth.adapter.stop_discovery(), 10000)
                            }}
                        />
                    ]}
                </box>

                <box className="device-list" vertical>
                    {bind(bluetooth, "devices").as(devices => 
                        devices.filter(device => !device.paired && device.name).map(device => (
                            <box className="device-item">
                                <icon icon={device.icon || "bluetooth-symbolic"} />
                                <box vertical hexpand>
                                    <label 
                                        className="device-name" 
                                        label={device.name} 
                                        halign={Gtk.Align.START}
                                    />
                                    <label 
                                        className="device-status" 
                                        label="Not Paired"
                                        halign={Gtk.Align.START}
                                    />
                                </box>
                                <box className="device-controls">
                                    {[
                                        <button 
                                            className="device-button pair"
                                            child={<label label="Pair" />}
                                            onClicked={() => device.pair()}
                                        />
                                    ]}
                                </box>
                            </box>
                        ))
                    )}
                </box>
            </box>
        </box>
    );
}
