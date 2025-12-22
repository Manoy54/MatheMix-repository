import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, Flame, Trophy, Brain, AlertCircle, Menu, RotateCcw, Home, Loader2, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Keyboard from '../components/Keyboard.jsx';
import { auth, db } from '../firebaseConfig.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useMobile } from '../hooks/useMobile.jsx';

import StandardHeader from '../components/StandardHeader';

export default function Game({ onGameEnd, onOpenSidebar }) {
    const isMobile = useMobile();
    const location = useLocation();
    const navigate = useNavigate();

    // --- 1. Get Category & Questions ---
    const CATEGORY_MAP = {
        "Number & Algebra": "number-algebra",
        "Measurement & Geometry": "measurement-geometry",
        "Data & probability": "data-probability"
    };

    const category = location.state?.category || "Number & Algebra";
    const [categoryQuestions, setCategoryQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);

    const getRandomQuestion = useCallback((questions = categoryQuestions) => {
        if (!questions || questions.length === 0) return { definition: "No questions found.", answer: "ERROR" };
        return questions[Math.floor(Math.random() * questions.length)];
    }, [categoryQuestions]);

    // --- 2. State Management ---
    const [currentQ, setCurrentQ] = useState(null);
    const [input, setInput] = useState('');
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoadingQuestions(true);
            const slug = CATEGORY_MAP[category] || "number-algebra";
            try {
                const docRef = doc(db, 'question-data', slug);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const qArray = data.questions || [];
                    if (qArray.length > 0) {
                        setCategoryQuestions(qArray);
                        setCurrentQ(qArray[Math.floor(Math.random() * qArray.length)]);
                    } else if (data.definition && data.answer) {
                        // Fallback to legacy fields if 'questions' array is missing
                        const legacyQ = { definition: data.definition, answer: data.answer };
                        setCategoryQuestions([legacyQ]);
                        setCurrentQ(legacyQ);
                    }
                }
            } catch (err) {
                console.error("Error fetching questions:", err);
            } finally {
                setLoadingQuestions(false);
            }
        };
        fetchQuestions();
    }, [category]);

    // UI States
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    // Game Status
    const [answerStatus, setAnswerStatus] = useState(null);
    const [pressedKey, setPressedKey] = useState(null);

    const answer = useMemo(() => currentQ?.answer?.toUpperCase() || '', [currentQ]);
    const answerWithSpaces = useMemo(() => answer.replace(/ /g, ''), [answer]);

    const getMasteryKey = (cat) => {
        if (cat.includes("Algebra")) return "algebra";
        if (cat.includes("Geometry")) return "geometry";
        if (cat.includes("Data")) return "statistics";
        return "algebra";
    };

    // Timer Ref
    const questionStartTime = useRef(Date.now());

    // Reset timer when question changes
    useEffect(() => {
        if (currentQ) {
            questionStartTime.current = Date.now();
        }
    }, [currentQ]);

    const updateStats = async (isCorrect, endedStreakCount = 0, isGameEnd = false) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const timeTaken = (Date.now() - questionStartTime.current) / 1000; // Seconds
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

            // Only increment totalGames if the session ended
            const currentTotalGames = currentStats.totalGames || 0;
            const newTotalGames = isGameEnd ? currentTotalGames + 1 : currentTotalGames;

            const newCatTotal = (currentCatStats.total || 0) + 1;
            const newCatCorrect = (currentCatStats.correct || 0) + (isCorrect ? 1 : 0);

            const masteryPercent = Math.round((newCatCorrect / newCatTotal) * 100);
            const newAccuracy = Math.round((newTotalWins / newTotalGames) * 100); // Note: This logic assumes distinct games/sessions vs questions. If totalGames increments per question, this is question accuracy.

            const currentLongest = currentStats.longestStreak || 0;
            const candidateStreak = isCorrect ? (streak + 1) : endedStreakCount;
            const newLongestStreak = Math.max(currentLongest, candidateStreak);

            // Time Stats Calculation
            const currentPlayTime = currentStats.totalPlayTime || 0;
            const newPlayTime = currentPlayTime + timeTaken;

            let newAvgTime = currentStats.avgAnswerTime || 0;
            let newFastest = currentStats.fastestAnswer || 0;

            if (isCorrect) {
                // Weighted average for avgAnswerTime
                const oldTotalCorrect = currentStats.totalWins || 0; // Using wins as proxy for correct answers
                newAvgTime = parseFloat(((newAvgTime * oldTotalCorrect + timeTaken) / (oldTotalCorrect + 1)).toFixed(2));

                // Fastest answer
                if (newFastest === 0 || timeTaken < newFastest) {
                    newFastest = parseFloat(timeTaken.toFixed(2));
                }
            }

            const updates = {
                totalGames: newTotalGames,
                totalQuestions: newTotalQuestions,
                totalWins: newTotalWins,
                accuracy: newAccuracy,
                longestStreak: newLongestStreak,
                totalPlayTime: Math.round(newPlayTime),
                avgAnswerTime: newAvgTime,
                fastestAnswer: newFastest,
                username: auth.currentUser?.displayName || "Player",
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
                    date: new Date().toLocaleDateString(),
                    timestamp: Date.now()
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
    }, [getRandomQuestion]);

    const resetGame = useCallback(() => {
        setIsGameOver(false);
        setStreak(0);
        setQuestionNumber(1);
        setAnswerStatus(null);
        setInput('');
        setCurrentQ(getRandomQuestion());
    }, [getRandomQuestion]);

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
            updateStats(true, newStreak, false); // Not game end
            setTimeout(() => {
                nextQuestion();
            }, 2000);
        } else {
            setAnswerStatus('wrong');
            const finalStreak = streak;
            if (onGameEnd) onGameEnd(false);
            updateStats(false, finalStreak, true); // Game ends here
            setTimeout(() => {
                setIsGameOver(true);
            }, 1000);
        }
    }, [input, answer, streak, bestStreak, onGameEnd, nextQuestion, answerStatus, isGameOver]);

    const handleSkip = useCallback(() => {
        if (!answerStatus && !isGameOver) {
            if (isMobile) {
                // Blur whatever is currently focused
                if (document?.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }

                // Blur any focusable elements inside the keyboard container
                keyboardContainerRef.current
                    ?.querySelectorAll("button, [tabindex]:not([tabindex='-1']), input, select, textarea")
                    .forEach((el) => {
                        if (el instanceof HTMLElement) el.blur();
                    });
            }
            setShowGiveUpModal(true);
        }
    }, [answerStatus, isGameOver, isMobile]);

    const confirmGiveUp = () => {
        setShowGiveUpModal(false);
        const finalStreak = streak;
        if (onGameEnd) onGameEnd(false);
        updateStats(false, finalStreak, true); // Game ends here
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

    // --- 4. Physical Keyboard & Container Measurement ---
    const containerRef = useRef(null);
    const keyboardContainerRef = useRef(null);
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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showGiveUpModal || isGameOver) return;

            let keyToPress = null;
            if (e.key.length === 1 && (/[a-zA-Z]/.test(e.key) || e.key === '-')) {
                keyToPress = e.key.toUpperCase();
                handleChar(keyToPress);
            }
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                keyToPress = 'DELETE';
                handleDelete();
            }
            else if (e.key === 'Enter') {
                keyToPress = 'ENTER';
                handleSubmit();
            }
            else if (e.key === 'Escape') {
                keyToPress = 'CLEAR';
                handleClear();
            }

            if (keyToPress) {
                setPressedKey(keyToPress);
                const timer = setTimeout(() => setPressedKey(null), 150);
                return () => clearTimeout(timer);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleChar, handleDelete, handleSubmit, handleClear, showGiveUpModal, isGameOver]);

    // Focus/Blur management for modals
    useEffect(() => {
        const isAnyModalOpen = showGiveUpModal || isGameOver;
        if (isAnyModalOpen) {
            // Blur the active element (e.g., if there's an invisible input or a clicked button)
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            // Also explicitly blur any focused buttons/inputs within the keyboard to ensure it doesn't stay highlighted/active
            const keyboardFocusables = keyboardContainerRef.current?.querySelectorAll("button, [tabindex]:not([tabindex='-1']), input, select, textarea");
            keyboardFocusables?.forEach(el => {
                if (el instanceof HTMLElement) el.blur();
            });
        }
    }, [showGiveUpModal, isGameOver]);

    if (loadingQuestions) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-white animate-spin relative z-10" />
                </div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white font-bold italic mt-6 tracking-widest uppercase text-sm"
                >
                    Fetching challenges...
                </motion.p>
            </div>
        );
    }

    if (!currentQ) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-white/40 mb-4" />
                <h1 className="text-white text-2xl font-black mb-2">Oops! No questions found</h1>
                <p className="text-white/60 mb-6">We couldn't find any questions for this category.</p>
                <button onClick={() => navigate('/category-select')} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={`px-4 py-3 h-full preserve-3d flex flex-col ${isMobile ? 'pb-[280px]' : ''}`}>
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
                                    onClick={() => navigate('/category-select')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                >
                                    <Layout className="w-5 h-5" />
                                    <span>Categories</span>
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

            <StandardHeader onOpenSidebar={onOpenSidebar} subtitle={`Solo Mode - ${category}`} />

            <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
                <div className="w-full max-w-5xl space-y-4">
                    <QuestionStats
                        questionNumber={questionNumber}
                        streak={streak}
                        bestStreak={bestStreak}
                    />

                    <QuestionCard
                        questionNumber={questionNumber}
                        category={category}
                        definition={currentQ.definition}
                    />

                    <CharacterBoxes
                        containerRef={containerRef}
                        answer={answer}
                        input={input}
                        answerStatus={answerStatus}
                        isMobile={isMobile}
                        containerWidth={containerWidth}
                    />

                    <motion.div
                        ref={keyboardContainerRef}
                        className={isMobile ? "fixed inset-x-0 bottom-0" : ""}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            pointerEvents: (showGiveUpModal || isGameOver) ? 'none' : 'auto',
                            zIndex: (showGiveUpModal || isGameOver) ? 40 : 60,
                            filter: (showGiveUpModal || isGameOver) ? 'blur(2px)' : 'none'
                        }}
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

