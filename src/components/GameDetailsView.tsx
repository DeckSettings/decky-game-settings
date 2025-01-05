import React, {useEffect, useState} from 'react';
import {ButtonItem, PanelSection, PanelSectionRow} from "@decky/ui";
import {fetchNoCors} from "@decky/api";
import GameReportView from "./GameReportView";

interface GameDataViewProps {
    gameName: string;
    appId?: number;
    onGoBack: () => void;
}

interface GameDetails {
    gameName: string;
    appId?: number;
    metadata: GameMetadata;
    reports: any[];
}

interface GameMetadata {
    banner: string;
    poster: string;
    hero: string;
}

const GameDataView: React.FC<GameDataViewProps> = ({gameName, appId, onGoBack}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (appId) {
                setIsLoading(true);
                try {
                    const url = `https://deckverified.test.streamingtech.co.nz/deck-verified/api/v1/game_details?appid=${appId}&include_external=false`;
                    console.log(url)
                    const res = await fetchNoCors(url, {
                        method: 'GET'
                    });
                    const data = await res.json();
                    setGameDetails(data);
                    console.log(data)
                    console.log(gameDetails)
                } catch (error) {
                    console.error("Error fetching game details:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
    }, [appId]);

    const handleReportSelect = (gameReport) => {
        console.log(`Selected game report ${gameReport.title}`);
        setSelectedReport(gameReport);
    };

    return (
        <div>
            {selectedReport ? (
                <GameReportView
                    gameReport={selectedReport}
                    onGoBack={() => setSelectedReport(null)}
                />
            ) : (
                <div>
                    <PanelSection>
                        <ButtonItem layout="below" bottomSeparator="none" onClick={onGoBack}>
                            Go Back
                        </ButtonItem>
                    </PanelSection>
                    <hr/>

                    <PanelSection title={gameName}>
                        {isLoading ? (
                            <PanelSection spinner title="Loading..."/>
                        ) : (
                            <div>
                                <div>
                                    {appId && <span>App ID: {appId}</span>}
                                    {appId && gameDetails && <span> | </span>}
                                    {gameDetails && <span>Reports: {gameDetails.reports.length}</span>}
                                </div>
                                {gameDetails && gameDetails.reports.length > 0 && (
                                    <div>
                                        {gameDetails.reports.map((gameReport) => (
                                            <PanelSectionRow key={`${gameReport.id}`}>
                                                <ButtonItem
                                                    layout="below"
                                                    key={gameReport.id}
                                                    onClick={() => handleReportSelect(gameReport)}
                                                >
                                                    {gameReport.parsed_data.target_framerate} | {gameReport.parsed_data.device}
                                                    <br/>
                                                    <small>
                                                        "{gameReport.parsed_data.summary}"
                                                    </small>
                                                </ButtonItem>
                                            </PanelSectionRow>
                                        ))}
                                        <p>

                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </PanelSection>
                </div>
            )}
        </div>
    );
};

export default GameDataView;