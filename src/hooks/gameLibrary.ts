import { Router } from "decky-frontend-lib";

// Define the GameInfo interface
export interface GameInfo {
    title: string;
    appId: number;
    sortAs?: string;
}

// Lists of apps to ignore
export const ignoreSteam = [
    2180100, // Proton Hotfix
    1493710, // Proton Experimental
    1070560, // Steam Linux Runtime
    1070560, // "Steam Linux Runtime 1.0 (scout)"
    1391110, // "Steam Linux Runtime 2.0 (soldier)"
    1628350, // "Steam Linux Runtime 3.0 (sniper)"
    228980, // "Steamworks Common Redistributables"
]
const appsToIgnore = [
    /^Proton\s\d+\.\d+$/,
    /^Steam Linux Runtime \d+\.\d+\s\(.*\)$/
];

export const getInstalledGames = async () => {
    const installFolders = await SteamClient.InstallFolder.GetInstallFolders();
    const games: Required<GameInfo>[] = [];
    const currentRunningGame = Router.MainRunningApp;
    let runningGame: GameInfo | null = null;
    console.log(currentRunningGame)

    installFolders.forEach((folder) => {
        folder.vecApps.forEach((app) => {
            if (!ignoreSteam.includes(app.nAppID) && !appsToIgnore.some(regex => regex.test(app.strAppName))) {
                if (
                    !runningGame &&
                    currentRunningGame?.appid == app.nAppID.toString()
                ) {
                    runningGame = {
                        title: app.strAppName,
                        appId: app.nAppID,
                    };
                }
                games.push({
                    title: app.strAppName,
                    appId: app.nAppID,
                    sortAs: app.strSortAs,
                });
            }
        });
    });

    games.sort((a, b) => (a.sortAs ? (a.sortAs > b.sortAs ? 1 : -1) : 0));
    return { games, runningGame };
};