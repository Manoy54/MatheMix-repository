import { useState, useEffect } from 'react';
import { Calculator, Sparkles, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import RoomSelection from './RoomSelection';
import HostLobby from './HostLobby';
import PlayerWaiting from './PlayerWaiting';

// Mock Firebase functions for demo - replace with actual imports
const db = {};
const doc = () => {};
const setDoc = () => {};
const getDoc = () => ({ exists: () => false });
const updateDoc = () => {};
const onSnapshot = () => () => {};
const arrayUnion = () => {};

// Mock data
const QUESTIONS = {
    "Number & Algebra": [],
    "Geometry": [],
    "Statistics": []
};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export default function Lobby({ user, onOpenSidebar }) {
    const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];

    // UI state
    const [view, setView] = useState("select");
    const [nickname, setNickname] = useState(user?.username || "Player");
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");

    // Game state
    const [roomData, setRoomData] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);

    const isHost = roomData?.hostId === user?.uid;

    // Real-time listener
    useEffect(() => {
        if (!roomCode) return;

        const roomRef = doc(db, "rooms", roomCode);
        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRoomData(data);
                if (data.status === "playing") {
                    setGameStarted(true);
                }
            } else {
                if (view === "host" || view === "waiting") {
                    setError("Room not found or has been closed.");
                    setRoomCode("");
                    setRoomData(null);
                    setView("select");
                }
            }
        });

        return () => unsubscribe();
    }, [roomCode, view]);

    // Handlers
    const handleHostGame = async (playerNickname) => {
        if (!playerNickname.trim()) {
            setError("Please enter a nickname.");
            return;
        }
        setError("");

        const newRoomCode = generateRoomCode();
        setRoomCode(newRoomCode);
        setView("host");

        const roomRef = doc(db, "rooms", newRoomCode);
        const newPlayer = { uid: user.uid, nickname: playerNickname, score: 0 };

        await setDoc(roomRef, {
            hostId: user.uid,
            hostName: playerNickname,
            roomCode: newRoomCode,
            players: [newPlayer],
            category: "Number & Algebra",
            status: "waiting",
            currentQuestion: null,
            answers: [],
        });
    };

    const handleJoinGame = async (playerNickname, codeToJoin) => {
        if (!playerNickname.trim() || !codeToJoin.trim()) {
            setError("Please enter a nickname and room code.");
            return;
        }
        setError("");

        const roomRef = doc(db, "rooms", codeToJoin);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            setError("Room not found. Check the code and try again.");
            return;
        }

        const data = roomSnap.data();
        if (data.status === "playing") {
            setError("Game is already in progress. Cannot join.");
            return;
        }

        const newPlayer = { uid: user.uid, nickname: playerNickname, score: 0 };
        await updateDoc(roomRef, {
            players: arrayUnion(newPlayer)
        });

        setRoomCode(codeToJoin);
        setView("waiting");
    };

    const handleStartGame = async () => {
        if (!roomData) return;

        const category = roomData.category;
        const question = QUESTIONS[category][Math.floor(Math.random() * QUESTIONS[category].length)];

        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
        });
    };

    const handleCategoryChange = async (newCategory) => {
        if (!isHost || !roomCode) return;
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            category: newCategory
        });
    };

    if (gameStarted && roomData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex items-center justify-center p-4">
                <div className="text-white text-2xl">Game Started! (MultiplayerGame component would render here)</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {mathSymbols.map((symbol, i) => {
                    const duration = Math.max(15, Math.random() * 15 + 15);

                    return (
                        <div
                            key={`symbol-${i}`}
                            className="absolute text-white/10 select-none animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                fontSize: `${Math.random() * 80 + 60}px`,
                                animation: `float ${duration}s ease-in-out infinite`,
                                animationDelay: `${i * 0.5}s`
                            }}
                        >
                            {symbol}
                        </div>
                    );
                })}

                {/* Glowing orbs */}
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

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

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col">
                {/* Header - MATCHING ModeSelect.jsx */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between pt-4 pb-2 shrink-0"
                >
                    {/* Left side with Menu button and Logo */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu Button */}
                        {onOpenSidebar && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onOpenSidebar}
                                className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
                            >
                                <Menu className="w-6 h-6" />
                            </motion.button>
                        )}

                        {/* Rotating Calculator Icon */}
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-md opacity-50" />
                            <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border border-white/30 backdrop-blur-sm">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>

                        {/* Mathemix Logo */}
                        <div>
                            <h1 className="text-white flex items-center gap-2 font-black text-3xl drop-shadow-md">
                                Mathemix
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                </motion.div>
                            </h1>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content - Scrollable Area */}
                <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto">
                    <div className="w-full max-w-5xl py-4">
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
                            />
                        )}

                        {/* WAITING VIEW */}
                        {view === "waiting" && (
                            <PlayerWaiting
                                roomCode={roomCode}
                                roomData={roomData}
                                user={user}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                {view === "select" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-white/40 text-xs font-semibold py-3"
                    >
                        <p>Enter your nickname and choose to host or join a game! 🎮</p>
                    </motion.div>
                )}
            </div>

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