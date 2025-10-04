import React, { useEffect, useState } from 'react'
import GameSelectView from './views/GameSelectView'
import GameDetailsView from './views/GameDetailsView'
import CreateReportView from './views/CreateReportView'
import SearchResultsView from './views/SearchResultsView'
import type { GameInfo, PluginPage } from '../interfaces'
import PluginConfigView from './views/PluginConfigView'
import { Footer } from './elements/AuthorFooter'

const QuickAccessMenuRouter: React.FC = () => {
  const [pageHistory, setPageHistory] = useState<PluginPage[]>(['game_select'])
  const currentPage = pageHistory[pageHistory.length - 1]
  const changePage = (page: PluginPage) => {
    setPageHistory((prev) => [...prev, page])
  }
  const handleGoBack = () => {
    setPageHistory((prev) => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, prev.length - 1)
        return newHistory
      }
      return prev
    })
  }

  const [gameSearchText, setGameSearchText] = useState<string>('')
  const handleSearch = (searchText: string) => {
    setGameSearchText(searchText)
    setSelectedGame(null)
    changePage('search_results')
  }

  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null)
  const handleGameSelect = (game: GameInfo) => {
    setSelectedGame(game)
    changePage('game_data')
  }

  useEffect(() => {
  }, [currentPage])

  return (
    <div>
      {currentPage === 'plugin_config' && (
        <PluginConfigView
          onGoBack={handleGoBack}
        />
      )}
      {currentPage === 'game_select' && (
        <GameSelectView
          onGameSelect={handleGameSelect}
          onSearch={handleSearch}
          onChangePage={changePage}
        />
      )}
      {currentPage === 'search_results' && (
        <SearchResultsView
          query={gameSearchText}
          onGameSelect={handleGameSelect}
          onSearch={handleSearch}
          onGoBack={handleGoBack}
        />
      )}
      {currentPage === 'game_data' && selectedGame && (
        <GameDetailsView
          gameName={selectedGame.title}
          appId={selectedGame.appId}
          onChangePage={changePage}
          onGoBack={handleGoBack}
        />
      )}
      {currentPage === 'report_form' && (
        <CreateReportView
          onGoBack={handleGoBack}
          defaultGameName={selectedGame?.title}
          defaultAppId={selectedGame?.appId}
        />
      )}

      {/* Footer */}
      {(['game_select', 'plugin_config', 'search_results'] as PluginPage[]).includes(currentPage) && (
        <Footer />
      )}
    </div>
  )
}

export default QuickAccessMenuRouter
