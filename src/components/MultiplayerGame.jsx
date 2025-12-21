import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebaseConfig.js";
import { QUESTIONS } from "../data.js";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import Keyboard from "./Keyboard.jsx";
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Sparkles, Trophy, Brain, Users, Zap, Menu, Crown, LogOut, CheckCircle, XCircle, Clock, AlertCircle, Maximize2, X } from 'lucide-react';
import { useMobile } from "../hooks/useMobile.jsx";
import AnimatedBackground from "./AnimatedBackground.jsx";

export default function MultiplayerGame({ roomCode, roomData, user, nickname, onLeave, onOpenSidebar }) {
    // --- Logic State ---
    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState("playing"); // playing, correct, wrong
    const [scoreMessage, setScoreMessage] = useState("");
    const [nextCategory, setNextCategory] = useState(roomData.category);
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showRankingsModal, setShowRankingsModal] = useState(false);
    const [leaveNotifications, setLeaveNotifications] = useState([]);
    const [pressedKey, setPressedKey] = useState(null);
    const prevPlayersRef = useRef(roomData.players);
    const isMobile = useMobile();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const {
        currentQuestion,
        players,
        hostId,
        answers = [],
        roundStartTime,
    } = roomData;

    const answer = currentQuestion.answer.toUpperCase();
    const pureAnswer = answer.replace(/[^A-Z0-9]/g, '');
    const numGuessableBoxes = pureAnswer.length;

    if (!currentQuestion) return null;

    const isHost = hostId === user.uid;
    const hasAnswered = answers.some(a => a.uid === user.uid);

    // --- Effects ---
    useEffect(() => {
        setGuess("");
        setStatus("playing");
        setScoreMessage("");
        setShowGiveUpModal(false);
    }, [currentQuestion]);

    // --- Handlers (Memoized for performance) ---
    const handleKey = useCallback((key) => {
        if (status !== "playing" || hasAnswered || showGiveUpModal || roomData.status === "finished") return;
        setGuess(prev => {
            if (prev.length < numGuessableBoxes) {
                return prev + key;
            }
            return prev;
        });
        setPressedKey(key);
        setTimeout(() => setPressedKey(null), 150);
    }, [status, hasAnswered, showGiveUpModal, numGuessableBoxes, roomData.status]);

    const handleClear = useCallback(() => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal && roomData.status !== "finished") {
            setGuess("");
            setPressedKey('CLEAR');
            setTimeout(() => setPressedKey(null), 150);
        }
    }, [status, hasAnswered, showGiveUpModal, roomData.status]);

    const handleDelete = useCallback(() => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal && roomData.status !== "finished") {
            setGuess(prev => prev.slice(0, -1));
            setPressedKey('DELETE');
            setTimeout(() => setPressedKey(null), 150);
        }
    }, [status, hasAnswered, showGiveUpModal, roomData.status]);

    const submitAnswerToFirestore = async (isCorrect, score, finalGuess) => {
        const roomRef = doc(db, "rooms", roomCode);
        const answerData = {
            uid: user.uid,
            nickname: nickname || user.username || "Player",
            guess: finalGuess,
            isCorrect,
            score,
            timestamp: Date.now(),
        };

        await updateDoc(roomRef, {
            answers: arrayUnion(answerData)
        });
    };

    const handleSubmit = useCallback(async () => {
        if (status !== "playing" || hasAnswered || guess.length !== numGuessableBoxes || showGiveUpModal || roomData.status === "finished") return;

        setPressedKey('ENTER');
        setTimeout(() => setPressedKey(null), 150);

        let score = 0;
        let isCorrect = false;

        if (guess.trim().toUpperCase() === pureAnswer) {
            isCorrect = true;
            const correctAnswersSoFar = answers ? answers.filter(a => a.isCorrect).length : 0;
            const myRankAtSubmit = correctAnswersSoFar + 1;
            const baseScore = 100;
            const rankBonus = Math.max(0, 30 - ((myRankAtSubmit - 1) * 10));
            score = baseScore + rankBonus;
            setStatus("correct");
            setScoreMessage(`+${score} pts! (#${myRankAtSubmit})`);
        } else {
            setStatus("wrong");
            setScoreMessage("Wrong answer (+0)");
            score = 0;
        }

        await submitAnswerToFirestore(isCorrect, score, guess.toUpperCase());
    }, [status, hasAnswered, guess, numGuessableBoxes, showGiveUpModal, pureAnswer, answers, roomCode, user.uid, user.username]);

    const handleSkip = useCallback(() => {
        if (status === "playing" && !hasAnswered) {
            setShowGiveUpModal(true);
        }
    }, [status, hasAnswered]);

    const confirmGiveUp = async () => {
        setShowGiveUpModal(false);
        setStatus("wrong");
        setScoreMessage("Gave Up");
        // Submit as wrong with 0 score
        await submitAnswerToFirestore(false, 0, "GAVE UP");
    };

    const cancelGiveUp = () => {
        setShowGiveUpModal(false);
    };

    const handleNextRound = async () => {
        if (!isHost) return;

        const totalRounds = roomData.rounds || 5;
        const currentRoundNumber = roomData.roundNumber || 1;

        const roomRef = doc(db, "rooms", roomCode);

        // --- HOST-SIDE SCORE RECALCULATION ---
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
            return;
        }

        const category = nextCategory;
        const qBank = QUESTIONS[category] || QUESTIONS["Number & Algebra"];
        const question = qBank[Math.floor(Math.random() * qBank.length)];

        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
            players: updatedPlayers,
            category: category,
            roundNumber: currentRoundNumber + 1
        });
    };

    // --- Keyboard Listeners ---
    const handleKeyDown = useCallback(
        (e) => {
            if (showGiveUpModal || roomData.status === "finished") return;
            if (status !== 'playing' || hasAnswered) return;

            const key = e.key.toUpperCase();
            if (key === "ENTER") handleSubmit();
            else if (key === "BACKSPACE") handleDelete();
            else if (key === "ESCAPE") handleClear();
            else if (key.length === 1 && key.match(/[A-Z0-9-]/)) handleKey(key);
        },
        [guess, status, hasAnswered, showGiveUpModal, roomData.status]
    );

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") setShowRankingsModal(false);
        };
        if (showRankingsModal) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [showRankingsModal]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

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

    // --- Derived UI State ---
    const allPlayersAnswered = players.length === answers.length;
    const myAnswerData = answers.find(a => a.uid === user.uid);

    // Sort players for leaderboard
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myPlayer = sortedPlayers.find(p => p.uid === user.uid);
    const myCurrentRank = sortedPlayers.indexOf(myPlayer) + 1;

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            {!isMobile && <AnimatedBackground />}

            {/* Give Up Modal */}
            <AnimatePresence>
                {showGiveUpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#023e8a] border-2 border-white/20 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Give Up?</h2>
                            <p className="text-white/70">
                                This will mark the round as lost. Are you sure?
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={cancelGiveUp} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">
                                    Keep Trying
                                </button>
                                <button onClick={confirmGiveUp} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all">
                                    Yes, Give Up
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TopBar
                onOpenSidebar={onOpenSidebar}
                roomCode={roomCode}
                onLeave={() => setShowLeaveModal(true)}
            />

            <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-[280px]' : ''}`}>
                <div className={`flex flex-col md:flex-row-reverse ${isMobile ? 'items-center' : 'items-start'} justify-center p-4 gap-6 max-w-7xl mx-auto w-full`}>

                    <RankingsSidebar
                        isMobile={isMobile}
                        myRank={myCurrentRank}
                        myScore={myPlayer?.score || 0}
                        user={user}
                        sortedPlayers={sortedPlayers}
                        setShowRankingsModal={setShowRankingsModal}
                    />

                    <div className="flex-1 flex flex-col items-center max-w-4xl w-full z-10 space-y-4">
                        <QuestionCard
                            roundNumber={roomData.roundNumber}
                            category={roomData.category}
                            definition={currentQuestion.definition}
                            hasAnswered={hasAnswered}
                            allPlayersAnswered={allPlayersAnswered}
                            scoreMessage={scoreMessage}
                        />

                        <CharacterBoxes
                            containerRef={containerRef}
                            answer={answer}
                            guess={guess}
                            allPlayersAnswered={allPlayersAnswered}
                            hasAnswered={hasAnswered}
                            myAnswerData={myAnswerData}
                            isMobile={isMobile}
                            containerWidth={containerWidth}
                        />

                        {!isMobile && (
                            <div className="w-full max-w-2xl transform scale-95 origin-top">
                                <Keyboard
                                    onChar={handleKey}
                                    onDelete={handleDelete}
                                    onClear={handleClear}
                                    onSpace={() => { }}
                                    onSubmit={handleSubmit}
                                    onSkip={handleSkip}
                                    pressedKey={pressedKey}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Keyboard (Mobile only) */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-2 pb-[env(safe-area-inset-bottom)]">
                    <Keyboard
                        onChar={handleKey}
                        onDelete={handleDelete}
                        onClear={handleClear}
                        onSpace={() => { }}
                        onSubmit={handleSubmit}
                        onSkip={handleSkip}
                        pressedKey={pressedKey}
                    />
                </div>
            )}

            {/* Round Over Overlay */}
            <AnimatePresence>
                {allPlayersAnswered && roomData.status !== "finished" && (
                    <RoundOverOverlay
                        roomData={roomData}
                        user={user}
                        sortedPlayers={sortedPlayers}
                        isHost={isHost}
                        onNextRound={handleNextRound}
                        nextCategory={nextCategory}
                        setNextCategory={setNextCategory}
                        answers={answers}
                    />
                )}
            </AnimatePresence>

            {/* Rankings Modal for Mobile */}
            <AnimatePresence>
                {showRankingsModal && (
                    <RankingsModal
                        isOpen={showRankingsModal}
                        onClose={() => setShowRankingsModal(false)}
                        sortedPlayers={sortedPlayers}
                        userId={user.uid}
                    />
                )}
            </AnimatePresence>

            {/* Leave Confirmation Modal */}
            <AnimatePresence>
                {showLeaveModal && (
                    <LeaveConfirmationModal
                        isOpen={showLeaveModal}
                        isHost={isHost}
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

// --- HOT PATH SUBCOMPONENTS (Optimized for Multiplayer) ---

const TopBar = React.memo(({ onOpenSidebar, roomCode, onLeave }) => (
    <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 py-3 flex items-center justify-between flex-shrink-0 z-20"
    >
        <div className="flex items-center gap-3">
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
            <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-yellow-400/50 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm">
                    <Calculator className="w-6 h-6 text-white" />
                </div>
            </motion.div>
            <div>
                <h1 className="text-white flex items-center gap-2 text-xl font-black">
                    Mathemix
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                </h1>
                <p className="text-white/60 text-xs font-semibold">Multiplayer • Room {roomCode}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={onLeave}
                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg border border-red-500/30 transition-colors"
                title="Leave Game"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    </motion.div>
));

const RankingsSidebar = React.memo(({ isMobile, myRank, myScore, user, sortedPlayers, setShowRankingsModal }) => (
    <motion.div
        initial={isMobile ? { y: -20, x: 0, opacity: 0 } : { x: 50, y: 0, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        className="w-full max-w-3xl md:max-w-none md:w-80 flex-shrink-0 z-10 flex flex-col gap-4"
    >
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-around shadow-lg">
            <div className="flex flex-col items-center">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Your Rank</span>
                <div className="flex items-center gap-1.5">
                    <Crown className="w-5 h-5 text-yellow-300" />
                    <span className="text-yellow-300 font-black text-3xl leading-none">#{myRank}</span>
                </div>
            </div>
            <div className="h-10 w-[1px] bg-white/10"></div>
            <div className="flex flex-col items-center">
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Score</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-white font-black text-3xl leading-none">{myScore}</span>
                </div>
            </div>
        </div>

        {isMobile ? (
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRankingsModal(true)}
                className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-around shadow-lg group hover:bg-white/15 transition-all w-full"
            >
                <div className="flex flex-col items-center">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Currently Leading</span>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-400/10 rounded-xl border border-cyan-400/20">
                            <Users className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className={`font-black text-xl truncate max-w-[140px] transition-all ${sortedPlayers[0]?.uid === user.uid ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
                                {sortedPlayers[0]?.nickname || 'No players'}
                            </span>
                            {sortedPlayers[0]?.uid === user.uid && (
                                <span className="text-[10px] text-yellow-400/60 font-black uppercase tracking-widest">You</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-10 w-[1px] bg-white/10"></div>

                <div className="flex flex-col items-center">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Expand</span>
                    <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                        <Maximize2 className="w-5 h-5 text-white/50" />
                    </div>
                </div>
            </motion.button>
        ) : (
            <div className="bg-[#0f172a]/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 h-full max-h-[500px] overflow-hidden flex flex-col">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    <Users className="w-5 h-5 text-cyan-300" />
                    Live Rankings
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {sortedPlayers.map((p, index) => (
                        <div
                            key={p.uid}
                            className={`relative p-3 rounded-xl border flex items-center justify-between transition-all ${p.uid === user.uid ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_#fbbf24]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${p.uid === user.uid ? 'text-white' : 'text-white/70'}`}>
                                        {p.nickname}
                                    </span>
                                    {p.uid === user.uid && <span className="text-[10px] text-cyan-300 uppercase font-bold">You</span>}
                                </div>
                            </div>
                            <span className="text-white font-black text-lg">{p.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </motion.div>
));

const QuestionCard = React.memo(({ roundNumber, category, definition, hasAnswered, allPlayersAnswered, scoreMessage }) => (
    <motion.div
        key={definition}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-3xl"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-2xl blur-xl" />
        <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl text-center min-h-[130px] flex flex-col justify-center items-center">
            <div className="absolute top-3 left-3 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/50 border border-white/10 uppercase tracking-widest">
                {category || "General"}
            </div>

            {/* Round Counter in Top Right */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                <Brain className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[10px] font-black text-cyan-200 uppercase tracking-wider">
                    Round #{roundNumber || 1}
                </span>
            </div>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mt-2">
                {definition}
            </p>
            {hasAnswered && !allPlayersAnswered && (
                <div className="mt-4 flex items-center gap-2 text-yellow-300 animate-pulse bg-yellow-400/10 px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-bold">Waiting for opponents...</span>
                </div>
            )}
            {scoreMessage && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4 px-4 py-2 rounded-full font-bold text-sm bg-white/20 text-white shadow-lg border border-white/20"
                >
                    {scoreMessage}
                </motion.div>
            )}
        </div>
    </motion.div>
));

const RankingsModal = React.memo(({ isOpen, onClose, sortedPlayers, userId }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-white font-black text-xl flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Rankings
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <X className="w-5 h-5 text-white/50" />
                </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {sortedPlayers.map((p, index) => (
                    <div
                        key={p.uid}
                        className={`p-3 rounded-2xl flex items-center justify-between ${p.uid === userId ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}>
                                {index + 1}
                            </span>
                            <span className="text-white font-bold">{p.nickname}</span>
                        </div>
                        <span className="text-cyan-300 font-black">{p.score}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    </motion.div>
));


const RoundOverOverlay = React.memo(({ roomData, user, sortedPlayers, isHost, onNextRound, nextCategory, setNextCategory, answers }) => {
    const isWinner = sortedPlayers[0]?.uid === user.uid;
    const myPlayer = sortedPlayers.find(p => p.uid === user.uid);
    const isFinalRound = (roomData.roundNumber || 1) >= (roomData.rounds || 5);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#023e8a]/90 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#0f172a] border-2 border-white/10 p-8 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-xl w-full text-center space-y-8 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
                <div className="space-y-2">
                    <div className="inline-block p-4 bg-yellow-400/10 rounded-3xl mb-2">
                        <Trophy className={`w-12 h-12 ${isWinner ? 'text-yellow-400 animate-bounce' : 'text-gray-400'}`} />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight">
                        {isFinalRound ? "Match Over!" : "Round Over!"}
                    </h2>
                    <p className="text-white/60 font-medium">Amazing performance from everyone!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 p-4 rounded-3xl border border-yellow-400/30">
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Round Winner</p>
                        <p className="text-2xl font-black text-white">
                            {answers.filter(a => a.isCorrect).sort((a, b) => a.timestamp - b.timestamp)[0]?.nickname || "Calculating..."}
                        </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Items Found</p>
                        <p className="text-2xl font-black text-cyan-400">{answers.filter(a => a.uid === user.uid && a.isCorrect).length > 0 ? "Correct" : "Missed"}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Points Earned</p>
                        <p className="text-2xl font-black text-white">
                            {(() => {
                                const myRoundAnswer = answers.find(a => a.uid === user.uid && a.isCorrect);
                                if (!myRoundAnswer) return 0;
                                const correctOnes = answers.filter(a => a.isCorrect).sort((a, b) => a.timestamp - b.timestamp);
                                const myRank = correctOnes.findIndex(a => a.uid === user.uid) + 1;
                                return 100 + Math.max(0, 30 - ((myRank - 1) * 10));
                            })()}
                        </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                        <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Total Score</p>
                        <p className="text-2xl font-black text-white">
                            {(() => {
                                const baseScore = myPlayer?.score || 0;
                                const myRoundAnswer = answers.find(a => a.uid === user.uid && a.isCorrect);
                                if (!myRoundAnswer) return baseScore;
                                const correctOnes = answers.filter(a => a.isCorrect).sort((a, b) => a.timestamp - b.timestamp);
                                const myRank = correctOnes.findIndex(a => a.uid === user.uid) + 1;
                                const earned = 100 + Math.max(0, 30 - ((myRank - 1) * 10));
                                return baseScore + earned;
                            })()}
                        </p>
                    </div>
                </div>

                {isFinalRound ? (
                    <div className="pt-4">
                        <button
                            onClick={() => isHost && onNextRound(nextCategory)}
                            className={`w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-3 group ${!isHost ? 'opacity-70 cursor-default' : ''}`}
                        >
                            <Trophy className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                            {isHost ? "VIEW MATCH RESULTS" : "VIEW RESULTS (WAITING FOR HOST)"}
                        </button>
                    </div>
                ) : isHost ? (
                    <div className="space-y-4 pt-4">
                        <div className="relative group">
                            <Menu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <select
                                value={nextCategory}
                                onChange={(e) => setNextCategory(e.target.value)}
                                className="w-full bg-white/5 border-2 border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 font-bold appearance-none hover:bg-white/10 transition-all focus:outline-none focus:border-cyan-500/50"
                            >
                                {Object.keys(QUESTIONS).map(cat => (
                                    <option key={cat} value={cat} className="bg-[#0f172a] text-white font-bold">{cat}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => onNextRound(nextCategory)}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-3 group"
                        >
                            <Zap className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                            START NEXT ROUND
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                            <span className="text-white/80 font-bold italic">Waiting for host to start next round...</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
});

// --- Optimized Character Boxes Subcomponent (Mobile Responsive) ---
const CharacterBoxes = React.memo(({ containerRef, answer, guess, allPlayersAnswered, hasAnswered, myAnswerData, isMobile, containerWidth }) => {
    const words = useMemo(() => answer.split(' '), [answer]);
    const inputCharsOnly = useMemo(() => guess.split(''), [guess]);

    const layout = useMemo(() => {
        // Desktop Layout (Original sizing)
        if (!isMobile) {
            return {
                boxWidth: 48,
                boxHeight: 64,
                fontSize: 24,
                currentGap: 8,
                rowGap: 12
            };
        }

        // Mobile Layout (Dynamic Scaling)
        const GAP = 6;
        const BASE_BOX_WIDTH = 38;
        const BASE_BOX_HEIGHT = 52;
        const BASE_FONT_SIZE = 22;

        let scale = 1;
        if (containerWidth > 0) {
            let maxWordWidthNeeded = 0;
            words.forEach(word => {
                const width = (word.length * BASE_BOX_WIDTH) + ((word.length - 1) * GAP);
                if (width > maxWordWidthNeeded) maxWordWidthNeeded = width;
            });

            const availableWidth = containerWidth - 32;
            if (maxWordWidthNeeded > availableWidth) {
                scale = Math.max(0.45, availableWidth / maxWordWidthNeeded);
            }
        }

        return {
            boxWidth: BASE_BOX_WIDTH * scale,
            boxHeight: BASE_BOX_HEIGHT * scale,
            fontSize: BASE_FONT_SIZE * scale,
            currentGap: GAP * scale,
            rowGap: 12 * scale
        };
    }, [words, isMobile, containerWidth]);

    let globalInputIndex = 0;

    return (
        <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex flex-wrap items-center justify-center max-w-5xl mx-auto min-h-[100px] w-full px-2 ${isMobile ? 'gap-y-4' : 'gap-x-8 gap-y-6'}`}
            style={isMobile ? { gap: `${layout.currentGap * 2}px ${layout.currentGap * 1.5}px` } : {}}
        >
            {words.map((word, wordIndex) => (
                <div
                    key={`word-${wordIndex}`}
                    className="flex flex-nowrap justify-center"
                    style={{ gap: layout.currentGap }}
                >
                    {word.split('').map((char, charIndex) => {
                        const isSymbol = !char.match(/^[A-Z0-9]$/);
                        const inputChar = isSymbol ? '' : (inputCharsOnly[globalInputIndex] || '');
                        const currentIndex = globalInputIndex;
                        if (!isSymbol) globalInputIndex++;

                        return (
                            <CharacterBox
                                key={`${wordIndex}-${charIndex}`}
                                char={char}
                                inputChar={inputChar}
                                isSymbol={isSymbol}
                                index={currentIndex}
                                allPlayersAnswered={allPlayersAnswered}
                                hasAnswered={hasAnswered}
                                myAnswerData={myAnswerData}
                                boxWidth={layout.boxWidth}
                                boxHeight={layout.boxHeight}
                                fontSize={layout.fontSize}
                                isMobile={isMobile}
                            />
                        );
                    })}
                </div>
            ))}
        </motion.div>
    );
});

const CharacterBox = React.memo(({
    char, inputChar, isSymbol, index, allPlayersAnswered, hasAnswered, myAnswerData, boxWidth, boxHeight, fontSize, isMobile
}) => {
    // Determine visual state
    let bgColor = 'bg-white/10';
    let borderColor = inputChar ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';

    if (allPlayersAnswered) {
        if (char === inputChar) {
            bgColor = 'bg-green-500/50';
            borderColor = '#4ade80';
        } else {
            bgColor = 'bg-red-500/50';
            borderColor = '#f87171';
        }
    } else if (hasAnswered) {
        if (myAnswerData?.isCorrect) {
            bgColor = 'bg-green-500/50';
            borderColor = '#4ade80';
        } else {
            bgColor = 'bg-red-500/50';
            borderColor = '#f87171';
        }
    }

    if (isSymbol) {
        bgColor = 'bg-transparent';
        borderColor = 'transparent';
    }

    const displayChar = isSymbol ? char : inputChar;

    const glowColor = allPlayersAnswered
        ? (char === inputChar ? 'bg-green-400/50' : 'bg-red-400/50')
        : (hasAnswered ? (myAnswerData?.isCorrect ? 'bg-green-400/50' : 'bg-red-400/50') : 'bg-cyan-400/30');

    return (
        <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="relative"
        >
            {!isSymbol && (
                <>
                    <div className={`absolute inset-0 rounded-xl blur-md ${glowColor} opacity-50`} />
                    <div
                        className={`${bgColor} backdrop-blur-md border-2 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 relative z-10`}
                        style={{
                            width: boxWidth,
                            height: boxHeight,
                            borderColor,
                            fontSize: `${fontSize}px`
                        }}
                    >
                        <span className="text-white font-bold" style={{ fontSize: `${fontSize}px` }}>
                            {allPlayersAnswered && !inputChar ? char : displayChar}
                        </span>
                    </div>
                </>
            )}
            {isSymbol && (
                <div
                    className="flex items-center justify-center"
                    style={{ width: isMobile ? 'auto' : '32px', height: '56px' }}
                >
                    <span className="text-white font-bold" style={{ fontSize: isMobile ? '22px' : '24px' }}>{char}</span>
                </div>
            )}
        </motion.div>
    );
});

const LeaveConfirmationModal = React.memo(({ isOpen, isHost, onClose, onConfirm }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#023e8a] border-2 border-white/20 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4"
        >
            <div className={`w-16 h-16 ${isHost ? 'bg-red-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <LogOut className={`w-8 h-8 ${isHost ? 'text-red-400' : 'text-red-400'}`} />
            </div>
            <h2 className="text-2xl font-bold text-white">{isHost ? 'End Game for All?' : 'Leave Game?'}</h2>
            <p className="text-white/70">
                {isHost
                    ? "As the host, leaving will terminate the game immediately for all players. Are you sure you want to end the session?"
                    : "Are you sure you want to leave the game? Your current progress in this room will be lost."}
            </p>
            <div className="flex gap-3 mt-6">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
                >
                    Stay
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all font-black uppercase tracking-wider"
                >
                    {isHost ? 'End Game' : 'Leave'}
                </button>
            </div>
        </motion.div>
    </motion.div>
));
