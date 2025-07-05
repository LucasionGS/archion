import { App } from "astal/gtk3"
import { Variable, GLib, bind, execAsync, readFile } from "astal"
import { Astal, Gtk, Gdk } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland"
import Mpris from "gi://AstalMpris"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"
import Cava from "gi://AstalCava"
import Pango from "gi://Pango"


// System monitoring variables
const cpuUsage = Variable(0)
const ramUsage = Variable(0)
const networkDownload = Variable(0)
const networkUpload = Variable(0)

// Store previous network values for calculating rates
let prevNetworkStats = { rx: 0, tx: 0, timestamp: Date.now() }

// Store previous CPU values for delta calculation
let prevCpuStats = { idle: 0, total: 0 }

// Function to get CPU usage (optimized - no bash processes)
function getCpuUsage() {
    try {
        const cpuInfo = readFile("/proc/stat")
        const cpuLine = cpuInfo.split('\n')[0] // First line contains overall CPU stats
        const values = cpuLine.split(/\s+/).slice(1).map(Number) // Remove "cpu" and convert to numbers
        
        // CPU stats: user, nice, system, idle, iowait, irq, softirq, steal
        const idle = values[3] + values[4] // idle + iowait
        const total = values.reduce((sum, val) => sum + val, 0)
        
        if (prevCpuStats.total > 0) {
            const idleDiff = idle - prevCpuStats.idle
            const totalDiff = total - prevCpuStats.total
            const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0
            cpuUsage.set(Math.max(0, Math.min(100, usage)))
        }
        
        prevCpuStats = { idle, total }
    } catch (error) {
        console.warn("Failed to read CPU stats:", error)
        cpuUsage.set(0)
    }
}

// Function to get RAM usage (optimized - no bash processes)
function getRamUsage() {
    try {
        const memInfo = readFile("/proc/meminfo")
        const lines = memInfo.split('\n')
        
        const getMemValue = (key: string) => {
            const line = lines.find(l => l.startsWith(key))
            return line ? parseInt(line.split(/\s+/)[1]) : 0
        }
        
        const memTotal = getMemValue("MemTotal:")
        const memFree = getMemValue("MemFree:")
        const memBuffers = getMemValue("Buffers:")
        const memCached = getMemValue("Cached:")
        const sReclaimable = getMemValue("SReclaimable:")
        
        if (memTotal > 0) {
            const memUsed = memTotal - memFree - memBuffers - memCached - sReclaimable
            const usage = (memUsed / memTotal) * 100
            ramUsage.set(Math.max(0, Math.min(100, usage)))
        }
    } catch (error) {
        console.warn("Failed to read memory stats:", error)
        ramUsage.set(0)
    }
}

// Function to get network usage (optimized - no bash processes)
function getNetworkUsage() {
    try {
        const netDev = readFile("/proc/net/dev")
        const lines = netDev.split('\n').slice(2) // Skip header lines
        
        // Find first active network interface (wlan, eth, enp, wlp)
        const activeLine = lines.find(line => 
            /\s*(wlan|eth|enp|wlp)/.test(line) && 
            !line.includes(':    0        0') // Skip inactive interfaces
        )
        
        if (activeLine) {
            const parts = activeLine.trim().split(/\s+/)
            const rx = parseInt(parts[1]) || 0  // Received bytes
            const tx = parseInt(parts[9]) || 0  // Transmitted bytes
            const now = Date.now()
            
            if (prevNetworkStats.rx > 0 && prevNetworkStats.tx > 0) {
                const timeDiff = (now - prevNetworkStats.timestamp) / 1000 // seconds
                if (timeDiff > 0) {
                    const rxRate = Math.max(0, (rx - prevNetworkStats.rx) / timeDiff / 1024) // KB/s
                    const txRate = Math.max(0, (tx - prevNetworkStats.tx) / timeDiff / 1024) // KB/s
                    
                    networkDownload.set(rxRate)
                    networkUpload.set(txRate)
                }
            }
            
            prevNetworkStats = { rx, tx, timestamp: now }
        } else {
            networkDownload.set(0)
            networkUpload.set(0)
        }
    } catch (error) {
        console.warn("Failed to read network stats:", error)
        networkDownload.set(0)
        networkUpload.set(0)
    }
}

// Performance toggle - set to false to disable system monitoring for maximum performance
const ENABLE_SYSTEM_MONITORING = true

