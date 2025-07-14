import { Astal, Gtk } from "astal/gtk4"
import { bind, Variable, execAsync, exec, Binding, writeFile, Process } from "astal"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
const hypr = AstalHyprland.get_default()!;
const monitorConfigLocation = exec(["bash", "-c", "realpath ~/.config/hypr/configs/autogen/monitors.conf"]);

// Interface for monitor information
interface Monitor {
    id: string
    name: string
    width: number
    height: number
    refreshRates: number[]
    currentRefreshRate: number
    scale: number
    x: number
    y: number
    disabled: boolean
}

// Available resolutions (common ones)
const commonResolutions = [
    { width: 1920, height: 1080, label: "1920×1080" },
    { width: 2560, height: 1440, label: "2560×1440" },
    { width: 3840, height: 2160, label: "3840×2160" },
    { width: 1680, height: 1050, label: "1680×1050" },
    { width: 1366, height: 768, label: "1366×768" },
    { width: 1280, height: 720, label: "1280×720" }
]

// Scale options
const scaleOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

function DisplayCanvas({ monitors, selectedMonitor, onMonitorSelect }: {
    monitors: Variable<Monitor[]>
    selectedMonitor: Variable<Monitor | null>
    onMonitorSelect: (id: string) => void
}) {
    return (
        <box className="display-canvas" halign={Gtk.Align.CENTER}>
            {[<box className="monitor-layout">
                {bind(monitors).as(monitorList => 
                    monitorList.map(monitor => 
                        <button
                            className={bind(selectedMonitor).as(sel => 
                                `monitor-display ${sel?.id === monitor.id ? 'selected' : ''}`
                            )}
                            onClicked={() => onMonitorSelect(monitor.id)}
                            child={
                                <box vertical className="monitor-content">
                                    <label 
                                        className="monitor-name"
                                        label={monitor.name} 
                                    />
                                    <label 
                                        className="monitor-resolution"
                                        label={`${monitor.width}×${monitor.height}`}
                                    />
                                    <label 
                                        className="monitor-id"
                                        label={monitor.id}
                                    />
                                </box>
                            }
                        />
                    )
                )}
            </box>]}
        </box>
    )
}

