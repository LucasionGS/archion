import { App, Astal, Gtk, Widget } from "astal/gtk3"
import style from "./style.scss"

import Applauncher from "./widgets/applauncher/Applauncher";
import MprisPlayers from "./widgets/media-player/MediaPlayer";
import OSD from "./widgets/osd/OSD";
import Bar from "./widgets/simple-bar/Bar";
import NotificationPopups from "./widgets/notifications/NotificationPopups";
import SystemMenu from "./widgets/system-menu/SystemMenu";
import SettingsPanel from "./widgets/settings-panel/SettingsPanel";
import WindowManager, { WindowManagerController } from "./widgets/window-manager/WindowManager";
import { bind, Variable } from "astal";
import AstalHyprland from "gi://AstalHyprland";
import app from "astal/gtk3/app";

const hypr = AstalHyprland.get_default();

const displayMediaPlayer = new Variable(false);
const displaySystemMenu = new Variable(false);
const displaySettingsPanel = new Variable(false);
const displayWindowManager = new Variable(false);

const toggleBoolVar = (variable: Variable<boolean>, state: "toggle" | "show" | "hide") => {
    switch (state) {
        case "toggle":
            variable.set(!variable.get());
            break;
        case "show":
            variable.set(true);
            break;
        case "hide":
            variable.set(false);
            break;
        default:
            console.warn(`Unknown state: ${state}`);
            break;
    }
}

App.start({
    css: style,
    requestHandler(request, res) {
        const args = request.split(" ").map(arg => arg.trim()).filter(arg => arg.length > 0);
        const cmd = args.shift();
        switch (cmd) {
            case "settings":
                toggleBoolVar(displaySettingsPanel, args[0] as any);
                break;
        
            case "media":
                toggleBoolVar(displayMediaPlayer, args[0] as any);
                break;

            case "system":
                toggleBoolVar(displaySystemMenu, args[0] as any);
                break;

            case "window-manager":
                if (args[0] == "toggle" || args[0] == "show" || args[0] == "hide") {
                    toggleBoolVar(displayWindowManager, args[0] as any);
                }

                switch (args[0]) {
                    case "next":
                        WindowManagerController.navigateNext();
                        break;
                    case "previous":
                        WindowManagerController.navigatePrev();
                        break;
                    case "select":
                        WindowManagerController.selectCurrent();
                        break;
                    case "state":
                        return res(displayWindowManager.get() ? "open" : "closed");
                }
                
                break;
                
            default:
                break;
        }

        
        return res("ok")
    },
    main() {
        const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor;
        // Initialize widgets
        // Applauncher();
        new Widget.Window(
            {
                anchor: TOP,
                exclusivity: Astal.Exclusivity.NORMAL
            },
            MprisPlayers(displayMediaPlayer)
        );
        new Widget.Window(
            {
                anchor: TOP | RIGHT,
                exclusivity: Astal.Exclusivity.NORMAL
            },
            SystemMenu(displaySystemMenu)
        );
        
        // Settings Panel - centered overlay
        SettingsPanel(displaySettingsPanel);
        
        // Window Manager - centered overlay
        // new Widget.Window(
        //     {
        //         // gdkmonitor: bind(hypr!, "focusedMonitor").as(m => app.get_monitors().find(monitor => monitor === m.id)),
        //         anchor: 0, // No anchor, will be centered 
        //         exclusivity: Astal.Exclusivity.IGNORE,
        //         keymode: Astal.Keymode.ON_DEMAND
        //     },
        //     WindowManager(displayWindowManager)
        // );
        
        App.get_monitors().forEach(monitor => {
            // try {
            //     OSD(monitor);
            // } catch (error) {
            //     console.error("Failed to initialize OSD:", error);
            // }
            Bar(monitor, {
                displayMediaPlayer,
                displaySystemMenu,
                displaySettingsPanel
            });
            NotificationPopups(monitor);

            new Widget.Window(
                {
                    gdkmonitor: monitor,
                    anchor: 0, // No anchor, will be centered 
                    exclusivity: Astal.Exclusivity.IGNORE,
                    keymode: Astal.Keymode.ON_DEMAND
                },
                WindowManager(displayWindowManager)
            );
        });
    }
})
