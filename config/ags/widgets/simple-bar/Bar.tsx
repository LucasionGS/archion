import { App } from "astal/gtk3"
import { Variable, GLib, bind, execAsync } from "astal"
import { Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland"
import Mpris from "gi://AstalMpris"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"
import Cava from "gi://AstalCava"


function SysTray() {
    const tray = Tray.get_default()

    return <box className="SysTray">
        {bind(tray, "items").as(items => items.map(item => (
            <menubutton
                tooltipMarkup={bind(item, "tooltipMarkup")}
                usePopover={false}
                actionGroup={bind(item, "actionGroup").as(ag => ["dbusmenu", ag])}
                menuModel={bind(item, "menuModel")}>
                <icon gicon={bind(item, "gicon")} />
            </menubutton>
        )))}
    </box>
}

function Wifi() {
    const network = Network.get_default()
    const wifi = bind(network, "wifi")
    const ethernet = bind(network, "wired")

    return (
        <box>
            <box visible={wifi.as(Boolean)}>
                {wifi.as(wifi => wifi && ([
                    <icon
                        tooltipText={bind(wifi, "ssid").as(String)}
                        className="Wifi"
                        icon={bind(wifi, "iconName")}
                    />
                ]))}
            </box>
            <box visible={ethernet.as(Boolean)}>
                {ethernet.as(eth => eth && ([
                    <icon
                        tooltipText={bind(eth, "iconName").as(String)}
                        className="Ethernet"
                        icon={bind(eth, "iconName").as(String)}
                        // icon="network-wired-symbolic"
                    />
                ]))}
            </box>
        </box>
    );
}

function AudioSlider() {
    const speaker = Wp.get_default()?.audio.defaultSpeaker!

    return <box className="AudioSlider" css="min-width: 140px">
        <icon icon={bind(speaker, "volumeIcon")} />
        <slider
            hexpand
            onDragged={({ value }) => speaker.volume = value}
            value={bind(speaker, "volume")}
        />
    </box>
}

function BatteryLevel() {
    const bat = Battery.get_default()

    return <box className="Battery"
        visible={bind(bat, "isPresent")}>
        <icon icon={bind(bat, "batteryIconName")} />
        <label label={bind(bat, "percentage").as(p =>
            `${Math.floor(p * 100)} %`
        )} />
    </box>
}

function Media(props: {
    displayMediaPlayer?: Variable<boolean>
}) {
    const { displayMediaPlayer } = props
    const mpris = Mpris.get_default()
    // const cava = Cava.get_default()!

    // cava.connect("notify::values", () => {
    //     print(cava.values)
    // })

    return <box className="Media">
        {bind(mpris, "players").as(ps => [ps[0] ? (
            <box>
                <box
                    className="Cover"
                    valign={Gtk.Align.CENTER}
                    css={bind(ps[0], "coverArt").as(cover =>
                        `background-image: url('${cover}');`
                    )}
                />
                <button
                    onClick={() => displayMediaPlayer?.set(!displayMediaPlayer()?.get())}
                    label={bind(ps[0], "metadata").as(() =>
                        `${ps[0].title} - ${ps[0].artist}`
                    )}
                />
                {/* Visualizer? */}
                {/* <box
                    className="Cover"
                    valign={Gtk.Align.CENTER}
                    css={bind(ps[0], "coverArt").as(cover =>
                        `background-image: url('${cover}');`
                    )}
                /> */}
            </box>
        ) : (
            <label label="Archion" />
        )])}
    </box>
}

function Workspaces() {
    const hypr = Hyprland.get_default()

    return <box className="Workspaces">
        {bind(hypr, "workspaces").as(wss => wss
            .filter(ws => !(ws.id >= -99 && ws.id <= -2)) // filter out special workspaces
            .sort((a, b) => a.id - b.id)
            .map(ws => (
                <button
                    className={bind(hypr, "focusedWorkspace").as(fw =>
                        ws === fw ? "focused" : "")}
                    onClicked={() => ws.focus()}>
                    {ws.id}
                </button>
            ))
        )}
    </box>
}

function FocusedClient() {
    const hypr = Hyprland.get_default()
    const focused = bind(hypr, "focusedClient")

    return <box
        className="Focused"
        visible={focused.as(Boolean)}>
        {focused.as(client => (
            client && <label label={bind(client, "title").as(String)} />
        ))}
    </box>
}

function Time({ format = "%H:%M - %A %e." }) {
    const time = Variable<string>("").poll(1000, () =>
        GLib.DateTime.new_now_local().format(format)!)

    return <label
        className="Time"
        onDestroy={() => time.drop()}
        label={time()}
    />
}

function Leave() {
    const leaver = "wleave";

    return <box className="LeaveButton">
        {[<button
            onClicked={() => execAsync(leaver)}
            tooltipText="Logout"
        >
            <icon icon="system-log-out" />
        </button>]}
    </box>
}

export default function Bar(monitor: Gdk.Monitor, variables?: {
    displayMediaPlayer?: Variable<boolean>
}) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
    const { displayMediaPlayer } = variables ?? {}

    return <window
        className="Bar"
        gdkmonitor={monitor}
        margin={8}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}>
        <centerbox
            heightRequest={32}
        >
            <box hexpand halign={Gtk.Align.START}>
                <Workspaces />
                <FocusedClient />
            </box>
            <box>
                <Media displayMediaPlayer={displayMediaPlayer} />
            </box>
            <box hexpand halign={Gtk.Align.END} >
                <SysTray />
                <AudioSlider />
                <Wifi />
                <BatteryLevel />
                <Time />
                <Leave />
            </box>
        </centerbox>
    </window>
}
