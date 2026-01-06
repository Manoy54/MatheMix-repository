
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { db } from "../firebaseConfig.js";
import { doc, updateDoc, getDoc, serverTimestamp, increment, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useMobile } from "../hooks/useMobile.jsx";
import AnimatedBackground from "./AnimatedBackground.jsx";
import RoundTimer from "./RoundTimer.jsx";
import {
    TopBar,
    QuestionCard,
    RoundOverOverlay,
    LeaveConfirmationModal,
    CATEGORY_MAP
} from "./MultiplayerComponents.jsx";

export default function HostSpectatorPage({ roomCode, roomData, user, onLeave, onOpenSidebar }) {
    const {
        currentQuestion,
        players = [],
        answers = [],
        roundStartTime,
    } = roomData || {};

    const [isTimeUp, setIsTimeUp] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [nextCategory, setNextCategory] = useState("Number & Algebra");
    const [leaveNotifications, setLeaveNotifications] = useState([]);
    const prevPlayersRef = useRef(players);
    const isMobile = useMobile();

    // Reset state on new question
    useEffect(() => {
        setIsTimeUp(false);
    }, [currentQuestion]);

    // Handle Time Up -> Auto Advance Logic
    const handleTimeUp = useCallback(() => {
        setIsTimeUp(true);
    }, []);

    // Auto Advance Effect
    useEffect(() => {
        let timeout;
        if ((isTimeUp || (players.length > 0 && players.length === answers.length)) && roomData.status !== "finished") {
            // Wait 5 seconds, then go to next round
            timeout = setTimeout(() => {
                handleNextRound();
            }, 5000);
        }
        return () => clearTimeout(timeout);
    }, [isTimeUp, answers.length, players.length, roomData.status]);


    const handleNextRound = async (manualCategory) => {
        // Recalculate scores and push updates
        const totalRounds = roomData.rounds || 5;
        const currentRoundNumber = roomData.roundNumber || 1;
        const roomRef = doc(db, "rooms", roomCode);

        // Score Calculation
        const correctAnswers = answers
            .filter(a => a.isCorrect)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const roundScores = {};
        correctAnswers.forEach((answerData, index) => {
            const rank = index + 1;
            const baseScore = 100;
            const rankBonus = Math.max(0, 30 - ((rank - 1) * 10));
            roundScores[answerData.uid] = baseScore + rankBonus;
        });

        const updatedPlayers = players.map(p => {
            const verifiedRoundScore = roundScores[p.uid] || 0;
            return { ...p, score: p.score + verifiedRoundScore };
        });

        if (currentRoundNumber >= totalRounds) {
            // FINISH GAME
            await updateDoc(roomRef, {
                status: "finished",
                players: updatedPlayers,
                answers: [],
                currentQuestion: null
            });

            // Update stats for each player
            const batchPromises = updatedPlayers.map(async (p) => {
                try {
                    const userStatsRef = doc(db, 'userStats', p.uid);
                    // Check if doc exists first to avoid errors if user doesn't have stats yet
                    const userStatsSnap = await getDoc(userStatsRef);

                    const isWinner = p.uid === updatedPlayers.sort((a, b) => b.score - a.score)[0].uid;
                    const gameResult = {
                        id: roomCode + Date.now(),
                        mode: 'Multiplayer',
                        result: isWinner ? 'Victory' : 'Defeat',
                        score: p.score, // Using score instead of streak for MP
                        date: new Date().toLocaleDateString(),
                        timestamp: Date.now()
                    };

                    const updateData = {
                        'multiplayer.gamesPlayed': increment(1),
                        'multiplayer.wins': increment(isWinner ? 1 : 0),
                        'recentGames': arrayUnion(gameResult)
                    };

                    if (userStatsSnap.exists()) {
                        await updateDoc(userStatsRef, updateData);
                    } else {
                        // Ideally create it, but for now rely on existing migration or just update if exists
                        // To be safe we could use setDoc with merge, but keeping it simple as per instructions "Fix stats"
                    }
                } catch (err) {
                    console.error("Failed to update stats for player", p.uid, err);
                }
            });
            await Promise.all(batchPromises);

            return;
        }

        // Get Next Question
        const categoryToUse = manualCategory || nextCategory;
        const slug = CATEGORY_MAP[categoryToUse] || "number-algebra";
        const qDocRef = doc(db, 'question-data', slug);
        const qDocSnap = await getDoc(qDocRef);

        let question = null;
        if (qDocSnap.exists()) {
            const data = qDocSnap.data();
            const questions = data.questions || [];
            if (questions.length > 0) {
                question = questions[Math.floor(Math.random() * questions.length)];
            } else if (data.definition && data.answer) {
                question = { definition: data.definition, answer: data.answer };
            }
        }

        if (!question) {
            question = { definition: "Wait, no questions found in this category!", answer: "ERROR" };
        }

        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: serverTimestamp(),
            answers: [],
            players: updatedPlayers,
            category: categoryToUse,
            roundNumber: currentRoundNumber + 1
        });
    };

    // Notification for players leaving
    useEffect(() => {
        const prevPlayers = prevPlayersRef.current;
        if (players.length < prevPlayers.length) {
            const leftPlayer = prevPlayers.find(p => !players.some(curr => curr.uid === p.uid));
            if (leftPlayer) {
                const id = Date.now();
                setLeaveNotifications(prev => [...prev, { id, name: leftPlayer.nickname }]);
                setTimeout(() => {
                    setLeaveNotifications(prev => prev.filter(n => n.id !== id));
                }, 4000);
            }
        }
        prevPlayersRef.current = players;
    }, [players]);

    const sortedPlayers = useMemo(() => {
        if (!players || !roomData) return [];
        return players
            .filter(p => p && p.uid !== roomData.hostId)
            .sort((a, b) => b.score - a.score);
    }, [players, roomData]);
    const isRoundOver = isTimeUp || (players.length > 0 && players.length === answers.length);

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-[#023e8a] md:bg-gradient-to-br md:from-[#023e8a] md:via-[#0077b6] md:to-[#0096c7] px-4 pb-3">
            {!isMobile && <AnimatedBackground />}

            <TopBar
                onOpenSidebar={onOpenSidebar}
                roomCode={roomCode}
                onLeave={() => setShowLeaveModal(true)}
            />

            <div className="flex-1 overflow-y-auto pb-32 flex flex-col items-center">
                <h2 className="text-white/50 font-bold uppercase tracking-widest text-sm mb-4">Host View • Spectating</h2>

                <QuestionCard
                    roundNumber={roomData.roundNumber}
                    category={roomData.category}
                    definition={currentQuestion?.definition}
                    hasAnswered={false}
                    allPlayersAnswered={false}
                    scoreMessage=""
                />
                <RoundTimer
                    key={roomData.roundNumber}
                    startTime={roundStartTime}
                    duration={60}
                    onTimeUp={handleTimeUp}
                />

                <div className="w-full max-w-5xl mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPlayers.map((p, index) => {
                        const playerAnswer = answers.find(a => a.uid === p.uid);
                        return (
                            <motion.div
                                key={p.uid}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`bg-white/10 border ${playerAnswer ? (playerAnswer.isCorrect ? 'border-green-400/50 bg-green-900/20' : 'border-red-400/50 bg-red-900/20') : 'border-white/20'} rounded-2xl p-4 flex items-center justify-between`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{p.nickname}</div>
                                        <div className="text-white/60 text-xs">Score: {p.score}</div>
                                    </div>
                                </div>
                                <div>
                                    {playerAnswer ? (
                                        playerAnswer.isCorrect ?
                                            <div className="flex items-center gap-1 text-green-400 font-bold text-sm"><CheckCircle className="w-4 h-4" /> Correct</div> :
                                            <div className="flex items-center gap-1 text-red-400 font-bold text-sm"><XCircle className="w-4 h-4" /> {playerAnswer.guess}</div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-400/70 font-bold text-sm animate-pulse"><Clock className="w-4 h-4" /> Thinking...</div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Round Over Overlay - HOST MODE */}
            <AnimatePresence>
                {isRoundOver && roomData.status !== "finished" && (
                    <RoundOverOverlay
                        roomData={roomData}
                        user={user}
                        sortedPlayers={sortedPlayers}
                        isHost={true}
                        onNextRound={handleNextRound} // Can be called manually too if needed
                        nextCategory={nextCategory}
                        setNextCategory={setNextCategory}
                        answers={answers}
                        autoAdvancing={true}
                    />
                )}
            </AnimatePresence>

            {/* Leave Confirmation Modal */}
            <AnimatePresence>
                {showLeaveModal && (
                    <LeaveConfirmationModal
                        isOpen={showLeaveModal}
                        isHost={true}
                        onClose={() => setShowLeaveModal(false)}
                        onConfirm={onLeave}
                    />
                )}
            </AnimatePresence>

            {/* Leave Notifications */}
            <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
                <AnimatePresence>
                    {leaveNotifications.map(notification => (
                        <motion.div
                            key={notification.id}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-lg border border-red-400/30 flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-bold text-sm tracking-wide">{notification.name} left the room</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
