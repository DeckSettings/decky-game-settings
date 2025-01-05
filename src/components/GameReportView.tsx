import React from 'react';
import {PanelSection, PanelSectionRow, ButtonItem} from "@decky/ui";
import Markdown from 'markdown-to-jsx';

interface GameReportViewProps {
    gameReport: any; // TODO: Replace 'any' with the actual type of gameReport if available
    onGoBack: () => void;
}

const GameReportView: React.FC<GameReportViewProps> = ({gameReport, onGoBack}) => {

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
            if (key in gameReport.parsed_data && gameReport.parsed_data[key] !== null) {
                const value = gameReport.parsed_data[key];
                return [formattedKey, String(value)];
            }
            return null;
        })
        .filter(entry => entry !== null) as [string, string][];

    const performanceSettings = {
        "frame_limit": "Frame Limit",
        "allow_tearing": "Allow Tearing",
        "half_rate_shading": "Half Rate Shading",
        "tdp_limit": "TDP Limit",
        "manual_gpu_clock": "Manual GPU Clock",
        "scaling_mode": "Scaling Mode",
        "scaling_filter": "Scaling Filter",
    };
    const performanceSettingsData = Object.entries(performanceSettings)
        .map(([key, formattedKey]) => {
            if (key in gameReport.parsed_data && gameReport.parsed_data[key] !== null) {
                const value = gameReport.parsed_data[key];
                return [formattedKey, String(value)];
            }
            return null;
        })
        .filter(entry => entry !== null) as [string, string][];

    const markdownOptions = {
        overrides: {
            h4: {
                props: {style: {fontSize: '14px', margin: '5px 0'}}
            },
            ul: {
                props: {
                    style: {
                        listStyle: 'none',
                        fontSize: '12px',
                        padding: 0,
                        marginLeft: '3px',
                    }
                }
            },
            li: {
                props: {
                    style: {
                        /*display: 'flex',
                        alignItems: 'center',*/
                        /*display: 'inline-table',*/
                        display: 'table',
                        textAlign: 'right',
                        width: '100%',
                        borderBottom: '1px solid #333',
                        paddingTop: '2px',
                        paddingBottom: '2px',
                    }
                }
            },
            strong: {
                props: {
                    style: {
                        display: 'table-cell',
                        textAlign: 'left',
                        paddingRight: '10px',
                        /*flex: '0 0 50%',*/
                        minWidth: '100px',
                    }
                }
            },
            span: {
                props: {
                    style: {
                        display: 'table-cell',
                        textAlign: 'left',
                        fontSize: '12px',
                    }
                }
            },
            div: {
                props: {
                    style: {
                        padding: 0,
                        textAlign: 'left',
                    }
                }
            },
        }
    };

    return (
        <div>
            <div>
                <PanelSection>
                    <ButtonItem layout="below" onClick={onGoBack}>
                        Go Back
                    </ButtonItem>
                </PanelSection>
                <hr/>
            </div>

            <div>
                <PanelSection title="System Configuration">
                    <PanelSectionRow>
                        <div>
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
                    </PanelSectionRow>
                </PanelSection>
                <hr/>
            </div>

            <div>
                <PanelSection title="Performance Settings">
                    <PanelSectionRow>
                        <div>
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
                    </PanelSectionRow>
                </PanelSection>
                <hr/>
            </div>

            <div>
                <PanelSection title="Game Display Settings">
                    <PanelSectionRow>
                        <Markdown options={markdownOptions}>
                            {gameReport.parsed_data.game_display_settings || ''}
                        </Markdown>
                    </PanelSectionRow>
                </PanelSection>
                <hr/>
            </div>

            <div>
                <PanelSection title="Game Graphics Settings">
                    <PanelSectionRow>
                        <Markdown options={markdownOptions}>
                            {gameReport.parsed_data.game_graphics_settings || ''}
                        </Markdown>
                    </PanelSectionRow>
                </PanelSection>
                <hr/>
            </div>

            <div>
                <PanelSection title="Additional Notes">
                    <PanelSectionRow>
                        <Markdown options={markdownOptions}>
                            {gameReport.parsed_data.additional_notes || ''}
                        </Markdown>
                    </PanelSectionRow>
                </PanelSection>
                <hr/>
            </div>
        </div>
    );
};

export default GameReportView;
