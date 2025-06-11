import { Astal, Gtk } from "astal/gtk3"
import { bind, execAsync } from "astal"
import { IonTheme } from "../../../IonTheme";

export default function ThemeSettings() {

    const handleThemeChange = (themeId: IonTheme.ValidThemeName) => {
        IonTheme.setThemePreference(themeId);
    }

    const handleAccentColorChange = (color: IonTheme.ValidAccentColor) => {
        IonTheme.setAccent(color);
    }

    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Appearance" />
                
                <box className="setting-item" vertical>
                    <label label="Theme" halign={Gtk.Align.START} />
                    <box className="theme-options">
                        {IonTheme.themes.map(theme => (
                            <button 
                                className={bind(IonTheme.currentTheme).as(current => 
                                    `theme-option ${current === theme.id ? 'active' : ''}`
                                )}
                                onClicked={() => handleThemeChange(theme.id)}
                                child={
                                    <box vertical>
                                        <box 
                                            className="theme-preview" 
                                            css={`background: ${theme.preview};`}
                                        />
                                        <label label={theme.name} />
                                    </box>
                                }
                            />
                        ))}
                    </box>
                </box>

                <box className="setting-item" vertical>
                    <label label="Accent Color" halign={Gtk.Align.START} />
                    <box className="color-options">
                        {IonTheme.accentColors.map(color => (
                            <button 
                                className={bind(IonTheme.accentColor).as(current => 
                                    `color-option ${current === color ? 'active' : ''}`
                                )}
                                onClicked={() => handleAccentColorChange(color)}
                                child={
                                    <box 
                                        className="color-preview" 
                                        css={`background: ${color};`}
                                    />
                                }
                            />
                        ))}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Icons & Cursors" />
                
                <box className="setting-item">
                    <label label="Icon Theme" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <button 
                                className="dropdown-button"
                                child={<label label={IonTheme.iconTheme()} />}
                                onClicked={() => {
                                    const current = IonTheme.iconTheme.get()
                                    const newTheme = current === "Adwaita" ? "Papirus" : "Adwaita"
                                    IonTheme.iconTheme.set(newTheme)
                                    execAsync(`gsettings set org.gnome.desktop.interface icon-theme '${newTheme}'`)
                                }}
                            />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <label label="Cursor Theme" />
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <button 
                                className="dropdown-button"
                                child={<label label={IonTheme.cursorTheme()} />}
                                onClicked={() => {
                                    const current = IonTheme.cursorTheme.get()
                                    const newTheme = current === "default" ? "Adwaita" : "default"
                                    IonTheme.cursorTheme.set(newTheme)
                                    execAsync(`gsettings set org.gnome.desktop.interface cursor-theme '${newTheme}'`)
                                }}
                            />
                        ]}
                    </box>
                </box>
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Window Effects" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="Animations" />
                        <label className="setting-description" label="Enable window animations" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Blur Effects" />
                        <label className="setting-description" label="Enable background blur" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Transparency" />
                        <label className="setting-description" label="Enable window transparency" />
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
