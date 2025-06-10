import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"

import "./widgets/applauncher/app";
import "./widgets/media-player/app";
import "./widgets/osd/app";
import "./widgets/popover/app";
import "./widgets/simple-bar/app";
import "./widgets/notifications/app";

App.start({
    css: style,
    main() {
        App.get_monitors().map(Bar)
    },
    requestHandler(request, res) {
        const args = request.split(" ");
        const cmd = args.shift();
        switch (cmd) {
            case "start-menu": {
                // Toggle sidebar visibility
                if (args.length > 0 && args[0] === "show") {
                    globalThis.toggleStartMenu(true);
                } else if (args.length > 0 && args[0] === "hide") {
                    globalThis.toggleStartMenu(false);
                } else {
                    globalThis.toggleStartMenu();
                }
                break;
            }
        }

        res("ok");
    },
})
