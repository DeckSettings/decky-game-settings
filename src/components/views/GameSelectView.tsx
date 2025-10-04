import {
  DialogButton,
  PanelSection,
  PanelSectionRow,
  showModal,
  Focusable,
} from '@decky/ui'
import { useState, useEffect } from 'react'
import { getGamesList } from '../../hooks/gameLibrary'
import type { GameInfo, PluginPage } from '../../interfaces'
import { TextFieldModal } from '../elements/TextFieldModal'
import { MdSearch, MdSettings } from 'react-icons/md'
import { getPluginConfig } from '../../constants'


interface GameSelectViewProps {
  onGameSelect: (game: GameInfo) => void;
  onSearch: (searchText: string) => void;
  onChangePage: (page: PluginPage) => void;
}

const GameSelectView: React.FC<GameSelectViewProps> = ({ onGameSelect, onSearch, onChangePage }) => {
  const [currentlyRunningGame, setCurrentlyRunningGame] = useState<GameInfo | null>(null)
  const [installedGames, setInstalledGames] = useState<GameInfo[]>([])
  const [nonInstalledGames, setNonInstalledGames] = useState<GameInfo[]>([])

  // Fetch installed games using getInstalledGames
  const fetchInstalledGames = async () => {
    try {
      const { runningGame, installedGames, nonInstalledGames } = await getGamesList()
      setCurrentlyRunningGame(runningGame)
      setInstalledGames(installedGames)
      const currentConfig = getPluginConfig()
      if (currentConfig.showAllApps) {
        setNonInstalledGames(nonInstalledGames)
      }
    } catch (error) {
      console.error('[decky-game-settings:GameSelectView] Error fetching installed games:', error)
    }
  }

  const handleGameSelect = (game: GameInfo) => {
    onGameSelect(game)
  }

  useEffect(() => {
    fetchInstalledGames()
  }, [])

  return (
    <>
      <div>
        <div style={{ padding: '3px 16px 3px 16px', margin: 0 }}>
          <Focusable style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', height: '26px' }}
                     flow-children="horizontal">
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
              onClick={() => onChangePage('plugin_config')}>
              <MdSettings />
            </DialogButton>
            <DialogButton
              style={{
                width: '70%',
                minWidth: 0,
                padding: '3px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}
              onClick={() => showModal(
                <TextFieldModal
                  label="Search"
                  placeholder="Game name or appid"
                  applyLabel="Search"
                  onClosed={onSearch}
                />,
              )}>
              <MdSearch /> Search
            </DialogButton>
          </Focusable>
        </div>
        <hr />
      </div>

      {currentlyRunningGame ? (
        <PanelSection title="Current Game">
          <PanelSectionRow key={`${currentlyRunningGame.appId}${currentlyRunningGame.title}`}>
            <DialogButton
              style={{ padding: '3px', fontSize: '14px', marginBottom: '10px' }}
              key={currentlyRunningGame.appId}
              onClick={() => handleGameSelect(currentlyRunningGame)}
            >
              {currentlyRunningGame.title}
            </DialogButton>
          </PanelSectionRow>
        </PanelSection>
      ) : null}
      {currentlyRunningGame ? (<hr />) : null}

      <PanelSection title="Installed Games">
        {installedGames.map((game) => (
          <PanelSectionRow key={`${game.appId}${game.title}`}>
            <DialogButton
              style={{ padding: '3px', fontSize: '14px', marginBottom: '10px' }}
              key={game.appId}
              onClick={() => handleGameSelect(game)}
            >
              {game.title}
            </DialogButton>
          </PanelSectionRow>
        ))}
      </PanelSection>

      {nonInstalledGames && nonInstalledGames.length > 0 ? (
        <PanelSection title="All Other Games">
          {nonInstalledGames.map((game) => (
            <PanelSectionRow key={`${game.appId}${game.title}`}>
              <DialogButton
                style={{ padding: '3px', fontSize: '14px', marginBottom: '10px' }}
                key={game.appId}
                onClick={() => handleGameSelect(game)}
              >
                {game.title}
              </DialogButton>
            </PanelSectionRow>
          ))}
        </PanelSection>
      ) : null}
      {currentlyRunningGame ? (<hr />) : null}

    </>
  )
}

export default GameSelectView