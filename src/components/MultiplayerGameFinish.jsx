import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, LogOut, Crown, Users, Star, RotateCcw, CheckCircle2 } from 'lucide-react';
import { db } from '../firebaseConfig.js';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const PodiumItem = ({ player, rank, height, color, glow, delay }) => {
    if (!player) return <div className="flex-1" />;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.8, type: "spring" }}
            className="flex flex-col items-center flex-1 min-w-0"
        >
            <div className="relative mb-4">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className={`relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full border-4 ${color} bg-slate-800 flex items-center justify-center shadow-2xl overflow-hidden`}
                >
                    <span className="text-white font-black text-2xl md:text-3xl">
                        {player.nickname.charAt(0).toUpperCase()}
                    </span>
                </motion.div>
                {rank === 1 && (
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-6 -right-2 z-20"
                    >
                        <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                    </motion.div>
                )}
                <div className={`absolute inset-0 rounded-full ${glow} blur-xl opacity-50`} />
            </div>

            <div className="text-center mb-4 px-2 w-full">
                <p className="text-white font-black text-sm md:text-base truncate drop-shadow-md">
                    {player.nickname}
                </p>
                <p className={`text-xs font-bold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : 'text-orange-400'}`}>
                    {player.score} pts
                </p>
            </div>

            <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: delay + 0.3, duration: 1 }}
                className={`w-full max-w-[100px] ${color.replace('border-', 'bg-')} bg-opacity-20 backdrop-blur-md rounded-t-3xl border-t-4 border-x-4 ${color} relative flex items-start justify-center pt-4`}
            >
                <span className="text-white/40 font-black text-4xl md:text-5xl select-none">
                    {rank}
                </span>
                <div className={`absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-t-2xl`} />
            </motion.div>
        </motion.div>
    );
};

export default function MultiplayerGameFinish({ roomData, user, onLeave, onHostPlayAgain }) {
    const playAgainVotes = roomData?.playAgainVotes || [];
    const hasVoted = playAgainVotes.includes(user.uid);
    const isHost = user.uid === roomData?.hostId;
    const votesCount = playAgainVotes.length;
    const totalPlayers = roomData?.players?.length || 0;
    const canPlayAgain = votesCount >= Math.ceil(totalPlayers / 2);

    const sortedPlayers = useMemo(() => {
        return [...(roomData?.players || [])].sort((a, b) => b.score - a.score);
    }, [roomData?.players]);

    const top3 = [
        sortedPlayers[1], // 2nd
        sortedPlayers[0], // 1st
        sortedPlayers[2]  // 3rd
    ];

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const myRank = sortedPlayers.findIndex(p => p.uid === user.uid) + 1;

    const handleVotePlayAgain = async () => {
        if (hasVoted) return;
        try {
            const roomRef = doc(db, "rooms", roomData.roomCode);
            await updateDoc(roomRef, {
                playAgainVotes: arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error voting for play again:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] overflow-y-auto no-scrollbar">
            <div className="min-h-screen w-full flex flex-col items-center justify-start py-6 md:py-8 px-4 gap-4 md:gap-6">

                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center space-y-1 md:space-y-2"
                >
                    <div className="inline-block p-2 md:p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-1 md:mb-2">
                        <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-bounce" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                        Match Results
                    </h1>
                    <p className="text-white/60 font-bold tracking-widest uppercase text-xs md:text-sm">
                        Legendary Performance!
                    </p>
                </motion.div>

                {/* Podium Section */}
                <div className="w-full max-w-2xl flex items-end justify-center gap-2 md:gap-4 mt-4 min-h-[220px] md:min-h-[260px]">
                    <PodiumItem
                        player={top3[0]}
                        rank={2}
                        height={120}
                        color="border-slate-300"
                        glow="bg-slate-300"
                        delay={0.4}
                    />
                    <PodiumItem
                        player={top3[1]}
                        rank={1}
                        height={160}
                        color="border-yellow-400"
                        glow="bg-yellow-400"
                        delay={0.2}
                    />
                    <PodiumItem
                        player={top3[2]}
                        rank={3}
                        height={90}
                        color="border-orange-500"
                        glow="bg-orange-500"
                        delay={0.6}
                    />
                </div>

                {/* All Players List */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full max-w-2xl bg-black/20 backdrop-blur-xl rounded-[30px] border-2 border-white/10 p-4 md:p-6 shadow-2xl space-y-3"
                >
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h3 className="text-white/40 font-black uppercase tracking-widest text-xs">Final Standings</h3>
                        <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase">
                            <Users className="w-4 h-4" />
                            {sortedPlayers.length} Players
                        </div>
                    </div>

                    <div className="space-y-3">
                        {sortedPlayers.map((player, index) => (
                            <motion.div
                                key={player.uid}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 1 + index * 0.1 }}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all relative ${playAgainVotes.includes(player.uid)
                                    ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                    : player.uid === user.uid
                                        ? 'bg-white/20 border-white/40 shadow-xl'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                {playAgainVotes.includes(player.uid) && (
                                    <div className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Play Again
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-400 text-slate-900' :
                                        index === 1 ? 'bg-slate-300 text-slate-900' :
                                            index === 2 ? 'bg-orange-400 text-slate-900' :
                                                'bg-white/10 text-white'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-white font-bold">{player.nickname}</p>
                                        {player.uid === user.uid && (
                                            <span className="text-[10px] text-yellow-300 font-black uppercase tracking-tighter">Your Score</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-black text-xl">{player.score}</p>
                                    <p className="text-white/40 font-bold text-[10px] uppercase">Points</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Exit Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="w-full max-w-2xl px-4 pb-12"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={hasVoted ? undefined : handleVotePlayAgain}
                            disabled={hasVoted}
                            className={`py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${hasVoted
                                ? 'bg-green-500/20 text-green-300 border-2 border-green-500/30 cursor-default'
                                : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-300 hover:to-blue-400 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {hasVoted ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    Voted Play Again
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="w-6 h-6" />
                                    Vote Play Again
                                </>
                            )}
                        </button>

                        <button
                            onClick={isHost && canPlayAgain ? onHostPlayAgain : undefined}
                            disabled={!isHost || !canPlayAgain}
                            className={`py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${isHost && canPlayAgain
                                ? 'bg-white text-[#023e8a] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]'
                                : isHost
                                    ? 'bg-white/10 text-white/40 border-2 border-white/10 cursor-not-allowed opacity-50'
                                    : 'hidden md:flex bg-white/5 text-white/20 border-2 border-white/5 cursor-not-allowed'
                                }`}
                        >
                            <Star className={`w-6 h-6 ${isHost && canPlayAgain ? 'animate-spin-slow text-yellow-500' : ''}`} />
                            {isHost ? 'Start New Match' : 'Waiting for Host...'}
                        </button>

                        <button
                            onClick={onLeave}
                            className="md:col-span-2 py-6 bg-black/30 text-white/60 hover:text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-black/40 transition-all flex items-center justify-center gap-3 border-2 border-white/5 hover:border-white/10"
                        >
                            <LogOut className="w-6 h-6" />
                            Return to Main Lobby
                        </button>
                    </div>
                    {myRank === 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-yellow-300 animate-pulse">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-black uppercase tracking-widest">Victory is yours!</span>
                            <Star className="w-4 h-4 fill-current" />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
