import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    addDoc,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';
// Lazy load large game components to prevent initialization errors and improve performance
const MultiplayerGame = React.lazy(() => import('../../components/MultiplayerGame.jsx'));
const MultiplayerGameFinish = React.lazy(() => import('../../components/MultiplayerGameFinish.jsx'));
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Calculator, Sparkles, LogOut } from 'lucide-react';
import RoomSelection from './RoomSelection';
import HostLobby from './HostLobby';
import PlayerWaiting from './PlayerWaiting';
import { QUESTIONS } from '../../data.js';
import StandardHeader from '../../components/StandardHeader';
import { useMobile } from '../../hooks/useMobile';


const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("MultiplayerGame Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong.</h2>
                    <p className="text-sm opacity-70 mb-4">{this.state.error?.toString()}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                    >
                        Reload Game
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function Lobby({ user, username, onOpenSidebar }) {
    const isMobile = useMobile();
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

    const [view, setView] = useState("select");
    const [nickname, setNickname] = useState(() => {
        const saved = localStorage.getItem("lastUsedNickname");
        return saved || username || user?.displayName || user?.username || "Player";
    });

    // Update nickname if username becomes available and we don't have a saved one
    useEffect(() => {
        if (!localStorage.getItem("lastUsedNickname") && username) {
            setNickname(username);
        }
    }, [username]);
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");

    const [roomData, setRoomData] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [showHostLeftModal, setShowHostLeftModal] = useState(false);

    const isHost = roomData?.hostId === user?.uid;

    const hostIdRef = useRef(null);
    const gameStartedRef = useRef(false);
    const viewRef = useRef(view); // Ref to keep track of the latest 'view' state

    useEffect(() => {
        viewRef.current = view; // Update the ref whenever 'view' state changes
    }, [view]);

    useEffect(() => {
        if (!roomCode) return;

        const roomRef = doc(db, "rooms", roomCode);
        console.log("Setting up snapshot listener for room:", roomCode);

        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("Room data updated:", data.roomCode, "Players:", data.players.length);

                // Track hostId for the 'else' block (room deletion)
                hostIdRef.current = data.hostId;
                gameStartedRef.current = data.status === "playing" || data.status === "finished";

                setRoomData(data);

                if (data.status === "playing" || data.status === "finished") {
                    setGameStarted(true);
                } else {
                    setGameStarted(false);
                }
            } else {
                console.log("Room document deleted or does not exist.");
                // If room is deleted
                // Check if we were in a game and were NOT the host
                if (gameStartedRef.current && hostIdRef.current && hostIdRef.current !== user?.uid) {
                    setShowHostLeftModal(true);
                }

                // Clear room state regardless
                // Use viewRef.current to get the latest view state
                if (viewRef.current === "host" || viewRef.current === "waiting" || gameStartedRef.current) {
                    if (!showHostLeftModal) {
                        setRoomCode("");
                        setRoomData(null);
                        setGameStarted(false);
                        setView("select");
                    }
                }
            }
        }, (err) => {
            console.error("onSnapshot error:", err);
        });

        return () => {
            console.log("Unsubscribing from room snapshot:", roomCode);
            unsubscribe();
        };
    }, [roomCode, user?.uid]);

    // This effect cleans up the room if the host navigates away
    // MODIFY: disable auto-delete on unmount to prevent room destruction on crash/refresh
    useEffect(() => {
        return () => {
            // Auto-deletion removed for safety. 
            // Room should be deleted via explicit 'Leave' button or TTL.
            /* 
            if (isHost && roomCode) {
                const roomRef = doc(db, "rooms", roomCode);
                deleteDoc(roomRef);
            } 
            */
        };
    }, [isHost, roomCode]);


    const checkRoomExists = async (code) => {
        const roomRef = doc(db, "rooms", code);
        const roomSnap = await getDoc(roomRef);
        return roomSnap.exists();
    };

    const handleHostGame = async (playerNickname) => {
        if (!playerNickname.trim()) {
            setError("Please enter a nickname.");
            return;
        }
        setError("");

        console.log("Attempting to host game with nickname:", playerNickname);

        let newRoomCode = generateRoomCode();
        let roomExists = await checkRoomExists(newRoomCode);
        while (roomExists) {
            newRoomCode = generateRoomCode();
            roomExists = await checkRoomExists(newRoomCode);
        }

        console.log("Generated new room code:", newRoomCode);

        setRoomCode(newRoomCode);
        setView("host");

        const roomRef = doc(db, "rooms", newRoomCode);
        const newPlayer = { uid: user.uid, nickname: playerNickname, score: 0 };

        try {
            await setDoc(roomRef, {
                hostId: user.uid,
                hostName: playerNickname,
                roomCode: newRoomCode,
                players: [newPlayer],
                category: "Number & Algebra",
                status: "waiting",
                rounds: 5,
                currentQuestion: null,
                answers: [],
                roundNumber: 1,
            });
            console.log("Room created successfully in Firestore.");
            localStorage.setItem("lastUsedNickname", playerNickname);
        } catch (e) {
            console.error("Error creating room:", e);
            setError("Failed to create room. Please try again.");
            setRoomCode("");
            setView("select");
        }
    };

    const handleJoinGame = async (playerNickname, codeToJoin) => {
        if (!playerNickname.trim() || !codeToJoin.trim()) {
            setError("Please enter a nickname and room code.");
            return;
        }
        setError("");
        console.log(`Attempting to join room ${codeToJoin} with nickname ${playerNickname}`);

        const roomRef = doc(db, "rooms", codeToJoin);
        try {
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                setError("Room not found. Check the code and try again.");
                console.error(`Room ${codeToJoin} does not exist.`);
                return;
            }

            const data = roomSnap.data();
            if (data.status === "playing") {
                setError("Game is already in progress. Cannot join.");
                console.error(`Game in room ${codeToJoin} is already in progress.`);
                return;
            }

            // Check if user is already in the lobby
            const playerExists = data.players.find(p => p.uid === user.uid);
            if (playerExists) {
                console.log("Player already in lobby, rejoining...");
            } else {
                const newPlayer = { uid: user.uid, nickname: playerNickname, score: 0 };
                await updateDoc(roomRef, {
                    players: arrayUnion(newPlayer)
                });
                console.log(`Player ${playerNickname} successfully joined room ${codeToJoin}`);
            }


            setRoomCode(codeToJoin);
            setView("waiting");
            localStorage.setItem("lastUsedNickname", playerNickname);
        } catch (e) {
            console.error("Error joining room:", e);
            setError("Failed to join room. Please try again.");
        }
    };

    const handleStartGame = async () => {
        if (!roomData) return;

        const category = roomData.category;
        const qBank = QUESTIONS[category];

        if (!qBank || qBank.length === 0) {
            setError(`No questions available for the "${category}" category.`);
            return;
        }

        // Get a random question that hasn't been played yet in this session
        const playedQuestions = roomData.playedQuestions || [];
        const availableQuestions = qBank.filter(q => !playedQuestions.includes(q.id));

        if (availableQuestions.length === 0) {
            // All questions have been played, reset or notify
            // For now, let's just allow re-playing questions
            console.warn("All questions for this category have been played. Resetting played questions.");
            playedQuestions.length = 0; // Reset
        }


        const question = availableQuestions.length > 0
            ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
            : qBank[Math.floor(Math.random() * qBank.length)];


        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
            roundNumber: 1,
        });
    };

    const handleCategoryChange = async (newCategory) => {
        if (!isHost || !roomCode) return;
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            category: newCategory
        });
    };

    const handleRoundsChange = async (newRounds) => {
        if (!isHost || !roomCode) return;
        const rounds = parseInt(newRounds);
        if (isNaN(rounds) || rounds < 1) return;

        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            rounds: rounds
        });
    };

    const handlePlayAgain = async () => {
        if (!roomData || !isHost) return;

        const roomRef = doc(db, "rooms", roomCode);
        const matchesCollection = collection(roomRef, "matches");

        try {
            // 1. Archive current match results to a subcollection
            await addDoc(matchesCollection, {
                players: roomData.players,
                finishedAt: new Date(),
                totalRounds: roomData.rounds || 5,
                category: roomData.category || "General"
            });

            // 2. Reset room state for the next match
            // Reset players' scores and clear temporary game data
            const resetPlayers = roomData.players.map(p => ({ ...p, score: 0 }));

            await updateDoc(roomRef, {
                status: "waiting",
                players: resetPlayers,
                currentQuestion: null,
                answers: [],
                roundNumber: 1,
                playAgainVotes: [], // Clear votes
                // Ensure nextRoomCode is cleared if it exists from previous logic
                nextRoomCode: null
            });

            // Reset local flag
            setGameStarted(false);
        } catch (e) {
            console.error("Error in play again flow:", e);
            setError("Failed to reset the room. Please try again.");
        }
    };

    const leaveLobby = async () => {
        if (isHost) {
            // If host leaves, delete the entire room
            const updatedPlayers = roomData.players.filter(p => p.uid !== user.uid);
            await updateDoc(roomRef, { players: updatedPlayers });
        }
        setRoomCode("");
        setRoomData(null);
        setView("select");
        setError("");
        setGameStarted(false);
    };

    // Lazy load large game components to prevent initialization errors and improve performance
    const MultiplayerGame = React.lazy(() => import('../../components/MultiplayerGame'));
    const MultiplayerGameFinish = React.lazy(() => import('../../components/MultiplayerGameFinish'));

    if (gameStarted && roomData) {
        if (roomData.status === "finished") {
            return (
                <React.Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white text-xl font-bold animate-pulse">Loading Results...</div>
                    </div>
                }>
                    <MultiplayerGameFinish
                        user={user}
                        roomData={roomData}
                        onLeave={leaveLobby}
                        onHostPlayAgain={handlePlayAgain}
                    />
                </React.Suspense>
            );
        }

        if (roomData.currentQuestion) {
            return (
                <React.Suspense fallback={
                    <div className="h-screen w-full flex items-center justify-center bg-[#023e8a]">
                        <div className="text-white text-xl font-bold animate-pulse flex flex-col items-center gap-2">
                            <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
                            <span>Loading Game...</span>
                        </div>
                    </div>
                }>
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
            {/* Animated background elements - Disabled on mobile for performance */}
            {!isMobile && (
                <>
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

                        {/* Glowing orbs */}
                        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
                        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-3xl" style={{ animation: 'pulse-slow 8s ease-in-out 4s infinite' }} />

                        {/* Geometric patterns */}
                        <div className="absolute top-1/3 left-1/2 w-64 h-64 border-2 border-cyan-400/20 rounded-full animate-spin-slow" />
                        <div
                            className="absolute bottom-1/3 right-1/3 w-48 h-48 border-2 border-purple-400/20 animate-spin-reverse"
                            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                        />
                    </div>

                    {/* Grid pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                            `,
                            backgroundSize: '50px 50px'
                        }}
                    />
                </>
            )}

            {/* Content */}
            <div className={`relative z-10 px-4 h-full flex flex-col ${isMobile ? 'pt-[env(safe-area-inset-top)]' : ''}`}>
                <StandardHeader onOpenSidebar={onOpenSidebar} />

                {/* Main Content - Non-scrollable */}
                <div className="flex-1 flex items-start justify-center p-2 md:p-4 overflow-hidden">
                    <div className="w-full h-full md:h-auto md:w-full max-w-5xl mx-auto flex flex-col justify-start">
                        {/* SELECT VIEW */}
                        {view === "select" && (
                            <RoomSelection
                                nickname={nickname}
                                setNickname={setNickname}
                                onHostGame={handleHostGame}
                                onJoinGame={handleJoinGame}
                                error={error}
                            />
                        )}

                        {/* HOST VIEW */}
                        {view === "host" && (
                            <HostLobby
                                roomCode={roomCode}
                                roomData={roomData}
                                categories={Object.keys(QUESTIONS)}
                                user={user}
                                onStartGame={handleStartGame}
                                onCategoryChange={handleCategoryChange}
                                onRoundsChange={handleRoundsChange}
                                leaveLobby={leaveLobby}
                            />
                        )}

                        {/* WAITING VIEW */}
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

            {/* Final Global Overlays */}
            <AnimatePresence>
                {showHostLeftModal && (
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
                                    The host has ended the session. The game has been terminated for everyone.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowHostLeftModal(false);
                                    leaveLobby();
                                }}
                                className="w-full py-4 bg-white text-[#023e8a] rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-white/90 transition-all font-bold"
                            >
                                Return to Lobby
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CSS Animations */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(0, -40px) rotate(120deg); }
          66% { transform: translate(10px, 0) rotate(240deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
        @keyframes shine {
          100% { transform: translateX(200%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 25s linear infinite; }
        .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
        .animate-shine { animation: shine 1.5s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-fade-in-left { animation: fade-in-left 0.5s ease-out forwards; }
        .animate-fade-in-right { animation: fade-in-right 0.5s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
      `}</style>
        </div>
    );
}
