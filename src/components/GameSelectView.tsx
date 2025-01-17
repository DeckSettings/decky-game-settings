import {
    ButtonItem,
    DialogButton,
    PanelSection,
    PanelSectionRow,
    TextField,
    showModal,
} from "@decky/ui";
//import useLocalizationTs from '../../hooks/useLocalizationTs';
import {useState, useEffect} from 'react';
import {getInstalledGames} from "../hooks/gameLibrary"
import type {GameInfo} from "../interfaces";
import {TextFieldModal} from "./elements/TextFieldModal";


interface GameSelectViewProps {
    onGameSelect: (game: GameInfo) => void;
    onSearch: (searchText: string) => void;
}

const GameSelectView: React.FC<GameSelectViewProps> = ({onGameSelect, onSearch}) => {

    const [currentlyRunningGame, setCurrentlyRunningGame] = useState<GameInfo | null>(null);
    const [installedGames, setInstalledGames] = useState<GameInfo[]>([]);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchInstalledGames();
    }, []);

    // Fetch installed games using getInstalledGames
    const fetchInstalledGames = async () => {
        try {
            const {games, runningGame} = await getInstalledGames();
            setInstalledGames(games);
            setCurrentlyRunningGame(runningGame);
        } catch (error) {
            console.error("[GameSelectView] Error fetching installed games:", error);
        }
    };

    const handleGameSelect = (game: GameInfo) => {
        console.log(`[GameSelectView] Selected game [AppID:${game.appId}, Title:${game.title}]`);
        onGameSelect(game);
    };

    return (
        <div>
            <PanelSection title="Search for games">
                <PanelSectionRow>
                    <TextField
                        label="Search"
                        onClick={() => showModal(
                            <TextFieldModal
                                label="Search"
                                placeholder="Game name or appid"
                                onClosed={onSearch}
                            />
                        )}
                    />
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
                {installedGames.map((game) => (
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