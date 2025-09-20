import { definePlugin } from '@decky/api'
import QuickAccessMenuRouter from './components/QuickAccessMenuRouter'
import { gameChangeActions } from './hooks/gameLibrary'
import DeckSettingsIcon from './components/icons/DeckSettingsIcon'

export default definePlugin(() => {
  // Register for game lifetime change notifications
  console.log('[decky-game-settings:index] Registering background game change listener.')
  const gameChangeListener = gameChangeActions()
  return {
    // The name shown in various decky menus
    name: 'DeckyGameSettings',
    // The element displayed at the top of your plugin's menu
    titleView: <div>Deck Settings</div>,
    // Preserve the plugin's state while the QAM is closed
    alwaysRender: true,
    // The content of your plugin's menu
    content: <QuickAccessMenuRouter />,
    // The icon displayed in the plugin list
    icon: <DeckSettingsIcon size='1em' />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log('[decky-game-settings:index] Unloading background game change listener.')
      if (gameChangeListener && typeof gameChangeListener.unregister === 'function') gameChangeListener.unregister()
    },
  }
})