// --- HOT PATH SUBCOMPONENTS (Optimized for latency) ---



const QuestionStats = React.memo(({ questionNumber, streak, bestStreak }) => (
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
            <FireStreak streak={streak} />
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
));

const FireStreak = React.memo(({ streak }) => {
    // Generate static particle data so we don't call Math.random() on every keystroke
    const particles = useMemo(() => [...Array(12)].map((_, i) => ({
        delay: i * 0.2,
        x: (Math.random() - 0.5) * 80,
        isOrange: i % 2 === 0,
        isLarge: i % 3 === 0
    })), []);

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur-lg opacity-60" />
            {streak > 0 && (
                <>
                    {particles.map((p, i) => (
                        <motion.div
                            key={`particle-${i}`}
                            className={`absolute bottom-0 left-1/2 ${p.isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full ${p.isOrange ? 'bg-gradient-to-t from-orange-500 to-red-500' : 'bg-gradient-to-t from-yellow-400 to-orange-400'}`}
                            style={{ boxShadow: p.isOrange ? '0 0 20px rgba(251, 146, 60, 1)' : '0 0 20px rgba(250, 204, 21, 1)' }}
                            animate={{ y: [-10, -100], x: [0, p.x], opacity: [1, 0], scale: [1, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: p.delay }}
                        />
                    ))}
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
    );
});

const QuestionCard = React.memo(({ questionNumber, category, definition }) => (
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
                {definition}
            </p>
        </div>
    </motion.div>
));



// --- 5. Optimized Character Boxes Subcomponent ---
const CharacterBoxes = React.memo(({ containerRef, answer, input, answerStatus, isMobile, containerWidth }) => {
    const words = useMemo(() => answer.split(' '), [answer]);
    const inputCharsOnly = useMemo(() => input.split(''), [input]);

    const layout = useMemo(() => {
        const GAP = isMobile ? 6 : 8;
        const BASE_BOX_WIDTH = isMobile ? 38 : 48;
        const BASE_BOX_HEIGHT = isMobile ? 52 : 64;
        const BASE_FONT_SIZE = isMobile ? 22 : 30;

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
            currentGap: GAP * scale
        };
    }, [words, isMobile, containerWidth]);

    let globalInputIndex = 0;

    return (
        <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 max-w-5xl mx-auto min-h-[120px] w-full px-2"
        >
            {words.map((word, wordIndex) => (
                <div
                    key={`word-${wordIndex}`}
                    className="flex flex-nowrap justify-center"
                    style={{ gap: layout.currentGap }}
                >
                    {word.split('').map((char, charIndex) => {
                        const inputChar = inputCharsOnly[globalInputIndex] || '';
                        const currentGlobalIndex = globalInputIndex;
                        globalInputIndex++;

                        return (
                            <CharacterBox
                                key={`${wordIndex}-${charIndex}`}
                                inputChar={inputChar}
                                index={currentGlobalIndex}
                                answerStatus={answerStatus}
                                boxWidth={layout.boxWidth}
                                boxHeight={layout.boxHeight}
                                fontSize={layout.fontSize}
                            />
                        );
                    })}
                </div>
            ))}
        </motion.div>
    );
});

const CharacterBox = React.memo(({ inputChar, index, answerStatus, boxWidth, boxHeight, fontSize }) => {
    const getAnimation = () => {
        if (answerStatus === 'correct') return { scale: [1, 1.05, 1], rotate: [0, -2, 2, -2, 0] };
        if (answerStatus === 'wrong') return { x: [0, -10, 10, -10, 10, 0] };
        if (answerStatus === 'revealed') return { rotateX: [0, 90, 0], transition: { delay: index * 0.1, duration: 0.6 } };
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
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, x: 0, ...getAnimation() }}
            transition={{ y: { delay: 0.3 + index * 0.03 }, opacity: { delay: 0.3 + index * 0.03 } }}
            className="relative perspective-1000"
            style={{ width: boxWidth, height: boxHeight }}
        >
            <div className={`absolute inset-0 rounded-xl blur-md ${answerStatus === 'correct' ? 'bg-green-400/50' : answerStatus === 'wrong' ? 'bg-red-400/50' : 'bg-cyan-400/30'}`} />
            <motion.div
                className={`relative w-full h-full ${getBackgroundColor()} backdrop-blur-sm border-2 rounded-xl flex items-center justify-center shadow-xl transition-colors duration-300`}
                style={{
                    borderColor: inputChar ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: fontSize
                }}
            >
                <span className="text-white font-bold">
                    {inputChar}
                </span>
            </motion.div>
        </motion.div>
    );
});