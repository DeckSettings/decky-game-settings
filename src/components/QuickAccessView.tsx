import React, {useState} from 'react';
import type {GameInfo} from "../hooks/gameLibrary"
import GameSelectView from "./GameSelectView";
import GameDataView from "./GameDetailsView";


const QuickAccessView: React.FC = () => {

    const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);

    const handleGameSelect = (game: GameInfo) => {
        setSelectedGame(game);
    };

    return (
        <div>
            {selectedGame ? (
                <GameDataView
                    gameName={selectedGame.title}
                    appId={selectedGame.appId}
                    onGoBack={() => setSelectedGame(null)}
                />
            ) : (
                <GameSelectView onGameSelect={handleGameSelect}/>
            )}
        </div>
    )
        ;
};

export default QuickAccessView;
