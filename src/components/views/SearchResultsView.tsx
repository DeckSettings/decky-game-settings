import {
    PanelSection,
    PanelSectionRow,
    ButtonItem,
    Spinner,
    DialogButton, Focusable, TextField, showModal, staticClasses,
} from "@decky/ui";
import {useState, useEffect} from "react";
import {MdArrowBack} from "react-icons/md";
import {TextFieldModal} from "../elements/TextFieldModal";
import type {GameInfo} from "../../interfaces";
import {getGamesBySearchTerm} from "../../hooks/deckVerifiedApi";

interface SearchResultsViewProps {
    query: string;
    onGameSelect: (game: GameInfo) => void;
    onSearch: (searchText: string) => void;
    onGoBack: () => void;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({query, onGameSelect, onSearch, onGoBack,}) => {
    const [searchResults, setSearchResults] = useState<GameInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSearchResults = async (term: string) => {
        setIsLoading(true);
        try {
            const results = await getGamesBySearchTerm(term);
            console.log(`[SearchResultsView] Search Results: ${results}`);
            setSearchResults(results || []);
        } catch (error) {
            console.error("[SearchResultsView] Error fetching search results:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log(`[SearchResultsView] Mounted with query: ${query}`);
        fetchSearchResults(query);
    }, [query]);

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
                        <div style={{width: '70%', minWidth: 0}}>
                            <TextField
                                label="Search"
                                onClick={() => showModal(
                                    <TextFieldModal
                                        label="Search"
                                        placeholder="Game name or appid"
                                        onClosed={onSearch}
                                    />
                                )}
                            />
                        </div>
                    </Focusable>
                </PanelSection>
                <hr/>
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
                        <Spinner height="40px"/>
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
                                <ButtonItem layout="below" onClick={() => onGameSelect(game)}>
                                    {game.title}
                                </ButtonItem>
                            </PanelSectionRow>
                        ))}
                    </>
                ) : (
                    <div>No results found</div>
                )}
            </PanelSection>
        </div>
    );
};

export default SearchResultsView;
