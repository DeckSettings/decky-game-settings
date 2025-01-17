import React, {useEffect, useState} from 'react';
import {ButtonItem, DialogButton, Focusable, Navigation, PanelSection, PanelSectionRow, Router} from "@decky/ui";
import GameReportView from "./GameReportView";
import {reportsWebsiteBaseUrl} from "../constants";
import type {GameDataViewProps, GameDetails} from "../constants";
import {MdArrowBack, MdWeb} from "react-icons/md";
import {fetchGameDataByAppId, fetchGameDataByGameName} from "../hooks/deckVerifiedApi";

const GameDataView: React.FC<GameDataViewProps> = ({gameName, appId, onGoBack}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (appId) {
                    const data = await fetchGameDataByAppId(appId)
                    setGameDetails(data);
                } else {
                    const data = await fetchGameDataByGameName(gameName)
                    setGameDetails(data);
                }
            } catch (error) {
                console.error("[GameDataView] Error fetching game details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [appId]);

    const [selectedReport, setSelectedReport] = useState<any>(null);
    const handleReportSelect = (gameReport) => {
        console.log(`[GameDataView] Selected game report ${gameReport.title}`);
        setSelectedReport(gameReport);
    };

    const openWeb = (url: string) => {
        Navigation.NavigateToExternalWeb(url)
        Router.CloseSideMenus()
    }

    return (
        <div>
            {selectedReport ? (
                <GameReportView
                    gameReport={selectedReport}
                    onGoBack={() => setSelectedReport(null)}
                />
            ) : (
                <div>
                    <div>
                        <PanelSection>
                            <Focusable style={{display: 'flex', alignItems: 'center', gap: '1rem'}}
                                       flow-children="horizontal">
                                <DialogButton
                                    style={{width: '30%', minWidth: 0}}
                                    onClick={onGoBack}>
                                    <MdArrowBack/>
                                </DialogButton>
                                <DialogButton
                                    style={{width: '70%', minWidth: 0}}
                                    onClick={() => {
                                        if (appId) {
                                            openWeb(`${reportsWebsiteBaseUrl}/app/${appId}`);
                                        } else {
                                            openWeb(`${reportsWebsiteBaseUrl}/game/${gameName}`);
                                        }
                                    }}>
                                    <MdWeb/>
                                </DialogButton>
                            </Focusable>
                        </PanelSection>
                        <hr/>
                    </div>

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
                                                    {gameReport.data.target_framerate} | {gameReport.data.device}
                                                    <br/>
                                                    <small>
                                                        "{gameReport.data.summary}"
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