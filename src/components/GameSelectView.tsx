import {
    ButtonItem,
    DialogButton,
    PanelSection,
    PanelSectionRow
} from "@decky/ui";
//import useLocalizationTs from '../../hooks/useLocalizationTs';
import {useState, useEffect} from 'react';
import {getInstalledGames} from "../hooks/gameLibrary"
import type {GameInfo} from "../hooks/gameLibrary"


const GameSelectView: React.FC<{ onGameSelect: (game: GameInfo) => void }> = ({onGameSelect}) => {
    const [currentlyRunningGame, setCurrentlyRunningGame] = useState<GameInfo | null>(null);
    const [installedGames, setInstalledGames] = useState<GameInfo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch installed games using getInstalledGames
        const fetchInstalledGames = async () => {
            try {
                const {games, runningGame} = await getInstalledGames();
                setInstalledGames(games);
                setCurrentlyRunningGame(runningGame);
                // TODO: Remove logging
                console.log(games)
                console.log(runningGame)
                // TODO: Add support for setSearchTerm
                setSearchTerm('')
            } catch (error) {
                console.error("Error fetching installed games:", error);
            }
        };

        // noinspection JSIgnoredPromiseFromCall
        fetchInstalledGames();
    }, []);

    const filteredGames = installedGames.filter((game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const setShowSettings = () => {
        console.log(`Show Plugin Settings`);
    };

    const handleGameSelect = (game: GameInfo) => {
        console.log(`Selected game [AppID:${game.appId}, Title:${game.title}]`);
        onGameSelect(game);
    };

    return (
        <div>
            <PanelSection>
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => setShowSettings()}
                    >
                        Go To Settings
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
            <hr/>

            {currentlyRunningGame ? (
                <PanelSection title="Current Game">
                    <PanelSectionRow key={`${currentlyRunningGame.appId}${currentlyRunningGame.title}`}>
                        <DialogButton
                            key={currentlyRunningGame.appId}
                            onClick={() => handleGameSelect(currentlyRunningGame)}
                        >
                            {currentlyRunningGame.title}
                        </DialogButton>
                    </PanelSectionRow>
                </PanelSection>
            ) : null}
            {currentlyRunningGame ? (<hr/>) : null}

            <PanelSection title="Installed Games">
                {filteredGames.map((game) => (
                    <PanelSectionRow key={`${game.appId}${game.title}`}>
                        <ButtonItem
                            layout="below"
                            key={game.appId}
                            onClick={() => handleGameSelect(game)}
                        >
                            {game.title}
                        </ButtonItem>
                    </PanelSectionRow>
                ))}
            </PanelSection>
        </div>
    );
};

export default GameSelectView;