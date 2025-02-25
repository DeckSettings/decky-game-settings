import {
    PanelSection,
    PanelSectionRow,
    DialogButton,
    Focusable,
    ToggleField,
    Dropdown,
} from "@decky/ui";
import {useState, useEffect} from "react";
import {MdArrowBack} from "react-icons/md";
import type {Devices, PluginConfig} from "../interfaces";
import {getPluginConfig, setPluginConfig} from "../constants";
import {fetchDeviceList} from "../hooks/deckVerifiedApi";
import {PanelSocialButton} from "./elements/socialButton";
import {SiDiscord, SiGithub, SiKofi, SiPatreon} from "react-icons/si";

interface PluginConfigViewProps {
    onGoBack: () => void;
}

const PluginConfigView: React.FC<PluginConfigViewProps> = ({onGoBack,}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentConfig, setCurrentConfig] = useState(() => getPluginConfig())
    const [deviceList, setDeviceList] = useState<Devices[]>([]);


    const updateDeviceList = async () => {
        setIsLoading(true);
        try {
            const devices = await fetchDeviceList()
            setDeviceList(devices || []);
        } catch (error) {
            console.error("[PluginConfigView] Error fetching game details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateConfig = (updates: Partial<PluginConfig>) => {
        // Update the localStorage config
        setPluginConfig(updates);
        // Update the local state of component
        setCurrentConfig((prevConfig) => ({
            ...prevConfig,
            ...updates,
        }));
    };

    const handleDeviceSelection = (deviceName: string) => {
        const updatedDevices = currentConfig.filterDevices.includes(deviceName)
            ? currentConfig.filterDevices.filter((description) => description !== deviceName)
            : [...currentConfig.filterDevices, deviceName];
        updateConfig({filterDevices: updatedDevices});
    };

    useEffect(() => {
        console.log(`[PluginConfigView] Mounted`);
        updateDeviceList()
    }, []);

    return (
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
                    </Focusable>
                </PanelSection>
                <hr/>
            </div>
            <PanelSection title="Plugin Configuration">
            </PanelSection>
            {isLoading ? (
                <PanelSection spinner title="Fetching list of devices with configuration options..."/>
            ) : (
                <div>
                    <PanelSection title="Filter Reports by Device">
                        <PanelSectionRow>
                            <Dropdown
                                rgOptions={deviceList.map((device) => ({
                                    label: `${currentConfig.filterDevices.includes(device.description) ? '✔' : '—'} ${device.description}`,
                                    data: device.description,
                                }))}
                                selectedOption={null}
                                onChange={(option) => handleDeviceSelection(option.data)}
                                strDefaultLabel="Add a Device to Filters"
                            />
                            <p style={{fontSize: '0.6rem', marginBottom: '0'}}>
                                To remove a device from the filter list, select it again from the dropdown.
                            </p>
                            <p style={{fontSize: '0.6rem', marginTop: '0', marginBottom: '0'}}>
                                Currently Filtering on Devices:
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                    marginTop: '0.3rem',
                                    marginLeft: '1.5rem',
                                    fontSize: '0.6rem',
                                }}
                            >
                                {currentConfig.filterDevices.length > 0 ? (
                                    currentConfig.filterDevices.map((deviceName, index) => (
                                        <span key={index}>• {deviceName}</span>
                                    ))
                                ) : (
                                    <span>No devices selected. Showing reports for all devices.</span>
                                )}
                            </div>
                        </PanelSectionRow>
                    </PanelSection>
                    <PanelSection title="Game List Options">
                        <PanelSectionRow>
                            <ToggleField
                                checked={!currentConfig.showAllApps}
                                label="Only Show Installed Games"
                                description="Enable this option to display only installed games in your library. Disable to include all games, even those not installed."
                                onChange={(value) => updateConfig({showAllApps: !value})}
                            />
                        </PanelSectionRow>
                    </PanelSection>
                    <hr/>
                    <PanelSection>
                        <PanelSocialButton icon={<SiPatreon fill="#438AB9"/>} url="https://www.patreon.com/c/Josh5">
                            Patreon
                        </PanelSocialButton>
                        <PanelSocialButton icon={<SiKofi fill="#FF5E5B"/>} url="https://ko-fi.com/josh5coffee">
                            Ko-fi
                        </PanelSocialButton>
                        <PanelSocialButton icon={<SiDiscord fill="#5865F2"/>} url="https://streamingtech.co.nz/discord">
                            Discord
                        </PanelSocialButton>
                        <PanelSocialButton icon={<SiGithub fill="#f5f5f5"/>}
                                           url="https://github.com/DeckSettings/decky-game-settings">
                            Plugin Source
                        </PanelSocialButton>
                    </PanelSection>
                </div>
            )}
        </div>
    );
};

export default PluginConfigView;
