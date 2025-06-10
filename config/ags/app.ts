import { App, Widget } from "astal/gtk3"
import style from "./style.scss"

import Applauncher from "./widgets/applauncher/Applauncher";
import MprisPlayers from "./widgets/media-player/MediaPlayer";
import OSD from "./widgets/osd/OSD";
import Bar from "./widgets/simple-bar/Bar";
import NotificationPopups from "./widgets/notifications/NotificationPopups";

App.start({
    css: style,
    requestHandler(request, res) {
        print(request)
        res("ok")
    },
    main() {
        // Initialize widgets
        // Applauncher();
        new Widget.Window({}, MprisPlayers());
        App.get_monitors().forEach(monitor => {
            // try {
            //     OSD(monitor);
            // } catch (error) {
            //     console.error("Failed to initialize OSD:", error);
            // }
            Bar(monitor);
            NotificationPopups(monitor);
        });
    }
})
