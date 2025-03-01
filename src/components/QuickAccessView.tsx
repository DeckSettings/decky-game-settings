import React, {useEffect, useState} from 'react';
import GameSelectView from "./GameSelectView";
import GameDetailsView from "./GameDetailsView";
import SearchResultsView from "./SearchResultsView";
import type {GameInfo, PluginPage} from "../interfaces";
import PluginConfigView from "./PluginConfigView";
import {Footer} from "./elements/authorFooter";

const QuickAccessView: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<PluginPage>("game_select");
    const changePage = (page: PluginPage) => {
        console.log(`[QuickAccessView] Changing page to: ${page}`);
        setCurrentPage(page);
    };

    const [gameSearchText, setGameSearchText] = useState<string>("");
    const handleSearch = (searchText: string) => {
        console.log(`[QuickAccessView] Setting search text: ${searchText}`);
        setGameSearchText(searchText);
        setSelectedGame(null);
        changePage("search_results");
    };

    const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
    const handleGameSelect = (game: GameInfo) => {
        setSelectedGame(game);
        changePage("game_data");
    };

    useEffect(() => {
        console.log(`[QuickAccessView] Current page changed to: ${currentPage}`);
    }, [currentPage]);

    return (
        <div>
            {currentPage === "plugin_config" && (
                <PluginConfigView
                    onGoBack={() => changePage("game_select")}
                />
            )}
            {currentPage === "game_select" && (
                <GameSelectView
                    onGameSelect={handleGameSelect}
                    onSearch={handleSearch}
                    onChangePage={changePage}
                />
            )}
            {currentPage === "search_results" && (
                <SearchResultsView
                    query={gameSearchText}
                    onGameSelect={handleGameSelect}
                    onSearch={handleSearch}
                    onGoBack={() => changePage("game_select")}
                />
            )}
            {currentPage === "game_data" && selectedGame && (
                <GameDetailsView
                    gameName={selectedGame.title}
                    appId={selectedGame.appId}
                    onGoBack={() => changePage("game_select")}
                />
            )}

            {/* Footer */}
            <Footer/>
        </div>
    );
};

export default QuickAccessView;
