import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk4"
import style from "./style.scss"

import Applauncher from "./widgets/applauncher/Applauncher";
import MprisPlayers from "./widgets/media-player/MediaPlayer";
import OSD from "./widgets/osd/OSD";
import Bar from "./widgets/bar/Bar";
import NotificationPopups from "./widgets/notifications/NotificationPopups";
import SystemMenu from "./widgets/system-menu/SystemMenu";
// import SettingsPanel from "./widgets/settings-panel/SettingsPanel";
import WindowManager, { WindowManagerController } from "./widgets/window-manager/WindowManager";
import BackgroundImages, { BackgroundImageConfig, updateConfig as updateBgConfig } from "./widgets/background-images/BackgroundImages";
import Calendar from "./widgets/calendar/Calendar";
import { bind, execAsync, Variable, readFile, readFileAsync, exec, monitorFile, writeFileAsync } from "astal";
import AstalHyprland from "gi://AstalHyprland";
import app from "astal/gtk4/app";

// const hypr = AstalHyprland.get_default();

export const HOME = exec(["bash", "-c", "realpath ~"]);
export const CONFIG_DIR = HOME + "/.config/ags/configs"

const displayMediaPlayer = new Variable(false);
const displaySystemMenu = new Variable(false);
const displaySettingsPanel = new Variable(false);
const displayWindowManager = new Variable(false);
const displayBooruImagesToggle = new Variable<boolean | undefined>(undefined);
const displayCalendar = new Variable(false);

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

            case "calendar":
                toggleBoolVar(displayCalendar, args[0] as any);
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
        
        const initialize = (monitor: Gdk.Monitor) => {
            // Initialize widgets
            // Applauncher();
            Widget.Window({
                gdkmonitor: monitor,
                anchor: TOP,
                exclusivity: Astal.Exclusivity.NORMAL,
                child: MprisPlayers(displayMediaPlayer)
            });
            Widget.Window({
                gdkmonitor: monitor,
                anchor: TOP | RIGHT,
                exclusivity: Astal.Exclusivity.NORMAL,
                child: SystemMenu(displaySystemMenu)
            });

            // Calendar widget
            Calendar({ displayCalendar });
            
            // Settings Panel - centered overlay
            // SettingsPanel(displaySettingsPanel);
            try {
                OSD(monitor);
            } catch (error) {
                console.error("Failed to initialize OSD:", error);
            }
            Bar(monitor, {
                displayMediaPlayer,
                displaySystemMenu,
                displaySettingsPanel,
                displayBooruImagesToggle,
                displayCalendar
            });
            NotificationPopups(monitor);

            Widget.Window({
                gdkmonitor: monitor,
                anchor: 0, // No anchor, will be centered 
                exclusivity: Astal.Exclusivity.IGNORE,
                keymode: Astal.Keymode.ON_DEMAND,
                child: WindowManager(displayWindowManager)
            });

            try {
                // Get booru collector config
                const booruConfig = getConfig("booru-collector");
                
                // Initialize background images
                Widget.Window({
                    gdkmonitor: monitor,
                    anchor: 0, // No anchor, will be at the bottom layer
                    exclusivity: Astal.Exclusivity.EXCLUSIVE,
                    layer: Astal.Layer.BACKGROUND,
                    child: BackgroundImages(booruConfig)
                });

                displayBooruImagesToggle.set(booruConfig.enabled ?? true);

                monitorFile(CONFIG_DIR + "/booru-collector.json", async () => {
                    try {
                        const newConfig = getConfig("booru-collector");
                        updateBgConfig(newConfig);
                        displayBooruImagesToggle.set(newConfig.enabled ?? true);
                    } catch (error) {
                        console.error("Failed to update booru collector config:", error);
                    }
                });

                displayBooruImagesToggle.subscribe(async (enabled) => {
                    if (enabled === undefined) return;
                    try {
                        const config = getConfig("booru-collector");
                        config.enabled = enabled;
                        await writeFileAsync(CONFIG_DIR + "/booru-collector.json", JSON.stringify(config, null, 2));
                    } catch (error) {
                        console.error("Failed to update booru collector config file:", error);
                    }
                });
            } catch (error) {
                displayBooruImagesToggle.set(undefined);
            }
        };
        
        App.get_monitors().forEach(initialize);
        // When new monitors are added, reloading ags is required
        App.connect("monitor-added", (event, monitor) => {
            initialize(monitor);
        });
        App.connect("monitor-removed", (event, monitor) => {
            // Handle monitor removal if necessary
            console.log("Monitor removed:", monitor);
        });
    }
})

interface ConfigTypes {
    "booru-collector": BackgroundImageConfig
}

function getConfig<T extends keyof ConfigTypes>(name: T): ConfigTypes[T] {
    const path = HOME + "/.config/ags/configs/" + name + ".json";
    const config = readFile(path);
    if (!config) {
        throw new Error("No config found");
    }
    return JSON.parse(config);
}