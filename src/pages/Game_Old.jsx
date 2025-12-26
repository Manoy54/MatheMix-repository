import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, Flame, Trophy, Brain, AlertCircle, Menu, RotateCcw, Home, Loader2, Layout, Check } from 'lucide-react';
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
    const hiddenInputRef = useRef(null);


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
        if (isMobile && hiddenInputRef.current) {
            hiddenInputRef.current.value = '';
            hiddenInputRef.current.focus();
        }
    }, [getRandomQuestion, isMobile]);

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

    const handleMobileInput = useCallback((e) => {
        const val = e.target.value.toUpperCase();
        // Since we can't easily sync backspace vs char add with a simple value check if we rely purely on 'val', 
        // we'll just set input to val, but respecting the max length rule logic if needed. 
        // However, the game logic relies on 'input' state which includes spaces if any (though current implementation seems to remove spaces from comparison).
        // The existing handleChar appends. Let's try to sync closely.

        // Actually, easiest way for this specific game type (filling boxes) is:
        setPressedKey('TYPING'); // Feedback
        setTimeout(() => setPressedKey(null), 100);

        // Sanitize
        const cleanVal = val.replace(/[^A-Z]/g, ''); // Only letters? Or whatever allowed chars.

        setInput(prev => {
            if (cleanVal.length <= answerWithSpaces.length) {
                return cleanVal;
            }
            return cleanVal.slice(0, answerWithSpaces.length);
        });
    }, [answerWithSpaces]);

    const [activeBoxIndex, setActiveBoxIndex] = useState(0);

    // --- Mobile Individual Box Input Logic ---
    const handleBoxInput = useCallback((index, val) => {
        // Val coming from onChange. If input was 'A', typed 'B' -> val='AB'. Slice last char.
        // If input was '', typed 'A' -> val='A'. Slice last char.
        const char = val.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
        if (!char) return;

        setInput(prev => {
            const chars = prev.split('');
            // Ensure array is long enough 
            while (chars.length <= index) chars.push('');
            if (index >= answerWithSpaces.length) return prev;

            chars[index] = char;
            return chars.join('').slice(0, answerWithSpaces.length);
        });

        // Advance cursor
        if (index < answerWithSpaces.length - 1) {
            setActiveBoxIndex(index + 1);
        }
    }, [answerWithSpaces]);

    const handleBoxBackspace = useCallback((index) => {
        setInput(prev => {
            const chars = prev.split('');
            // If current box is empty, delete previous? Or delete current?
            // Standard behavior: if current empty, move back and delete. If current full, delete current.
            // But here "full" usually means we are focusing it to change it.
            // Let's say: Clear current char. If already empty, move back.

            if (!chars[index]) {
                // It's empty, maybe move back? But the separate logic handles focus.
                // Actually for this game, "Backspace" usually means "Go back and clear".
                return prev;
            }

            chars[index] = '';
            // Reconstruct carefully to avoid holes if logic expects contiguous? 
            // The existing game logic (handleChar) appends. But here we edit arbitrarily.
            // We should treat input as a sparse array or padded string? 
            // The existing `handleChar` does `prev + char`. It assumes contiguous.
            // To be compatible with `handleChar`, we probably should enforce contiguous filling or update `input` state management.
            // HOWEVER, refactoring `input` state to be fully sparse is big. 
            // Let's stick to: "Input is a string". If we delete middle, it becomes "TE T". 
            // `handleChar` uses `prev.replace(/ /g, '')` so it handles gaps effectively for length check.
            // But display relies on index.

            chars[index] = ' '; // Replace with space to keep alignment?
            // Actually, if we use space, `inputNoSpaces` works fine.
            return chars.join('');
        });

        // If we want backspace to ALSO move back if current was empty (or after clearing):
        // Handled in the component via onKeyDown check probably?
        // Let's let the component request "move focus".
    }, [answerWithSpaces]);

    // Handler for backspace navigation request
    const handleBoxFocusRequest = useCallback((index) => {
        if (index >= 0 && index < answerWithSpaces.length) {
            setActiveBoxIndex(index);
        }
    }, [answerWithSpaces]);

    const handleBoxBackspaceNav = useCallback((index) => {
        // If current box is empty or we just cleared it, move back
        if (input[index] === ' ' || !input[index] || input[index] === undefined) {
            if (index > 0) {
                setActiveBoxIndex(index - 1);
                // Optionally clear the one we moved to?
                // Standard behavior: Backspace on empty -> move left, delete that one.
                setInput(prev => {
                    const chars = prev.split('');
                    chars[index - 1] = ' ';
                    return chars.join('');
                });
            }
        } else {
            // Current has valid char, just clear it
            setInput(prev => {
                const chars = prev.split('');
                chars[index] = ' ';
                return chars.join('');
            });
        }
    }, [input]);

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
                if (isMobile && hiddenInputRef.current) {
                    hiddenInputRef.current.value = '';
                    hiddenInputRef.current.focus();
                }
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

            // If mobile, let default behavior happen on input, but map Enter
            if (isMobile) {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
                return;
            }

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
    }, [handleChar, handleDelete, handleSubmit, handleClear, showGiveUpModal, isGameOver, isMobile]);

    // Force focus on mobile start
    useEffect(() => {
        if (isMobile && !loadingQuestions && !showGiveUpModal && !isGameOver && hiddenInputRef.current) {
            // Small timeout to ensure render
            setTimeout(() => hiddenInputRef.current?.focus(), 100);
        }
    }, [isMobile, loadingQuestions, showGiveUpModal, isGameOver]);

    // Keep focus if user tapped away (optional aggressive focus)
    const handleGameAreaClick = () => {
        if (isMobile && hiddenInputRef.current) {
            hiddenInputRef.current.focus();
        }
    };

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
        <div className={`px-4 pb-3 h-full flex flex-col ${isMobile ? 'pb-[50px] pt-[env(safe-area-inset-top)]' : ''}`} onClick={handleGameAreaClick}>
            {/* Hidden Input moved to overlay CharacterBoxes */}

            <AnimatePresence>
                {showGiveUpModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <div
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
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGameOver && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <div
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
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <StandardHeader onOpenSidebar={onOpenSidebar} subtitle={`Solo Mode - ${category}`} />

            <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
                <div className={`mx-auto ${isMobile ? 'w-full px-2 space-y-[10px]' : 'w-[85%] md:w-full max-w-5xl space-y-4'}`}>
                    <QuestionStats
                        questionNumber={questionNumber}
                        streak={streak}
                        bestStreak={bestStreak}
                    />

                    <QuestionCard
                        questionNumber={questionNumber}
                        category={category}
                        definition={currentQ.definition}
                        isMobile={isMobile}
                    />

                    <div className="relative">
                        <CharacterBoxes
                            containerRef={containerRef}
                            answer={answer}
                            input={input}
                            answerStatus={answerStatus}
                            isMobile={isMobile}
                            containerWidth={containerWidth}
                            activeBoxIndex={activeBoxIndex}
                            onBoxClick={setActiveBoxIndex}
                            onBoxInput={handleBoxInput}
                            onBoxBackspace={handleBoxBackspaceNav}
                        />
                    </div>

                    {!isMobile && (
                        <motion.div
                            ref={keyboardContainerRef}
                            className=""
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
                    )}
                    {isMobile && (
                        <div className="fixed bottom-0 left-0 w-full p-4 z-50 pb-8 pt-6">
                            <div className="flex gap-3 w-full max-w-md mx-auto">
                                <button
                                    onClick={handleSkip}
                                    className="flex-1 bg-gradient-to-b from-orange-500 to-orange-600 active:from-orange-600 active:to-orange-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform"
                                >
                                    Give Up
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-gradient-to-b from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- HOT PATH SUBCOMPONENTS (Optimized for latency) ---



const QuestionStats = React.memo(({ questionNumber, streak, bestStreak }) => {
    const isMobile = useMobile();

    if (isMobile) {
        return (
            <div className="flex items-center justify-between">
                <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/20 flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-cyan-300" />
                    <div className="flex flex-col justify-center">
                        <div className="text-white/70 text-[8px] leading-none mb-0.5">Question</div>
                        <div className="text-white text-xs leading-none font-bold">#{questionNumber}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FireStreak streak={streak} />
                    <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/20 flex items-center gap-1.5">
                        <Trophy className="w-3 h-3 text-yellow-300" />
                        <div className="flex flex-col justify-center">
                            <div className="text-white/70 text-[8px] leading-none mb-0.5">Best</div>
                            <div className="text-white text-xs leading-none font-bold">{bestStreak}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                    <Brain className="w-3 h-3 md:w-4 md:h-4 text-cyan-300" />
                    <div>
                        <div className="text-white/70 text-[10px] md:text-xs">Question</div>
                        <div className="text-white text-lg md:text-xl md:font-bold">#{questionNumber}</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <FireStreak streak={streak} />
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                        <div>
                            <div className="text-white/70 text-[10px] md:text-xs">Best</div>
                            <div className="text-white text-lg md:text-xl md:font-bold">{bestStreak}</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

const FireStreak = React.memo(({ streak }) => {
    const isMobile = useMobile();

    // Static render for mobile
    if (isMobile) {
        return (
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl px-2 py-1 border border-orange-300/30 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-white" />
                <div className="flex flex-col justify-center">
                    <div className="text-orange-100 text-[8px] leading-none mb-0.5">Streak</div>
                    <div className="text-white text-xs leading-none font-bold">{streak}</div>
                </div>
            </div>
        );
    }

    // Standard desktop render (unchanged logic mostly, just cleaned up)
    const particles = useMemo(() => {
        const count = 12;
        return [...Array(count)].map((_, i) => ({
            delay: i * 0.2,
            x: (Math.random() - 0.5) * 80,
            isOrange: i % 2 === 0,
            isLarge: i % 3 === 0
        }));
    }, []);

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
                className="relative bg-gradient-to-br from-orange-500 to-red-600 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-orange-300/50 flex items-center gap-2"
                animate={streak > 0 ? { boxShadow: ['0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)', '0 0 60px rgba(251, 146, 60, 1), 0 0 120px rgba(239, 68, 68, 0.9)', '0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)',], } : {}}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
                <motion.div
                    animate={streak > 0 ? { rotate: [-5, 5, -5, 5, -5, 0], scale: [1, 1.2, 1, 1.15, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                >
                    <Flame className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-lg" />
                </motion.div>
                <div>
                    <div className="text-orange-100 text-[10px] md:text-xs">Streak</div>
                    <motion.div className="text-white text-lg md:text-xl font-bold" key={streak} initial={{ scale: 1 }} animate={streak > 0 ? { scale: [1, 1.3, 1] } : {}}>
                        {streak}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
});

const QuestionCard = React.memo(({ questionNumber, category, definition, isMobile }) => {
    if (isMobile) {
        return (
            <div className="relative">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/20 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between w-full mb-2">
                        <div className="px-2 py-0.5 text-[10px] bg-white/20 text-white rounded-full border border-white/30">
                            {category}
                        </div>
                        <div className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] rounded-full font-bold">
                            Question #{questionNumber}
                        </div>
                    </div>
                    <p className="text-white text-sm mt-0 leading-snug text-center font-medium w-full">
                        {definition}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            key={questionNumber}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-2xl blur-xl" />
            <div className="relative bg-white/15 backdrop-blur-xl p-5 rounded-2xl border-2 border-white/30 shadow-2xl transition-all flex flex-col">
                <div className="flex items-center justify-between w-full mb-2">
                    <div className="px-3 py-1 text-xs bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 shadow-sm">
                        {category}
                    </div>
                    <div className="px-4 py-1 text-sm bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] rounded-full shadow-lg font-bold">
                        Question #{questionNumber}
                    </div>
                </div>

                <p className="text-white text-lg leading-relaxed mt-4 text-center font-medium w-full">
                    {definition}
                </p>
            </div>
        </motion.div>
    );
});



// --- 5. Optimized Character Boxes Subcomponent ---
const CharacterBoxes = React.memo(({ containerRef, answer, input, answerStatus, isMobile, containerWidth, activeBoxIndex, onBoxClick, onBoxInput, onBoxBackspace }) => {
    const words = useMemo(() => answer.split(' '), [answer]);
    // Allow sparse input for mapping
    const inputCharsOnly = useMemo(() => {
        const chars = input.split('');
        // Ensure we respect spaces/indices
        return chars;
    }, [input]);

    // Refs for all inputs
    const inputsRef = useRef([]);

    // Auto-focus active box input on mobile
    useEffect(() => {
        if (isMobile && inputsRef.current[activeBoxIndex]) {
            inputsRef.current[activeBoxIndex].focus();
        }
    }, [activeBoxIndex, isMobile]);

    const layout = useMemo(() => {
        const GAP = isMobile ? 4 : 8;
        const BASE_BOX_WIDTH = isMobile ? 32 : 48;
        const BASE_BOX_HEIGHT = isMobile ? 40 : 64;
        const BASE_FONT_SIZE = isMobile ? 18 : 30;

        let scale = 1;
        if (containerWidth > 0) {
            let maxWordWidthNeeded = 0;
            words.forEach(word => {
                const width = (word.length * BASE_BOX_WIDTH) + ((word.length - 1) * GAP);
                if (width > maxWordWidthNeeded) maxWordWidthNeeded = width;
            });

            const availableWidth = containerWidth - (isMobile ? 16 : 32);
            if (maxWordWidthNeeded > availableWidth) {
                scale = Math.max(0.3, availableWidth / maxWordWidthNeeded);
            }
        }

        return {
            boxWidth: BASE_BOX_WIDTH * scale,
            boxHeight: BASE_BOX_HEIGHT * scale,
            fontSize: Math.max(10, BASE_FONT_SIZE * scale),
            currentGap: GAP * scale
        };
    }, [words, isMobile, containerWidth]);

    let globalInputIndex = 0;

    return (
        <div
            ref={containerRef}
            className={`flex flex-wrap items-center justify-center ${isMobile ? 'gap-[10px]' : 'gap-x-8 gap-y-6'} max-w-5xl mx-auto min-h-[120px] w-full px-2`}
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
                                isMobile={isMobile}
                                isActive={isMobile && activeBoxIndex === currentGlobalIndex}
                                onBoxClick={() => onBoxClick && onBoxClick(currentGlobalIndex)}
                                onInput={(val) => onBoxInput && onBoxInput(currentGlobalIndex, val)}
                                onBackspace={() => onBoxBackspace && onBoxBackspace(currentGlobalIndex)}
                                inputRef={(el) => inputsRef.current[currentGlobalIndex] = el}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

const CharacterBox = React.memo(({ inputChar, index, answerStatus, boxWidth, boxHeight, fontSize, isMobile, isActive, onBoxClick, onInput, onBackspace, inputRef }) => {
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

    if (isMobile) {
        // Mobile View: Plain Divs, No Framer Motion, No Blurs, No Shadows
        // Removed "thin wrapper" (assumed to be pointer-events-none layer border if that was it)
        const bgColor = (() => {
            if (answerStatus === 'correct') return 'bg-green-500/80';
            if (answerStatus === 'wrong') return 'bg-red-500/80';
            if (answerStatus === 'revealed') return 'bg-orange-500/80';
            return 'bg-white/20';
        })();

        const borderColor = (inputChar && inputChar !== ' ') ? 'border-white/60' : 'border-white/20';

        return (
            <div
                className="relative"
                style={{ width: boxWidth, height: boxHeight }}
                onClick={onBoxClick}
            >
                <input
                    ref={inputRef}
                    value={inputChar === ' ' ? '' : inputChar}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                            // Detected deletion (mobile backspace often just clears)
                            onBackspace();
                        } else {
                            // Detected input (taking the last char handled by parent logic mostly, but passing raw val)
                            onInput(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                            onBackspace();
                        }
                    }}
                    className={`absolute inset-0 w-full h-full text-center bg-transparent border-none outline-none text-white font-bold p-0 m-0 z-20 ${answerStatus ? 'pointer-events-none' : ''}`}
                    style={{
                        fontSize: fontSize,
                        caretColor: 'white',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                // Removed maxLength to allow 'typing over' a character
                />
                <div
                    className={`absolute inset-0 w-full h-full ${bgColor} border-2 rounded-xl flex items-center justify-center transition-colors duration-200 pointer-events-none ${borderColor}`}
                >
                    {/* Clean solid box, no blur, no shadow */}
                </div>
            </div>
        );
    }

    // Desktop View (Unchanged essentially, but cleaned up)
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