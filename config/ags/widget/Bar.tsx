import { App, Astal, Gtk, Gdk, Widget } from "astal/gtk3"
import { GObject, Variable } from "astal"
import AstalNetwork from "gi://AstalNetwork";
import Network from "gi://AstalNetwork"
import NM from "gi://NM?version=1.0";
import Hyprland from "gi://AstalHyprland";

const time = Variable("").poll(1000, "date")

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;
    // const apps = new Apps.Apps({
    //     nameMultiplier: 2,
    //     entryMultiplier: 0,
    //     executableMultiplier: 0,
    // });

    // for (const app of apps.fuzzy_query("google")) {
    //     print(app.name);
    // }

    const network = Network.get_default();

    const hyprland = Hyprland.get_default();
    const workspaces = hyprland.workspaces.reverse();

    // Listen for workspace changes
    hyprland.bind_property(
        "workspaces",
        hyprland,
        "workspaces",
        GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.BIDIRECTIONAL
    );
    
    return <window
        className="TopBar"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}
        application={App}
        child={
            <centerbox>
                <box
                    halign={Gtk.Align.START}
                >
                    {workspaces.map((workspace, index) => (
                        <button
                            className="workspace"
                            onClicked={() => workspace.focus()}
                            child={<label label={workspace.name} />}
                        />
                    ))}
                </box>
                <button
                    className="red"
                    onClicked="kitty"
                    child={<label label="Terminal" />}
                />
                <box
                    halign={Gtk.Align.END}
                >
                    <label
                        label={
                            network.wired.state === AstalNetwork.DeviceState.ACTIVATED
                                ? "Wired"
                                : (
                                    network.wifi?.ssid ? network.wifi.ssid : "No internet"
                                )
                        }
                    />
                    <label halign={Gtk.Align.END} label={time().as(v => {
                        const [
                            _,
                            dayName,
                            monthName,
                            day,
                            hour,
                            minute,
                            second,
                            ampm,
                            zone,
                            year
                        ] = v.match(/(\w+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)\s+(AM|PM)\s+(\w+)\s+(\d+)/) || [];

                        // return `${dayName}, ${monthName} ${day}, ${year} ${hour}:${minute}:${second} ${ampm}`;
                        return `${hour}:${minute}:${second} ${ampm}`;
                    })} />
                </box>
            </centerbox>
        }
        />
}
