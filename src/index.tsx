import {
  definePlugin,
} from '@decky/api'
import { MdTune } from 'react-icons/md'
import QuickAccessMenuRouter from './components/QuickAccessMenuRouter'
import { gameChangeActions } from './hooks/gameLibrary'

export default definePlugin(() => {
  console.log('Plugin initializing, this is called once on frontend startup')

  // Register for game lifetime change notifications
  const onGameChange = gameChangeActions()

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
    icon: <MdTune />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log('[decky-game-settings:index] Unloading background profile listener.')
      if (onGameChange && typeof onGameChange.unregister === 'function') onGameChange.unregister()
    },
  }
})
