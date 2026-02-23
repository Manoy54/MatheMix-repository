
import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Calculator, Sparkles, Trophy, Brain, Users, Zap, Menu, Crown, LogOut, Clock, AlertCircle, Maximize2, X } from 'lucide-react';

export const CATEGORY_MAP = {
    "Number & Algebra": "number-algebra",
    "Measurement & Geometry": "measurement-geometry",
    "Data & Probability": "data-probability"
};

export const TopBar = React.memo(({ onOpenSidebar, roomCode, onLeave }) => (
    <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full py-3 flex items-center justify-between flex-shrink-0 z-20"
    >
        <div className="flex items-center gap-3">
            {onOpenSidebar && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onOpenSidebar}
                    className="bg-white/10 md:backdrop-blur-md p-2 rounded-xl border border-white/20 text-white md:shadow-lg active:bg-white/20 md:hover:bg-white/20 transition-all"
                >
                    <Menu className="w-6 h-6" />
                </motion.button>
            )}
            <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-yellow-400/50 rounded-xl md:blur-lg md:opacity-50 hidden md:block" />
                <div className="relative bg-white/10 p-2 rounded-xl border border-white/20 md:backdrop-blur-sm">
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
                className="p-2 bg-red-500/20 active:bg-red-500/40 md:hover:bg-red-500/40 text-red-200 rounded-lg border border-red-500/30 transition-colors"
                title="Leave Game"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    </motion.div>
));

