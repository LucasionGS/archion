import { GLib } from "astal"
import { Gtk, Astal } from "astal/gtk4"
import Notifd from "gi://AstalNotifd"

const isIcon = (icon: string) => {
    // In GTK4, Icon.lookup_icon might not be available, use a simple check
    return icon && icon.length > 0
}

const fileExists = (path: string) =>
    GLib.file_test(path, GLib.FileTest.EXISTS)

const time = (time: number, format = "%H:%M") => GLib.DateTime
    .new_from_unix_local(time)
    .format(format)!

const urgency = (n: Notifd.Notification) => {
    const { LOW, NORMAL, CRITICAL } = Notifd.Urgency
    // match operator when?
    switch (n.urgency) {
        case LOW: return "low"
        case CRITICAL: return "critical"
        case NORMAL:
        default: return "normal"
    }
}

type Props = {
    setup(self: Gtk.Widget): void
    onHoverLost(self: Gtk.Widget): void
    notification: Notifd.Notification
}

export default function Notification(props: Props) {
    const { notification: n, onHoverLost, setup } = props
    const { START, CENTER, END } = Gtk.Align

    return <button
        cssName={`Notification ${urgency(n)}`}
        setup={setup}
        onHoverLost={onHoverLost}
        child={
            <box vertical>
                <box cssName="header">
                    <image
                        cssName="app-icon"
                        visible={Boolean(n.appIcon || n.desktopEntry)}
                        iconName={n.appIcon || n.desktopEntry || ""}
                    />
                    <label
                        cssName="app-name"
                        halign={START}
                        label={n.appName || "Unknown"}
                    />
                    <label
                        cssName="time"
                        hexpand
                        halign={END}
                        label={time(n.time)}
                    />
                    <button 
                        onClicked={() => n.dismiss()}
                        child={<image iconName="window-close-symbolic" />}
                    />
                </box>
                <Gtk.Separator visible />
                <box cssName="content">
                    <box
                        valign={START}
                        cssName="image"
                        visible={n.image && fileExists(n.image) ? true : false}
                    />
                    <box
                        hexpand={false}
                        valign={START}
                        cssName="icon-image"
                        visible={n.image && isIcon(n.image) ? true : false}>
                        {[<image iconName={n.image || ""} hexpand halign={CENTER} valign={CENTER} />]}
                    </box>
                    <box vertical>
                        <label
                            cssName="summary"
                            halign={START}
                            xalign={0}
                            label={n.summary}
                        />
                        <label
                            cssName="body"
                            wrap
                            useMarkup
                            halign={START}
                            xalign={0}
                            label={n.body || ""}
                            visible={Boolean(n.body)}
                        />
                    </box>
                </box>
                <box cssName="actions" visible={n.get_actions().length > 0}>
                    {n.get_actions().map(({ label, id }) => (
                        <button
                            hexpand
                            onClicked={() => n.invoke(id)}
                            child={<label label={label} halign={CENTER} hexpand />}
                        />
                    ))}
                </box>
            </box>
        }
    />
}
