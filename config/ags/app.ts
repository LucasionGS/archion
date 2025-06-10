import { App, Astal, Gtk, Widget } from "astal/gtk3"
import style from "./style.scss"

import Applauncher from "./widgets/applauncher/Applauncher";
import MprisPlayers from "./widgets/media-player/MediaPlayer";
import OSD from "./widgets/osd/OSD";
import Bar from "./widgets/simple-bar/Bar";
import NotificationPopups from "./widgets/notifications/NotificationPopups";
import { Variable } from "astal";

const displayMediaPlayer = new Variable(false);

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
                exclusivity: Astal.Exclusivity.NORMAL,
                // onButtonPressEvent: (self, event) => {
                //     const [, _x, _y] = event.get_coords()
                //     const { x, y, width, height } = self
                //         .get_child()!
                //         .get_allocation()

                //     const xOut = _x < x || _x > x + width
                //     const yOut = _y < y || _y > y + height

                //     print("Clicked outside:", xOut, yOut);

                //     // clicked outside
                //     if (xOut || yOut) {
                //         displayMediaPlayer.set(false);
                //     }
                // }
            },
            MprisPlayers(displayMediaPlayer)
        );
        App.get_monitors().forEach(monitor => {
            // try {
            //     OSD(monitor);
            // } catch (error) {
            //     console.error("Failed to initialize OSD:", error);
            // }
            Bar(monitor, {
                displayMediaPlayer
            });
            NotificationPopups(monitor);
        });
    }
})
