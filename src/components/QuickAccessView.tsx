import React, {useEffect, useState} from 'react';
import GameSelectView from "./GameSelectView";
import GameDataView from "./GameDetailsView";
import SearchResultsView from "./SearchResultsView";
import type {GameInfo} from "../interfaces";

type Page = "game_select" | "search_results" | "game_data";


const QuickAccessView: React.FC = () => {

    //const setShowSettings = () => {
    //    console.log(`[QuickAccessView] Show Plugin Settings`);
    //};

    const [currentPage, setCurrentPage] = useState<Page>("game_select");
    const changePage = (page: Page) => {
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
            {currentPage === "game_select" && (
                <GameSelectView
                    onGameSelect={handleGameSelect}
                    onSearch={handleSearch}
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
                <GameDataView
                    gameName={selectedGame.title}
                    appId={selectedGame.appId}
                    onGoBack={() => changePage("game_select")}
                />
            )}
        </div>
    )
        ;
};

export default QuickAccessView;
