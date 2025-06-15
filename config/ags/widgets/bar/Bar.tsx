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
import Pango from "gi://Pango"


function SysTray() {
    const tray = Tray.get_default()

    return <box className="SysTray">
        {bind(tray, "items").as(items => items.map(item => (
            <menubutton
                tooltipMarkup={bind(item, "tooltipMarkup")}
                usePopover={false}
                actionGroup={bind(item, "actionGroup").as(ag => ["dbusmenu", ag])}
                menuModel={bind(item, "menuModel")}
                child={<icon gicon={bind(item, "gicon")} />}
            />
        )))}
    </box>
}

function Wifi() {
    const network = Network.get_default();
    const wifi = bind(network, "wifi");
    const ethernet = bind(network, "wired");
    const ethernetState = bind(network.wired, "state");

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
            <box visible={ethernetState.as(a => a === Network.DeviceState.ACTIVATED)}>
                {ethernet.as(eth => eth && ([
                    <icon
                        tooltipText={bind(eth, "iconName").as(String)}
                        className="Ethernet"
                        icon={bind(eth, "iconName").as(String)}
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
    const cava = Cava.get_default()!
    const cavaValues = bind(cava, "values");

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
                <box className="Visualizer">
                    {/* @ts-ignore */}
                    {bind(cava, "bars").as(bars => (
                        <box className="Cava">
                            {new Array(bars).map((_, i) => (
                                <box
                                    className="Cava-Bar"
                                    css={cavaValues.as(values => `min-height: ${+(values[i].toFixed(2)) * 100}%; min-width: 3px;`)}
                                />
                            ))}
                        </box>
                    ))}
                </box>
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
                    onClicked={() => ws.focus()}
                    label={ws.id.toString()}
                >
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
            client && [<label label={bind(client, "title").as(String)} />]
            // client && <label label={bind(client, "title").as(String)} ellipsize={Pango.EllipsizeMode.END} />
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

function SystemMenuButton(props: {
    displaySystemMenu?: Variable<boolean>
}) {
    const { displaySystemMenu } = props
    // const leaver = "wleave";

    return <box className="SystemMenuButton">
        {[<button
            onClicked={() => displaySystemMenu?.set(!displaySystemMenu?.get())}
            tooltipText="System"
            child={<icon icon="system-log-out" />}
        />]}
    </box>
}

function SettingsButton(props: {
    displaySettingsPanel?: Variable<boolean>
}) {
    const { displaySettingsPanel } = props

    return <box className="SettingsButton">
        {[<button
            onClicked={() => displaySettingsPanel?.set(!displaySettingsPanel.get())}
            tooltipText="Settings"
            child={<icon icon="preferences-system-symbolic" />}
        />]}
    </box>
}

export default function Bar(monitor: Gdk.Monitor, variables?: {
    displayMediaPlayer?: Variable<boolean>,
    displaySystemMenu?: Variable<boolean>,
    displaySettingsPanel?: Variable<boolean>
}) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
    const { displayMediaPlayer, displaySystemMenu, displaySettingsPanel } = variables ?? {}

    return <window
        className="Bar"
        gdkmonitor={monitor}
        margin={8}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}
        child={(
            <centerbox
                heightRequest={32}
                child={(
                    <>
                        <box hexpand halign={Gtk.Align.START}>
                        <Workspaces />
                        <FocusedClient />
                    </box>
                    <box>
                        {[<Media displayMediaPlayer={displayMediaPlayer} />]}
                    </box>
                    <box hexpand halign={Gtk.Align.END} >
                        <SysTray />
                        <AudioSlider />
                        <Wifi />
                        <BatteryLevel />
                        <Time />
                        <SettingsButton displaySettingsPanel={displaySettingsPanel} />
                        <SystemMenuButton displaySystemMenu={displaySystemMenu} />
                    </box>
                    </>
                )}
            />
        )}
    />
}
