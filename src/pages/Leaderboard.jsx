
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Target, Flame, Medal as MedalIcon } from 'lucide-react';
import { useLoading } from '../context/LoadingContext';
import { useMobile } from '../hooks/useMobile';

import StandardHeader from '../components/StandardHeader';

export default function Leaderboard({ onOpenSidebar }) {
    const isMobile = useMobile();
    const [leaders, setLeaders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('totalWins'); // totalWins, accuracy, longestStreak
    const [error, setError] = useState(null);
    const { setModeDataReady, setBg3DReady } = useLoading();

    useEffect(() => {
        setModeDataReady(true);
        setBg3DReady(true);
    }, [setModeDataReady, setBg3DReady]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Create Query based on filter
                // Note: This requires Firestore indexes. If index is missing, it will throw an error in console with a link to create it.
                // We fallback to client-side sorting if needed, but for "accurate data" server-side is best.
                // However, without guaranteed indexes, fetching all might be too heavy. 
                // Let's try to fetch a reasonable batch (e.g. 100) ordered by the filter.

                const statsRef = collection(db, 'userStats');
                const q = query(statsRef, orderBy(filter, 'desc'), limit(50));

                const querySnapshot = await getDocs(q);

                // 2. Process Data
                const leaderboardData = [];
                const userFetchPromises = [];

                querySnapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const uid = docSnap.id;

                    const entry = {
                        id: uid,
                        ...data,
                        username: data.username || null // Might be null if legacy data
                    };

                    leaderboardData.push(entry);

                    // 3. Fallback: If username is missing, fetch from 'users' collection
                    if (!entry.username) {
                        const userPromise = getDoc(doc(db, 'users', uid)).then(userSnap => {
                            if (userSnap.exists()) {
                                entry.username = userSnap.data().username || "Unknown Player";
                            } else {
                                entry.username = "Anonymous";
                            }
                        });
                        userFetchPromises.push(userPromise);
                    }
                });

                // Wait for all usernames to resolve
                if (userFetchPromises.length > 0) {
                    await Promise.all(userFetchPromises);
                }

                setLeaders(leaderboardData);

            } catch (err) {
                console.error("Error fetching leaderboard:", err);
                // Fallback for missing index error (common in dev)
                if (err.code === 'failed-precondition') {
                    setError("Indexing required. Please check console for Firebase link or try again later.");
                } else {
                    setError("Failed to load leaderboard data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [filter]);

    // Format helpers
    const getMedalColor = (index) => {
        switch (index) {
            case 0: return "text-yellow-400"; // Gold
            case 1: return "text-gray-300";   // Silver
            case 2: return "text-amber-600";  // Bronze
            default: return "text-blue-200";
        }
    };

    const getRankBadge = (index) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />;
            case 1: return <MedalIcon className="w-6 h-6 text-gray-300 fill-gray-300/20" />;
            case 2: return <MedalIcon className="w-6 h-6 text-amber-600 fill-amber-600/20" />;
            default: return <span className="text-white/50 font-bold w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className={`min-h-screen font-nunito pb-24 ${isMobile ? 'bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]' : ''}`}>
            <StandardHeader onOpenSidebar={onOpenSidebar} className="px-4" />

            <div className="p-4 md:p-8">
                {/* Header Section */}
                <motion.div
                    initial={isMobile ? {} : { opacity: 0, y: -20 }}
                    animate={isMobile ? {} : { opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto mb-8 text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-1.5 rounded-full border border-orange-400/30 mb-4">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-100 text-sm font-bold tracking-wide">Global Rankings</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                        Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Fame</span>
                    </h1>
                    <p className="text-white/60">Top performing players across the Mathemix universe</p>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={isMobile ? {} : { opacity: 0, y: 10 }}
                    animate={isMobile ? {} : { opacity: 1, y: 0 }}
                    transition={isMobile ? { duration: 0 } : { delay: 0.1 }}
                    className="max-w-5xl mx-auto mb-8 flex justify-center"
                >
                    <div className={`p-1.5 rounded-xl flex gap-1 ${isMobile ? 'bg-white/10 border border-white/10' : 'bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl'}`}>
                        {[
                            { id: 'totalWins', label: 'Most Wins', icon: Trophy },
                            { id: 'accuracy', label: 'Highest Accuracy', icon: Target },
                            { id: 'longestStreak', label: 'Best Streak', icon: Flame }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                                ${filter === tab.id
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                            `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={isMobile ? {} : { opacity: 0 }}
                                animate={isMobile ? {} : { opacity: 1 }}
                                exit={isMobile ? {} : { opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                                <p className="text-white/50 animate-pulse">Fetching data...</p>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={isMobile ? {} : { opacity: 0 }}
                                animate={isMobile ? {} : { opacity: 1 }}
                                className="text-center py-20 bg-red-500/10 border border-red-500/20 rounded-2xl"
                            >
                                <p className="text-red-400 font-bold mb-2">Unable to load leaderboard</p>
                                <p className="text-red-300/60 text-sm">{error}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={isMobile ? {} : { opacity: 0 }}
                                animate={isMobile ? {} : { opacity: 1 }}
                                className="space-y-4"
                            >
                                {/* Top 3 Podium (If enough players) */}
                                {leaders.length >= 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end">
                                        {/* 2nd Place */}
                                        <div className={`order-2 md:order-1 p-4 md:p-6 rounded-2xl relative transition-transform duration-300 ${isMobile ? 'bg-white/10 border border-white/10' : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:-translate-y-2'}`}>
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-900 font-bold rounded-full w-8 h-8 flex items-center justify-center border-4 border-[#0f172a]">2</div>
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-gray-500/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                                                    <Medal className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <h3 className="text-white font-bold text-lg truncate px-2">{leaders[1].username}</h3>
                                                <p className="text-gray-400 text-sm font-mono mt-1">
                                                    {leaders[1][filter]} <span className="text-xs opacity-50">{filter === 'accuracy' ? '%' : ''}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* 1st Place */}
                                        <div className={`order-1 md:order-2 p-6 md:p-8 rounded-2xl relative z-10 transition-transform duration-300 ${isMobile ? 'bg-white/20 border border-white/20' : 'bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border border-yellow-500/30 shadow-2xl shadow-yellow-500/10 transform scale-105 hover:-translate-y-2'}`}>
                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black rounded-full w-10 h-10 flex items-center justify-center border-4 border-[#0f172a] shadow-lg shadow-yellow-500/50">1</div>
                                            {!isMobile && <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent rounded-2xl" />}
                                            <div className="text-center relative">
                                                <div className="w-20 h-20 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-yellow-500/20">
                                                    <Crown className="w-10 h-10 text-yellow-400" />
                                                </div>
                                                <h3 className="text-white font-black text-2xl truncate px-2">{leaders[0].username}</h3>
                                                <p className="text-yellow-400 text-xl font-mono mt-2 font-bold">
                                                    {leaders[0][filter]} <span className="text-sm opacity-60">{filter === 'accuracy' ? '%' : ''}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* 3rd Place */}
                                        <div className={`order-3 p-4 md:p-6 rounded-2xl relative transition-transform duration-300 ${isMobile ? 'bg-white/10 border border-white/10' : 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/50 shadow-xl hover:-translate-y-2'}`}>
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center border-4 border-[#0f172a]">3</div>
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-amber-600/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                                                    <Medal className="w-8 h-8 text-amber-600" />
                                                </div>
                                                <h3 className="text-white font-bold text-lg truncate px-2">{leaders[2].username}</h3>
                                                <p className="text-amber-500 text-sm font-mono mt-1">
                                                    {leaders[2][filter]} <span className="text-xs opacity-50">{filter === 'accuracy' ? '%' : ''}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* List View */}
                                <div className={`rounded-2xl border overflow-hidden ${isMobile ? 'bg-white/5 border-white/5' : 'bg-white/5 backdrop-blur-md border-white/10 shadow-2xl'}`}>
                                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-white/40 uppercase tracking-wider">
                                        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                                        <div className="col-span-6 md:col-span-5">Player</div>
                                        <div className="col-span-4 md:col-span-6 flex justify-between pr-4">
                                            <span className="text-center flex-1 hidden md:block">Wins</span>
                                            <span className="text-center flex-1 hidden md:block">Accuracy</span>
                                            <span className="text-center flex-1 hidden md:block">Streak</span>
                                            <span className="text-right flex-1 md:hidden">Stat</span>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {leaders.map((player, index) => (
                                            <motion.div
                                                key={player.id}
                                                initial={isMobile ? {} : { opacity: 0, x: -20 }}
                                                animate={isMobile ? {} : { opacity: 1, x: 0 }}
                                                transition={isMobile ? { duration: 0 } : { delay: index * 0.05 }}
                                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="col-span-2 md:col-span-1 flex justify-center">
                                                    {getRankBadge(index)}
                                                </div>

                                                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg">
                                                        {player.username?.substring(0, 2) || "??"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${index < 3 ? 'text-white' : 'text-white/80'} group-hover:text-white transition-colors`}>
                                                            {player.username}
                                                        </span>
                                                        {index < 3 && <span className="text-[10px] text-yellow-400/70 font-bold uppercase tracking-wide">Top 3</span>}
                                                    </div>
                                                </div>

                                                <div className="col-span-4 md:col-span-6 flex justify-between pr-4 items-center">
                                                    {/* Desktop Columns */}
                                                    <div className={`flex-1 text-center font-mono font-bold hidden md:block ${filter === 'totalWins' ? 'text-blue-400 text-lg' : 'text-white/50'}`}>
                                                        {player.totalWins || 0}
                                                    </div>
                                                    <div className={`flex-1 text-center font-mono font-bold hidden md:block ${filter === 'accuracy' ? 'text-green-400 text-lg' : 'text-white/50'}`}>
                                                        {player.accuracy || 0}%
                                                    </div>
                                                    <div className={`flex-1 text-center font-mono font-bold hidden md:block ${filter === 'longestStreak' ? 'text-orange-400 text-lg' : 'text-white/50'}`}>
                                                        {player.longestStreak || 0}
                                                    </div>

                                                    {/* Mobile Single Column */}
                                                    <div className="flex-1 text-right md:hidden">
                                                        <span className="text-white font-bold text-lg">
                                                            {player[filter]}
                                                            <span className="text-xs ml-1 text-white/50">{filter === 'accuracy' ? '%' : ''}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {leaders.length === 0 && (
                                            <div className="p-8 text-center text-white/40">
                                                No data found yet. Be the first to play!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
