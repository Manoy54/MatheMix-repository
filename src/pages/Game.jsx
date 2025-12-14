import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, Flame, Trophy, Brain, AlertCircle, Menu, RotateCcw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUESTIONS } from '../data.js';
import Keyboard from '../components/Keyboard.jsx';
import { auth, db } from '../firebaseConfig.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Game({ onGameEnd, onOpenSidebar }) {
    const location = useLocation();
    const navigate = useNavigate();

    // --- 1. Get Category & Questions ---
    const category = location.state?.category || "Number & Algebra";
    const categoryQuestions = QUESTIONS[category] || [];

    const getRandomQuestion = () => {
        if (categoryQuestions.length === 0) return { definition: "No questions found.", answer: "ERROR" };
        return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    };

    // --- 2. State Management ---
    const [currentQ, setCurrentQ] = useState(() => getRandomQuestion());
    const [input, setInput] = useState('');
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);

    // UI States
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    // Game Status
    const [answerStatus, setAnswerStatus] = useState(null);
    const [pressedKey, setPressedKey] = useState(null);

    const answer = currentQ.answer.toUpperCase();
    const answerWithSpaces = answer.replace(/ /g, '');

    const getMasteryKey = (cat) => {
        if (cat.includes("Algebra")) return "algebra";
        if (cat.includes("Geometry")) return "geometry";
        if (cat.includes("Data")) return "statistics";
        return "algebra";
    };

    const updateStats = async (isCorrect, endedStreakCount = 0) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userStatsRef = doc(db, 'userStats', userId);
        const masteryKey = getMasteryKey(category);

        try {
            const docSnap = await getDoc(userStatsRef);
            const currentStats = docSnap.exists() ? docSnap.data() : {};

            const catCounts = currentStats.categoryCounts || {};
            const currentCatStats = catCounts[masteryKey] || { total: 0, correct: 0 };
            const masteryStats = currentStats.mastery || {};

            const newTotalQuestions = (currentStats.totalQuestions || 0) + 1;
            const newTotalWins = (currentStats.totalWins || 0) + (isCorrect ? 1 : 0);
            const newTotalGames = (currentStats.totalGames || 0) + 1;

            const newCatTotal = (currentCatStats.total || 0) + 1;
            const newCatCorrect = (currentCatStats.correct || 0) + (isCorrect ? 1 : 0);

            const masteryPercent = Math.round((newCatCorrect / newCatTotal) * 100);
            const newAccuracy = Math.round((newTotalWins / newTotalGames) * 100);

            const currentLongest = currentStats.longestStreak || 0;
            const candidateStreak = isCorrect ? (streak + 1) : endedStreakCount;
            const newLongestStreak = Math.max(currentLongest, candidateStreak);

            const updates = {
                totalGames: newTotalGames,
                totalQuestions: newTotalQuestions,
                totalWins: newTotalWins,
                accuracy: newAccuracy,
                longestStreak: newLongestStreak,
                mastery: {
                    ...masteryStats,
                    [masteryKey]: masteryPercent
                },
                categoryCounts: {
                    ...catCounts,
                    [masteryKey]: {
                        total: newCatTotal,
                        correct: newCatCorrect
                    }
                }
            };

            if (!isCorrect) {
                const newGameEntry = {
                    result: 'Defeat',
                    mode: `Solo - ${category}`,
                    score: endedStreakCount,
                    date: new Date().toLocaleDateString()
                };
                const recentGames = currentStats.recentGames || [];
                const updatedRecent = [newGameEntry, ...recentGames].slice(0, 10);
                updates.recentGames = updatedRecent;
            }

            await setDoc(userStatsRef, updates, { merge: true });

        } catch (error) {
            console.error("Error updating stats:", error);
        }
    };

    // --- 3. Game Logic Handlers ---

    const nextQuestion = useCallback(() => {
        setQuestionNumber(prev => prev + 1);
        setCurrentQ(getRandomQuestion());
        setInput('');
        setAnswerStatus(null);
    }, []);

    const resetGame = () => {
        setIsGameOver(false);
        setStreak(0);
        setQuestionNumber(1);
        setAnswerStatus(null);
        setInput('');
        setCurrentQ(getRandomQuestion());
    };

    const handleChar = useCallback((char) => {
        if (answerStatus || isGameOver) return;
        setInput(prev => {
            const nonSpaceInput = prev.replace(/ /g, '');
            if (nonSpaceInput.length < answerWithSpaces.length) {
                return prev + char;
            }
            return prev;
        });
    }, [answerWithSpaces.length, answerStatus, isGameOver]);

    const handleSpace = useCallback(() => { }, []);
    const handleClear = useCallback(() => {
        if (!answerStatus && !isGameOver) setInput('');
    }, [answerStatus, isGameOver]);

    const handleDelete = useCallback(() => {
        if (!answerStatus && !isGameOver) setInput(prev => prev.slice(0, -1));
    }, [answerStatus, isGameOver]);

    const handleSubmit = useCallback(() => {
        if (answerStatus || isGameOver) return;

        const inputNoSpaces = input.replace(/ /g, '');
        const answerNoSpaces = answer.replace(/ /g, '');

        if (inputNoSpaces.toUpperCase() === answerNoSpaces) {
            setAnswerStatus('correct');
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
            if (onGameEnd) onGameEnd(true);
            updateStats(true, newStreak);
            setTimeout(() => {
                nextQuestion();
            }, 2000);
        } else {
            setAnswerStatus('wrong');
            const finalStreak = streak;
            // setStreak(0); // Don't reset streak yet, show it in Game Over
            if (onGameEnd) onGameEnd(false);
            updateStats(false, finalStreak);
            setTimeout(() => {
                setIsGameOver(true);
            }, 1000);
        }
    }, [input, answer, streak, bestStreak, onGameEnd, nextQuestion, answerStatus, isGameOver]);

    const handleSkip = useCallback(() => {
        if (!answerStatus && !isGameOver) setShowGiveUpModal(true);
    }, [answerStatus, isGameOver]);

    const confirmGiveUp = () => {
        setShowGiveUpModal(false);
        const finalStreak = streak;
        // setStreak(0); // Don't reset streak yet
        if (onGameEnd) onGameEnd(false);
        updateStats(false, finalStreak);
        const cleanAnswer = answer.replace(/ /g, '');
        setInput(cleanAnswer);
        setAnswerStatus('revealed');
        setTimeout(() => {
            setIsGameOver(true);
        }, 3000);
    };

    const cancelGiveUp = () => {
        setShowGiveUpModal(false);
    };

    // --- 4. Physical Keyboard ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showGiveUpModal || isGameOver) return;
            if (e.key.length === 1 && (/[a-zA-Z]/.test(e.key) || e.key === '-')) {
                const key = e.key.toUpperCase();
                setPressedKey(key);
                handleChar(key);
                setTimeout(() => setPressedKey(null), 150);
            }
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                setPressedKey('DELETE');
                handleDelete();
                setTimeout(() => setPressedKey(null), 150);
            }
            else if (e.key === 'Enter') {
                setPressedKey('ENTER');
                handleSubmit();
                setTimeout(() => setPressedKey(null), 150);
            }
            else if (e.key === 'Escape') {
                setPressedKey('CLEAR');
                handleClear();
                setTimeout(() => setPressedKey(null), 150);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleChar, handleDelete, handleSubmit, handleClear, showGiveUpModal, isGameOver]);

    return (
        <div className="px-4 py-3 h-screen flex flex-col">
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
                                This will reset your streak to 0 and reveal the answer. Are you sure?
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

            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0f172a] border-2 border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Trophy className="w-12 h-12 text-yellow-400" />
                                <h2 className="text-3xl font-black text-white">Game Over</h2>
                                <p className="text-white/60">Good effort! Here's how you did:</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="text-white/60 text-sm mb-1">Final Streak</div>
                                    <div className="text-3xl font-bold text-white">{streak}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="text-white/60 text-sm mb-1">Best Streak</div>
                                    <div className="text-3xl font-bold text-yellow-400">{Math.max(streak, bestStreak)}</div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Home</span>
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Play Again</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between mb-3 flex-shrink-0">
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
                        transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-lg opacity-50" />
                        <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border-2 border-white/30 backdrop-blur-sm">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                    </motion.div>
                    <div>
                        <h1 className="text-white flex items-center gap-2 text-xl">
                            Mathemix
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                            >
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                            </motion.div>
                        </h1>
                        <p className="text-white/60 text-xs">Solo Mode - {category}</p>
                    </div>
                </div>
            </motion.div>

            <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
                <div className="w-full max-w-5xl space-y-4">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-between"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                            <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                                <Brain className="w-4 h-4 text-cyan-300" />
                                <div>
                                    <div className="text-white/70 text-xs">Question</div>
                                    <div className="text-white text-xl">#{questionNumber}</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur-lg opacity-60" />
                                {streak > 0 && (
                                    <>
                                        {[...Array(12)].map((_, i) => {
                                            const randomDelay = i * 0.2;
                                            const randomX = (Math.random() - 0.5) * 80;
                                            const isOrange = i % 2 === 0;
                                            const isLarge = i % 3 === 0;

                                            return (
                                                <motion.div
                                                    key={`particle-${i}`}
                                                    className={`absolute bottom-0 left-1/2 ${isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full ${isOrange ? 'bg-gradient-to-t from-orange-500 to-red-500' : 'bg-gradient-to-t from-yellow-400 to-orange-400'}`}
                                                    style={{ boxShadow: isOrange ? '0 0 20px rgba(251, 146, 60, 1)' : '0 0 20px rgba(250, 204, 21, 1)' }}
                                                    animate={{ y: [-10, -100], x: [0, randomX], opacity: [1, 0], scale: [1, 0.3] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: randomDelay }}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                                <motion.div
                                    className="relative bg-gradient-to-br from-orange-500 to-red-600 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-orange-300/50 flex items-center gap-2"
                                    animate={streak > 0 ? { boxShadow: ['0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)', '0 0 60px rgba(251, 146, 60, 1), 0 0 120px rgba(239, 68, 68, 0.9)', '0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)',], } : { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <motion.div
                                        animate={streak > 0 ? { rotate: [-5, 5, -5, 5, -5, 0], scale: [1, 1.2, 1, 1.15, 1] } : {}}
                                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                                    >
                                        <Flame className="w-4 h-4 text-white drop-shadow-lg" />
                                    </motion.div>
                                    <div>
                                        <div className="text-orange-100 text-xs">Streak</div>
                                        <motion.div className="text-white text-xl font-bold" key={streak} initial={{ scale: 1 }} animate={streak > 0 ? { scale: [1, 1.3, 1] } : {}}>
                                            {streak}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                                <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                                    <Trophy className="w-4 h-4 text-yellow-300" />
                                    <div>
                                        <div className="text-white/70 text-xs">Best</div>
                                        <div className="text-white text-xl">{bestStreak}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        key={questionNumber}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-2xl blur-xl" />
                        <div className="relative bg-white/15 backdrop-blur-xl p-5 rounded-2xl border-2 border-white/30 shadow-2xl">
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] px-4 py-1 rounded-full shadow-lg text-sm">
                                Question #{questionNumber}
                            </div>
                            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs border border-white/30">
                                {category}
                            </div>
                            <p className="text-white text-lg leading-relaxed mt-6 text-center">
                                {currentQ.definition}
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center items-center gap-6 flex-wrap max-w-5xl mx-auto min-h-[80px]"
                    >
                        {(() => {
                            const words = answer.split(' ');
                            const inputCharsOnly = input.split('');
                            let globalInputIndex = 0;

                            return words.map((word, wordIndex) => (
                                <div key={`word-${wordIndex}`} className="flex gap-2 items-center">
                                    {word.split('').map((char, charIndex) => {
                                        const inputChar = inputCharsOnly[globalInputIndex] || '';
                                        const currentGlobalIndex = globalInputIndex;
                                        globalInputIndex++;
                                        const getAnimation = () => {
                                            if (answerStatus === 'correct') {
                                                return { scale: [1, 1.05, 1], rotate: [0, -2, 2, -2, 0] };
                                            }
                                            if (answerStatus === 'wrong') {
                                                return { x: [0, -10, 10, -10, 10, 0] };
                                            }
                                            if (answerStatus === 'revealed') {
                                                return {
                                                    rotateX: [0, 90, 0], // Flip
                                                    transition: { delay: currentGlobalIndex * 0.1, duration: 0.6 }
                                                };
                                            }
                                            return { y: 0, x: 0, scale: 1, rotate: 0 };
                                        };

                                        const getBackgroundColor = () => {
                                            if (answerStatus === 'correct') return 'bg-gradient-to-br from-green-400 to-emerald-500';
                                            if (answerStatus === 'wrong') return 'bg-gradient-to-br from-red-400 to-red-600';
                                            if (answerStatus === 'revealed') return 'bg-gradient-to-br from-orange-400 to-orange-600';
                                            return 'bg-white/20';
                                        };

                                        return (
                                            <motion.div
                                                key={`${wordIndex}-${charIndex}`}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1, x: 0, ...getAnimation() }}
                                                transition={{ y: { delay: 0.3 + currentGlobalIndex * 0.03 }, opacity: { delay: 0.3 + currentGlobalIndex * 0.03 }, }}
                                                className="relative perspective-1000"
                                            >
                                                <div className={`absolute inset-0 rounded-xl blur-md ${answerStatus === 'correct' ? 'bg-green-400/50' : answerStatus === 'wrong' ? 'bg-red-400/50' : 'bg-cyan-400/30'}`} />
                                                <motion.div
                                                    className={`relative w-12 h-16 ${getBackgroundColor()} backdrop-blur-sm border-2 rounded-xl flex items-center justify-center shadow-xl transition-colors duration-300`}
                                                    style={{ borderColor: inputChar ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)' }}
                                                >
                                                    <span className="text-white text-3xl font-bold">
                                                        {inputChar}
                                                    </span>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </motion.div>
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Keyboard
                            onChar={handleChar}
                            onDelete={handleDelete}
                            onClear={handleClear}
                            onSpace={handleSpace}
                            onSubmit={handleSubmit}
                            onSkip={handleSkip}
                            pressedKey={pressedKey}
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}