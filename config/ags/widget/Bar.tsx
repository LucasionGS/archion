import { App, Astal, Gtk, Gdk, Widget } from "astal/gtk3"
import { GObject, Variable } from "astal"
import AstalNetwork from "gi://AstalNetwork";
import Network from "gi://AstalNetwork"
import NM from "gi://NM?version=1.0";
import Hyprland from "gi://AstalHyprland";
import AstalHyprland from "gi://AstalHyprland?version=0.1";

const hyprland = Hyprland.get_default();
let focusedWorkSpaceId = hyprland.focusedWorkspace.id;
const time = Variable("").poll(1000, "date")
const workspaceVar = Variable<AstalHyprland.Workspace[]>([]);
// Watch for workspace changes
workspaceVar.watch("astal-hyprland", (stdout, workspaces) => {
    try {
        // stdout = stdout.replace(/(event|payload):/g, "\"$1\":");
        // print("Workspace output:", stdout.toString());
        // const out = JSON.parse(stdout.toString()) as {
        //     event: string;
        //     payload: string
        // };
        // If it has to do with workspaces, update the variable
        // Parse the output to get the workspaces
        const new_workspaces = hyprland.get_workspaces().sort((a, b) => a.id - b.id);
        setTimeout(() => {
            // Update the focused workspace ID
            focusedWorkSpaceId = hyprland.get_focused_workspace().get_id();
            workspaceVar.set(new_workspaces);
        }, 100); // Wait for the next tick to ensure the workspaces are updated
        return workspaces;
    } catch (error) {
        console.error("Error parsing workspace output:", error);
        return workspaces;
    }
});

export default function Bar(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

    const network = Network.get_default();

    return <window
        className="TopBar"
        gdkmonitor={gdkmonitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}
        application={App}
        child={
            <centerbox>
                <Workspaces />
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
                        // return v;
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
                        return `${dayName} ${monthName} ${day} ${year} ${hour}:${minute}:${second} ${ampm}`;
                    })} />
                </box>
            </centerbox>
        }
        />
}

function Workspaces() {
    const workspaces = workspaceVar();
    
    return <box halign={Gtk.Align.START}>
        {workspaces.as(workspaces => {
            // Get the current focused workspace ID
            const totalToShow = 5; // Total number of workspaces to show
            const halfSize = Math.floor(totalToShow / 2);
            
            // Calculate the range to display, centered around the focused workspace
            let startId = Math.max(1, focusedWorkSpaceId - halfSize);
            const endId = startId + totalToShow - 1;
            
            // Find the maximum workspace ID to avoid showing non-existent workspaces
            const maxId = workspaces.reduce((max, ws) => Math.max(max, ws.get_id()), 0);
            
            // Adjust the range if it extends beyond the max workspace
            if (endId > maxId) {
                startId = Math.max(1, maxId - totalToShow + 1);
            }
            
            // Create an array of workspace IDs to display
            const displayWorkspaceIds = Array.from(
                { length: Math.min(totalToShow, maxId) }, 
                (_, i) => startId + i
            );
            
            return displayWorkspaceIds.map(id => {
                // Find the actual workspace if it exists
                const workspace = workspaces.find(ws => ws.get_id() === id);
                const exists = !!workspace;
                
                return (
                    <button
                        className={`workspace${!exists ? " empty" : ""}${focusedWorkSpaceId === id ? " focused" : ""}`}
                        onClicked={() => {
                            if (exists) {
                                workspace.focus();
                            } else {
                                // Create and switch to this workspace if it doesn't exist
                                hyprland.message(`dispatch workspace ${id}`);
                            }
                        }}
                        child={<label label={exists ? workspace.get_name() : id.toString()} />}
                    />
                );
            });
        })}
    </box>;
}