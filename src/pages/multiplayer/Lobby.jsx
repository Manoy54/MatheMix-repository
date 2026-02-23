import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MultiplayerService } from '../../services/MultiplayerService';
import { useMultiplayerRoom } from '../../hooks/useMultiplayerRoom';
import { useMobile } from '../../hooks/useMobile';

// Lazy load game components
const MultiplayerGame = React.lazy(() => import('../../components/MultiplayerGame.jsx'));
const MultiplayerGameFinish = React.lazy(() => import('../../components/MultiplayerGameFinish.jsx'));

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, LogOut } from 'lucide-react';
import RoomSelection from './RoomSelection';
import HostLobby from './HostLobby';
import PlayerWaiting from './PlayerWaiting';
import { QUESTIONS } from '../../data.js';
import StandardHeader from '../../components/StandardHeader';

// Background Component to prevent Lobby re-renders from affecting it
const LobbyBackground = React.memo(({ isMobile }) => {
    const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];
    const symbolsData = useMemo(() => {
        return mathSymbols.map((symbol, i) => ({
            symbol,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 80 + 60}px`,
            duration: Math.max(15, Math.random() * 15 + 15),
            delay: `${i * 0.5}s`
        }));
    }, []);

    if (isMobile) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {symbolsData.map((data, i) => (
                <div
                    key={`symbol-${i}`}
                    className="absolute text-white/10 select-none"
                    style={{
                        left: data.left,
                        top: data.top,
                        fontSize: data.fontSize,
                        animation: `float ${data.duration}s ease-in-out ${data.delay} infinite`
                    }}
                >
                    {data.symbol}
                </div>
            ))}
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-3xl" style={{ animation: 'pulse-slow 8s ease-in-out 4s infinite' }} />
            <div className="absolute top-1/3 left-1/2 w-64 h-64 border-2 border-cyan-400/20 rounded-full animate-spin-slow" />
            <div
                className="absolute bottom-1/3 right-1/3 w-48 h-48 border-2 border-purple-400/20 animate-spin-reverse"
                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
            />
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />
        </div>
    );
});

export default function Lobby({ user, username, onOpenSidebar }) {
    const isMobile = useMobile();

    // Local UI State
    const [view, setView] = useState("select");
    const [nickname, setNickname] = useState(() => {
        const saved = localStorage.getItem(`lastUsedNickname_${user?.uid}`);
        return saved || username || user?.displayName || user?.username || "Player";
    });
    const [roomCode, setRoomCode] = useState("");
    const [uiError, setUiError] = useState("");
    const [showHostLeftModal, setShowHostLeftModal] = useState(false);

    // Sync nickname with prop updates
    useEffect(() => {
        if (!localStorage.getItem(`lastUsedNickname_${user?.uid}`) && username) {
            setNickname(username);
        }
    }, [username, user?.uid]);

    // Use Custom Hook for Room Logic
    const { roomData, gameStarted, error: roomError, hostIdRef } = useMultiplayerRoom(roomCode, user);

    // Derived State
    const isHost = roomData?.hostId === user?.uid;

    // Handle Room Errors / Host Leaving
    useEffect(() => {
        if (roomError) {
            // If error occurs (e.g. room deleted), and we thought we were in a game:
            if (view !== "select") {
                // Check if it was because host left (we are not host)
                if (hostIdRef.current && hostIdRef.current !== user?.uid) {
                    setShowHostLeftModal(true);
                } else {
                    // Just reset
                    setRoomCode("");
                    setView("select");
                }
            }
        }
    }, [roomError, view, user?.uid, hostIdRef]);

    // Cleanup when leaving manually
    const leaveLobby = async () => {
        if (roomCode) {
            try {
                await MultiplayerService.leaveRoom(roomCode, roomData, user, isHost);
            } catch (err) {
                console.error("Error leaving room:", err);
            }
        }
        setRoomCode("");
        setView("select");
        setUiError("");
        setShowHostLeftModal(false);
    };

    // Actions
    const handleHostGame = async (playerNickname) => {
        if (!playerNickname.trim()) return setUiError("Please enter a nickname.");
        setUiError("");
        try {
            const newRoomCode = await MultiplayerService.createRoom(user, playerNickname);
            setRoomCode(newRoomCode);
            setView("host");
            localStorage.setItem(`lastUsedNickname_${user.uid}`, playerNickname);
        } catch (e) {
            setUiError("Failed to create room. Please try again.");
        }
    };

    const handleJoinGame = async (playerNickname, codeToJoin) => {
        if (!playerNickname.trim() || !codeToJoin.trim()) return setUiError("Enter nickname and room code.");
        setUiError("");
        try {
            await MultiplayerService.joinRoom(user, playerNickname, codeToJoin);
            setRoomCode(codeToJoin);
            setView("waiting");
            localStorage.setItem(`lastUsedNickname_${user.uid}`, playerNickname);
        } catch (e) {
            setUiError(e.message || "Failed to join room.");
        }
    };

    const handleStartGame = async () => {
        if (!roomData) return;
        const category = roomData.category;
        const qBank = QUESTIONS[category];
        try {
            await MultiplayerService.startGame(roomCode, roomData, qBank);
        } catch (e) {
            setUiError(e.message);
        }
    };

    // Render Game if Started
    if (gameStarted && roomData) {
        if (roomData.status === "finished") {
            return (
                <React.Suspense fallback={<LoadingScreen text="Loading Results..." />}>
                    <MultiplayerGameFinish
                        user={user}
                        roomData={roomData}
                        onLeave={leaveLobby}
                        onHostPlayAgain={() => MultiplayerService.playAgain(roomCode, roomData)}
                    />
                </React.Suspense>
            );
        }

        if (roomData.currentQuestion) {
            return (
                <React.Suspense fallback={<LoadingScreen text="Loading Game..." />}>
                    <MultiplayerGame
                        user={user}
                        nickname={nickname}
                        roomCode={roomCode}
                        roomData={roomData}
                        onLeave={leaveLobby}
                        onOpenSidebar={onOpenSidebar}
                    />
                </React.Suspense>
            );
        }
    }

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            <LobbyBackground isMobile={isMobile} />

            <div className={`relative z-10 px-4 h-full flex flex-col ${isMobile ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
                <StandardHeader onOpenSidebar={onOpenSidebar} />

                <div className="flex-1 flex items-start justify-center p-2 md:p-4 overflow-hidden">
                    <div className="w-full h-full md:h-auto md:w-full max-w-5xl mx-auto flex flex-col justify-start">
                        {view === "select" && (
                            <RoomSelection
                                nickname={nickname}
                                setNickname={setNickname}
                                onHostGame={handleHostGame}
                                onJoinGame={handleJoinGame}
                                error={uiError}
                            />
                        )}

                        {view === "host" && (
                            <HostLobby
                                roomCode={roomCode}
                                roomData={roomData}
                                categories={Object.keys(QUESTIONS)}
                                user={user}
                                onStartGame={handleStartGame}
                                onCategoryChange={(cat) => MultiplayerService.updateCategory(roomCode, cat)}
                                onRoundsChange={(r) => MultiplayerService.updateRounds(roomCode, parseInt(r))}
                                leaveLobby={leaveLobby}
                                hostParticipates={roomData?.hostParticipates ?? true}
                                onHostParticipationToggle={(p) => MultiplayerService.toggleHostParticipation(roomCode, roomData, user, nickname, p)}
                            />
                        )}

                        {view === "waiting" && (
                            <PlayerWaiting
                                roomCode={roomCode}
                                roomData={roomData}
                                user={user}
                                leaveLobby={leaveLobby}
                            />
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showHostLeftModal && (
                    <HostLeftModal onLeave={() => { setShowHostLeftModal(false); leaveLobby(); }} />
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponents for cleaner file
const LoadingScreen = ({ text }) => (
    <div className="h-screen w-full flex items-center justify-center bg-[#023e8a]">
        <div className="text-white text-xl font-bold animate-pulse flex flex-col items-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
            <span>{text}</span>
        </div>
    </div>
);

const HostLeftModal = ({ onLeave }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#023e8a] border-2 border-white/20 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center space-y-6"
        >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Host Left</h2>
                <p className="text-white/70 font-medium">
                    The host has ended the session.
                </p>
            </div>
            <button
                onClick={onLeave}
                className="w-full py-4 bg-white text-[#023e8a] rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-white/90 transition-all font-bold"
            >
                Return to Lobby
            </button>
        </motion.div>
    </div>
);
