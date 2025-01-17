import {Router} from "decky-frontend-lib";
import {appsToIgnore, ignoreSteam} from "../constants";
import type {GameInfo} from "../interfaces";

export const getInstalledGames = async () => {
    const installFolders = await SteamClient.InstallFolder.GetInstallFolders();
    const games: Required<GameInfo>[] = [];
    const currentRunningGame = Router.MainRunningApp;
    let runningGame: GameInfo | null = null;

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
    return {games, runningGame};
};
