import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig.js";
import { QUESTIONS } from "../data.js";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import Keyboard from "./Keyboard.jsx";
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Sparkles, Trophy, Brain, Users, Zap, Menu, Crown, LogOut, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function MultiplayerGame({ roomCode, roomData, user, onLeave, onOpenSidebar }) {
    // --- Logic State ---
    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState("playing"); // playing, correct, wrong
    const [scoreMessage, setScoreMessage] = useState("");
    const [nextCategory, setNextCategory] = useState(roomData.category);
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);

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

    const isHost = hostId === user.uid;
    const hasAnswered = answers.some(a => a.uid === user.uid);

    // --- Effects ---
    useEffect(() => {
        setGuess("");
        setStatus("playing");
        setScoreMessage("");
        setShowGiveUpModal(false);
    }, [currentQuestion]);

    // --- Handlers ---
    const handleKey = (key) => {
        if (status !== "playing" || hasAnswered || showGiveUpModal) return;
        if (guess.length < numGuessableBoxes) {
            setGuess(guess + key);
        }
    };
    const handleClear = () => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal) setGuess("");
    };
    const handleDelete = () => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal) setGuess(guess.slice(0, -1));
    };

    const submitAnswerToFirestore = async (isCorrect, score, finalGuess) => {
        const roomRef = doc(db, "rooms", roomCode);
        const answerData = {
            uid: user.uid,
            nickname: user.username || "Player",
            guess: finalGuess,
            isCorrect,
            score,
        };

        await updateDoc(roomRef, {
            answers: arrayUnion(answerData)
        });
    };

    const handleSubmit = async () => {
        if (status !== "playing" || hasAnswered || guess.length !== numGuessableBoxes || showGiveUpModal) return;

        let score = 0;
        let isCorrect = false;

        if (guess.trim().toUpperCase() === pureAnswer) {
            isCorrect = true;
            const timeTaken = (Date.now() - roundStartTime) / 1000;
            const timeBonus = Math.max(0, 10 - Math.floor(timeTaken));
            score = 10 + timeBonus;
            setStatus("correct");
            setScoreMessage(`+${score} points!`);
        } else {
            setStatus("wrong");
            setScoreMessage("Wrong answer!");
        }

        await submitAnswerToFirestore(isCorrect, score, guess.toUpperCase());
    };

    const handleSkip = () => {
        if (status === "playing" && !hasAnswered) {
            setShowGiveUpModal(true);
        }
    };

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

        const category = nextCategory;
        const qBank = QUESTIONS[category] || QUESTIONS["Number & Algebra"];
        const question = qBank[Math.floor(Math.random() * qBank.length)];

        const roomRef = doc(db, "rooms", roomCode);

        // Update player scores persistently
        const updatedPlayers = players.map(p => {
            const playerAnswer = answers.find(a => a.uid === p.uid);
            if (playerAnswer && playerAnswer.isCorrect) {
                return { ...p, score: p.score + playerAnswer.score };
            }
            return p;
        });

        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
            players: updatedPlayers,
            category: category
        });
    };

    // --- Keyboard Listeners ---
    const handleKeyDown = useCallback(
        (e) => {
            if (showGiveUpModal) return;
            if (status !== 'playing' || hasAnswered) return;

            const key = e.key.toUpperCase();
            if (key === "ENTER") handleSubmit();
            else if (key === "BACKSPACE") handleDelete();
            else if (key === "ESCAPE") handleClear();
            else if (key.length === 1 && key.match(/[A-Z0-9-]/)) handleKey(key);
        },
        [guess, status, hasAnswered, showGiveUpModal]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // --- Derived UI State ---
    const allPlayersAnswered = players.length === answers.length;
    const myAnswerData = answers.find(a => a.uid === user.uid);

    // Sort players for leaderboard
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myPlayer = sortedPlayers.find(p => p.uid === user.uid);
    const myRank = sortedPlayers.indexOf(myPlayer) + 1;

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden">
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

            {/* --- TOP BAR --- */}
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

            {/* --- MAIN GAME AREA --- */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-6 max-w-7xl mx-auto w-full min-h-0">

                {/* Center: Game Board */}
                <div className="flex-1 flex flex-col items-center max-w-4xl w-full z-10 space-y-4">

                    {/* Question Card */}
                    <motion.div
                        key={currentQuestion.definition}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-full max-w-3xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-2xl blur-xl" />
                        <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl text-center min-h-[130px] flex flex-col justify-center items-center">
                            <div className="absolute top-3 left-3 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/50 border border-white/10 uppercase tracking-widest">
                                {roomData.category || "General"}
                            </div>
                            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mt-2">
                                {currentQuestion.definition}
                            </p>


                            {/* Status Indicator inside card */}
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
                                    className={`mt-4 px-4 py-2 rounded-full font-bold text-sm bg-white/20 text-white shadow-lg border border-white/20`}
                                >
                                    {scoreMessage}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Answer Area (Words & Letters) */}
                    <motion.div className="flex justify-center items-center gap-x-4 gap-y-3 flex-wrap w-full min-h-[80px]">
                        {(() => {
                            const words = answer.split(' ');
                            const inputCharsOnly = guess.split('');
                            let globalInputIndex = 0;

                            return words.map((word, wordIndex) => (
                                <div key={`word-${wordIndex}`} className="flex gap-1.5 items-center">
                                    {word.split('').map((char, charIndex) => {
                                        const inputChar = inputCharsOnly[globalInputIndex] || '';
                                        const currentIndex = globalInputIndex;

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

                                        // If not a letter (symbol), show it
                                        const isSymbol = !char.match(/^[A-Z0-9]$/);
                                        const displayChar = isSymbol ? char : inputChar;
                                        if (isSymbol) {
                                            bgColor = 'bg-transparent';
                                            borderColor = 'transparent';
                                        } else {
                                            globalInputIndex++;
                                        }

                                        return (
                                            <motion.div
                                                key={`${wordIndex}-${charIndex}`}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.1 + currentIndex * 0.05 }}
                                                className="relative"
                                            >
                                                {!isSymbol && (
                                                    <div className={`w-10 h-14 md:w-12 md:h-16 ${bgColor} backdrop-blur-md border-2 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300`}
                                                        style={{ borderColor }}
                                                    >
                                                        <span className="text-white text-2xl font-bold">{allPlayersAnswered && !inputChar ? char : displayChar}</span>
                                                    </div>
                                                )}
                                                {isSymbol && (
                                                    <div className="w-8 h-14 flex items-center justify-center">
                                                        <span className="text-white text-2xl font-bold">{char}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </motion.div>

                    {/* Keyboard */}
                    <div className="w-full max-w-2xl transform scale-95 origin-top">
                        <Keyboard
                            onChar={handleKey}
                            onDelete={handleDelete}
                            onClear={handleClear}
                            onSpace={() => { }}
                            onSubmit={handleSubmit}
                            onSkip={handleSkip}
                            pressedKey={null}
                        />
                    </div>
                </div>

                {/* Right Side: Leaderboard */}
                {/* On Mobile it will stack below. On desktop right side. */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-full md:w-80 flex-shrink-0 z-10 flex flex-col gap-4"
                >
                    {/* Rank & Score Widget (Moved here) */}
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
                                <span className="text-white font-black text-3xl leading-none">{myPlayer?.score || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Ranking List */}
                    <div className="bg-[#0f172a]/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 h-full max-h-[500px] overflow-hidden flex flex-col">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                            <Users className="w-5 h-5 text-cyan-300" />
                            Live Rankings
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {sortedPlayers.map((p, index) => (
                                <div
                                    key={p.uid}
                                    className={`relative p-3 rounded-xl border flex items-center justify-between transition-all ${p.uid === user.uid
                                        ? 'bg-white/10 border-white/30 shadow-lg'
                                        : 'bg-transparent border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_#fbbf24]' :
                                            index === 1 ? 'bg-gray-300 text-black' :
                                                index === 2 ? 'bg-orange-400 text-black' :
                                                    'bg-white/10 text-white'
                                            }`}>
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
                </motion.div>
            </div>

            {/* --- ROUND OVER OVERLAY --- */}
            <AnimatePresence>
                {allPlayersAnswered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f172a] border-2 border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
                        >
                            {/* Background glow */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500" />

                            <h2 className="text-3xl font-black text-white mb-2">Round Complete!</h2>
                            <p className="text-white/60 mb-6">The answer was:</p>

                            <div className="bg-white/10 p-4 rounded-xl mb-6">
                                <span className="text-2xl font-black text-yellow-300 tracking-wider type-writer">
                                    {answer}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="text-xs text-white/50 uppercase font-bold">Your Result</div>
                                    <div className={`text-xl font-bold ${myAnswerData?.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                        {myAnswerData?.isCorrect ? 'Correct' : 'Wrong'}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="text-xs text-white/50 uppercase font-bold">Points Gained</div>
                                    <div className="text-xl font-bold text-white">
                                        +{myAnswerData?.score || 0}
                                    </div>
                                </div>
                            </div>

                            {isHost ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2 text-left">
                                        <label className="text-xs font-bold text-white/70 uppercase">Next Category</label>
                                        <select
                                            value={nextCategory}
                                            onChange={(e) => setNextCategory(e.target.value)}
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:border-cyan-400 font-semibold"
                                        >
                                            {Object.keys(QUESTIONS).map((cat) => (
                                                <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleNextRound}
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                                    >
                                        Next Round <Zap className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 animate-pulse">
                                    <Clock className="w-8 h-8 text-white/50" />
                                    <p className="text-white/50 font-medium">Waiting for host...</p>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}