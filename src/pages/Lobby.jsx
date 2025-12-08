import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, LogIn, Copy, Check, Sparkles, Calculator, Info, Play } from 'lucide-react';

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

export default function Lobby({ goBack, user }) {
    const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];

    // UI state
    const [view, setView] = useState("select");
    const [nickname, setNickname] = useState(user?.username || "Player");
    const [roomCode, setRoomCode] = useState("");
    const [joinInput, setJoinInput] = useState("");
    const [error, setError] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);

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
    const handleHostGame = async () => {
        if (!nickname.trim()) {
            setError("Please enter a nickname.");
            return;
        }
        setError("");

        const newRoomCode = generateRoomCode();
        setRoomCode(newRoomCode);
        setView("host");

        const roomRef = doc(db, "rooms", newRoomCode);
        const newPlayer = { uid: user.uid, nickname, score: 0 };

        await setDoc(roomRef, {
            hostId: user.uid,
            hostName: nickname,
            roomCode: newRoomCode,
            players: [newPlayer],
            category: "Number & Algebra",
            status: "waiting",
            currentQuestion: null,
            answers: [],
        });
    };

    const handleJoinGame = async () => {
        if (!nickname.trim() || !joinInput.trim()) {
            setError("Please enter a nickname and room code.");
            return;
        }
        setError("");

        const codeToJoin = joinInput.toUpperCase();
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

        const newPlayer = { uid: user.uid, nickname, score: 0 };
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

    const copyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleBack = () => {
        if (view === "select") {
            goBack?.();
        } else {
            setView("select");
            setRoomCode("");
            setRoomData(null);
            setError("");
        }
    };

    if (gameStarted && roomData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex items-center justify-center p-4">
                <div className="text-white text-2xl">Game Started! (MultiplayerGame component would render here)</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
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
            <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 shrink-0 opacity-0 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="relative animate-spin-slow">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-md opacity-50" />
                            <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border border-white/30 backdrop-blur-sm">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-white flex items-center gap-2 text-3xl drop-shadow-md" style={{ fontWeight: 900 }}>
                                Mathemix
                                <div className="animate-wiggle">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                </div>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
                    <div className="w-full max-w-5xl py-4">

                        {/* SELECT VIEW */}
                        {view === "select" && (
                            <>
                                {/* Welcome Section */}
                                <div className="text-center mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-2 shadow-lg">
                                        <Users className="w-4 h-4 text-cyan-300" />
                                        <span className="text-white text-base" style={{ fontWeight: 700 }}>Multiplayer Mode</span>
                                    </div>

                                    <h2 className="text-white text-3xl md:text-4xl mb-2 leading-tight drop-shadow-lg" style={{ fontWeight: 900 }}>
                                        Compete with <span className="text-yellow-300">Friends</span>
                                    </h2>
                                    <p className="text-white/80 text-base" style={{ fontWeight: 500 }}>Challenge your friends in real-time math battles!</p>
                                </div>

                                {/* Info Card */}
                                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-3 border border-yellow-400/30 mb-4 shadow-lg opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-400/30 rounded-lg p-2 mt-0.5">
                                            <Info className="w-4 h-4 text-yellow-200" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white text-sm mb-1" style={{ fontWeight: 700 }}>How Multiplayer Works</h3>
                                            <p className="text-white/90 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                                                One player hosts a game and shares the room code. Others can join using that code. Enter your nickname below to get started!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-3 relative animate-scale-in">
                                        <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-lg" />
                                        <div className="relative bg-red-500/90 backdrop-blur-sm p-3 rounded-xl border-2 border-red-300/50 text-white text-center text-sm font-semibold">
                                            {error}
                                        </div>
                                    </div>
                                )}

                                {/* Nickname Input */}
                                <div className="mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                    <label className="block text-white/90 mb-2 text-xs" style={{ fontWeight: 700 }}>
                                        ENTER YOUR NICKNAME
                                    </label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="Player123"
                                        className="w-full px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-xl"
                                        style={{ fontWeight: 600 }}
                                    />
                                </div>

                                {/* Host & Join Cards */}
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    {/* Host a Game */}
                                    <div
                                        onMouseEnter={() => setHoveredCard('host')}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className="relative group opacity-0 animate-fade-in-left"
                                        style={{ animationDelay: '0.5s' }}
                                    >
                                        <div
                                            className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-600/80 to-violet-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.03] hover:translate-y-[-5px] active:scale-[0.98] ${
                                                hoveredCard === 'host' ? 'shadow-[0_0_30px_rgba(168,85,247,0.4)]' : ''
                                            }`}
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                            <div className="relative z-10 flex flex-col h-full min-h-[280px] justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-gradient-to-br from-purple-500/30 to-violet-500/30 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm">
                                                            <Plus className="w-9 h-9 text-white" />
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full transition-all ${
                                                            hoveredCard === 'host'
                                                                ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                                                : 'bg-white/20'
                                                        }`} />
                                                    </div>

                                                    <h3 className="text-white text-xl mb-2 leading-tight" style={{ fontWeight: 900 }}>
                                                        Host a Game
                                                    </h3>
                                                    <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontWeight: 500 }}>
                                                        Create a new room and get a code to share with friends.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={handleHostGame}
                                                    className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Create Room
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Join a Game */}
                                    <div
                                        onMouseEnter={() => setHoveredCard('join')}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className="relative group opacity-0 animate-fade-in-right"
                                        style={{ animationDelay: '0.5s' }}
                                    >
                                        <div
                                            className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-600/80 to-cyan-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.03] hover:translate-y-[-5px] active:scale-[0.98] ${
                                                hoveredCard === 'join' ? 'shadow-[0_0_30px_rgba(59,130,246,0.4)]' : ''
                                            }`}
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                            <div className="relative z-10 flex flex-col h-full min-h-[320px] justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm">
                                                            <LogIn className="w-9 h-9 text-white" />
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full transition-all ${
                                                            hoveredCard === 'join'
                                                                ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                                                : 'bg-white/20'
                                                        }`} />
                                                    </div>

                                                    <h3 className="text-white text-xl mb-2 leading-tight" style={{ fontWeight: 900 }}>
                                                        Join a Game
                                                    </h3>
                                                    <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontWeight: 500 }}>
                                                        Enter the room code provided by your friend.
                                                    </p>

                                                    {/* Room Code Input */}
                                                    <div className="mb-3">
                                                        <label className="block text-white/90 text-xs mb-2" style={{ fontWeight: 700 }}>
                                                            ENTER ROOM CODE
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={joinInput}
                                                            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                                                            placeholder="ABC123"
                                                            className="w-full px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-white focus:ring-4 focus:ring-white/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-lg tracking-widest text-center"
                                                            style={{ fontWeight: 700 }}
                                                            maxLength={6}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleJoinGame}
                                                    className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{ fontWeight: 700 }}
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    Join Room
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* HOST VIEW */}
                        {view === "host" && (
                            <div className="bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-8 animate-scale-in">
                                <div className="text-center mb-6">
                                    <h2 className="text-white text-3xl mb-2" style={{ fontWeight: 900 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                      Host Lobby
                    </span>
                                    </h2>
                                    <p className="text-white/80">Waiting for players to join...</p>
                                </div>

                                {/* Room Code Display */}
                                <div className="mb-6 relative animate-scale-in">
                                    <div className="relative bg-gradient-to-r from-yellow-300 to-orange-300 p-6 rounded-xl border-2 border-yellow-200/50 flex items-center justify-between shadow-lg">
                                        <div>
                                            <p className="text-[#023e8a] text-xs mb-1" style={{ fontWeight: 700 }}>ROOM CODE</p>
                                            <p className="text-[#023e8a] text-4xl tracking-widest" style={{ fontWeight: 900 }}>
                                                {roomCode}
                                            </p>
                                        </div>
                                        <button
                                            onClick={copyCode}
                                            className="bg-white/90 hover:bg-white p-3 rounded-xl shadow-lg transition-all hover:scale-110 active:scale-90"
                                        >
                                            {copiedCode ? (
                                                <Check className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <Copy className="w-6 h-6 text-[#023e8a]" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Players List */}
                                <div className="mb-6">
                                    <h3 className="text-white text-lg mb-3" style={{ fontWeight: 700 }}>
                                        Players Waiting ({roomData?.players.length || 0})
                                    </h3>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                                        <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-4 min-h-[100px]">
                                            {roomData?.players.map((p) => (
                                                <div key={p.uid} className="text-white text-lg py-2 flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    {p.nickname} {p.uid === user?.uid && "⭐ (You)"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Category Selection */}
                                <div className="mb-6">
                                    <label className="block text-white text-sm mb-2" style={{ fontWeight: 700 }}>
                                        SELECT CATEGORY
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={roomData?.category || "Number & Algebra"}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/30 outline-none transition-all text-gray-800 shadow-xl"
                                            style={{ fontWeight: 600 }}
                                        >
                                            {Object.keys(QUESTIONS).map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Start Game Button */}
                                <button
                                    onClick={handleStartGame}
                                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/40 transition-all border-2 border-green-300/50 flex items-center justify-center gap-2 text-xl hover:scale-105 hover:translate-y-[-2px] active:scale-95"
                                    style={{ fontWeight: 700 }}
                                >
                                    <Play className="w-6 h-6" />
                                    Start Game
                                </button>
                            </div>
                        )}

                        {/* WAITING VIEW */}
                        {view === "waiting" && (
                            <div className="bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-8 animate-scale-in">
                                <div className="text-center mb-6">
                                    <h2 className="text-white text-3xl mb-2" style={{ fontWeight: 900 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                      Joined Room: {roomCode}
                    </span>
                                    </h2>
                                </div>

                                {/* Players List */}
                                <div className="mb-6">
                                    <h3 className="text-white text-lg mb-3" style={{ fontWeight: 700 }}>
                                        Players in Lobby ({roomData?.players.length || 0})
                                    </h3>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                                        <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-4 min-h-[150px]">
                                            {roomData?.players.map((p) => (
                                                <div key={p.uid} className="text-white text-lg py-2 flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    {p.nickname}
                                                    {p.uid === roomData.hostId && " (Host) ⭐"}
                                                    {p.uid === user?.uid && " (You)"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Waiting Message */}
                                <div className="relative animate-pulse">
                                    <div className="absolute inset-0 bg-yellow-400/20 rounded-xl blur-lg" />
                                    <div className="relative bg-yellow-300/30 backdrop-blur-sm p-6 rounded-xl border-2 border-yellow-200/50 text-center">
                                        <p className="text-yellow-100 text-2xl" style={{ fontWeight: 700 }}>
                                            Waiting for the host to start...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {view === "select" && (
                    <div className="text-center text-white/40 text-xs py-3 px-4 opacity-0 animate-fade-in" style={{ fontWeight: 600, animationDelay: '0.6s' }}>
                        <p>Enter your nickname and choose to host or join a game! 🎮</p>
                    </div>
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