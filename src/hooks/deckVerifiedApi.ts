import {reportsApiBaseUrl} from "../constants";
import type {GameDetails} from "../constants";
import {fetchNoCors} from "@decky/api";
import type {GameInfo, GameSearchResult} from "../interfaces";

export const fetchGameDataByAppId = async (appId: number): Promise<GameDetails | null> => {
    const url = `${reportsApiBaseUrl}/game_details?appid=${appId}&include_external=false`;
    const res = await fetchNoCors(url, {
        method: 'GET'
    });
    return await res.json() as GameDetails;
}

export const fetchGameDataByGameName = async (gameName: string): Promise<GameDetails | null> => {
    const url = `${reportsApiBaseUrl}/game_details?name=${gameName}&include_external=false`;
    const res = await fetchNoCors(url, {
        method: 'GET'
    });
    return await res.json() as GameDetails;
}

export const getGamesBySearchTerm = async (term: string): Promise<GameInfo[] | null> => {
    const url = `${reportsApiBaseUrl}/search_games?term=${term}&include_external=true`
    if (!term && term.trim().length < 3) {
        return []
    }
    const res = await fetchNoCors(url, {
        method: 'GET'
    });
    const data = await res.json() as GameSearchResult[];
    const results: GameInfo[] = [];
    data.forEach((app) => {
        results.push({
            title: app.gameName,
            appId: app.appId,
        });
    });
    return results
}