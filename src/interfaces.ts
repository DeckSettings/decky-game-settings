export interface GameInfo {
    title: string;
    appId: number;
    sortAs?: string;
}

export interface GameSearchResult {
    gameName: string;
    appId: number;
    metadata: GameMetadata
}

export interface GameMetadata {
    poster: string | null;
    hero: string | null;
    banner: string | null;
    background: string | null;
}