export const RankingsSidebar = React.memo(({ isMobile, myRank, myScore, user, sortedPlayers, setShowRankingsModal }) => (
    <motion.div
        initial={isMobile ? { y: -20, x: 0, opacity: 0 } : { x: 50, y: 0, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        className="w-full max-w-3xl md:max-w-none md:w-80 flex-shrink-0 z-10 flex flex-col gap-4"
    >
        {isMobile ? (
            <div className="flex w-full gap-2">
                {/* Left: Your Rank & Score Combined */}
                <div className="flex-1 bg-white/10 md:backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-center justify-center md:shadow-lg p-2 min-h-[70px]">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Rank</span>
                        <div className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-yellow-300" />
                            <span className="text-yellow-300 font-black text-lg leading-none">#{myRank}</span>
                        </div>
                    </div>
                    <div className="w-full h-[1px] bg-white/10 my-1" />
                    <div className="flex items-center gap-2">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Score</span>
                        <span className="text-white font-black text-lg leading-none">{myScore}</span>
                    </div>
                </div>

                {/* Right: Currently Leading */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRankingsModal(true)}
                    className="flex-1 bg-white/10 md:backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-center justify-center md:shadow-lg p-2 min-h-[70px] relative overflow-hidden"
                >
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Leader</span>
                    <div className="flex items-center gap-2 z-10">
                        <span className={`font-black text-sm truncate max-w-[100px] ${sortedPlayers[0]?.uid === user?.uid ? 'text-yellow-400' : 'text-white'}`}>
                            {sortedPlayers[0]?.nickname || '-'}
                        </span>
                        <Maximize2 className="w-3 h-3 text-white/50" />
                    </div>
                </motion.button>
            </div>
        ) : (
            <>
                <div className="bg-white/10 md:backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-around md:shadow-lg">
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

                <div className="bg-[#0f172a]/40 md:backdrop-blur-xl rounded-2xl border border-white/10 p-4 h-full max-h-[500px] overflow-hidden flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                        <Users className="w-5 h-5 text-cyan-300" />
                        Live Rankings
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {sortedPlayers.map((p, index) => (
                            <div
                                key={p.uid}
                                className={`relative p-3 rounded-xl border flex items-center justify-between transition-all ${p.uid === user?.uid ? 'bg-white/10 border-white/30 md:shadow-lg' : 'bg-transparent border-transparent active:bg-white/5 md:hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-black shadow-[0_0_10px_#fbbf24]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${p.uid === user?.uid ? 'text-white' : 'text-white/70'}`}>
                                            {p.nickname}
                                        </span>
                                        {p.uid === user?.uid && <span className="text-[10px] text-cyan-300 uppercase font-bold">You</span>}
                                    </div>
                                </div>
                                <span className="text-white font-black text-lg">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}
    </motion.div>
));

export const QuestionCard = React.memo(({ roundNumber, category, definition, hasAnswered, allPlayersAnswered, scoreMessage, children }) => (
    <motion.div
        key={definition}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-3xl"
    >
        <div className="absolute inset-0 md:bg-gradient-to-r md:from-cyan-400/20 md:to-blue-400/20 rounded-2xl md:blur-xl" />
        <div className="relative bg-white/10 md:backdrop-blur-xl p-3 md:p-6 rounded-2xl border border-white/20 md:shadow-2xl text-center min-h-[130px] md:min-h-[130px] flex flex-col justify-center items-center">
            <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold text-white/50 border border-white/10 uppercase tracking-widest">
                {category || "General"}
            </div>

            {/* Round Counter in Top Right */}
            <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1.5 bg-cyan-400/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-cyan-400/20">
                <Brain className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-cyan-300" />
                <span className="text-[8px] md:text-[10px] font-black text-cyan-200 uppercase tracking-wider">
                    Round #{roundNumber || 1}
                </span>
            </div>
            <p className="text-white text-sm md:text-xl font-medium leading-relaxed mt-4 md:mt-2">
                {definition}
            </p>
            {hasAnswered && !allPlayersAnswered && (
                <div className="mt-4 flex items-center gap-2 text-yellow-300 animate-pulse bg-yellow-400/10 px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-bold">Waiting for opponents (or timer)...</span>
                </div>
            )}
            {scoreMessage && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4 px-4 py-2 rounded-full font-bold text-sm bg-white/20 text-white md:shadow-lg border border-white/20"
                >
                    {scoreMessage}
                </motion.div>
            )}
            {/* Inject children (Timer) here */}
            {children}
        </div>
    </motion.div>
));

export const RankingsModal = React.memo(({ isOpen, onClose, sortedPlayers, userId }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 md:backdrop-blur-md"
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden md:shadow-2xl"
        >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-white font-black text-xl flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Rankings
                </h2>
                <button onClick={onClose} className="p-2 active:bg-white/10 md:hover:bg-white/10 rounded-full transition-all">
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

export const RoundOverOverlay = ({ roomData, user, sortedPlayers, isHost, onNextRound, nextCategory, setNextCategory, answers, autoAdvancing = false }) => {
    const isWinner = sortedPlayers[0]?.uid === user?.uid;
    const myPlayer = sortedPlayers.find(p => p.uid === user?.uid);
    const isFinalRound = (roomData.roundNumber || 1) >= (roomData.rounds || 5);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#023e8a]/90 md:backdrop-blur-xl"
        >

            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#0f172a] border-2 border-white/10 p-3 md:p-6 rounded-[20px] md:rounded-[36px] md:shadow-[0_0_80px_rgba(0,0,0,0.5)] max-w-lg w-[90%] md:w-full h-auto max-h-[85vh] md:max-h-none text-center flex flex-col md:block relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shrink-0" />
                <div className="space-y-1 shrink-0 mb-2">
                    <div className="inline-block p-2 md:p-3 bg-yellow-400/10 rounded-2xl mb-1">
                        <Trophy className={`w-6 h-6 md:w-10 md:h-10 ${isWinner ? 'text-yellow-400 animate-bounce' : 'text-gray-400'}`} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        {isFinalRound ? "Match Over!" : "Round Over!"}
                    </h2>
                    <p className="text-white/60 font-medium text-[10px] md:text-sm">Amazing performance from everyone!</p>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1 overflow-y-auto md:overflow-visible content-start md:content-center py-1 md:py-2 px-1">
                    <div className="col-span-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 p-2 md:p-3 rounded-2xl md:rounded-3xl border border-yellow-400/30 flex flex-col items-center justify-center">
                        <p className="text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">Round Winner</p>
                        <p className="text-lg md:text-xl font-black text-white truncate w-full">
                            {answers.filter(a => a.isCorrect).sort((a, b) => a.timestamp - b.timestamp)[0]?.nickname || "None"}
                        </p>
                    </div>
                    {/* Only show "Items Found" etc if user is a player (has user object and is participating) */}
                    {user && (
                        <>
                            <div className="bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                                <p className="text-white/40 text-[8px] md:text-[9px] font-bold uppercase mb-0.5">Items Found</p>
                                <p className={`text-sm md:text-xl font-black ${answers.filter(a => a.uid === user.uid && a.isCorrect).length > 0 ? "text-green-500" : "text-red-500"}`}>
                                    {answers.filter(a => a.uid === user.uid && a.isCorrect).length > 0 ? "Correct" : "Missed"}
                                </p>
                            </div>
                            <div className="bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                                <p className="text-white/40 text-[8px] md:text-[9px] font-bold uppercase mb-0.5">Points Earned</p>
                                <p className="text-sm md:text-xl font-black text-white">
                                    {(() => {
                                        const myRoundAnswer = answers.find(a => a.uid === user.uid && a.isCorrect);
                                        if (!myRoundAnswer) return 0;
                                        const correctOnes = answers.filter(a => a.isCorrect).sort((a, b) => a.timestamp - b.timestamp);
                                        const myRank = correctOnes.findIndex(a => a.uid === user.uid) + 1;
                                        return 100 + Math.max(0, 30 - ((myRank - 1) * 10));
                                    })()}
                                </p>
                            </div>
                            <div className="bg-white/5 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                                <p className="text-white/40 text-[8px] md:text-[9px] font-bold uppercase mb-0.5">Total Score</p>
                                <p className="text-sm md:text-xl font-black text-white">
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
                        </>
                    )}


                    {/* Leaderboard Section */}
                    <div className="col-span-3 mt-2 md:mt-3 bg-white/5 rounded-2xl border border-white/10 overflow-hidden md:shadow-lg">
                        <div className="p-2 bg-white/5 border-b border-white/10 font-bold text-white text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            Current Standings
                        </div>
                        <div className="max-h-[140px] md:max-h-[160px] overflow-y-auto custom-scrollbar">
                            {sortedPlayers.map((p, i) => (
                                <div key={p.uid} className={`flex justify-between px-3 py-2 md:px-4 md:py-3 border-b border-white/5 last:border-0 transition-colors ${p.uid === user?.uid ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className={`font-black text-xs md:text-sm w-5 md:w-6 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/40'}`}>
                                            #{i + 1}
                                        </span>
                                        <span className={`text-xs md:text-sm font-bold ${p.uid === user?.uid ? 'text-cyan-300' : 'text-white/90'}`}>
                                            {p.nickname} {p.uid === user?.uid && '(You)'}
                                        </span>
                                    </div>
                                    <span className="font-black text-xs md:text-sm text-white">{p.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {
                    isFinalRound ? (
                        <div className="pt-2 md:pt-4 shrink-0 mt-auto">
                            <button
                                onClick={() => isHost && onNextRound(nextCategory)}
                                className={`w-full bg-gradient-to-r from-yellow-400 to-orange-500 active:from-yellow-300 active:to-orange-400 md:hover:from-yellow-300 md:hover:to-orange-400 text-white font-black py-3 rounded-xl md:shadow-[0_10px_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2 group text-sm md:text-base ${!isHost ? 'opacity-70 cursor-default' : ''}`}
                            >
                                <Trophy className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                                {isHost ? "VIEW MATCH RESULTS" : "VIEW RESULTS (WAITING FOR HOST)"}
                            </button>
                        </div>
                    ) : (
                        <CountdownOverlay
                            autoAdvancing={autoAdvancing}
                            targetTime={roomData?.intermissionEndsAt}
                        />
                    )
                }
            </motion.div>
        </motion.div>
    );
};

const CountdownOverlay = ({ autoAdvancing, targetTime }) => {
    // We rely purely on targetTime from server/host
    const [seconds, setSeconds] = useState(10); // Default to 10 visual

    useEffect(() => {
        if (!autoAdvancing || !targetTime) {
            setSeconds(10);
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            // If targetTime is invalid or in the past (stale from previous round), show 10s (Waiting state)
            // This prevents "Stuck at 0" while waiting for the new round's intermission timestamp to propagate.
            if (!targetTime || targetTime <= now) {
                setSeconds(10);
                return;
            }

            const remaining = Math.max(0, targetTime - now);
            setSeconds(Math.ceil(remaining / 1000));
        };

        // Initial update
        updateTimer();

        const interval = setInterval(() => {
            const now = Date.now();
            if (!targetTime || targetTime <= now) {
                // Keep checking in case it updates, but keep display at 10 or 0? 
                // If it is truly over, we should probably stay at 0, BUT... 
                // If we are autoAdvancing, we expect a future time. 
                // If we are strictly stuck at 0, it means we are waiting for host.
                // Let's stick to 10s "Waiting..." visual if it's stale. 
                // But wait, if the round DOES end (timer reaches 0), we want it to show 0.
                // How to distinguish "Stale Old Round" vs "Just Finished Countdown"?
                // We can check if (now - targetTime) is huge?
                // Simpler: If targetTime creates a negative remaining > 5 seconds (e.g. old round), treat as Stale.
                // If it is close to 0 (e.g. -1s), it just finished.
                // Let's use a threshold. 15 seconds.
                const diff = targetTime - now;
                if (diff < -5000) {
                    // Propagated stale time
                    setSeconds(10);
                } else {
                    setSeconds(Math.ceil(Math.max(0, diff) / 1000));
                }
            } else {
                setSeconds(Math.ceil((targetTime - now) / 1000));
            }
        }, 200);

        return () => clearInterval(interval);
    }, [autoAdvancing, targetTime]);

    return (
        <div className="bg-white/5 rounded-2xl p-3 md:p-4 border border-white/10 flex flex-col items-center gap-2 shrink-0 mt-auto w-full">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                <span className="text-white/80 font-bold italic text-sm md:text-base">
                    {autoAdvancing ? `Next round in ${seconds}s...` : "Waiting..."}
                </span>
            </div>
            {/* Countdown bar removed as requested */}
        </div>
    );
};

// --- Optimized Character Boxes Subcomponent (Mobile Responsive with Input) ---
export const CharacterBox = React.memo(({ inputChar, index, answerStatus, boxWidth, boxHeight, fontSize, isMobile, isActive, onBoxClick, onInput, onBackspace, inputRef }) => {
    // Desktop View
    if (!isMobile) {
        let bgColorClass = 'bg-white/20';
        if (answerStatus === 'correct') bgColorClass = 'bg-gradient-to-br from-green-400 to-emerald-500';
        if (answerStatus === 'wrong') bgColorClass = 'bg-gradient-to-br from-red-400 to-red-600';

        return (
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative perspective-1000"
                style={{ width: boxWidth, height: boxHeight }}
            >
                <div className={`absolute inset-0 rounded-xl blur-md ${answerStatus === 'correct' ? 'bg-green-400/50' : answerStatus === 'wrong' ? 'bg-red-400/50' : 'bg-cyan-400/30'}`} />
                <motion.div
                    className={`relative w-full h-full ${bgColorClass} backdrop-blur-sm border-2 rounded-xl flex items-center justify-center shadow-xl transition-colors duration-300`}
                    style={{
                        borderColor: inputChar ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: fontSize
                    }}
                >
                    <span className="text-white font-bold">{inputChar}</span>
                </motion.div>
            </motion.div>
        );
    }

    // Mobile View with Input
    const bgColor = (() => {
        if (answerStatus === 'correct') return 'bg-green-500/80';
        if (answerStatus === 'wrong') return 'bg-red-500/80';
        return 'bg-white/20';
    })();

    const borderColor = (inputChar && inputChar !== ' ') ? 'border-white/60' : 'border-white/20';

    return (
        <div
            className={`relative rounded-xl`}
            style={{ width: boxWidth, height: boxHeight }}
            onClick={onBoxClick}
        >
            <input
                ref={inputRef}
                value={inputChar === ' ' ? '' : inputChar}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                        onBackspace();
                    } else {
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
                    appearance: 'none', // Remove default styling
                    textAlign: 'center'
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
            />
            <div
                className={`absolute inset-0 w-full h-full ${bgColor} border-2 rounded-xl flex items-center justify-center transition-colors duration-200 pointer-events-none ${borderColor}`}
            >
                {/* Visual Background */}
            </div>
        </div>
    );
});

export const CharacterBoxes = React.memo(({ containerRef, answer, guess, allPlayersAnswered, hasAnswered, myAnswerData, isMobile, containerWidth, activeBoxIndex, onBoxClick, onBoxInput, onBoxBackspace, disabled }) => {
    const words = useMemo(() => answer.split(' '), [answer]);
    const inputCharsOnly = useMemo(() => guess.split(''), [guess]);
    const inputsRef = useRef([]);

    useEffect(() => {
        if (isMobile && inputsRef.current[activeBoxIndex]) {
            inputsRef.current[activeBoxIndex].focus();
        }
    }, [activeBoxIndex, isMobile]);

    const layout = useMemo(() => {
        if (!isMobile) {
            return {
                boxWidth: 48,
                boxHeight: 64,
                fontSize: 24,
                currentGap: 8,
                rowGap: 12
            };
        }
        const GAP = 3;
        const BASE_BOX_WIDTH = 32;
        const BASE_BOX_HEIGHT = 44;
        const BASE_FONT_SIZE = 18;

        let scale = 1;
        if (containerWidth > 0) {
            let maxWordWidthNeeded = 0;
            words.forEach(word => {
                const width = (word.length * BASE_BOX_WIDTH) + ((word.length - 1) * GAP);
                if (width > maxWordWidthNeeded) maxWordWidthNeeded = width;
            });
            const availableWidth = containerWidth - 60;
            if (maxWordWidthNeeded > availableWidth) {
                scale = availableWidth / maxWordWidthNeeded;
            }
            if (words.length > 2) scale *= 0.9;
        }

        return {
            boxWidth: BASE_BOX_WIDTH * scale,
            boxHeight: BASE_BOX_HEIGHT * scale,
            fontSize: Math.max(10, BASE_FONT_SIZE * scale),
            currentGap: GAP * scale
        };
    }, [words, isMobile, containerWidth, answer]);

    let globalInputIndex = 0;

    return (
        <div
            ref={containerRef}
            className={`flex flex-wrap items-center justify-center ${isMobile ? 'gap-[6px]' : 'gap-x-8 gap-y-6'} max-w-3xl mx-auto min-h-[120px] w-full px-2 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
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

                        let status = null;
                        if (hasAnswered) {
                            if (myAnswerData?.isCorrect) status = 'correct';
                            else status = 'wrong';
                        }
                        if (disabled && !hasAnswered) {
                            // If disabled (time up) and not answered, maybe show as missed/locked?
                        }

                        return (
                            <CharacterBox
                                key={`${wordIndex}-${charIndex}`}
                                inputChar={inputChar}
                                index={currentGlobalIndex}
                                answerStatus={status}
                                boxWidth={layout.boxWidth}
                                boxHeight={layout.boxHeight}
                                fontSize={layout.fontSize}
                                isMobile={isMobile}
                                isActive={isMobile && activeBoxIndex === currentGlobalIndex}
                                onBoxClick={() => onBoxClick && onBoxClick(currentGlobalIndex)}
                                onInput={(val) => onBoxInput && onBoxInput(currentGlobalIndex, val)}
                                onBackspace={() => onBoxBackspace && onBoxBackspace(currentGlobalIndex)}
                                inputRef={isMobile ? (el) => inputsRef.current[currentGlobalIndex] = el : null}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

export const LeaveConfirmationModal = React.memo(({ isOpen, isHost, onClose, onConfirm }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 md:bg-black/60 md:backdrop-blur-sm"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#023e8a] border-2 border-white/20 p-6 rounded-3xl md:shadow-2xl max-w-sm w-full text-center space-y-4"
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
                    className="flex-1 py-3 bg-white/10 active:bg-white/20 md:hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
                >
                    Stay
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 active:from-red-600 active:to-red-700 md:hover:from-red-600 md:hover:to-red-700 text-white rounded-xl font-semibold md:shadow-lg shadow-red-500/30 transition-all font-black uppercase tracking-wider"
                >
                    {isHost ? 'End Game' : 'Leave'}
                </button>
            </div>
        </motion.div>
    </motion.div>
));
