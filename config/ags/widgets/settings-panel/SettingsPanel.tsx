import { Astal, Gtk, App } from "astal/gtk3"
import { bind, Binding, Variable } from "astal"
import DisplaySettings from "./categories/DisplaySettings"
import AudioSettings from "./categories/AudioSettings"
import BluetoothSettings from "./categories/BluetoothSettings"
import ThemeSettings from "./categories/ThemeSettings"
import FontSettings from "./categories/FontSettings"
import NetworkSettings from "./categories/NetworkSettings"
import SystemSettings from "./categories/SystemSettings"
import Bluetooth from "gi://AstalBluetooth"
// import { IonTheme } from "../../IonTheme"

interface SettingsCategory {
    id: string
    name: string
    icon: string
    component: () => JSX.Element,
    condition?: (() => boolean) | Binding<boolean>
}

const bluetooth = Bluetooth.get_default();

const settingsCategories: SettingsCategory[] = [
    {
        id: "display",
        name: "Display",
        icon: "preferences-desktop-display-symbolic",
        component: DisplaySettings
    },
    {
        id: "audio",
        name: "Audio",
        icon: "audio-volume-high-symbolic",
        component: AudioSettings
    },
    {
        id: "bluetooth",
        name: "Bluetooth", 
        icon: "bluetooth-symbolic",
        component: BluetoothSettings,
        condition: bind(bluetooth, "adapter").as(adapter => Boolean(adapter))
    },
    {
        id: "network",
        name: "Network",
        icon: "network-wireless-symbolic",
        component: NetworkSettings
    },
    {
        id: "theme",
        name: "Theme",
        icon: "applications-graphics-symbolic",
        component: ThemeSettings
    },
    {
        id: "fonts",
        name: "Fonts",
        icon: "preferences-desktop-font-symbolic",
        component: FontSettings
    },
    {
        id: "system",
        name: "System",
        icon: "preferences-system-symbolic",
        component: SystemSettings
    }
]

function SettingsSidebar({ activeCategory, onCategoryChange }: {
    activeCategory: Variable<string>
    onCategoryChange: (categoryId: string) => void
}) {
    return (
        <box className="settings-sidebar" vertical>
            <label className="sidebar-title" label="Settings" />
            
            <box className="sidebar-categories" vertical>
                {settingsCategories.map(category => (
                    <button
                        visible={
                            category.condition ? (
                                typeof category.condition === 'function'
                                    ? category.condition() // Function
                                    : category.condition // Binding
                            ) : true
                        }
                        className={bind(activeCategory).as(active => 
                            `sidebar-category ${active === category.id ? 'active' : ''}`
                        )}
                        onClicked={() => onCategoryChange(category.id)}
                        child={
                            <box>
                                <icon icon={category.icon} />
                                <label label={category.name} />
                            </box>
                        }
                    />
                ))}
            </box>
        </box>
    )
}

function SettingsContent({ activeCategory }: { activeCategory: Variable<string> }) {
    return (
        <box className="settings-content" vertical>
            <box className="content-header">
                {[
                    <label 
                        className="content-title" 
                        label={bind(activeCategory).as(categoryId => {
                            const category = settingsCategories.find(cat => cat.id === categoryId)
                            return category ? category.name : "Settings"
                        })}
                    />
                ]}
            </box>
            
            {/* @ts-ignore */}
            <scrollable className="content-scrollable" vexpand>
                <box className="content-body" vertical>
                    {settingsCategories.map(category => (
                        <box
                            className="settings-category-container"
                            visible={bind(activeCategory).as(active => active === category.id)}
                        >
                            {[category.component()]}
                        </box>
                    ))}
                </box>
            </scrollable>
        </box>
    )
}

export default function SettingsPanel(show: Variable<boolean>) {
    const activeCategory = Variable("display")
    
    const handleClose = () => {
        show.set(false)
    }
    
    const handleCategoryChange = (categoryId: string) => {
        activeCategory.set(categoryId)
    }

    return (
        <window
            className="SettingsPanel"
            visible={show()}
            application={App}
            // gdkmonitor={App.monitors[0]}
            layer={Astal.Layer.OVERLAY}
            exclusivity={Astal.Exclusivity.NORMAL}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            keymode={Astal.Keymode.ON_DEMAND}
            child={
                <eventbox>
                    <box 
                        className="settings-panel-backdrop"
                        child={
                            <eventbox>
                                <box className="settings-panel-container" vertical>
                                    {/* Header with close button */}
                                    <box className="settings-header">
                                        <label className="settings-title" label="System Settings" />
                                        <box hexpand halign={Gtk.Align.END}>
                                            {[
                                                <button
                                                    className="close-button"
                                                    onClicked={handleClose}
                                                    child={<icon icon="window-close-symbolic" />}
                                                />
                                            ]}
                                        </box>
                                    </box>
                                    
                                    {/* Main content area */}
                                    <box className="settings-main" hexpand vexpand>
                                        <SettingsSidebar 
                                            activeCategory={activeCategory}
                                            onCategoryChange={handleCategoryChange}
                                        />
                                        <SettingsContent activeCategory={activeCategory} />
                                    </box>
                                </box>
                            </eventbox>
                        }
                    />
                </eventbox>
            }
        />
    )
}
