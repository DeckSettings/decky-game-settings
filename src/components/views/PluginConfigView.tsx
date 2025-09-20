import { PanelSection, PanelSectionRow, DialogButton, Focusable, ToggleField, Dropdown, ButtonItem } from '@decky/ui'
import { useState, useEffect, CSSProperties, useMemo } from 'react'
import { MdArrowBack } from 'react-icons/md'
import type { Devices, PluginConfig, NotificationSettings } from '../../interfaces'
import { getPluginConfig, setPluginConfig, defaultNotificationSettings } from '../../constants'
import { fetchDeviceList } from '../../hooks/deckVerifiedApi'
import { PanelSocialButton } from '../elements/SocialButton'
import { SiDiscord, SiGithub, SiKofi, SiPatreon } from 'react-icons/si'
import { popupLoginDialog } from '../elements/LoginDialog'
import {
  hasToken as hasGithubToken,
  clearTokens as clearGithubTokens,
  GithubUserProfile,
  gitHubUserProfile,
  clearUserProfile,
} from '../../hooks/githubAuth'
import { sendNotification } from '../../hooks/gameLibrary'

interface PluginConfigViewProps {
  onGoBack: () => void
}

const fieldBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
  padding: '8px 16px 8px 0',
}
const fieldHeadingStyle: CSSProperties = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em' }
const helperTextStyle: CSSProperties = { fontSize: '11px', opacity: 0.75, lineHeight: '1.35' }
const mutedHelperTextStyle: CSSProperties = { ...helperTextStyle, opacity: 0.6 }
const toggleBlockStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' }
const chipListStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }
const chipStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '999px',
  padding: '1px 8px',
  fontSize: '10px',
  letterSpacing: '0.01em',
}
const actionButtonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '28px',
  padding: '6px 10px',
  fontSize: '12px',
}

