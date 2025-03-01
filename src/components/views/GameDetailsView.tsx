import React, {useEffect, useState} from 'react';
import {
    ButtonItem,
    DialogButton,
    Focusable,
    Navigation,
    PanelSection,
    PanelSectionRow,
    Router,
    staticClasses
} from "@decky/ui";
import GameReportView from "./GameReportView";
import {hasYoutubeLink, reportsWebsiteBaseUrl} from "../../constants";
import type {ExternalReview, GameMetadata, GameReport} from "../../interfaces";
import {MdArrowBack, MdWeb} from "react-icons/md";
import {fetchGameDataByAppId, fetchGameDataByGameName} from "../../hooks/deckVerifiedApi";
import {getPluginConfig} from "../../constants";
import {PanelSocialButton} from "../elements/socialButton";
import {TbBrandYoutubeFilled, TbReport} from "react-icons/tb";

const deckVerifiedIconSrc = "https://deckverified.games/deck-verified/assets/logo-dark-DRV01ZBg.png"

export interface GameDetailsViewProps {
    gameName: string;
    appId?: number;
    onGoBack: () => void;
}

const GameDetailsView: React.FC<GameDetailsViewProps> = ({gameName, appId, onGoBack}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [configFilterDevices, setConfigFilterDevices] = useState<boolean>(false);
    const [filteredReports, setFilteredReports] = useState<GameReport[]>([]);
    const [externalReviews, setExternalReviews] = useState<ExternalReview[]>([]);
    const [metadata, setMetadata] = useState<GameMetadata | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = appId
                ? await fetchGameDataByAppId(appId)
                : await fetchGameDataByGameName(gameName);

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

            // Extract external reviews and store them in state
            if (data?.external_reviews && Array.isArray(data.external_reviews)) {
                setExternalReviews(data.external_reviews);
            } else {
                setExternalReviews([]);
            }

            // Extract metadata
            if (data?.external_reviews && Array.isArray(data.external_reviews)) {
                setMetadata(data.metadata);
            } else {
                setMetadata(null);
            }
        } catch (error) {
            console.error("[GameDetailsView] Error fetching game details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const [selectedReport, setSelectedReport] = useState<GameReport | ExternalReview | null>(null);
    const handleReportSelect = (gameReport: GameReport | ExternalReview) => {
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

                    <PanelSection>
                        <div style={{marginBottom: '10px'}}>
                            {metadata && metadata.hero ? (
                                <div style={{
                                    width: '100%',
                                    background: `
                                      linear-gradient(to right, #0e141b 0%, transparent 20%, transparent 80%, #0e141b 100%),
                                      linear-gradient(to bottom, #0e141b 0%, transparent 40%, transparent 60%, #0e141b 100%),
                                      url(${metadata.hero})
                                    `,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white'
                                }}>
                                    {gameName && (
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            width: '100%',
                                            textShadow: `
                                              -3px -3px 7px #0e141b,
                                              3px -3px 7px #0e141b,
                                              -3px 3px 7px #0e141b,
                                              3px 3px 7px #0e141b
                                            `
                                        }}>
                                            {gameName}
                                        </div>
                                    )}
                                    {appId && (
                                        <div style={{
                                            fontSize: '11px',
                                            textShadow: `
                                              -2px -2px 10px #0e141b,
                                              2px -2px 10px #0e141b,
                                              -2px 2px 10px #0e141b,
                                              2px 2px 10px #0e141b
                                            `
                                        }}>
                                            App ID: {appId}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {gameName && (
                                        <div style={{fontSize: '18px', fontWeight: 'bold', color: 'white'}}>
                                            {gameName}
                                        </div>
                                    )}
                                    {appId && (
                                        <div style={{fontSize: '11px'}}>
                                            App ID: {appId}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {isLoading ? (
                            <PanelSection spinner title="Loading..."/>
                        ) : (
                            <>
                                <hr style={{marginTop: '5px', marginBottom: '5px'}}/>

                                <div>
                                    <span className={staticClasses.PanelSectionTitle}
                                          style={{
                                              color: 'white',
                                              fontSize: '22px',
                                              fontWeight: 'bold',
                                              lineHeight: '28px',
                                              textTransform: 'none',
                                              marginBottom: '10px',
                                          }}>
                                        Game Reports:
                                    </span>
                                </div>

                                {/*Deck Verified Game Reports*/}
                                <div style={{
                                    padding: '0px 0px 0px 3px',
                                    margin: 0,
                                    borderLeft: 'thin dotted'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0px 0px 10px 0px',
                                    }}>
                                        <img src={deckVerifiedIconSrc}
                                             alt="Deck Verified Site Logo"
                                             style={{
                                                 height: "18px",
                                                 marginLeft: "3px"
                                             }}
                                        />
                                    </div>
                                    <div className={staticClasses.PanelSectionTitle}
                                         style={{
                                             padding: '0px 0px 3px 3px',
                                             margin: 0,
                                             color: 'white',
                                             fontSize: '14px',
                                             lineHeight: '16px',
                                             display: 'none'
                                         }}>
                                        Game Reports: {filteredReports.length}
                                    </div>

                                    {filteredReports.length > 0 && (
                                        <>
                                            {filteredReports.map((gameReport) => (
                                                <PanelSectionRow key={`${gameReport.id}`}>
                                                    <div style={{
                                                        padding: '5px',
                                                        margin: '0px 0px 10px 0px',
                                                        border: 'thin outset'
                                                    }}>
                                                        <ul style={{
                                                            listStyle: 'none',
                                                            fontSize: '0.7rem',
                                                            margin: 0,
                                                            paddingLeft: '5px',
                                                            paddingRight: 0,
                                                            paddingTop: 0,
                                                            paddingBottom: '3px',
                                                        }}>
                                                            <li style={{
                                                                display: 'table',
                                                                textAlign: 'right',
                                                                width: '100%',
                                                                borderBottom: '1px solid #333',
                                                                paddingTop: '2px',
                                                                paddingBottom: '2px',
                                                            }}>
                                                                <strong style={{
                                                                    display: 'table-cell',
                                                                    textAlign: 'left',
                                                                    paddingRight: '3px',
                                                                }}>{gameReport.data.summary}</strong>
                                                            </li>
                                                            <li style={{
                                                                display: 'table',
                                                                textAlign: 'right',
                                                                width: '100%',
                                                                borderBottom: '1px solid #333',
                                                                paddingTop: '2px',
                                                                paddingBottom: '2px',
                                                            }}>
                                                                <strong style={{
                                                                    display: 'table-cell',
                                                                    textAlign: 'left',
                                                                    paddingRight: '3px',
                                                                }}>Device:</strong>
                                                                {gameReport.data.device}
                                                            </li>
                                                            {gameReport.data.target_framerate && gameReport.data.target_framerate.length > 0 && (
                                                                <li style={{
                                                                    display: 'table',
                                                                    textAlign: 'right',
                                                                    width: '100%',
                                                                    borderBottom: '1px solid #333',
                                                                    paddingTop: '2px',
                                                                    paddingBottom: '2px',
                                                                }}>
                                                                    <strong style={{
                                                                        display: 'table-cell',
                                                                        textAlign: 'left',
                                                                        paddingRight: '3px',
                                                                    }}>Target Framerate:</strong>
                                                                    {gameReport.data.target_framerate}
                                                                </li>
                                                            )}
                                                            {hasYoutubeLink(gameReport.data.additional_notes) && (
                                                                <li style={{
                                                                    display: 'table',
                                                                    textAlign: 'right',
                                                                    width: '100%',
                                                                    borderBottom: '1px solid #333',
                                                                    paddingTop: '2px',
                                                                    paddingBottom: '2px',
                                                                }}>

                                                                    <strong style={{
                                                                        display: 'table-cell',
                                                                        verticalAlign: 'middle',
                                                                        textAlign: 'left',
                                                                        paddingRight: '3px',
                                                                    }}>
                                                                        <TbBrandYoutubeFilled
                                                                            style={{
                                                                                display: 'table-cell',
                                                                                verticalAlign: 'middle',
                                                                                height: '100%',
                                                                                paddingRight: '10px',
                                                                                paddingLeft: '5px'
                                                                            }}
                                                                            fill="#FF0000"
                                                                        />
                                                                    </strong>
                                                                    Includes YouTube Video
                                                                </li>
                                                            )}
                                                        </ul>
                                                        <div style={{
                                                            margin: 0,
                                                            paddingLeft: '5px',
                                                            paddingRight: '5px',
                                                            paddingTop: 0,
                                                            paddingBottom: 0,
                                                            overflow: 'hidden'
                                                        }}>
                                                            <ButtonItem
                                                                bottomSeparator="none"
                                                                layout="below"
                                                                key={gameReport.id}
                                                                onClick={() => handleReportSelect(gameReport)}
                                                            >
                                                                View Report
                                                            </ButtonItem>
                                                        </div>
                                                    </div>

                                                </PanelSectionRow>
                                            ))}
                                        </>
                                    )}
                                    {configFilterDevices && filteredReports.length === 0 && (
                                        <p style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'orangered',
                                            margin: '0px 0px 10px 0px',
                                        }}>
                                            No game reports match the selected device filters.
                                        </p>
                                    )}
                                    {!configFilterDevices && filteredReports.length === 0 && (
                                        <p style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'orangered',
                                            margin: '0px 0px 10px 0px',
                                        }}>
                                            No game reports found.
                                        </p>
                                    )}
                                </div>

                                <hr style={{marginTop: '25px', marginBottom: '25px'}}/>

                                <div>
                                    <span className={staticClasses.PanelSectionTitle}
                                          style={{
                                              color: 'white',
                                              fontSize: '22px',
                                              fontWeight: 'bold',
                                              lineHeight: '28px',
                                              textTransform: 'none',
                                              marginBottom: '10px',
                                          }}>
                                            External Game Reviews:
                                    </span>
                                </div>

                                {/*External Game Reports*/}
                                {externalReviews.length > 0 && (
                                    <>

                                        {externalReviews.map((review) => (
                                            <div style={{
                                                padding: '0px 0px 0px 3px',
                                                margin: 0,
                                                borderLeft: 'thin dotted'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    fontSize: '14px',
                                                    lineHeight: '16px',
                                                    margin: '0 0 10px 0',
                                                }}>
                                                    <img src={review.source.avatar_url}
                                                         alt="Deck Verified Site Logo"
                                                         style={{
                                                             height: '18px',
                                                             marginLeft: '3px'
                                                         }}
                                                    />
                                                    <span style={{
                                                        padding: '0 0 3px 3px',
                                                        margin: 0,
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px',
                                                        lineHeight: '16px',
                                                    }}>
                                                        {review.source.name}
                                                    </span>
                                                </div>

                                                <PanelSectionRow key={`${review.id}`}>
                                                    <div style={{
                                                        padding: '5px',
                                                        margin: '0px 0px 10px 0px',
                                                        border: 'thin outset'
                                                    }}>
                                                        <ul style={{
                                                            listStyle: 'none',
                                                            fontSize: '0.7rem',
                                                            margin: 0,
                                                            paddingLeft: '5px',
                                                            paddingRight: 0,
                                                            paddingTop: 0,
                                                            paddingBottom: '3px',
                                                        }}>
                                                            <li style={{
                                                                display: 'table',
                                                                textAlign: 'right',
                                                                width: '100%',
                                                                borderBottom: '1px solid #333',
                                                                paddingTop: '2px',
                                                                paddingBottom: '2px',
                                                            }}>
                                                                <strong style={{
                                                                    display: 'table-cell',
                                                                    textAlign: 'left',
                                                                    paddingRight: '3px',
                                                                }}>{review.data.summary}</strong>
                                                            </li>
                                                            <li style={{
                                                                display: 'table',
                                                                textAlign: 'right',
                                                                width: '100%',
                                                                borderBottom: '1px solid #333',
                                                                paddingTop: '2px',
                                                                paddingBottom: '2px',
                                                            }}>
                                                                <strong style={{
                                                                    display: 'table-cell',
                                                                    textAlign: 'left',
                                                                    paddingRight: '3px',
                                                                }}>Device:</strong>
                                                                {review.data.device}
                                                            </li>
                                                            {review.data.target_framerate && review.data.target_framerate.length > 0 && (
                                                                <li style={{
                                                                    display: 'table',
                                                                    textAlign: 'right',
                                                                    width: '100%',
                                                                    borderBottom: '1px solid #333',
                                                                    paddingTop: '2px',
                                                                    paddingBottom: '2px',
                                                                }}>
                                                                    <strong style={{
                                                                        display: 'table-cell',
                                                                        textAlign: 'left',
                                                                        paddingRight: '3px',
                                                                    }}>Target Framerate:</strong>
                                                                    {review.data.target_framerate}
                                                                </li>
                                                            )}
                                                        </ul>
                                                        <div style={{
                                                            margin: 0,
                                                            paddingLeft: '5px',
                                                            paddingRight: '5px',
                                                            paddingTop: 0,
                                                            paddingBottom: 0,
                                                            overflow: 'hidden'
                                                        }}>
                                                            <ButtonItem
                                                                bottomSeparator="none"
                                                                layout="below"
                                                                key={review.id}
                                                                onClick={() => handleReportSelect(review)}
                                                            >
                                                                View Details
                                                            </ButtonItem>
                                                        </div>
                                                    </div>

                                                </PanelSectionRow>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {externalReviews.length === 0 && (
                                    <p style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'orangered',
                                        margin: '0px 0px 10px 0px',
                                    }}>
                                        No external reviews found for this game.
                                    </p>
                                )}
                            </>
                        )}
                        {filteredReports.length > 0 && <hr/>}
                        <div style={{
                            margin: 0,
                            paddingLeft: '5px',
                            paddingRight: '5px',
                            paddingTop: 0,
                            paddingBottom: 0,
                            overflow: 'hidden'
                        }}>
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
                        </div>
                    </PanelSection>
                </div>
            )}
        </div>
    );
};

export default GameDetailsView;
