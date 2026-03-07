import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useMobile } from '../../../hooks/useMobile';
import { QUESTIONS } from '../../../data';
import { useSoundEffects } from '../../../hooks/useSoundEffects';

export const useGameLogic = (onGameEnd) => {
    const isMobile = useMobile();
    const location = useLocation();
    const navigate = useNavigate();
    const hiddenInputRef = useRef(null);
    const keyboardContainerRef = useRef(null);
    const { playKeyPress, playCorrect, playWrong, playGiveUp } = useSoundEffects();

    // --- 1. Get Category & Questions ---
    const CATEGORY_MAP = {
        "Number & Algebra": "number-algebra",
        "Measurement & Geometry": "measurement-geometry",
        "Data & Probability": "data-probability"
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
    // New Points System
    const [currentPoints, setCurrentPoints] = useState(25);
    const [highestPoints, setHighestPoints] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [hintError, setHintError] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const userId = auth.currentUser?.uid;
            if (userId) {
                try {
                    const userStatsRef = doc(db, 'userStats', userId);
                    const docSnap = await getDoc(userStatsRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setBestStreak(data.longestStreak || 0);
                        setHighestPoints(data.highestPoints || 0);
                    }
                } catch (e) {
                    console.error("Error fetching user stats", e);
                }
            }
        };
        fetchUserData();

        const fetchQuestions = async () => {
            setLoadingQuestions(true);
            const slug = CATEGORY_MAP[category] || "number-algebra";
            let loadedQuestions = [];

            try {
                const docRef = doc(db, 'question-data', slug);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const qArray = data.questions || [];
                    if (qArray.length > 0) {
                        loadedQuestions = qArray;
                    } else if (data.definition && data.answer) {
                        loadedQuestions = [{ definition: data.definition, answer: data.answer }];
                    }
                }
            } catch (err) {
                console.error("Error fetching questions from Firestore, falling back to local data:", err);
            }

            // Fallback to local data if Firestore returned nothing
            if (loadedQuestions.length === 0) {
                // Try exact match or fallback
                loadedQuestions = QUESTIONS[category] || [];
                if (loadedQuestions.length === 0) {
                    console.warn(`No local questions found for category: ${category}`);
                }
            }

            setCategoryQuestions(loadedQuestions);
            if (loadedQuestions.length > 0) {
                setCurrentQ(loadedQuestions[Math.floor(Math.random() * loadedQuestions.length)]);
            } else {
                setCurrentQ(null);
            }
            setLoadingQuestions(false);
        };
        fetchQuestions();
    }, [category]);

    // UI States
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [answerStatus, setAnswerStatus] = useState(null);
    const [pressedKey, setPressedKey] = useState(null);

    const answer = useMemo(() => currentQ?.answer?.toUpperCase() || '', [currentQ]);
    const answerWithSpaces = useMemo(() => answer.replace(/ /g, ''), [answer]);

    // Timer Ref
    const questionStartTime = useRef(Date.now());
    useEffect(() => { if (currentQ) questionStartTime.current = Date.now(); }, [currentQ]);

    const getMasteryKey = (cat) => {
        if (cat.includes("Algebra")) return "algebra";
        if (cat.includes("Geometry")) return "geometry";
        if (cat.includes("Data")) return "statistics";
        return "algebra";
    };

    const updateStats = async (isCorrect, endedStreakCount = 0, isGameEnd = false, currentScore = 0) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const timeTaken = (Date.now() - questionStartTime.current) / 1000;
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
            const currentTotalGames = currentStats.totalGames || 0;
            const newTotalGames = isGameEnd ? currentTotalGames + 1 : currentTotalGames;

            const newCatTotal = (currentCatStats.total || 0) + 1;
            const newCatCorrect = (currentCatStats.correct || 0) + (isCorrect ? 1 : 0);
            const masteryPercent = Math.round((newCatCorrect / newCatTotal) * 100);
            const newAccuracy = Math.round((newTotalWins / newTotalGames) * 100);

            const currentLongest = currentStats.longestStreak || 0;
            const candidateStreak = isCorrect ? (streak + 1) : endedStreakCount;
            const newLongestStreak = Math.max(currentLongest, candidateStreak);

            const currentHighestPoints = currentStats.highestPoints || 0;
            const newHighestPoints = Math.max(currentHighestPoints, currentScore);

            const currentPlayTime = currentStats.totalPlayTime || 0;
            const newPlayTime = currentPlayTime + timeTaken;

            let newAvgTime = currentStats.avgAnswerTime || 0;
            let newFastest = currentStats.fastestAnswer || 0;

            if (isCorrect) {
                const oldTotalCorrect = currentStats.totalWins || 0;
                newAvgTime = parseFloat(((newAvgTime * oldTotalCorrect + timeTaken) / (oldTotalCorrect + 1)).toFixed(2));
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
                highestPoints: newHighestPoints,
                totalPlayTime: Math.round(newPlayTime),
                avgAnswerTime: newAvgTime,
                fastestAnswer: newFastest,
                username: auth.currentUser?.displayName || "Player",
                mastery: { ...masteryStats, [masteryKey]: masteryPercent },
                categoryCounts: { ...catCounts, [masteryKey]: { total: newCatTotal, correct: newCatCorrect } }
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

    const nextQuestion = useCallback(() => {
        setQuestionNumber(prev => prev + 1);
        setCurrentQ(getRandomQuestion());
        setInput('');
        setAnswerStatus(null);
    }, [getRandomQuestion]);

    const resetGame = useCallback(() => {
        setIsGameOver(false);
        setStreak(0);
        setCurrentPoints(25);
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
        playKeyPress();
        setInput(prev => {
            const nonSpaceInput = prev.replace(/ /g, '');
            if (nonSpaceInput.length < answerWithSpaces.length) {
                return prev + char;
            }
            return prev;
        });
    }, [answerWithSpaces.length, answerStatus, isGameOver, playKeyPress]);

    const [activeBoxIndex, setActiveBoxIndex] = useState(0);

    const handleBoxInput = useCallback((index, val) => {
        const char = val.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
        if (!char) return;

        playKeyPress();
        setInput(prev => {
            const chars = prev.split('');
            while (chars.length <= index) chars.push('');
            if (index >= answerWithSpaces.length) return prev;
            chars[index] = char;
            return chars.join('').slice(0, answerWithSpaces.length);
        });

        if (index < answerWithSpaces.length - 1) {
            setActiveBoxIndex(index + 1);
        }
    }, [answerWithSpaces, playKeyPress]);

    const handleBoxBackspaceNav = useCallback((index) => {
        if (input[index] === ' ' || !input[index] || input[index] === undefined) {
            if (index > 0) {
                setActiveBoxIndex(index - 1);
                setInput(prev => {
                    const chars = prev.split('');
                    chars[index - 1] = ' ';
                    return chars.join('');
                });
            }
        } else {
            setInput(prev => {
                const chars = prev.split('');
                chars[index] = ' ';
                return chars.join('');
            });
        }
    }, [input]);

    const handleClear = useCallback(() => {
        if (!answerStatus && !isGameOver) {
            playKeyPress();
            setInput('');
        }
    }, [answerStatus, isGameOver, playKeyPress]);

    const handleDelete = useCallback(() => {
        if (!answerStatus && !isGameOver) {
            playKeyPress();
            setInput(prev => prev.slice(0, -1));
        }
    }, [answerStatus, isGameOver, playKeyPress]);

    const handleSubmit = useCallback(() => {
        if (answerStatus || isGameOver) return;
        const inputNoSpaces = input.replace(/ /g, '');
        const answerNoSpaces = answer.replace(/ /g, '');

        if (inputNoSpaces.length === 0) {
            const finalStreak = streak;
            if (onGameEnd) onGameEnd(false);
            updateStats(false, finalStreak, true, currentPoints);
            setInput(answerNoSpaces);
            setAnswerStatus('revealed');
            setTimeout(() => { setIsGameOver(true); }, 3000);
            return;
        }

        if (inputNoSpaces.toUpperCase() === answerNoSpaces) {
            playCorrect();
            setAnswerStatus('correct');
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);

            const newPoints = currentPoints + 5;
            setCurrentPoints(newPoints);
            if (newPoints > highestPoints) setHighestPoints(newPoints);

            if (onGameEnd) onGameEnd(true);
            updateStats(true, newStreak, false, newPoints);
            setTimeout(() => {
                nextQuestion();
                if (isMobile && hiddenInputRef.current) {
                    hiddenInputRef.current.value = '';
                    hiddenInputRef.current.focus();
                }
            }, 2000);
        } else {
            playWrong();
            setAnswerStatus('wrong');
            const finalStreak = streak;
            if (onGameEnd) onGameEnd(false);
            updateStats(false, finalStreak, true, currentPoints);
            setTimeout(() => { setIsGameOver(true); }, 1000);
        }
    }, [input, answer, streak, bestStreak, onGameEnd, nextQuestion, answerStatus, isGameOver, currentPoints, highestPoints, playCorrect, playWrong]);

    const handleSkip = useCallback(() => {
        if (!answerStatus && !isGameOver) {
            if (isMobile) {
                if (document?.activeElement instanceof HTMLElement) document.activeElement.blur();
                keyboardContainerRef.current?.querySelectorAll("button, input").forEach((el) => {
                    if (el instanceof HTMLElement) el.blur();
                });
            }
            setShowGiveUpModal(true);
        }
    }, [answerStatus, isGameOver, isMobile]);

    const confirmGiveUp = () => {
        playGiveUp();
        setShowGiveUpModal(false);
        const finalStreak = streak;
        if (onGameEnd) onGameEnd(false);
        updateStats(false, finalStreak, true, currentPoints);
        const cleanAnswer = answer.replace(/ /g, '');
        setInput(cleanAnswer);
        setAnswerStatus('revealed');
        setTimeout(() => { setIsGameOver(true); }, 3000);
    };

    const cancelGiveUp = () => setShowGiveUpModal(false);

    // Keyboard event listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showGiveUpModal || isGameOver) return;
            if (isMobile) {
                if (e.key === 'Enter') handleSubmit();
                return;
            }
            let keyToPress = null;
            if (e.key.length === 1 && (/[a-zA-Z]/.test(e.key) || e.key === '-')) {
                keyToPress = e.key.toUpperCase();
                handleChar(keyToPress);
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                keyToPress = 'DELETE';
                handleDelete();
            } else if (e.key === 'Enter') {
                keyToPress = 'ENTER';
                handleSubmit();
            } else if (e.key === 'Escape') {
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
            setTimeout(() => hiddenInputRef.current?.focus(), 100);
        }
    }, [isMobile, loadingQuestions, showGiveUpModal, isGameOver]);

    // Hint Logic
    const handleHint = useCallback(() => {
        if (answerStatus || isGameOver || loadingQuestions) return;

        if (currentPoints <= 0) {
            setHintError(true);
            setTimeout(() => setHintError(false), 500);
            return;
        }

        const answerClean = answer.replace(/ /g, '');
        let targetIndex = -1;

        // Find first mismatch or empty spot
        for (let i = 0; i < answerClean.length; i++) {
            const charInput = (input[i] || '').toUpperCase();
            const charAnswer = answerClean[i].toUpperCase();
            if (charInput !== charAnswer) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) return;

        const charToReveal = answerClean[targetIndex];

        // Deduct points
        let nextPoints = currentPoints - 5;
        if (nextPoints <= 0) {
            nextPoints = 0;
            setStreak(0);
        }
        setCurrentPoints(nextPoints);

        // Update input
        setInput(prev => {
            const chars = prev.split('');
            while (chars.length <= targetIndex) chars.push(' ');
            chars[targetIndex] = charToReveal;
            return chars.join('');
        });

    }, [answer, input, answerStatus, isGameOver, loadingQuestions, currentPoints]);

    const handleGameAreaClick = () => {
        if (isMobile && hiddenInputRef.current) {
            hiddenInputRef.current.focus();
        }
    };

    return {
        // State
        category,
        currentQ,
        loadingQuestions,
        input,
        currentPoints,
        highestPoints,
        streak,
        bestStreak,
        questionNumber,
        hintError,
        showGiveUpModal,
        isGameOver,
        answerStatus,
        pressedKey,
        activeBoxIndex,
        hiddenInputRef,
        keyboardContainerRef,
        answer,
        // Handlers
        navigate,
        handleChar,
        handleDelete,
        handleClear,
        handleSubmit,
        handleSkip,
        confirmGiveUp,
        cancelGiveUp,
        resetGame,
        handleBoxInput,
        handleBoxBackspaceNav,
        setActiveBoxIndex,
        setActiveBoxIndex,
        handleGameAreaClick,
        handleHint
    };
};
