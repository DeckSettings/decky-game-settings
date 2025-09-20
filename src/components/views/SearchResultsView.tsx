import {
  PanelSection,
  PanelSectionRow,
  Spinner,
  DialogButton, Focusable, showModal, staticClasses,
} from '@decky/ui'
import { useState, useEffect } from 'react'
import { MdArrowBack, MdSearch } from 'react-icons/md'
import { TextFieldModal } from '../elements/TextFieldModal'
import type { GameInfo } from '../../interfaces'
import { getGamesBySearchTerm } from '../../hooks/deckVerifiedApi'

interface SearchResultsViewProps {
  query: string;
  onGameSelect: (game: GameInfo) => void;
  onSearch: (searchText: string) => void;
  onGoBack: () => void;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({ query, onGameSelect, onSearch, onGoBack }) => {
  const [searchResults, setSearchResults] = useState<GameInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSearchResults = async (term: string) => {
    setIsLoading(true)
    try {
      const results = await getGamesBySearchTerm(term)
      console.log(`[decky-game-settings:SearchResultsView] Search Results: ${results}`)
      setSearchResults(results || [])
    } catch (error) {
      console.error('[decky-game-settings:SearchResultsView] Error fetching search results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log(`[decky-game-settings:SearchResultsView] Mounted with query: ${query}`)
    fetchSearchResults(query)
  }, [query])

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
              onClick={onGoBack}>
              <MdArrowBack />
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
                  initialValue={query}
                  onClosed={onSearch}
                />,
              )}>
              <MdSearch /> Search
            </DialogButton>
          </Focusable>
        </div>
        <hr />
      </div>
      <PanelSection>
        {isLoading ? (
          <>
            <div>
                            <span className={staticClasses.PanelSectionTitle}
                                  style={{
                                    color: 'white',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    lineHeight: '28px',
                                    textTransform: 'none',
                                    marginBottom: '0px',
                                  }}>
                                {`Searching...`}
                            </span> "{query}"
            </div>
            <Spinner height="40px" />
          </>
        ) : searchResults.length > 0 ? (
          <>
            <div>
                            <span className={staticClasses.PanelSectionTitle}
                                  style={{
                                    color: 'white',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    lineHeight: '28px',
                                    textTransform: 'none',
                                    marginBottom: '0px',
                                  }}>
                                Search Results:
                            </span>
            </div>
            {searchResults.map((game, index) => (
              <PanelSectionRow key={index}>
                <DialogButton
                  style={{ padding: '3px', fontSize: '14px', marginBottom: '10px' }}
                  key={game.title}
                  onClick={() => onGameSelect(game)}>
                  {game.title}
                </DialogButton>
              </PanelSectionRow>
            ))}
          </>
        ) : (
          <div>No results found</div>
        )}
      </PanelSection>
    </>
  )
}

export default SearchResultsView
