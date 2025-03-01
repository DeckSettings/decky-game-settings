// Site URLs
import type {PluginConfig} from "./interfaces";

export const reportsApiBaseUrl = "https://deckverified.games/deck-verified/api/v1";
export const reportsWebsiteBaseUrl = "https://deckverified.games/deck-verified";

// List of apps to always filter out
export const ignoreListAppRegex = [
    /^Proton\s\d+\.\d+$/,
    /^Steam Linux Runtime \d+\.\d+\s\(.*\)$/
];
export const ignoreListCompatibilityTools = [
    2180100, // Proton Hotfix
    1493710, // Proton Experimental
    1070560, // Steam Linux Runtime
    1070560, // "Steam Linux Runtime 1.0 (scout)"
    1391110, // "Steam Linux Runtime 2.0 (soldier)"
    1628350, // "Steam Linux Runtime 3.0 (sniper)"
    228980, // "Steamworks Common Redistributables"
]

export const restartSteamClient = (): void => {
    SteamClient.User.StartRestart(false);
}

export const getPluginConfig = (): PluginConfig => {
    const defaultConfig: PluginConfig = {
        filterDevices: [],
        showAllApps: false,
    };
    const dataJson = window.localStorage.getItem("decky-game-settings");
    if (dataJson) {
        try {
            const parsedConfig = JSON.parse(dataJson);
            return {
                ...defaultConfig,
                ...parsedConfig,
            };
        } catch (error) {
            console.error("Failed to parse plugin config:", error);
        }
    }
    return defaultConfig;
}

export const setPluginConfig = (updates: Partial<PluginConfig>): void => {
    const currentConfig = getPluginConfig();
    const newConfig = {
        ...currentConfig,
        ...updates,
    };
    try {
        window.localStorage.setItem("decky-game-settings", JSON.stringify(newConfig));
        console.log("Plugin configuration updated:", newConfig);
    } catch (error) {
        console.error("Failed to save plugin config:", error);
    }
};

export const hasYoutubeLink = (text: string): boolean => {
    const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return regex.test(text);
}
