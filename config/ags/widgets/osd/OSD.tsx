import { App, Astal, Gdk, Gtk } from "astal/gtk4"
import { timeout } from "astal/time"
import Variable from "astal/variable"
import Brightness from "./brightness"
import Wp from "gi://AstalWp"

function OnScreenProgress({ visible }: { visible: Variable<boolean> }) {
    const brightness = Brightness.get_default()
    const speaker = Wp.get_default()!.get_default_speaker()

    const iconName = Variable("")
    const value = Variable(0)

    let count = 0
    function show(v: number, icon: string) {
        visible.set(true)
        value.set(v)
        iconName.set(icon)
        count++
        timeout(2000, () => {
            count--
            if (count === 0) visible.set(false)
        })
    }

    // Set up signal connections
    brightness.connect("notify::screen", () =>
        show(brightness.screen, "display-brightness-symbolic"),
    )

    if (speaker) {
        speaker.connect("notify::volume", () =>
            show(speaker.volume, speaker.volumeIcon),
        )
    }

    return (
        <revealer
            revealChild={visible()}
            transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
            child={
                <box cssName="OSD">
                    <image iconName={iconName()} />
                    <levelbar valign={Gtk.Align.CENTER} widthRequest={100} value={value()} />
                    <label label={value(v => `${Math.floor(v * 100)}%`)} />
                </box>
            }
        />
    )
}

export default function OSD(monitor: Gdk.Monitor) {
    const visible = Variable(false)

    return (
        <window
            gdkmonitor={monitor}
            cssName="OSD"
            namespace="osd"
            application={App}
            layer={Astal.Layer.OVERLAY}
            keymode={Astal.Keymode.ON_DEMAND}
            anchor={Astal.WindowAnchor.BOTTOM}
            child={
                <button onClicked={() => visible.set(false)} child={
                    <OnScreenProgress visible={visible} />
                } />
            }
        />
    )
}
