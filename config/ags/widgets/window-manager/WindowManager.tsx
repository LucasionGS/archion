import { Astal, Gtk } from "astal/gtk3"
import { bind, Binding, Variable } from "astal"
import Hyprland from "gi://AstalHyprland"

export class WindowManagerController {
    public static navigateNext: () => void
    public static navigatePrev: () => void
    public static selectCurrent: () => void
}

interface WorkspaceClientProps {
    client: Hyprland.Client
    isActive: Binding<boolean>
    onSelect: () => void
}

const workspaceContainerWidth: number[] = [];

function WorkspaceClient({ client, isActive, onSelect }: WorkspaceClientProps) {
    return (
        <button
            className={isActive.as(isActive => `window-manager-client ${isActive ? "active" : ""}`)}
            onClicked={onSelect}
            child={
                <box vertical spacing={8}>
                    <icon
                        icon={bind(client, "class").as((cls) => getIconForClass(cls || ""))}
                        iconSize={48}
                    />
                    <label
                        className="client-title"
                        label={bind(client, "title").as((title) =>
                            title.length > 18 ? title.substring(0, 18) + "..." : title
                        )}
                    />
                    <label
                        className="client-class"
                        label={bind(client, "class").as((cls) => cls || "Unknown")}
                    />
                </box>
            }
        />
    )
}

function getIconForClass(className: string): string {
    const iconMap: { [key: string]: string } = {
        "firefox": "firefox",
        "chromium": "chromium",
        "google-chrome": "google-chrome",
        "code": "visual-studio-code",
        "code-oss": "visual-studio-code",
        "kitty": "terminal",
        "alacritty": "terminal",
        "foot": "terminal",
        "thunar": "folder",
        "nautilus": "folder",
        "dolphin": "folder",
        "discord": "discord",
        "spotify": "spotify",
        "steam": "steam",
        "gimp": "gimp",
        "inkscape": "inkscape",
        "libreoffice": "libreoffice-startcenter",
        "vlc": "vlc",
        "mpv": "multimedia-video-player",
        "obs": "obs",
        "telegram": "telegram",
        "whatsapp": "whatsapp",
        "signal": "signal-desktop",
    }

    const lowerClass = className.toLowerCase()
    return iconMap[lowerClass] || "application-x-executable"
}

interface WorkspaceContainerProps {
    workspace: Hyprland.Workspace
    selectedWorkspaceIndex: Variable<number>
    selectedClientIndex: Variable<number>
    selectedWorkspaceAndClientIndex: Variable<[number, number]>
    workspaceIndex: number
    onClientSelect: (clientIndex: number) => void
}

function WorkspaceContainer({
    workspace,
    selectedWorkspaceIndex,
    selectedClientIndex,
    selectedWorkspaceAndClientIndex,
    workspaceIndex,
    onClientSelect
}: WorkspaceContainerProps) {
    const clients = bind(workspace, "clients")

    return (
        <box className="window-manager-workspace" vertical spacing={12} onDraw={(box) => {
            workspaceContainerWidth[workspaceIndex] = box.get_allocated_width();
        }}>
            <box className="workspace-header">
                <icon
                    icon="applications-system"
                    iconSize={20}
                    className="workspace-icon"
                />
                <label
                    className="workspace-name"
                    label={`Workspace ${workspace.id}${workspace.name ? ` - ${workspace.name}` : ""}`}
                />
                <label
                    className="client-count"
                    label={clients.as(c => `${c.length} window${c.length !== 1 ? 's' : ''}`)}
                />
            </box>
            <box className="workspace-clients" spacing={16}>
                {clients.as(clientList =>
                    clientList.map((client, index) => {
                        const isActive = bind(selectedWorkspaceAndClientIndex).as(([wsIndex, cIndex]) => {
                            if (wsIndex !== workspaceIndex) return false
                            return cIndex === index;
                        })

                        return (
                            <WorkspaceClient
                                client={client}
                                isActive={isActive}
                                onSelect={() => onClientSelect(index)}
                            />
                        )
                    })
                )}
            </box>
        </box>
    )
}

