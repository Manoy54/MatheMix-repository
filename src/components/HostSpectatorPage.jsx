import React, { useState, useMemo } from "react";
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
} from "./MultiplayerComponents.jsx";

import { useHostGameLogic } from "../hooks/useHostGameLogic";
import { useLeaveNotifications } from "../hooks/useLeaveNotifications";

export default function HostSpectatorPage({ roomCode, roomData, user, onLeave, onOpenSidebar }) {
    const {
        currentQuestion,
        players = [],
        answers = [],
        roundStartTime,
    } = roomData || {};

    const [showLeaveModal, setShowLeaveModal] = useState(false);

    // Extracted Hook
    const leaveNotifications = useLeaveNotifications(players);

    const isMobile = useMobile();

    const {
        isTimeUp,
        handleTimeUp,
        handleNextRound,
        nextCategory,
        setNextCategory
    } = useHostGameLogic(roomCode, roomData, true); // isHost=true always for SpectatorPage

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
