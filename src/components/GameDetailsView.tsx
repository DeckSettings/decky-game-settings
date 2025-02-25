import React, {useEffect, useState} from 'react';
import {ButtonItem, DialogButton, Focusable, Navigation, PanelSection, PanelSectionRow, Router} from "@decky/ui";
import GameReportView from "./GameReportView";
import {reportsWebsiteBaseUrl} from "../constants";
import type {GameDetails, GameReport} from "../interfaces";
import {MdArrowBack, MdWeb} from "react-icons/md";
import {fetchGameDataByAppId, fetchGameDataByGameName} from "../hooks/deckVerifiedApi";
import {getPluginConfig} from "../constants";
import {PanelSocialButton} from "./elements/socialButton";
import {TbReport} from "react-icons/tb";

export interface GameDetailsViewProps {
    gameName: string;
    appId?: number;
    onGoBack: () => void;
}

const GameDetailsView: React.FC<GameDetailsViewProps> = ({gameName, appId, onGoBack}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
    const [configFilterDevices, setConfigFilterDevices] = useState<boolean>(false);
    const [filteredReports, setFilteredReports] = useState<GameReport[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = appId
                ? await fetchGameDataByAppId(appId)
                : await fetchGameDataByGameName(gameName);

            setGameDetails(data);

            // Filter the reports based on the filterDevices configuration
            if (data?.reports && Array.isArray(data.reports)) {
                const pluginConfig = getPluginConfig();
                if (pluginConfig.filterDevices.length === 0) {
                    setConfigFilterDevices(false)
                    setFilteredReports(data.reports);
                } else {
                    setConfigFilterDevices(true)
                    const filtered = data.reports.filter((report) =>
                        report.labels.some(label =>
                            pluginConfig.filterDevices.includes(label.description)
                        )
                    );
                    setFilteredReports(filtered);
                }
            } else {
                setFilteredReports([]);
            }
        } catch (error) {
            console.error("[GameDetailsView] Error fetching game details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const [selectedReport, setSelectedReport] = useState<GameReport | null>(null);
    const handleReportSelect = (gameReport: GameReport) => {
        console.log(`[GameDetailsView] Selected game report ${gameReport.title}`);
        setSelectedReport(gameReport);
    };

    const openWeb = (url: string) => {
        Navigation.NavigateToExternalWeb(url)
        Router.CloseSideMenus()
    }

    useEffect(() => {
        console.log(`[GameDetailsView] Mounted with [appId: ${appId}, gameName: ${gameName}]`);
        fetchData();
    }, [appId, gameName]);

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
                                    {gameDetails && <span>Reports: {filteredReports.length}</span>}
                                </div>
                                {filteredReports.length > 0 && (
                                    <div>
                                        {filteredReports.map((gameReport) => (
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
                                {configFilterDevices && filteredReports.length === 0 && (
                                    <p>No reports match the selected device filters.</p>
                                )}
                                {!configFilterDevices && filteredReports.length === 0 && (
                                    <p>No reports found.</p>
                                )}
                                <hr/>
                                <PanelSection>
                                    <PanelSocialButton
                                        icon={<TbReport fill="#FF5E5B"/>}
                                        url={
                                            appId
                                                ? `${reportsWebsiteBaseUrl}/app/${appId}?openReportForm=true`
                                                : `${reportsWebsiteBaseUrl}/game/${gameName}?openReportForm=true`
                                        }
                                    >
                                        Add your own report
                                    </PanelSocialButton>
                                </PanelSection>
                            </div>
                        )}
                    </PanelSection>
                </div>
            )}
        </div>
    );
};

export default GameDetailsView;
