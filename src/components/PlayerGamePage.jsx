
import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebaseConfig.js";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, LogOut } from 'lucide-react';
import { useMobile } from "../hooks/useMobile.jsx";
import AnimatedBackground from "./AnimatedBackground.jsx";
import GameControls from "./GameControls.jsx";
import Keyboard from "./Keyboard.jsx";
import RoundTimer from "./RoundTimer.jsx";
import {
    TopBar,
    RankingsSidebar,
    QuestionCard,
    RankingsModal,
    RoundOverOverlay,
    CharacterBoxes,
    LeaveConfirmationModal,
    CATEGORY_MAP
} from "./MultiplayerComponents.jsx";

export default function PlayerGamePage({ roomCode, roomData, user, nickname, onLeave, onOpenSidebar }) {
    // --- Logic State ---
    const {
        currentQuestion,
        players = [],
        answers = [],
        roundStartTime,
    } = roomData || {};

    const answer = currentQuestion?.answer?.toUpperCase() || "";
    const pureAnswer = answer.replace(/[^A-Z0-9]/g, '');
    const numGuessableBoxes = pureAnswer.length;

    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState("playing"); // playing, correct, wrong
    const [scoreMessage, setScoreMessage] = useState("");
    const [showGiveUpModal, setShowGiveUpModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showRankingsModal, setShowRankingsModal] = useState(false);
    const [leaveNotifications, setLeaveNotifications] = useState([]);
    const [pressedKey, setPressedKey] = useState(null);
    const prevPlayersRef = useRef(roomData.players);
    const isMobile = useMobile();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [activeBoxIndex, setActiveBoxIndex] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);

    // --- Box Input Logic ---
    const handleBoxInput = useCallback((index, val) => {
        if (!val) return;
        const char = val.slice(-1).toUpperCase();
        if (!char.match(/[A-Z0-9]/)) return;

        setGuess(prev => {
            const arr = prev.padEnd(numGuessableBoxes, ' ').split('');
            arr[index] = char;
            return arr.join('').slice(0, numGuessableBoxes);
        });

        if (index < numGuessableBoxes - 1) {
            setActiveBoxIndex(index + 1);
        }
    }, [numGuessableBoxes]);

    const handleBoxBackspaceNav = useCallback((index) => {
        setGuess(prev => {
            if (index < 0 || index >= prev.length) return prev;
            const arr = prev.split('');
            arr[index] = ' ';
            return arr.join('').trimEnd();
        });

        if (index > 0) {
            setActiveBoxIndex(index - 1);
        }
    }, [numGuessableBoxes]);

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

    const hasAnswered = answers.some(a => a.uid === user.uid);

    // --- Effects ---
    useEffect(() => {
        setGuess("");
        setStatus("playing");
        setScoreMessage("");
        setShowGiveUpModal(false);
        setIsTimeUp(false);
    }, [currentQuestion]);

    // Handle Time Up
    const handleTimeUp = useCallback(async () => {
        setIsTimeUp(true);
        // If player hasn't answered, maybe mark as missed locally? 
        // The overlay handles showing "Missed".
    }, []);

    // --- Handlers (Memoized for performance) ---
    const handleKey = useCallback((key) => {
        if (status !== "playing" || hasAnswered || showGiveUpModal || roomData.status === "finished" || isTimeUp) return;
        setGuess(prev => {
            if (prev.length < numGuessableBoxes) {
                return prev + key;
            }
            return prev;
        });
        setPressedKey(key);
        setTimeout(() => setPressedKey(null), 150);
    }, [status, hasAnswered, showGiveUpModal, numGuessableBoxes, roomData.status, isTimeUp]);

    const handleClear = useCallback(() => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal && roomData.status !== "finished" && !isTimeUp) {
            setGuess("");
            setPressedKey('CLEAR');
            setTimeout(() => setPressedKey(null), 150);
        }
    }, [status, hasAnswered, showGiveUpModal, roomData.status, isTimeUp]);

    const handleDelete = useCallback(() => {
        if (status === "playing" && !hasAnswered && !showGiveUpModal && roomData.status !== "finished" && !isTimeUp) {
            setGuess(prev => prev.slice(0, -1));
            setPressedKey('DELETE');
            setTimeout(() => setPressedKey(null), 150);
        }
    }, [status, hasAnswered, showGiveUpModal, roomData.status, isTimeUp]);

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
        if (status !== "playing" || hasAnswered || guess.length !== numGuessableBoxes || showGiveUpModal || roomData.status === "finished" || isTimeUp) return;

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
    }, [status, hasAnswered, guess, numGuessableBoxes, showGiveUpModal, pureAnswer, answers, roomCode, user.uid, user.username, isTimeUp]);

    const handleSkip = useCallback(() => {
        if (status === "playing" && !hasAnswered && !isTimeUp) {
            setShowGiveUpModal(true);
        }
    }, [status, hasAnswered, isTimeUp]);

    const confirmGiveUp = async () => {
        setShowGiveUpModal(false);
        setStatus("wrong");
        setScoreMessage("Gave Up");
        await submitAnswerToFirestore(false, 0, "GAVE UP");
    };

    const cancelGiveUp = () => {
        setShowGiveUpModal(false);
    };

    // --- Keyboard Listeners ---
    const handleKeyDown = useCallback(
        (e) => {
            if (showGiveUpModal || roomData.status === "finished" || isTimeUp) return;
            if (status !== 'playing' || hasAnswered) return;

            const key = e.key.toUpperCase();
            if (key === "ENTER") handleSubmit();
            else if (key === "BACKSPACE") handleDelete();
            else if (key === "ESCAPE") handleClear();
            else if (key.length === 1 && key.match(/[A-Z0-9-]/)) handleKey(key);
        },
        [guess, status, hasAnswered, showGiveUpModal, roomData.status, isTimeUp, handleSubmit, handleDelete, handleClear, handleKey]
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

    // Notification for players leaving (reused logic)
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
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myPlayer = sortedPlayers.find(p => p.uid === user.uid);
    const myCurrentRank = sortedPlayers.indexOf(myPlayer) + 1;

    // Is the round effectively over? Time up OR everyone answered.
    const isRoundOver = allPlayersAnswered || isTimeUp;

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-[#023e8a] md:bg-gradient-to-br md:from-[#023e8a] md:via-[#0077b6] md:to-[#0096c7] px-4 pb-3">
            {!isMobile && <AnimatedBackground />}

            {/* Give Up Modal */}
            <AnimatePresence>
                {showGiveUpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 md:bg-black/60 md:backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#023e8a] border-2 border-white/20 p-6 rounded-3xl md:shadow-2xl max-w-sm w-full text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Give Up?</h2>
                            <p className="text-white/70">
                                This will mark the round as lost. Are you sure?
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={cancelGiveUp} className="flex-1 py-3 bg-white/10 active:bg-white/20 md:hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">
                                    Keep Trying
                                </button>
                                <button onClick={confirmGiveUp} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 active:from-orange-600 active:to-red-700 md:hover:from-orange-600 md:hover:to-red-700 text-white rounded-xl font-semibold md:shadow-lg shadow-orange-500/30 transition-all">
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

            <div className={`flex-1 overflow-y-auto pb-32`}>
                <div className={`flex flex-col md:flex-row-reverse ${isMobile ? 'items-center' : 'items-start'} justify-center py-4 gap-6 max-w-7xl mx-auto w-full`}>

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
                        <RoundTimer
                            key={roomData.roundNumber}
                            startTime={roundStartTime}
                            duration={60}
                            onTimeUp={handleTimeUp}
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
                            activeBoxIndex={activeBoxIndex}
                            onBoxClick={setActiveBoxIndex}
                            onBoxInput={handleBoxInput}
                            onBoxBackspace={handleBoxBackspaceNav}
                            disabled={isTimeUp}
                        />

                        {!isMobile && (
                            <div className="w-full max-w-2xl mt-6 z-40 relative">
                                <Keyboard
                                    isMobile={false}
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

            {isMobile && <GameControls
                isMobile={true}
                onSkip={handleSkip}
                onSubmit={handleSubmit}
            />
            }

            {/* Round Over Overlay */}
            <AnimatePresence>
                {(isRoundOver) && roomData.status !== "finished" && (
                    <RoundOverOverlay
                        roomData={roomData}
                        user={user}
                        sortedPlayers={sortedPlayers}
                        isHost={false}
                        answers={answers}
                        autoAdvancing={true}
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
                        isHost={false}
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