function WindowManagerContent({ visible }: { visible: Variable<boolean> }) {
    const hypr = Hyprland.get_default()
    const selectedWorkspaceIndex = Variable(0)
    const selectedClientIndex = Variable(0)
    const selectedWorkspaceAndClientIndex: Variable<[number, number]> = Variable([0, 0]); // Should be read only
    const scrollAdjustment = Gtk.Adjustment.new(0, 0, 100, 1, 10, 0);

    selectedClientIndex.subscribe(
        () => selectedWorkspaceAndClientIndex.set([
            selectedWorkspaceIndex.get(),
            selectedClientIndex.get()
        ])
    )
    selectedWorkspaceIndex.subscribe(
        () => selectedWorkspaceAndClientIndex.set([
            selectedWorkspaceIndex.get(),
            selectedClientIndex.get()
        ])
    )

    // Get workspaces with clients only
    const workspacesWithClients = bind(hypr, "workspaces").as(workspaces =>
        workspaces
        .filter(ws => !(ws.id >= -99 && ws.id <= -2)) // Filter special workspaces
        .filter(ws => ws.get_clients().length > 0) // Only workspaces with clients
        .sort((a, b) => a.id - b.id)
    )
    
    selectedWorkspaceAndClientIndex.subscribe(([wsIndex, clientIndex]) => {
        // Get size of workspaces and clients
        const clientsPrior = workspaceContainerWidth.slice(0, wsIndex).reduce((a, b) => a + b + 6, 0);
        scrollAdjustment.set_value(clientsPrior);

        print(`Selected workspace: ${wsIndex}`);
    });

    // Reset selection when widget becomes visible
    visible.subscribe(isVisible => {
        if (isVisible) {
            const workspaces = hypr.get_workspaces()
                .filter(ws => !(ws.id >= -99 && ws.id <= -2))
                .filter(ws => ws.get_clients().length > 0)
                .sort((a, b) => a.id - b.id);

            // Find current workspace index
            const currentWorkspace = hypr.get_focused_workspace()
            const currentWorkspaceIndex = workspaces.findIndex(ws => ws.id === currentWorkspace.id)

            selectedWorkspaceIndex.set(Math.max(0, currentWorkspaceIndex))

            // Find focused client in the current workspace
            const currentClient = hypr.get_focused_client()
            const currentWorkspaceClients = workspaces[selectedWorkspaceIndex.get()]?.get_clients() || [];
            const currentClientIndex = currentWorkspaceClients.findIndex(client => client.address === currentClient.address)
            print(`Current client index: ${currentClientIndex}`)
            selectedClientIndex.set(Math.max(0, currentClientIndex))
        }
    })

    const navigateNext = () => {
        const workspaces = hypr.get_workspaces()
            .filter(ws => !(ws.id >= -99 && ws.id <= -2))
            .filter(ws => ws.get_clients().length > 0)
            .sort((a, b) => a.id - b.id);

        if (workspaces.length === 0) return

        const currentWorkspaceIndex = selectedWorkspaceIndex.get()
        const currentClientIndex = selectedClientIndex.get()
        const currentWorkspace = workspaces[currentWorkspaceIndex]

        if (!currentWorkspace) return

        const clients = currentWorkspace.get_clients()

        if (currentClientIndex < clients.length - 1) {
            selectedClientIndex.set(currentClientIndex + 1)
        } else if (currentWorkspaceIndex < workspaces.length - 1) {
            selectedWorkspaceIndex.set(currentWorkspaceIndex + 1)
            selectedClientIndex.set(0)
        } else {
            // Wrap to first workspace, first client
            selectedWorkspaceIndex.set(0)
            selectedClientIndex.set(0)
        }
    }

    const navigatePrev = () => {
        const workspaces = hypr.get_workspaces()
            .filter(ws => !(ws.id >= -99 && ws.id <= -2))
            .filter(ws => ws.get_clients().length > 0)
            .sort((a, b) => a.id - b.id);

        if (workspaces.length === 0) return

        const currentWorkspaceIndex = selectedWorkspaceIndex.get()
        const currentClientIndex = selectedClientIndex.get()

        if (currentClientIndex > 0) {
            selectedClientIndex.set(currentClientIndex - 1)
        } else if (currentWorkspaceIndex > 0) {
            selectedWorkspaceIndex.set(currentWorkspaceIndex - 1)
            const prevWorkspace = workspaces[currentWorkspaceIndex - 1]
            selectedClientIndex.set(Math.max(0, prevWorkspace.get_clients().length - 1))
        } else {
            // Wrap to last workspace, last client
            selectedWorkspaceIndex.set(workspaces.length - 1)
            const lastWorkspace = workspaces[workspaces.length - 1]
            selectedClientIndex.set(Math.max(0, lastWorkspace.get_clients().length - 1))
        }
    }

    const selectCurrent = () => {
        const workspaces = hypr.get_workspaces()
            .filter(ws => !(ws.id >= -99 && ws.id <= -2))
            .filter(ws => ws.get_clients().length > 0)
            .sort((a, b) => a.id - b.id);

        const workspace = workspaces[selectedWorkspaceIndex.get()]
        const client = workspace?.get_clients()[selectedClientIndex.get()]

        if (client) {
            client.focus()
            visible.set(false)
        }
    }

    WindowManagerController.navigateNext = navigateNext
    WindowManagerController.navigatePrev = navigatePrev
    WindowManagerController.selectCurrent = selectCurrent

    return (
        <box className="window-manager-container" vertical spacing={20}>
            <box className="window-manager-header">
                {[<icon icon="preferences-system-windows" iconSize={24} />]}
            </box>
            
            <scrollable
                hadjustment={scrollAdjustment}
                className="window-manager-scroll"
                hscroll={Gtk.PolicyType.ALWAYS}
                vscroll={Gtk.PolicyType.NEVER}
                vexpand
                child={
                    <box className="window-manager-workspaces" spacing={24}>
                        {bind(workspacesWithClients).as(workspaces =>
                            workspaces.map((workspace, workspaceIndex) => (
                                <WorkspaceContainer
                                    workspace={workspace}
                                    selectedWorkspaceIndex={selectedWorkspaceIndex}
                                    selectedClientIndex={selectedClientIndex}
                                    selectedWorkspaceAndClientIndex={selectedWorkspaceAndClientIndex}
                                    workspaceIndex={workspaceIndex}
                                    onClientSelect={(clientIndex) => {
                                        selectedWorkspaceIndex.set(workspaceIndex)
                                        selectedClientIndex.set(clientIndex)
                                        selectCurrent()
                                    }}
                                />
                            ))
                        )}
                    </box>
                }
            />

            <box className="window-manager-controls" spacing={12}>
                <button
                    className="window-manager-control-button"
                    onClicked={navigatePrev}
                    child={
                        <box spacing={4}>
                            <icon icon="go-previous" iconSize={16} />
                            <label label="Prev" />
                        </box>
                    }
                />
                <button
                    className="window-manager-control-button primary"
                    onClicked={selectCurrent}
                    child={
                        <box spacing={4}>
                            <icon icon="dialog-ok" iconSize={16} />
                            <label label="Select" />
                        </box>
                    }
                />
                <button
                    className="window-manager-control-button"
                    onClicked={navigateNext}
                    child={
                        <box spacing={4}>
                            <icon icon="go-next" iconSize={16} />
                            <label label="Next" />
                        </box>
                    }
                />
            </box>
        </box>
    )
}

export default function WindowManager(show: Variable<boolean>) {
    return (
        <box
            visible={bind(show)}
            className="WindowManager"
            child={<WindowManagerContent visible={show} />}
        />
    )
}
