import {
  PanelSection,
  PanelSectionRow,
  DialogButton,
  Focusable,
  ToggleField,
  Dropdown,
} from '@decky/ui'
import { useState, useEffect } from 'react'
import { MdArrowBack } from 'react-icons/md'
import type { Devices, PluginConfig } from '../../interfaces'
import { getPluginConfig, setPluginConfig } from '../../constants'
import { fetchDeviceList } from '../../hooks/deckVerifiedApi'
import { PanelSocialButton } from '../elements/SocialButton'
import { SiDiscord, SiGithub, SiKofi, SiPatreon } from 'react-icons/si'
import { popupLoginDialog } from '../elements/LoginDialog'
import {
  hasToken as hasGithubToken,
  clearTokens as clearGithubTokens,
  GithubUserProfile,
  loadUserProfile, clearUserProfile,
} from '../../hooks/githubAuth'

interface PluginConfigViewProps {
  onGoBack: () => void
}

const PluginConfigView: React.FC<PluginConfigViewProps> = ({ onGoBack }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState(() => getPluginConfig())
  const [deviceList, setDeviceList] = useState<Devices[]>([])
  const [hasGithub, setHasGithub] = useState<boolean>(hasGithubToken())
  const [ghProfile, setGhProfile] = useState<GithubUserProfile | null>(loadUserProfile())


  const updateDeviceList = async () => {
    setIsLoading(true)
    try {
      const devices = await fetchDeviceList()
      setDeviceList(devices || [])
    } catch (error) {
      console.error('[PluginConfigView] Error fetching game details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = (updates: Partial<PluginConfig>) => {
    // Update the localStorage config
    setPluginConfig(updates)
    // Update the local state of component
    setCurrentConfig((prevConfig) => ({
      ...prevConfig,
      ...updates,
    }))
  }

  const openGithubLogin = () => {
    popupLoginDialog(() => {
      setHasGithub(hasGithubToken())
      setGhProfile(loadUserProfile())
    })
  }

  const logoutGithub = () => {
    clearGithubTokens()
    clearUserProfile()
    setHasGithub(false)
    setGhProfile(null)
  }

  const handleDeviceSelection = (deviceName: string) => {
    const updatedDevices = currentConfig.filterDevices.includes(deviceName)
      ? currentConfig.filterDevices.filter((description) => description !== deviceName)
      : [...currentConfig.filterDevices, deviceName]
    updateConfig({ filterDevices: updatedDevices })
  }

  useEffect(() => {
    console.log(`[PluginConfigView] Mounted`)
    updateDeviceList()
  }, [])

  return (
    <>
      <div>
        <div style={{ padding: '3px 16px 3px 16px', margin: 0 }}>
          <Focusable style={{ display: 'flex', alignItems: 'stretch', gap: '1rem' }}
            flow-children="horizontal">
            <DialogButton
              // @ts-ignore
              autoFocus={true}
              retainFocus={true}
              style={{
                width: '30%',
                minWidth: 0,
                padding: '3px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
              onClick={onGoBack}>
              <MdArrowBack />
            </DialogButton>
          </Focusable>
        </div>
        <hr />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <>

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
            `,
          }}>
            Plugin Configuration
          </div>
        </>
        <hr style={{ marginTop: '5px', marginBottom: '5px' }} />
      </div>

      <>
        {/* GitHub Account */}
        <PanelSection title="GitHub Account">
          <PanelSectionRow>
            {hasGithub ? (
              <DialogButton onClick={logoutGithub}>
                {ghProfile?.avatar_url ? (
                  <img
                    src={ghProfile.avatar_url}
                    alt={ghProfile.login}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      marginRight: 8,
                      verticalAlign: 'middle',
                    }}
                  />
                ) : null}
                Logout @{ghProfile?.login || 'GitHub'}
              </DialogButton>
            ) : (
              <DialogButton onClick={openGithubLogin}>Connect GitHub</DialogButton>
            )}
          </PanelSectionRow>
        </PanelSection>

        {/* Filter Reports by Device */}
        {isLoading ? (
          <PanelSection spinner title="Fetching list of devices with configuration options..." />
        ) : (
          <>
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
                <p style={{ fontSize: '0.6rem', marginTop: '9px', marginBottom: '0' }}>
                  To remove a device from the filter list, select it again from the dropdown.
                </p>
                {currentConfig.filterDevices.length > 0 ? (
                  currentConfig.filterDevices.map((deviceName, index) => (
                    <>
                      <p style={{ fontSize: '0.6rem', marginTop: '0', marginBottom: '0' }}>
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
                        <span key={index}>• {deviceName}</span>
                      </div>
                    </>
                  ))
                ) : (
                  <>
                    <p style={{ fontSize: '0.6rem', marginTop: '0', marginBottom: '0' }}>
                      No devices selected. Showing reports for all devices.
                    </p>
                  </>
                )}
              </PanelSectionRow>
            </PanelSection>
          </>
        )}

        {/* Game List Options */}
        <PanelSection title="Game List Options">
          <PanelSectionRow>
            <ToggleField
              checked={!currentConfig.showAllApps}
              label="Only Show Installed Games"
              onChange={(value) => updateConfig({ showAllApps: !value })}
            />
            <p style={{ fontSize: '0.6rem', marginTop: '9px', marginBottom: '0' }}>
              Enable this option to display only installed games in your library. Disable to include all games, even those not installed.
            </p>
          </PanelSectionRow>
        </PanelSection>
        <hr />
        <PanelSection>
          <PanelSocialButton icon={<SiPatreon fill="#438AB9" />} url="https://www.patreon.com/c/Josh5">
            Patreon
          </PanelSocialButton>
          <PanelSocialButton icon={<SiKofi fill="#FF5E5B" />} url="https://ko-fi.com/josh5coffee">
            Ko-fi
          </PanelSocialButton>
          <PanelSocialButton icon={<SiDiscord fill="#5865F2" />} url="https://streamingtech.co.nz/discord">
            Discord
          </PanelSocialButton>
          <PanelSocialButton icon={<SiGithub fill="#f5f5f5" />}
            url="https://github.com/DeckSettings/decky-game-settings">
            Plugin Source
          </PanelSocialButton>
        </PanelSection>
      </>
    </>
  )
}

export default PluginConfigView
