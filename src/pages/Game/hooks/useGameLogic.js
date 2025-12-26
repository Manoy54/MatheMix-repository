import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useMobile } from '../../../hooks/useMobile';

export const useGameLogic = (onGameEnd) => {
    const isMobile = useMobile();
    const location = useLocation();
    const navigate = useNavigate();
    const hiddenInputRef = useRef(null);
    const keyboardContainerRef = useRef(null);

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

    const updateStats = async (isCorrect, endedStreakCount = 0, isGameEnd = false) => {
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

    const [activeBoxIndex, setActiveBoxIndex] = useState(0);

    const handleBoxInput = useCallback((index, val) => {
        const char = val.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
        if (!char) return;

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
    }, [answerWithSpaces]);

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
            updateStats(true, newStreak, false);
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
            updateStats(false, finalStreak, true);
            setTimeout(() => { setIsGameOver(true); }, 1000);
        }
    }, [input, answer, streak, bestStreak, onGameEnd, nextQuestion, answerStatus, isGameOver]);

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
        setShowGiveUpModal(false);
        const finalStreak = streak;
        if (onGameEnd) onGameEnd(false);
        updateStats(false, finalStreak, true);
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
        streak,
        bestStreak,
        questionNumber,
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
        handleGameAreaClick
    };
};
