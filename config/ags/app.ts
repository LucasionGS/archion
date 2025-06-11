import { App, Astal, Gtk, Widget } from "astal/gtk3"
import style from "./style.scss"

import Applauncher from "./widgets/applauncher/Applauncher";
import MprisPlayers from "./widgets/media-player/MediaPlayer";
import OSD from "./widgets/osd/OSD";
import Bar from "./widgets/simple-bar/Bar";
import NotificationPopups from "./widgets/notifications/NotificationPopups";
import SystemMenu from "./widgets/system-menu/SystemMenu";
import { Variable } from "astal";

const displayMediaPlayer = new Variable(false);
const displaySystemMenu = new Variable(true);

App.start({
    css: style,
    requestHandler(request, res) {
        print(request)
        res("ok")
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
        App.get_monitors().forEach(monitor => {
            // try {
            //     OSD(monitor);
            // } catch (error) {
            //     console.error("Failed to initialize OSD:", error);
            // }
            Bar(monitor, {
                displayMediaPlayer,
                displaySystemMenu
            });
            NotificationPopups(monitor);
        });
    }
})
