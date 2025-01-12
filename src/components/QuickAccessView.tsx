import React, {useState} from 'react';
import type {GameInfo} from "../hooks/gameLibrary"
import GameSelectView from "./GameSelectView";
import GameDataView from "./GameDetailsView";


const QuickAccessView: React.FC = () => {

    //const setShowSettings = () => {
    //    console.log(`Show Plugin Settings`);
    //};

    //const onSearchModalClosed = async (query: string) => {
    //    Navigation.OpenQuickAccessMenu(QuickAccessTab.Decky);
    //    onSearch(query);
    //}

    const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
    const handleGameSelect = (game: GameInfo) => {
        setSelectedGame(game);
    };

    return (
        <div>
            {/*<PanelSection>
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        onClick={() => setShowSettings()}
                    >
                        Go To Settings
                    </ButtonItem>
                </PanelSectionRow>
            </PanelSection>
            <hr/>*/}
            {/*<PanelSection>
                <PanelSectionRow>
                    <Focusable>
                        <TextField
                            label="Search for games"
                            // @ts-ignore
                            placeholder={'Search for game by name or appid'}
                            onClick={() => showModal(<TextFieldModal label="Search" placeholder="Search for game by name or appid" onClosed={onSearchModalClosed} />)}
                        />
                    </Focusable >
                </PanelSectionRow>
            </PanelSection>
            <hr/>*/}

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