// Poll system stats every 5 seconds (reduced from 2s for better performance)
if (ENABLE_SYSTEM_MONITORING) {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, () => {
        getCpuUsage()
        getRamUsage()
        getNetworkUsage()
        return true
    })

    // Initialize with first reading
    getCpuUsage()
    getRamUsage()
    getNetworkUsage()
}

function CpuUsage() {
    return <box className="CpuUsage" css="min-width: 60px"
        tooltipText={bind(cpuUsage).as(usage => `CPU Usage: ${usage.toFixed(1)}%`)}>
        <icon icon="power-profile-performance-symbolic" />
        <box vertical>
            <label label={bind(cpuUsage).as(usage => `${usage.toFixed(0)}%`)} />
            <levelbar
                value={bind(cpuUsage).as(usage => usage / 100)}
                css="min-width: 40px; min-height: 4px;"
            />
        </box>
    </box>
}

function RamUsage() {
    return <box className="RamUsage" css="min-width: 60px"
        tooltipText={bind(ramUsage).as(usage => `Memory Usage: ${usage.toFixed(1)}%`)}>
        <icon icon="application-x-firmware" />
        <box vertical>
            <label label={bind(ramUsage).as(usage => `${usage.toFixed(0)}%`)} />
            <levelbar
                value={bind(ramUsage).as(usage => usage / 100)}
                css="min-width: 40px; min-height: 4px;"
            />
        </box>
    </box>
}

function NetworkUsage() {
    const formatSpeed = (kbps: number) => {
        if (kbps < 1024) {
            return `${kbps.toFixed(0)}K`
        } else if (kbps < 1024 * 1024) {
            return `${(kbps / 1024).toFixed(1)}M`
        } else {
            return `${(kbps / 1024 / 1024).toFixed(1)}G`
        }
    }

    return <box className="NetworkUsage" css="min-width: 80px"
        tooltipText="Network Usage">
        <icon icon="network-wired" />
        <box vertical>
            <label label={bind(networkDownload).as(down => `↓${formatSpeed(down)}`)} />
            <label label={bind(networkUpload).as(up => `↑${formatSpeed(up)}`)} />
        </box>
    </box>
}

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
        <box className="Wifi">
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
            `${Math.floor(p * 100)}%`
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

function Time({ format = "%H:%M - %A %e.", displayCalendar }: { format?: string, displayCalendar?: Variable<boolean> }) {
    // Reduced polling from 1s to 5s for better performance (time doesn't need to update every second)
    const time = Variable<string>("").poll(5000, () =>
        GLib.DateTime.new_now_local().format(format)!)

    return <button
        className="Time"
        onDestroy={() => time.drop()}
        onClicked={() => displayCalendar?.set(!displayCalendar?.get())}
        tooltipText="Click to open calendar"
        child={<label label={time()} />}
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

function BooruImagesToggle(props: {
    displayBooruImagesToggle?: Variable<boolean | undefined>
}) {
    const { displayBooruImagesToggle } = props

    return <box className="BarButton" visible={displayBooruImagesToggle?.().as(a => a !== undefined) ?? false}>
        {[<button
            onClicked={() => displayBooruImagesToggle?.set(!displayBooruImagesToggle?.get())}
            tooltipText="Booru Images Toggle"
            child={
                // 
                displayBooruImagesToggle?.().as(a => 
                    a !== false
                        ? <icon icon="help-browser-symbolic" css="color: green" />
                        : <icon icon="help-browser-symbolic" css="color: red" />
                ) ?? undefined
            }
            // child={<icon icon="system-log-out" />}
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
    displaySettingsPanel?: Variable<boolean>,
    displayBooruImagesToggle?: Variable<boolean | undefined>,
    displayCalendar?: Variable<boolean>,
}) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
    const {
        displayMediaPlayer,
        displaySystemMenu,
        displaySettingsPanel,
        displayBooruImagesToggle,
        displayCalendar,
    } = variables ?? {}

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
                            {ENABLE_SYSTEM_MONITORING && <CpuUsage />}
                            {ENABLE_SYSTEM_MONITORING && <RamUsage />}
                            {ENABLE_SYSTEM_MONITORING && <NetworkUsage />}
                            {/* <AudioSlider /> */}
                            <Wifi />
                            <BatteryLevel />
                            <Time displayCalendar={displayCalendar} />
                            <BooruImagesToggle displayBooruImagesToggle={displayBooruImagesToggle} />
                            <SettingsButton displaySettingsPanel={displaySettingsPanel} />
                            <SystemMenuButton displaySystemMenu={displaySystemMenu} />
                        </box>
                    </>
                )}
            />
        )}
    />
}