function MonitorSettings({ monitors, selectedMonitor }: {
    monitors: Variable<Monitor[]>
    selectedMonitor: Variable<Monitor | null>
}) {
    const updateMonitor = (id: string, updates: Partial<Monitor>) => {
        const currentMonitors = monitors.get()
        const updatedMonitors = currentMonitors.map(m => 
            m.id === id ? { ...m, ...updates } : m
        )
        monitors.set(updatedMonitors)
        // generateConfigFile(updatedMonitors)
    }

    return (
        <box className="monitor-settings" vertical>
            {bind(selectedMonitor).as(monitor => {
                
                if (!monitor) {
                    return [
                        <box className="no-selection" vertical halign={Gtk.Align.CENTER}>
                            <icon icon="preferences-desktop-display" iconSize={48} />
                            <label label="Select a monitor to configure" />
                        </box>
                    ]
                }

                return [
                    <box vertical spacing={12}>
                        <box className="setting-group" vertical>
                            <label className="group-title" label={`${monitor.name} (${monitor.id})`} />
                            
                            <box className="setting-item">
                                <label label="Enabled" />
                                <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                    {[
                                        <switch 
                                            active={!monitor.disabled}
                                            onButtonPressEvent={() => {
                                                selectedMonitor.set({
                                                    ...monitor,
                                                    disabled: !monitor.disabled
                                                })
                                                updateMonitor(monitor.id, { disabled: !monitor.disabled })
                                            }}
                                        />
                                    ]}
                                </box>
                            </box>
                        </box>

                        <box className="setting-group" vertical>
                            <label className="group-title" label="Resolution & Display" />
                            
                            <box className="setting-item">
                                <label label="Resolution" />
                                <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                    {[
                                        <button 
                                            className="dropdown-button"
                                            child={<label label={`${monitor.width}×${monitor.height}`} />}
                                            onClicked={() => {
                                                // Cycle through common resolutions
                                                const current = commonResolutions.findIndex(r => 
                                                    r.width === monitor.width && r.height === monitor.height
                                                )
                                                const next = (current + 1) % commonResolutions.length
                                                const newRes = commonResolutions[next]
                                                selectedMonitor.set({
                                                    ...monitor,
                                                    width: newRes.width,
                                                    height: newRes.height
                                                })
                                                updateMonitor(monitor.id, { 
                                                    width: newRes.width, 
                                                    height: newRes.height 
                                                })
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
                                            child={<label label={`${monitor.currentRefreshRate} Hz`} />}
                                            onClicked={() => {
                                                // Cycle through available refresh rates
                                                const currentIndex = monitor.refreshRates.indexOf(monitor.currentRefreshRate)
                                                const nextIndex = (currentIndex + 1) % monitor.refreshRates.length
                                                const newRate = monitor.refreshRates[nextIndex]
                                                selectedMonitor.set({
                                                    ...monitor,
                                                    currentRefreshRate: newRate
                                                })
                                                updateMonitor(monitor.id, { currentRefreshRate: newRate })
                                            }}
                                        />
                                    ]}
                                </box>
                            </box>

                            <box className="setting-item">
                                <label label="Scale" />
                                <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                    {[
                                        <button 
                                            className="dropdown-button"
                                            child={<label label={`${Math.round(monitor.scale * 100)}%`} />}
                                            onClicked={() => {
                                                // Cycle through scale options
                                                const currentIndex = scaleOptions.indexOf(monitor.scale)
                                                const nextIndex = (currentIndex + 1) % scaleOptions.length
                                                const newScale = scaleOptions[nextIndex]
                                                selectedMonitor.set({
                                                    ...monitor,
                                                    scale: newScale
                                                })
                                                updateMonitor(monitor.id, { scale: newScale })
                                            }}
                                        />
                                    ]}
                                </box>
                            </box>
                        </box>

                        <box className="setting-group" vertical>
                            <label className="group-title" label="Position" />
                            
                            <box className="setting-item">
                                <label label="X Position" />
                                <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                    {[
                                        <box spacing={8}>
                                            <button 
                                                className="pos-button"
                                                child={<label label="-" />}
                                                onClicked={() => {
                                                    selectedMonitor.set({
                                                        ...monitor,
                                                        x: monitor.x - (monitor.width / 10)
                                                    })
                                                    updateMonitor(monitor.id, { x: Math.max(0, monitor.x - (monitor.width / 10)) })
                                                }}
                                            />
                                            <label label={monitor.x.toString()} />
                                            <button 
                                                className="pos-button"
                                                child={<label label="+" />}
                                                onClicked={() => {
                                                    selectedMonitor.set({
                                                        ...monitor,
                                                        x: monitor.x + (monitor.width / 10)
                                                    })
                                                    updateMonitor(monitor.id, { x: monitor.x + (monitor.width / 10) })
                                                }}
                                            />
                                        </box>
                                    ]}
                                </box>
                            </box>

                            <box className="setting-item">
                                <label label="Y Position" />
                                <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                    {[
                                        <box spacing={8}>
                                            <button 
                                                className="pos-button"
                                                child={<label label="-" />}
                                                onClicked={() => {
                                                    selectedMonitor.set({
                                                        ...monitor,
                                                        y: Math.max(0, monitor.y - 100)
                                                    })
                                                    updateMonitor(monitor.id, { y: Math.max(0, monitor.y - 100) })
                                                }}
                                            />
                                            <label label={monitor.y.toString()} />
                                            <button 
                                                className="pos-button"
                                                child={<label label="+" />}
                                                onClicked={() => {
                                                    selectedMonitor.set({
                                                        ...monitor,
                                                        y: monitor.y + 100
                                                    })
                                                    updateMonitor(monitor.id, { y: monitor.y + 100 })
                                                }}
                                            />
                                        </box>
                                    ]}
                                </box>
                            </box>
                        </box>
                    </box>
                ]
            })}
        </box>
    )
}

// Function to generate the configuration file
function generateConfigFile(monitors: Monitor[]) {
    const configLines = monitors
        .filter(m => !m.disabled)
        .map(m => {
            return `monitor = ${m.name}, ${m.width}x${m.height}@${m.currentRefreshRate}, ${Math.round(m.x)}x${Math.round(m.y)}, ${m.scale}`
        })
    
    const configContent =
`#####################################################
## DO NOT EDIT THIS FILE!                           #
## This file is automatically generated by Archion. #
#####################################################
${configLines.join('\n')}`
    
    // Write to a configuration file (adjust path as needed)
    try {
        writeFile(monitorConfigLocation, configContent);
    } catch (error) {
        console.error("Failed to write monitor config:", error);
        return;
    }
    
    console.log("Generated monitor configuration:")
    console.log(configContent)
}

export default function DisplaySettings() {
    // const monitors = Variable<Monitor[]>(mockMonitors)
    const monitors: Variable<Monitor[]> = new Variable<Monitor[]>([]);
    const updateMonitors = (m: AstalHyprland.Monitor[]) => {
        // Get available modes
        monitors.set(m.map(monitor => ({
            id: monitor.id.toString(),
            name: monitor.name,
            width: monitor.width,
            height: monitor.height,
            refreshRates: monitor.availableModes?.map(mode => mode.split('@')[1] ? parseInt(mode.split('@')[1]) : 60) || [monitor.refreshRate],
            currentRefreshRate: monitor.refreshRate,
            scale: monitor.scale,
            x: monitor.x,
            y: monitor.y,
            disabled: monitor.disabled
        }) satisfies Monitor));

        console.log("Monitors updated:", monitors.get());
    };
    
    updateMonitors(hypr.monitors);
    bind(hypr, "monitors").subscribe(updateMonitors);
    const selectedMonitor = Variable<Monitor | null>(null)
    const brightness = Variable(1.0)

    const handleBrightnessChange = (value: number) => {
        brightness.set(value)
        execAsync(`brightnessctl set ${Math.floor(value * 100)}%`)
    }

    const refreshDisplays = () => {
        // In real implementation, this would query hyprctl monitors
        execAsync("hyprctl monitors -j")
            .then(output => {
                // Parse and update monitor list
                console.log("Refreshed displays")
            })
            .catch(err => console.error("Failed to refresh displays:", err))
    }

    const handleMonitorSelect = (id: string) => {
        selectedMonitor.set(selectedMonitor.get()?.id === id ? null : monitors.get().find(m => m.id === id) || null);
    }

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Display Layout" />
                <DisplayCanvas 
                    monitors={monitors}
                    selectedMonitor={selectedMonitor}
                    onMonitorSelect={handleMonitorSelect}
                />
            </box>

            <box className="display-settings-main" spacing={24}>
                {[
                    <MonitorSettings 
                        monitors={monitors}
                        selectedMonitor={selectedMonitor}
                    />
                ]}
            </box>

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
                <label className="group-title" label="Actions" />
                
                <box className="setting-item">
                    {[
                        <button 
                            className="action-button"
                            child={<label label="Refresh Displays" />}
                            onClicked={refreshDisplays}
                        />
                    ]}
                </box>
                
                <box className="setting-item">
                    {[
                        <button 
                            className="action-button"
                            child={<label label="Apply Configuration" />}
                            onClicked={() => {
                                generateConfigFile(monitors.get())
                                execAsync("hyprctl reload")
                            }}
                        />
                    ]}
                </box>
            </box>
        </box>
    )
}