const PluginConfigView: React.FC<PluginConfigViewProps> = ({ onGoBack }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<PluginConfig>(() => getPluginConfig())
  const [deviceList, setDeviceList] = useState<Devices[]>([])
  const [hasGithub, setHasGithub] = useState<boolean>(hasGithubToken())
  const [ghProfile, setGhProfile] = useState<GithubUserProfile | null>(null)
  const [showDebugButtons] = useState(false)

  const notificationSettings = currentConfig.notificationSettings ?? defaultNotificationSettings

  const notificationToggleMeta: Array<{
    key: keyof NotificationSettings
    label: string
    description: string
  }> = [
    {
      key: 'onGameStartWithReports',
      label: 'Game Start: Reports Found',
      description: 'Reminds you at launch to check community reports that may help before you begin playing.',
    },
    {
      key: 'onGameStartWithoutReports',
      label: 'Game Start: No Reports',
      description: 'Encourages you at launch to be the first to share a report and help grow the community database.',
    },
    {
      key: 'onGameStopWithReports',
      label: 'Game Exit: Reports Found',
      description: 'After your session, suggests reviewing what other players have reported about the game.',
    },
    {
      key: 'onGameStopWithoutReports',
      label: 'Game Exit: No Reports',
      description: 'When you exit, prompts you to take a moment to submit the first community report for this game.',
    },
  ]

  const updateDeviceList = async () => {
    setIsLoading(true)
    try {
      const devices = await fetchDeviceList()
      setDeviceList(devices || [])
    } catch (error) {
      console.error('[decky-game-settings:PluginConfigView] Error fetching game details:', error)
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

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const nextSettings: NotificationSettings = {
      ...(currentConfig.notificationSettings ?? defaultNotificationSettings),
      [key]: value,
    }
    updateConfig({ notificationSettings: nextSettings })
  }

  const openGithubLogin = () => {
    popupLoginDialog(() => {
      setHasGithub(hasGithubToken())
      const fetchProfile = async () => {
        const p = await gitHubUserProfile()
        setGhProfile(p)
      }
      fetchProfile()
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

  const sortedDeviceOptions = useMemo(
    () =>
      [...deviceList]
        .sort((a, b) => a.description.localeCompare(b.description))
        .map((device) => ({
          label: `${currentConfig.filterDevices.includes(device.description) ? '✔' : '—'} ${device.description}`,
          data: device.description,
        })),
    [deviceList, currentConfig.filterDevices]
  )

  useEffect(() => {
    console.log(`[decky-game-settings:PluginConfigView] Mounted`)
    updateDeviceList()
    const fetchProfile = async () => {
      const p = await gitHubUserProfile()
      setGhProfile(p)
    }
    fetchProfile()
  }, [])

  return (
    <>
      <div style={{ padding: '3px 16px 3px 16px', margin: 0 }}>
        <Focusable
          style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', height: '26px' }}
          flow-children='horizontal'
        >
          <DialogButton
            // @ts-ignore
            autoFocus={true}
            retainFocus={true}
            style={{
              width: '73px',
              minWidth: '73px',
              padding: '3px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
            }}
            onClick={onGoBack}
          >
            <MdArrowBack />
          </DialogButton>
        </Focusable>
      </div>
      <hr />

      <>
        <PanelSection title='GitHub Account'>
          <PanelSectionRow>
            <div style={fieldBlockStyle}>
              <div style={fieldHeadingStyle}>{hasGithub ? 'GitHub linked' : 'Connect GitHub'}</div>
              <div style={helperTextStyle}>
                Sign in to sync report submissions with your GitHub account directly from Decky.
              </div>
              {hasGithub ? (
                <DialogButton style={actionButtonStyle} onClick={logoutGithub}>
                  {ghProfile?.avatar_url ? (
                    <img
                      src={ghProfile.avatar_url}
                      alt={ghProfile.login}
                      style={{ width: 20, height: 20, borderRadius: '50%' }}
                    />
                  ) : null}
                  <span>Sign out @{ghProfile?.login || 'GitHub'}</span>
                </DialogButton>
              ) : (
                <DialogButton style={actionButtonStyle} onClick={openGithubLogin}>
                  Connect GitHub
                </DialogButton>
              )}
            </div>
          </PanelSectionRow>
        </PanelSection>

        {isLoading ? (
          <PanelSection spinner title='Loading device list…' />
        ) : (
          <PanelSection title='Device filters'>
            <PanelSectionRow>
              <div style={fieldBlockStyle}>
                <div style={fieldHeadingStyle}>Choose which devices to show</div>
                <div style={helperTextStyle}>
                  Select to add, select again to remove. Leave empty to browse everything.
                </div>
                <Dropdown
                  rgOptions={sortedDeviceOptions}
                  selectedOption={null}
                  onChange={(option) => handleDeviceSelection(option.data)}
                  strDefaultLabel='Toggle devices'
                />
                {currentConfig.filterDevices.length > 0 ? (
                  <div style={chipListStyle}>
                    {currentConfig.filterDevices.map((deviceName) => (
                      <span key={deviceName} style={chipStyle}>
                        {deviceName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={mutedHelperTextStyle}>No filters applied — all devices are shown.</div>
                )}
              </div>
            </PanelSectionRow>
          </PanelSection>
        )}

        <PanelSection title='Library view'>
          <PanelSectionRow>
            <div style={fieldBlockStyle}>
              <ToggleField
                checked={!currentConfig.showAllApps}
                label='Installed games only'
                onChange={(value) => updateConfig({ showAllApps: !value })}
              />
              <div style={helperTextStyle}>Limits the library view to titles installed on this device.</div>
            </div>
          </PanelSectionRow>
        </PanelSection>

        <PanelSection title='Notifications'>
          <PanelSectionRow>
            <div style={{ ...fieldBlockStyle, gap: '10px' }}>
              <div style={helperTextStyle}>Configure notifications pushed by this plugin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={toggleBlockStyle}>
                  <ToggleField
                    checked={notificationSettings.notifyOncePerGame}
                    label='Notify once per game'
                    onChange={(value) => updateNotificationSetting('notifyOncePerGame', value)}
                  />
                  <div style={helperTextStyle}>Ensures each notification type is sent once per game</div>
                </div>
                {notificationToggleMeta.map(({ key, label, description }) => (
                  <div key={key} style={toggleBlockStyle}>
                    <ToggleField
                      checked={notificationSettings[key] as boolean}
                      label={label}
                      onChange={(value) => updateNotificationSetting(key, value)}
                    />
                    <div style={helperTextStyle}>{description}</div>
                  </div>
                ))}
              </div>
            </div>
          </PanelSectionRow>

          {showDebugButtons ? (
            <PanelSectionRow>
              <ButtonItem onClick={() => sendNotification('onGameStopWithoutReports', 0)}>Test Notification</ButtonItem>
            </PanelSectionRow>
          ) : null}
        </PanelSection>
        <hr />
        <PanelSection>
          <PanelSocialButton icon={<SiPatreon fill='#438AB9' />} url='https://www.patreon.com/c/Josh5'>
            Patreon
          </PanelSocialButton>
          <PanelSocialButton icon={<SiKofi fill='#FF5E5B' />} url='https://ko-fi.com/josh5coffee'>
            Ko-fi
          </PanelSocialButton>
          <PanelSocialButton icon={<SiDiscord fill='#5865F2' />} url='https://streamingtech.co.nz/discord'>
            Discord
          </PanelSocialButton>
          <PanelSocialButton
            icon={<SiGithub fill='#f5f5f5' />}
            url='https://github.com/DeckSettings/decky-game-settings'
          >
            Plugin Source
          </PanelSocialButton>
        </PanelSection>
      </>
    </>
  )
}

export default PluginConfigView
