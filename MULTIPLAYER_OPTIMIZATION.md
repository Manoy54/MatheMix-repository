# Multiplayer Optimization & Refactoring Report

## Executive Summary
A comprehensive audit and refactoring of the multiplayer architecture was conducted to address performance bottlenecks, race conditions, and code maintainability. Key improvements include the introduction of a centralized room subscription hook, transaction-based game state updates, and rendering optimizations in the main game loop.

## Identified Bottlenecks & Issues

### 1. Rendering Performance
- **Issue**: The entire `Lobby` and `PlayerGamePage` component trees were re-rendering on every single data update (e.g., a timer tick or a single character input).
- **Cause**: Lack of memoization for derived state (e.g., player rankings) and expensive components (`RoundTimer`, `CharacterBoxes`).
- **Fix**: 
    - Implemented `useMemo` for derived data structures (`sortedPlayers`, `myRank`).
    - Memoized `RoundTimer` to prevent parent re-renders from cascading.
    - Optimized `CharacterBoxes` to ensure stable callbacks (`useCallback`).

### 2. Game State Consistency (Race Conditions)
- **Issue**: Scoring and round transitions relied on client-side state in the Host's browser, which was then written back to Firestore.
- **Risk**: If a player joined/left or answered exactly when the round ended, their data could be overwritten or lost due to stale closure variables.
- **Fix**: 
    - Refactored `MultiplayerService.js` to use **Firestore Transactions** (`runTransaction`) for `startNextRound` and `finishGame`.
    - Moved scoring logic inside the transaction to ensure it always uses the authoritative server state.

### 3. Network Efficiency & Stability
- **Issue**: The `useHostGameLogic` hook had potential for "double-firing" events (e.g., starting intermission multiple times) due to latency in state updates.
- **Fix**: 
    - Introduced `processingActionRef` to block duplicate calls during async operations.
    - Improved `useEffect` dependency arrays to prevent unnecessary network requests.
    - Centralized room subscription logic in `useMultiplayerRoom` to ensure clean mounting/unmounting behavior.

### 4. Code maintainability (Spaghetti Code)
- **Issue**: `Lobby.jsx` contained mixed responsibilities (UI, Logic, Subscription, Background Animation).
- **Fix**: 
    - Extracted `useMultiplayerRoom` hook.
    - Moved background animation logic to a memoized `LobbyBackground` component.
    - Cleaned up `useHostGameLogic` to be a pure logic controller without side effects on the DOM.

## Architecture Overview

### Data Flow
1. **Firestore** (Source of Truth)
2. **useMultiplayerRoom** (Subscription Layer) -> Pushes updates to `Lobby`.
3. **MultiplayerService** (Write Layer) -> Handles user actions via Transactions.
4. **PlayerGamePage** (View Layer) -> derived state & optimized rendering.

### Key Files Modified
- `src/services/MultiplayerService.js`: Added transactions, improved error handling.
- `src/pages/multiplayer/Lobby.jsx`: Refactored to use hooks, separated background.
- `src/components/PlayerGamePage.jsx`: Added memoization for critical paths.
- `src/hooks/useHostGameLogic.js`: Made robust against race conditions.
- `src/hooks/useMultiplayerRoom.js`: **New** hook for clean subscriptions.

## Performance Validation
- **Rendering**: Typing in the answer box no longer triggers re-sort of players or re-render of the timer.
- **Networking**: Round transitions are now atomic. Host leaving effectively cleans up resources.
- **Reliability**: Race conditions during high-concurrency answer submissions are mitigated by `arrayUnion` and transactional scoring.
