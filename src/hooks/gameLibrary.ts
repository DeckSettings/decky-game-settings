import {Router} from "@decky/ui"
import {ignoreListAppRegex, ignoreListCompatibilityTools} from "../constants";
import type {GameInfo} from "../interfaces";

export const getGamesList = async () => {
    const installFolders = await SteamClient.InstallFolder.GetInstallFolders();
    const installedGames: Required<GameInfo>[] = [];
    const nonInstalledGames: Required<GameInfo>[] = [];
    const currentRunningGame = Router.MainRunningApp;
    let runningGame: GameInfo | null = null;
    const installedAppIds = new Set<number>();

    installFolders.forEach((folder) => {
        folder.vecApps.forEach((app) => {
            if (
                !ignoreListCompatibilityTools.includes(app.nAppID) &&
                !ignoreListAppRegex.some(regex => regex.test(app.strAppName))
            ) {
                if (
                    !runningGame &&
                    currentRunningGame?.appid == app.nAppID.toString()
                ) {
                    runningGame = {
                        title: app.strAppName,
                        appId: app.nAppID,
                    };
                }
                installedGames.push({
                    title: app.strAppName,
                    appId: app.nAppID,
                    sortAs: app.strSortAs,
                });
                installedAppIds.add(app.nAppID);
            }
        });
    });
    installedGames.sort((a, b) => (a.sortAs ? (a.sortAs > b.sortAs ? 1 : -1) : 0));

    const allApps = (window as any).collectionStore.allGamesCollection.allApps;
    allApps.forEach((app: any) => {
        if (
            !ignoreListCompatibilityTools.includes(app.nAppID) &&
            !ignoreListAppRegex.some(regex => regex.test(app.strAppName)) &&
            !installedAppIds.has(app.appid)
        ) {
            const gameInfo: Required<GameInfo> = {
                title: app.display_name,
                appId: app.appid,
                sortAs: app.sort_as,
            };
            nonInstalledGames.push(gameInfo);
        }
    });
    nonInstalledGames.sort((a, b) => (a.sortAs > b.sortAs ? 1 : -1));

    // If runningGame was not set, but currentRunningGame has a display_name, set the runningGame title.
    // Here, we cannot trust the appId is the real game appId. So leave it off.
    // The API will handle things via just game name if it is correct and without typos.
    if (!runningGame && currentRunningGame && currentRunningGame.display_name.trim() !== "") {
        runningGame = {
            title: currentRunningGame.display_name,
        };
    }

    return {runningGame, installedGames, nonInstalledGames};
}
