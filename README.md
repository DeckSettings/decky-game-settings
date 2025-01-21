# Deck Settings

[![Chat](https://img.shields.io/badge/chat-on%20discord-7289da.svg)](https://streamingtech.co.nz/discord)

"Deck Settings" is a plugin for Decky Loader that fetches and displays community-driven game compatibility and configuration reports directly from the [Deck Settings API](https://deckverified.games/). These reports, sourced from the open-source [game-reports-steamos repository](https://github.com/DeckSettings/game-reports-steamos), provide optimized performance tweaks, graphics settings, and compatibility information for handheld gaming devices like the Steam Deck.

## Features
- Fetches game compatibility reports for devices like Steam Deck, ROG Ally, and others.
- Provides configuration tips, performance tweaks, and compatibility ratings for individual games.
- Allows users to search by game name or Steam App ID.

## Developers

### Dependencies

This relies on the user having Node.js v16.14+ and `pnpm` (v9) installed on their system.  
Please make sure to install pnpm v9 to prevent issues with CI during plugin submission.  
`pnpm` can be downloaded from `npm` itself which is recommended.

#### Linux

```bash
npm i -g pnpm@9
```

### Building Deck Settings

1. Clone the repository.
2. In your local fork/own plugin-repository run these commands:
   1. ``pnpm i``
   2. ``pnpm run build``
      - These setup pnpm and build the frontend code for testing.
3. Use the [decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) documentation to integrate additional functionality as needed.
4. If using VSCodium/VSCode, run the `setup` and `build` and `deploy` tasks. If not using VSCodium etc. you can derive your own makefile or just manually utilize the scripts for these commands as you see fit.

If you use VSCode or it's derivatives (we suggest [VSCodium](https://vscodium.com/)!) just run the `setup` and `build` tasks. It's really that simple.

#### Rebuilding After Code Changes

Everytime you change the frontend code (`index.tsx` etc) you will need to rebuild using the commands from step 2 above or the build task if you're using vscode or a derivative.

Note: If you are receiving build errors due to an out of date library, you should run this command inside of your repository:

```bash
pnpm update @decky/ui --latest
```
