// Site URLs
export const reportsApiBaseUrl = "https://deckverified.games/deck-verified/api/v1";
export const reportsWebsiteBaseUrl = "https://deckverified.games/deck-verified/#";

// Lists of apps to ignore
export const ignoreSteam = [
    2180100, // Proton Hotfix
    1493710, // Proton Experimental
    1070560, // Steam Linux Runtime
    1070560, // "Steam Linux Runtime 1.0 (scout)"
    1391110, // "Steam Linux Runtime 2.0 (soldier)"
    1628350, // "Steam Linux Runtime 3.0 (sniper)"
    228980, // "Steamworks Common Redistributables"
]
export const appsToIgnore = [
    /^Proton\s\d+\.\d+$/,
    /^Steam Linux Runtime \d+\.\d+\s\(.*\)$/
];

export interface GameDataViewProps {
    gameName: string;
    appId?: number;
    onGoBack: () => void;
}

export interface GameDetails {
    gameName: string;
    appId?: number;
    metadata: GameMetadata;
    reports: GameReport[];
}

export interface GameMetadata {
    poster: string | null;
    hero: string | null;
    banner: string | null;
    background: string | null;
}

export interface GameReport {
    id: number;
    title: string;
    html_url: string;
    data: GameReportData;
    reactions: GameReportReactions;
    labels: {
        name: string;
        color: string;
        description: string;
    }[];
    user: GitHubUser;
    created_at: string; // ISO 8601 formatted date string
    updated_at: string; // ISO 8601 formatted date string
}

export interface GameReportReactions {
    reactions_thumbs_up: number;
    reactions_thumbs_down: number;
}

export interface GameReportData {
    summary: string;
    game_name: string;
    app_id: number;
    launcher: string;
    device_compatibility: string;
    target_framerate: string;
    device: string;
    os_version: string;
    undervolt_applied: string | null;
    steam_play_compatibility_tool_used: string;
    compatibility_tool_version: string;
    game_resolution: string;
    custom_launch_options: string | null;
    frame_limit: number | null;
    disable_frame_limit: string;
    enable_vrr: string;
    allow_tearing: string;
    half_rate_shading: string;
    tdp_limit: number | null;
    manual_gpu_clock: number | null;
    scaling_mode: string;
    scaling_filter: string;
    game_display_settings: string;
    game_graphics_settings: string;
    additional_notes: string;
}

export interface GitHubUser {
    login: string;
    avatar_url: string;
}