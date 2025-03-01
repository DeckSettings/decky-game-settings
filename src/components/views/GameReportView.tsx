import React, {useEffect, useState} from 'react';
import {PanelSection, Focusable, DialogButton, Navigation, Router} from "@decky/ui";
import Markdown from 'markdown-to-jsx';
import {Scrollable, scrollableRef, ScrollArea} from "../elements/ScrollableList";
import {reportsWebsiteBaseUrl} from "../../constants";
import type {ExternalReview, GameReport} from "../../interfaces";
import {MdArrowBack, MdWeb} from "react-icons/md";


// Type guard to distinguish ExternalReview from GameReport.
export const isExternalReview = (report: GameReport | ExternalReview): report is ExternalReview => {
    return (report as ExternalReview).source !== undefined;
}

// Helper to extract YouTube ID from a URL.
export const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
}

interface GameReportViewProps {
    gameReport: GameReport | ExternalReview | null;
    onGoBack: () => void;
}

const GameReportView: React.FC<GameReportViewProps> = ({gameReport, onGoBack}) => {
    const [youTubeVideoId, setYouTubeVideoId] = useState<string | null>(null);

    // Custom link component to override markdown rendering for links.
    const CustomLink: React.FC<{
        href: string;
        title?: string;
        children: React.ReactNode;
    }> = ({href, title, children, ...rest}) => {
        const excludeShieldsBadges = false
        // Check if the URL is a YouTube link.
        const isYoutubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(href);
        // Convert children to an array and check if any <img> has a shields.io URL.
        const childrenArray = React.Children.toArray(children);
        const containsShieldsBadge = childrenArray.some(child => {
            if (!excludeShieldsBadges) {
                return false
            }
            if (React.isValidElement(child) && child.type === 'img') {
                const imgSrc = child.props.src;
                return typeof imgSrc === 'string' && imgSrc.includes('shields.io');
            }
            return false;
        });

        useEffect(() => {
            if (isYoutubeLink && !containsShieldsBadge) {
                const videoId = extractYouTubeId(href);
                if (videoId) {
                    setYouTubeVideoId(videoId);
                }
            }
        }, [href, isYoutubeLink, containsShieldsBadge]);

        // If it's a YouTube link without a shields badge, don't render the link.
        if (isYoutubeLink && !containsShieldsBadge) {
            return null;
        }

        // Otherwise, render the link normally.
        return <a href={href} title={title} {...rest}>{children}</a>;
    };

    //const allSettings = {
    //    "summary": "SUMMARY",
    //    "game_name": "GAME NAME",
    //    "app_id": "APP ID",
    //    "launcher": "LAUNCHER",
    //    "device_compatibility": "DEVICE COMPATIBILITY",
    //    "target_framerate": "TARGET FRAMERATE",
    //    "device": "DEVICE",
    //    "os_version": "OS VERSION",
    //    "undervolt_applied": "UNDERVOLT APPLIED",
    //    "steam_play_compatibility_tool_used": "STEAM PLAY COMPATIBILITY TOOL USED",
    //    "compatibility_tool_version": "COMPATIBILITY TOOL VERSION",
    //    "custom_launch_options": "CUSTOM LAUNCH OPTIONS",
    //    "frame_limit": "FRAME LIMIT",
    //    "allow_tearing": "ALLOW TEARING",
    //    "half_rate_shading": "HALF RATE SHADING",
    //    "tdp_limit": "TDP LIMIT",
    //    "manual_gpu_clock": "MANUAL GPU CLOCK",
    //    "scaling_mode": "SCALING MODE",
    //    "scaling_filter": "SCALING FILTER",
    //};
    const systemConfiguration = {
        "undervolt_applied": "Undervolt Applied",
        "compatibility_tool_version": "Compatibility Tool Version",
        "custom_launch_options": "Game Launch Options",
    };
    const systemConfigurationData = Object.entries(systemConfiguration)
        .map(([key, formattedKey]) => {
            if (gameReport && gameReport.data && key in gameReport.data && gameReport.data[key] !== null) {
                const value = gameReport.data[key];
                return [formattedKey, String(value)];
            }
            return null;
        })
        .filter(entry => entry !== null) as [string, string][];

    const performanceSettings = {
        "frame_limit": "Frame Limit",
        "disable_frame_limit": "Disable Frame Limit",
        "enable_vrr": "Enable VRR",
        "allow_tearing": "Allow Tearing",
        "half_rate_shading": "Half Rate Shading",
        "tdp_limit": "TDP Limit",
        "manual_gpu_clock": "Manual GPU Clock",
        "scaling_mode": "Scaling Mode",
        "scaling_filter": "Scaling Filter",
    };
    const performanceSettingsData = Object.entries(performanceSettings)
        .map(([key, formattedKey]) => {
            if (gameReport && gameReport.data && key in gameReport.data && gameReport.data[key] !== null) {
                const value = gameReport.data[key];
                return [formattedKey, String(value)];
            }
            return null;
        })
        .filter(entry => entry !== null) as [string, string][];

    const markdownOptions = {
        overrides: {
            a: {
                component: CustomLink,
            },
            h4: {
                props: {style: {fontSize: '14px', margin: '5px 0'}},
            },
            ul: {
                props: {
                    style: {
                        listStyle: 'none',
                        fontSize: '12px',
                        padding: 0,
                    },
                },
            },
            li: {
                props: {
                    style: {
                        display: 'table',
                        textAlign: 'right',
                        width: '100%',
                        borderBottom: '1px solid #333',
                        paddingTop: '2px',
                        paddingBottom: '2px',
                    },
                },
            },
            strong: {
                props: {
                    style: {
                        display: 'table-cell',
                        textAlign: 'left',
                        paddingRight: '10px',
                        minWidth: '100px',
                    },
                },
            },
            span: {
                props: {
                    style: {
                        display: 'table-cell',
                        textAlign: 'left',
                        fontSize: '12px',
                    },
                },
            },
            div: {
                props: {
                    style: {
                        padding: 0,
                        textAlign: 'left',
                    },
                },
            },
        },
    };

    const ref = scrollableRef();

    const openWeb = (url: string) => {
        Navigation.NavigateToExternalWeb(url);
        Router.CloseSideMenus();
    };

    return (
        <>
            <style>{`
            .game-report {
                padding: 0px 3px;
            }
            .game-report .yt-embed {
                width: 100%;
                max-width: 800px;
                aspect-ratio: 16 / 9;
                border: thin solid;
            }
            .game-report div {
                padding: 0;
            }
            .game-report-section {
                padding: 0px 3px !important;
            }
            .game-report-section-body {
                padding: 0px 7px !important;
                margin-top: 10px;
            }
            `}</style>
            <div>
                <PanelSection>
                    <Focusable style={{display: 'flex', alignItems: 'center', gap: '1rem'}} flow-children="horizontal">
                        <DialogButton
                            // @ts-ignore
                            autoFocus={true}
                            style={{width: '50%', minWidth: 0}}
                            onClick={onGoBack}>
                            <MdArrowBack/>
                        </DialogButton>
                        <DialogButton
                            style={{width: '50%', minWidth: 0}}
                            onClick={() => {
                                if (gameReport) {
                                    if (isExternalReview(gameReport)) {
                                        openWeb(gameReport.html_url);
                                    } else {
                                        if (gameReport.data.app_id) {
                                            openWeb(`${reportsWebsiteBaseUrl}/app/${gameReport.data.app_id}`);
                                        } else {
                                            openWeb(`${reportsWebsiteBaseUrl}/game/${gameReport.data.game_name}`);
                                        }
                                    }
                                }
                            }}>
                            <MdWeb/>
                        </DialogButton>
                    </Focusable>
                </PanelSection>
                <hr/>
            </div>

            {gameReport && (
                <div className="game-report"
                     style={{display: 'flex', alignItems: 'center', justifyContent: 'right', margin: '10px'}}>
                    {isExternalReview(gameReport) ? (
                        <>
                            <img
                                src={gameReport.source.avatar_url}
                                alt="Source Avatar"
                                style={{height: '18px', marginLeft: '3px'}}
                            />
                            <span style={{
                                padding: '0 0 3px 3px',
                                margin: 0,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                lineHeight: '16px',
                            }}>
                            {gameReport.source.name}
                          </span>
                        </>
                    ) : (
                        <>
                            <img
                                src={gameReport.user.avatar_url}
                                alt="User Avatar"
                                style={{height: '18px', marginLeft: '3px'}}
                            />
                            <span style={{
                                padding: '0 0 3px 3px',
                                margin: 0,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                lineHeight: '16px',
                            }}>
                            {gameReport.user.login}
                          </span>
                        </>
                    )}
                </div>
            )}

            {youTubeVideoId && (
                <div className="game-report"
                     style={{display: 'flex', alignItems: 'center', justifyContent: 'right', margin: '10px'}}>
                    <iframe
                        className="yt-embed"
                        src={`https://www.youtube.com/embed/${youTubeVideoId}?fs=0&controls=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={false}>
                        {`Loading embedded YT player for link https://youtu.be/${youTubeVideoId}`}
                    </iframe>
                </div>
            )}

            <Scrollable ref={ref} className="game-report">
                <ScrollArea scrollable={ref}>
                    <div className="game-report-section">
                        <PanelSection title="System Configuration">
                            <div className="game-report-section-body">
                                <ul style={markdownOptions.overrides.ul.props.style}>
                                    {systemConfigurationData.map(([key, value]) => (
                                        <li key={key}
                                            style={{
                                                ...markdownOptions.overrides.li.props.style,
                                                textAlign: 'right'
                                            }}>
                                            <strong style={{
                                                ...markdownOptions.overrides.strong.props.style,
                                                textAlign: 'left'
                                            }}>
                                                {key}
                                            </strong>
                                            {value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </PanelSection>
                        <hr/>
                    </div>

                    <div className="game-report-section">
                        <PanelSection title="Performance Settings">
                            <div className="game-report-section-body">
                                <ul style={markdownOptions.overrides.ul.props.style}>
                                    {performanceSettingsData.map(([key, value]) => (
                                        <li key={key}
                                            style={{
                                                ...markdownOptions.overrides.li.props.style,
                                                textAlign: 'right'
                                            }}>
                                            <strong style={{
                                                ...markdownOptions.overrides.strong.props.style,
                                                textAlign: 'left'
                                            }}>
                                                {key}
                                            </strong>
                                            {value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </PanelSection>
                        <hr/>
                    </div>

                    {gameReport && gameReport.data.game_display_settings && (
                        <div className="game-report-section">
                            <PanelSection title="Game Display Settings">
                                <div className="game-report-section-body">
                                    <Markdown options={markdownOptions}>
                                        {gameReport.data.game_display_settings || ''}
                                    </Markdown>
                                </div>
                            </PanelSection>
                            <hr/>
                        </div>
                    )}

                    {gameReport && gameReport.data.game_graphics_settings && (
                        <div className="game-report-section">
                            <PanelSection title="Game Graphics Settings">
                                <div className="game-report-section-body">
                                    <Markdown options={markdownOptions}>
                                        {gameReport.data.game_graphics_settings || ''}
                                    </Markdown>
                                </div>
                            </PanelSection>
                            <hr/>
                        </div>
                    )}

                    {gameReport && gameReport.data.additional_notes && (
                        <div className="game-report-section">
                            <PanelSection title="Additional Notes">
                                <div className="game-report-section-body">
                                    <Markdown options={markdownOptions}>
                                        {gameReport.data.additional_notes || ''}
                                    </Markdown>
                                </div>
                            </PanelSection>
                            <hr/>
                        </div>
                    )}
                </ScrollArea>
            </Scrollable>
        </>
    );
};

export default GameReportView;
