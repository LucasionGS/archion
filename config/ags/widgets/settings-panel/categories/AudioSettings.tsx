import { Astal, Gtk } from "astal/gtk4"
import { bind, Variable } from "astal"
import Wp from "gi://AstalWp"

export default function AudioSettings() {
    const wp = Wp.get_default()
    
    // Safe access with fallbacks
    const speaker = wp?.audio?.defaultSpeaker
    const microphone = wp?.audio?.defaultMicrophone
    
    return (
        <box className="settings-category" vertical>
            <box className="setting-group" vertical>
                <label className="group-title" label="Output" />
                
                {speaker ? (
                    <>
                        <box className="setting-item">
                            <label label="Output Volume" />
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                <slider
                                    value={bind(speaker, "volume").as(v => v || 0)}
                                    onDragged={({ value }) => speaker.volume = value}
                                    widthRequest={200}
                                />
                                <label label={bind(speaker, "volume").as(v => `${Math.floor((v || 0) * 100)}%`)} />
                            </box>
                        </box>

                        <box className="setting-item">
                            <label label="Output Device" />
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <button 
                                        className="dropdown-button"
                                        child={<label label={bind(speaker, "description").as(d => d || "Default")} />}
                                    />
                                ]}
                            </box>
                        </box>

                        <box className="setting-item">
                            <box vertical>
                                <label label="Mute Output" />
                                <label className="setting-description" label="Silence all output audio" />
                            </box>
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <switch 
                                        active={bind(speaker, "mute").as(m => m || false)}
                                        onButtonReleaseEvent={(self) => {
                                            // Ensure the switch reflects the current mute state
                                            speaker.set_mute(!speaker.mute || false);
                                        }}
                                    />
                                ]}
                            </box>
                        </box>
                    </>
                ) : (
                    <box className="setting-item">
                        {[
                            <label label="No audio output device available" />
                        ]}
                    </box>
                )}
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Input" />
                
                {microphone ? (
                    <>
                        <box className="setting-item">
                            <label label="Input Volume" />
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                <slider
                                    value={bind(microphone, "volume").as(v => v || 0)}
                                    onDragged={({ value }) => microphone.volume = value}
                                    widthRequest={200}
                                />
                                <label label={bind(microphone, "volume").as(v => `${Math.floor((v || 0) * 100)}%`)} />
                            </box>
                        </box>

                        <box className="setting-item">
                            <label label="Input Device" />
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <button 
                                        className="dropdown-button"
                                        child={<label label={bind(microphone, "description").as(d => d || "Default")} />}
                                    />
                                ]}
                            </box>
                        </box>

                        <box className="setting-item">
                            <box vertical>
                                <label label="Mute Input" />
                                <label className="setting-description" label="Disable microphone input" />
                            </box>
                            <box className="setting-control" hexpand halign={Gtk.Align.END}>
                                {[
                                    <switch 
                                        active={bind(microphone, "mute").as(m => m || false)}
                                        onButtonReleaseEvent={() => microphone.set_mute(!microphone.mute)}
                                    />
                                ]}
                            </box>
                        </box>
                    </>
                ) : (
                    <box className="setting-item">
                        {[
                            <label label="No audio input device available" />
                        ]}
                    </box>
                )}
            </box>

            <box className="setting-group" vertical>
                <label className="group-title" label="Audio Effects" />
                
                <box className="setting-item">
                    <box vertical>
                        <label label="System Sounds" />
                        <label className="setting-description" label="Play sounds for system events" />
                    </box>
                    <box className="setting-control" hexpand halign={Gtk.Align.END}>
                        {[
                            <switch />
                        ]}
                    </box>
                </box>

                <box className="setting-item">
                    <box vertical>
                        <label label="Notification Sounds" />
                        <label className="setting-description" label="Play sounds for notifications" />
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
