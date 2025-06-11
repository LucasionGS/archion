import { Astal, Gtk } from "astal/gtk3"
import { bind, Variable, execAsync } from "astal"

export default function DisplaySettings() {
    const brightness = Variable(1.0)
    const resolution = Variable("1920x1080")
    const refreshRate = Variable("60")

    const handleBrightnessChange = (value: number) => {
        brightness.set(value)
        execAsync(`brightnessctl set ${Math.floor(value * 100)}%`)
    }

    const handleResolutionChange = (newResolution: string) => {
        resolution.set(newResolution)
        // Would integrate with actual display management
        execAsync(`hyprctl keyword monitor ,${newResolution}@${refreshRate.get()},0x0,1`)
    }

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Brightness" />
                <box className="setting-item">
                    <label label="Screen Brightness" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        <slider
                            value={brightness()}
                            onDragged={({ value }) => handleBrightnessChange(value)}
                            widthRequest={200}
                        />
                        <label label={bind(brightness).as(b => `${Math.floor(b * 100)}%`)} />
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Display Configuration" />
                
                <box className="setting-item">
                    <label label="Resolution" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <button 
                                className="dropdown-button"
                                child={<label label={resolution()} />}
                                onClicked={() => {
                                    // Simple resolution toggle for demo
                                    const current = resolution.get()
                                    const newRes = current === "1920x1080" ? "2560x1440" : "1920x1080"
                                    handleResolutionChange(newRes)
                                }}
                            />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <label label="Refresh Rate" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <button 
                                className="dropdown-button"
                                child={<label label={bind(refreshRate).as(r => `${r} Hz`)} />}
                                onClicked={() => {
                                    const current = refreshRate.get();
                                    const newRate = current === "60" ? "144" : "60"
                                    refreshRate.set(newRate);
                                }}
                            />
                        ]}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Display Options" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Night Light" />
                        <label className="setting-description" label="Reduces blue light in the evening" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Auto-rotate" />
                        <label className="setting-description" label="Automatically rotate display" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Actions" />
                
                <box className="setting-item">
                    {[
                        <button 
                            className="action-button"
                            child={<label label="Detect Displays" />}
                            onClicked={() => execAsync("hyprctl reload")}
                        />
                    ]}
                </box>
            </box>
        </box>
    )
}
