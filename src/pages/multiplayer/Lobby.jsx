import React, { useState, useEffect, useMemo } from 'react';
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
} from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';
import MultiplayerGame from '../../components/MultiplayerGame';
import { motion } from 'framer-motion';
import { Menu, Calculator, Sparkles } from 'lucide-react';
import RoomSelection from './RoomSelection';
import HostLobby from './HostLobby';
import PlayerWaiting from './PlayerWaiting';
import { QUESTIONS } from '../../data.js';
import { useMobile } from '../../hooks/useMobile';


const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

const mathSymbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];

export default function Lobby({ user, onOpenSidebar }) {
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
    const [nickname, setNickname] = useState(user?.username || "Player");
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");

    const [roomData, setRoomData] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);

    const isHost = roomData?.hostId === user?.uid;

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

    // This effect cleans up the room if the host navigates away
    useEffect(() => {
        return () => {
            if (isHost && roomCode) {
                const roomRef = doc(db, "rooms", roomCode);
                deleteDoc(roomRef);
            }
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
                currentQuestion: null,
                answers: [],
            });
            console.log("Room created successfully in Firestore.");
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
    const leaveLobby = async () => {
        if (isHost) {
            // If host leaves, delete the entire room
            const roomRef = doc(db, "rooms", roomCode);
            await deleteDoc(roomRef);
        } else {
            // If a player leaves, remove them from the players list
            const roomRef = doc(db, "rooms", roomCode);
            const updatedPlayers = roomData.players.filter(p => p.uid !== user.uid);
            await updateDoc(roomRef, { players: updatedPlayers });
        }
        setRoomCode("");
        setRoomData(null);
        setView("select");
        setError("");
    };



    if (gameStarted && roomData && roomData.currentQuestion) {
        return (
            <MultiplayerGame
                user={user}
                roomCode={roomCode}
                roomData={roomData}
                onLeave={() => {
                    setGameStarted(false);
                    setView("select");
                    setRoomCode("");
                    setRoomData(null);
                }}
                onOpenSidebar={onOpenSidebar}
            />

        );
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
            <div className="relative z-10 px-4 h-screen flex flex-col">
                {/* Header - Left-aligned Logo */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between pt-4 pb-2 shrink-0"
                >
                    {/* Logo & Sidebar Toggle */}
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

                {/* Main Content - Non-scrollable */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl">
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
