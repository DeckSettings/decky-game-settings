import {
    staticClasses
} from "@decky/ui";
import {
    definePlugin,
} from "@decky/api"
import {MdTune} from "react-icons/md";
import QuickAccessMenuRouter from "./components/QuickAccessMenuRouter";

export default definePlugin(() => {
    console.log("Plugin initializing, this is called once on frontend startup")

    return {
        // The name shown in various decky menus
        name: "DeckyGameSettings",
        // The element displayed at the top of your plugin's menu
        titleView: <div>Deck Settings</div>,
        // Preserve the plugin's state while the QAM is closed
        alwaysRender: true,
        // The content of your plugin's menu
        content: <QuickAccessMenuRouter/>,
        // The icon displayed in the plugin list
        icon: <MdTune/>,
        // The function triggered when your plugin unloads
        onDismount() {
            console.log("Unloading")
        },
    };
});
