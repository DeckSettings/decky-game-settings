import {
  staticClasses
} from "@decky/ui";
import {
  definePlugin,
  // routerHook
} from "@decky/api"
import { FaShip } from "react-icons/fa";
import QuickAccessView from "./components/QuickAccessView";

// import logo from "../assets/logo.png";

export default definePlugin(() => {
  console.log("Plugin initializing, this is called once on frontend startup")

  return {
    // The name shown in various decky menus
    name: "DeckyGameSettings",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>Game Settings</div>,
    // The content of your plugin's menu
    content: <QuickAccessView />,
    // The icon displayed in the plugin list
    icon: <FaShip />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("Unloading")
    },
  };
});
