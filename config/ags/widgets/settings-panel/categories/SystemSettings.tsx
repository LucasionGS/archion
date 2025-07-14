import { Astal, Gtk } from "astal/gtk4"
import { bind, Variable, execAsync } from "astal"
import Battery from "gi://AstalBattery"

export default function SystemSettings() {
    const battery = Battery.get_default()
    const autoLogin = Variable(false)
    const powerButtonAction = Variable("suspend")
    const autoUpdates = Variable(true)

    const powerActions = ["suspend", "shutdown", "hibernate", "lock"]

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Power Management" />
                
                {battery.isPresent && (
                    <box className="setting-item">
                        <label label="Battery Status" />
                        <box className="setting-control" hexpand halign={Gtk.Align.END}>
                            <label label={bind(battery, "percentage").as(p => 
                                `${Math.floor(p * 100)}% ${battery.charging ? "(Charging)" : ""}`
                            )} />
                        </box>
                    </box>
                )}

                <box className="setting-item">
                    <label label="Power Button Action" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <button 
                            className="dropdown-button"
                            child={<label label={powerButtonAction()} />}
                            onClicked={() => {
                                const currentIndex = powerActions.indexOf(powerButtonAction.get())
                                const nextIndex = (currentIndex + 1) % powerActions.length
                                powerButtonAction.set(powerActions[nextIndex])
                            }}
                        />
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Automatic Suspend" />
                        <label className="setting-description" label="Suspend when inactive" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <switch />
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="System Updates" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Automatic Updates" />
                        <label className="setting-description" label="Install updates automatically" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <switch 
                            active={autoUpdates()}
                            onButtonPressEvent={() => autoUpdates.set(!autoUpdates.get())}
                        />
                    </box>
                </box>

                <box className="setting-item">
                    <button 
                        className="action-button"
                        child={<label label="Check for Updates" />}
                        onClicked={() => execAsync("checkupdates")}
                    />
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Security & Privacy" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Automatic Login" />
                        <label className="setting-description" label="Skip login screen" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <switch 
                            active={autoLogin()}
                            onButtonPressEvent={() => autoLogin.set(!autoLogin.get())}
                        />
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Screen Lock" />
                        <label className="setting-description" label="Lock screen when idle" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <switch />
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="System Information" />
                
                <box className="setting-item">
                    <label label="Hostname" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <label label="archion-desktop" />
                    </box>
                </box>

                <box className="setting-item">
                    <label label="Desktop Environment" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <label label="Hyprland + AGS" />
                    </box>
                </box>

                <box className="setting-item">
                    <button 
                        className="action-button"
                        child={<label label="System Information" />}
                        onClicked={() => execAsync("neofetch")}
                    />
                </box>
            </box>
        </box>
    )
}
