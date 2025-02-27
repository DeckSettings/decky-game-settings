import {
    ButtonItem,
    DialogButton,
    PanelSection,
    PanelSectionRow,
    TextField,
    showModal, Focusable,
} from "@decky/ui";
import {useState, useEffect} from 'react';
import {getGamesList} from "../hooks/gameLibrary"
import type {GameInfo, PluginPage} from "../interfaces";
import {TextFieldModal} from "./elements/TextFieldModal";
import {MdSettings} from "react-icons/md";
import {getPluginConfig} from "../constants";


interface GameSelectViewProps {
    onGameSelect: (game: GameInfo) => void;
    onSearch: (searchText: string) => void;
    onChangePage: (page: PluginPage) => void;
}

const GameSelectView: React.FC<GameSelectViewProps> = ({onGameSelect, onSearch, onChangePage}) => {
    const [currentlyRunningGame, setCurrentlyRunningGame] = useState<GameInfo | null>(null);
    const [installedGames, setInstalledGames] = useState<GameInfo[]>([]);
    const [nonInstalledGames, setNonInstalledGames] = useState<GameInfo[]>([]);

    // Fetch installed games using getInstalledGames
    const fetchInstalledGames = async () => {
        try {
            const {runningGame, installedGames, nonInstalledGames} = await getGamesList();
            setCurrentlyRunningGame(runningGame);
            setInstalledGames(installedGames);
            const currentConfig = getPluginConfig();
            if (currentConfig.showAllApps) {
                setNonInstalledGames(nonInstalledGames);
            }
        } catch (error) {
            console.error("[GameSelectView] Error fetching installed games:", error);
        }
    };

    const handleGameSelect = (game: GameInfo) => {
        console.log(`[GameSelectView] Selected game [AppID:${game.appId}, Title:${game.title}]`);
        onGameSelect(game);
    };

    useEffect(() => {
        console.log(`[GameSelectView] Mounted`);
        // noinspection JSIgnoredPromiseFromCall
        fetchInstalledGames();
    }, []);

    return (
        <div>
            <div>
                <PanelSection>
                    <Focusable style={{display: 'flex', alignItems: 'center', gap: '1rem'}}
                               flow-children="horizontal">
                        <DialogButton
                            style={{width: '30%', minWidth: 0}}
                            onClick={() => onChangePage("plugin_config")}>
                            <MdSettings/>
                        </DialogButton>
                        <div style={{width: '70%', minWidth: 0}}>
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
                        </div>
                    </Focusable>
                </PanelSection>
                <hr/>
            </div>

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

            {nonInstalledGames && nonInstalledGames.length > 0 ? (
                <PanelSection title="All Other Games">
                    {nonInstalledGames.map((game) => (
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
            ) : null}
            {currentlyRunningGame ? (<hr/>) : null}

        </div>
    );
};

export default GameSelectView;