import {Router} from "decky-frontend-lib";
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
            if (!ignoreListCompatibilityTools.includes(app.nAppID) && !ignoreListAppRegex.some(regex => regex.test(app.strAppName))) {
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
    nonInstalledGames.sort((a, b) => (a.sortAs > b.sortAs ? 1 : -1))

    return {runningGame, installedGames, nonInstalledGames};
}
