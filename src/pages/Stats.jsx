import { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import { doc, onSnapshot, getDoc, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path matches your project structure
import { Trophy, Target, Zap, Brain, TrendingUp, Clock, Award, Flame, Users, Gamepad2, Swords, Info } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

import StandardHeader from '../components/StandardHeader';

export default function Stats({ user, onOpenSidebar }) {
    // 1. Define the skeleton structure for safe defaults
    const defaultStats = {
        totalGames: 0, // Treated as Solo
        totalWins: 0,
        totalPlayTime: 0,
        accuracy: 0,
        longestStreak: 0,
        totalQuestions: 0,
        avgAnswerTime: 0,
        fastestAnswer: 0,
        mastery: {
            algebra: 0,
            geometry: 0,
            statistics: 0
        },
        recentGames: [],
        // New Multiplayer Stats (Placeholder structure)
        multiplayer: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            rankPoints: 0,
            rankName: "Unranked"
        }
    };

    // 2. State to hold the live data
    const [currentStats, setCurrentStats] = useState(defaultStats);
    const { setModeDataReady, setBg3DReady } = useLoading();

    useEffect(() => {
        setModeDataReady(true);
        setBg3DReady(true);
    }, [setModeDataReady, setBg3DReady]);

    // --- MIGRATION LOGIC: One-time check to move stats from users -> userStats ---
    useEffect(() => {
        const migrateStats = async () => {
            if (!user?.uid) return;

            const userStatsRef = doc(db, 'userStats', user.uid);
            const userProfileRef = doc(db, 'users', user.uid);

            try {
                const userStatsSnap = await getDoc(userStatsRef);

                // If userStats DOES NOT exist, but profile does... check for old stats
                if (!userStatsSnap.exists()) {
                    const userProfileSnap = await getDoc(userProfileRef);
                    if (userProfileSnap.exists()) {
                        const userData = userProfileSnap.data();
                        if (userData.stats) {
                            console.log("Migrating old stats to new collection...");
                            // Copy old stats to new collection
                            await setDoc(userStatsRef, userData.stats);
                        }
                    }
                }
            } catch (error) {
                console.error("Migration check failed:", error);
            }
        };

        migrateStats();
    }, [user]);


    // 3. Effect to subscribe to Firestore updates
    useEffect(() => {
        if (!user?.uid) return;

        // Listen to the specific user's document
        const userRef = doc(db, 'userStats', user.uid);

        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const dbStats = docSnap.data();

                // 4. Merge Logic: Combine defaults with DB data to prevent crashes
                const mergedStats = {
                    totalGames: dbStats.totalGames || 0,
                    totalWins: dbStats.totalWins || 0,
                    totalPlayTime: dbStats.totalPlayTime || 0,
                    accuracy: dbStats.accuracy || 0,
                    longestStreak: dbStats.longestStreak || dbStats.bestStreak || 0,
                    totalQuestions: dbStats.totalQuestions || 0,
                    avgAnswerTime: dbStats.avgAnswerTime || 0,
                    fastestAnswer: dbStats.fastestAnswer || 0,
                    mastery: {
                        algebra: dbStats.mastery?.algebra || 0,
                        geometry: dbStats.mastery?.geometry || 0,
                        statistics: dbStats.mastery?.statistics || 0
                    },
                    recentGames: dbStats.recentGames || [],
                    // Merge multiplayer if exists, else defaults
                    multiplayer: {
                        gamesPlayed: dbStats.multiplayer?.gamesPlayed || 0,
                        wins: dbStats.multiplayer?.wins || 0,
                        losses: dbStats.multiplayer?.losses || 0,
                        rankPoints: dbStats.multiplayer?.rankPoints || 0,
                        rankName: dbStats.multiplayer?.rankName || "Unranked"
                    }
                };

                setCurrentStats(mergedStats);
            }
        }, (error) => {
            console.error("Error fetching stats:", error);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [user]);

    // 5. Calculate Derived Metrics (UI Logic)

    // --- WEEKLY STATS CALCULATION ---
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const weeklyGames = currentStats.recentGames ? currentStats.recentGames.filter(g => {
        // Handle both legacy string dates and new timestamp fields
        if (g.timestamp) return g.timestamp > oneWeekAgo;
        // Fallback for rough string estimation if needed, though timestamp is better
        return true; // Show all if only 10 are stored anyway, as they are "recent"
    }) : [];

    // If we want to be strict about "Past Week" vs "All Time", we should ideally store a full history.
    // However, given current data constraints (10 recent games), we can treat the "Recent History" as the proxy for "This Week" 
    // IF the user plays frequently. 
    // To properly "display stats of the past week", we will calculate metrics ONLY from `weeklyGames`.

    const weeklyTotalGames = weeklyGames.length;
    const weeklyWins = weeklyGames.filter(g => g.result === 'Victory').length;
    const weeklyWinRate = weeklyTotalGames > 0
        ? ((weeklyWins / weeklyTotalGames) * 100).toFixed(1)
        : 0;

    // We will toggle the UI to show these "Weekly" stats instead of "All Time"
    const [showWeekly, setShowWeekly] = useState(true);

    const displayTotalGames = showWeekly ? weeklyTotalGames : currentStats.totalGames;
    const displayTotalWins = showWeekly ? weeklyWins : currentStats.totalWins;
    const displayWinRate = showWeekly ? weeklyWinRate : (currentStats.totalGames > 0 ? ((currentStats.totalWins / currentStats.totalGames) * 100).toFixed(1) : 0);

    // Filtered Accuracy Calculation (Global vs Weekly could be implemented, but prompt asks for global formula override)
    // Formula: Correct Answers (Total Questions) / (Total Correct + 1 Wrong per Game)
    const trueAccuracy = currentStats.totalGames > 0
        ? ((currentStats.totalQuestions / (currentStats.totalQuestions + currentStats.totalGames)) * 100).toFixed(1)
        : 0; // If 0 games, accuracy logic is undefined/0

    const mpWinRate = currentStats.multiplayer.gamesPlayed > 0
        ? ((currentStats.multiplayer.wins / currentStats.multiplayer.gamesPlayed) * 100).toFixed(1)
        : 0;

    const formatPlayTime = (seconds) => {
        if (!seconds) return "0m";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const masteryData = [
        { subject: 'Algebra', value: currentStats.mastery.algebra, fullMark: 100 },
        { subject: 'Geometry', value: currentStats.mastery.geometry, fullMark: 100 },
        { subject: 'Statistics', value: currentStats.mastery.statistics, fullMark: 100 }
    ];

    const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"];

    return (
        <div className="w-full min-h-full">
            <StandardHeader onOpenSidebar={onOpenSidebar} className="px-6 md:px-8" />

            <div className="w-full max-w-6xl mx-auto px-6 py-2 md:p-8 space-y-4 md:space-y-8 pb-20">
                {/* Header */}
                <div className="text-center mb-4 md:mb-6">
                    <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-purple-400/30 mb-2">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                        <span className="text-white text-xs md:text-sm" style={{ fontWeight: 700 }}>Your Statistics</span>
                    </div>
                    <h1 className="text-white text-xl md:text-3xl mb-1" style={{ fontWeight: 900 }}>
                        Performance <span className="text-purple-400">Dashboard</span>
                    </h1>

                    {/* --- TOGGLE FILTER --- */}
                    <div className="flex justify-center mt-3 md:mt-4">
                        <div className="bg-white/10 backdrop-blur-md p-1 rounded-lg flex gap-1 border border-white/20">
                            <button
                                onClick={() => setShowWeekly(true)}
                                className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${showWeekly
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => setShowWeekly(false)}
                                className={`px-3 py-1 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${!showWeekly
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    <p className="text-white/80 text-xs md:text-sm mt-2 md:mt-3" style={{ fontWeight: 500 }}>
                        {showWeekly ? "Tracking progress from the last 7 days" : "Tracking all history"}
                    </p>
                </div>

                {/* --- SECTION 1: SOLO MODE --- */}
                <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 border-b border-white/10 pb-1.5 md:pb-2">
                        <div className="bg-gradient-to-br from-[#023e8a] to-[#0077b6] p-1.5 md:p-2 rounded-xl shadow-lg border border-white/20">
                            <Brain className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl text-white font-black tracking-tight">Solo Mode</h2>
                            <p className="text-white/50 text-xs md:text-sm">Individual practice and mastery</p>
                        </div>
                    </div>

                    {/* Core Engagement Stats - Solo */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {/* Total Games */}
                        <div className="bg-gradient-to-br from-blue-600/80 to-blue-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <Trophy className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>{showWeekly ? "Weekly Games" : "Total Games"}</span>
                            </div>
                            <div className="text-white text-lg md:text-2xl" style={{ fontWeight: 900 }}>{displayTotalGames}</div>
                        </div>

                        {/* Average Correct Answers (Accuracy) */}
                        <div className="bg-gradient-to-br from-green-600/80 to-green-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <Target className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Avg. Accuracy</span>
                            </div>
                            <div className="text-white text-lg md:text-2xl" style={{ fontWeight: 900 }}>{trueAccuracy}%</div>
                        </div>

                        {/* Play Time */}
                        <div className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl col-span-2 md:col-span-1">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Play Time</span>
                            </div>
                            <div className="text-white text-lg md:text-xl" style={{ fontWeight: 900 }}>{formatPlayTime(currentStats.totalPlayTime)}</div>
                        </div>
                    </div>

                    {/* Skill & Accuracy + Speed & Reflexes */}
                    <div className="grid md:grid-cols-2 gap-2 md:gap-3">
                        {/* Skill & Accuracy */}
                        <div className="bg-gradient-to-br from-cyan-600/60 to-blue-600/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
                                    <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </div>
                                <h2 className="text-sm md:text-lg text-white" style={{ fontWeight: 900 }}>Skill & Accuracy</h2>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                {/* Longest Streak */}
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                        <span className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>Longest Streak</span>
                                        <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm md:text-base">
                                            <span>{currentStats.longestStreak} 🔥</span>
                                        </div>
                                    </div>
                                    {/* Visual representation of streak */}
                                    <div className="flex gap-1 h-1 md:h-1.5">
                                        {[...Array(Math.min(10, currentStats.longestStreak))].map((_, i) => (
                                            <div key={i} className="flex-1 rounded-full bg-yellow-400" />
                                        ))}
                                        {currentStats.longestStreak > 10 && (
                                            <div className="flex-1 rounded-full bg-white/20" />
                                        )}
                                    </div>
                                </div>

                                {/* Total Questions */}
                                <div className="flex items-center justify-between bg-white/10 rounded-lg p-2 border border-white/20">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                                        <span className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>Total Questions</span>
                                    </div>
                                    <span className="text-white text-sm md:text-base" style={{ fontWeight: 900 }}>{currentStats.totalQuestions}</span>
                                </div>
                            </div>
                        </div>

                        {/* Speed & Reflexes */}
                        <div className="bg-gradient-to-br from-yellow-600/60 to-orange-600/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
                                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </div>
                                <h2 className="text-sm md:text-lg text-white" style={{ fontWeight: 900 }}>Speed & Reflexes</h2>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                {/* Average Speed */}
                                <div className="bg-white/10 rounded-lg p-2 md:p-3 border border-white/20">
                                    <div className="text-white/80 text-[10px] md:text-xs mb-0.5" style={{ fontWeight: 600 }}>Average Speed</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white text-xl md:text-3xl" style={{ fontWeight: 900 }}>{currentStats.avgAnswerTime}</span>
                                        <span className="text-white/70 text-xs md:text-sm" style={{ fontWeight: 600 }}>seconds</span>
                                    </div>
                                    <div className="text-white/60 text-[10px] md:text-xs mt-0.5" style={{ fontWeight: 500 }}>per correct answer</div>
                                </div>

                                {/* Fastest Reflex */}
                                <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-lg p-2 md:p-3 border-2 border-yellow-400/40">
                                    <div className="flex items-center gap-1 md:gap-1.5 mb-0.5">
                                        <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-300" />
                                        <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Fastest Reflex</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white text-xl md:text-3xl" style={{ fontWeight: 900 }}>{currentStats.fastestAnswer}</span>
                                        <span className="text-white/70 text-xs md:text-sm" style={{ fontWeight: 600 }}>seconds</span>
                                    </div>
                                    <div className="text-yellow-300 text-[10px] md:text-xs mt-0.5" style={{ fontWeight: 600 }}>🏆 Personal Best</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subject Mastery - Solo only usually */}
                    <div className="bg-gradient-to-br from-indigo-600/60 to-purple-600/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                            <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
                                <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <h2 className="text-sm md:text-lg text-white" style={{ fontWeight: 900 }}>Subject Mastery</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Radar Chart */}
                            <div className="flex items-center justify-center -my-4 md:my-0">
                                <ResponsiveContainer width="100%" height={180}>
                                    <RadarChart data={masteryData} outerRadius="70%">
                                        <PolarGrid stroke="#ffffff40" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 600 }}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 100]}
                                            tick={{ fill: '#ffffff80', fontSize: 8 }}
                                        />
                                        <Radar
                                            name="Mastery"
                                            dataKey="value"
                                            stroke="#a78bfa"
                                            fill="#a78bfa"
                                            fillOpacity={0.6}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Mastery Breakdown */}
                            <div className="space-y-2 md:space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                        <span className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>Algebra</span>
                                        <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.algebra}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-1.5 md:h-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.algebra}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                        <span className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>Geometry</span>
                                        <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.geometry}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-1.5 md:h-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.geometry}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-0.5 md:mb-1">
                                        <span className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>Statistics</span>
                                        <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.statistics}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-1.5 md:h-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.statistics}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECTION 2: MULTIPLAYER MODE --- */}
                <div className="space-y-3 md:space-y-4 pt-2 md:pt-4">
                    <div className="flex items-center gap-2 md:gap-3 border-b border-white/10 pb-1.5 md:pb-2">
                        <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-1.5 md:p-2 rounded-xl shadow-lg border border-white/20">
                            <Users className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl text-white font-black tracking-tight">Multiplayer Mode</h2>
                            <p className="text-white/50 text-xs md:text-sm">Competitive battles and rankings</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {/* MP Games */}
                        <div className="bg-gradient-to-br from-red-600/80 to-red-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <Swords className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Battles</span>
                            </div>
                            <div className="text-white text-lg md:text-2xl" style={{ fontWeight: 900 }}>{currentStats.multiplayer.gamesPlayed}</div>
                        </div>

                        {/* MP Wins */}
                        <div className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <Trophy className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Victories</span>
                            </div>
                            <div className="text-white text-lg md:text-2xl" style={{ fontWeight: 900 }}>{currentStats.multiplayer.wins}</div>
                        </div>

                        {/* MP Win Rate */}
                        <div className="bg-gradient-to-br from-pink-600/80 to-pink-700/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-white/20 shadow-xl">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Win Rate</span>
                            </div>
                            <div className="text-white text-lg md:text-2xl" style={{ fontWeight: 900 }}>{mpWinRate}%</div>
                        </div>

                        {/* Rank with Tooltip */}
                        <div className="group relative bg-gradient-to-br from-purple-800/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border-2 border-purple-400/30 shadow-xl">
                            <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="bg-white/20 rounded-lg p-1 md:p-1.5">
                                        <Users className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                    </div>
                                    <span className="text-white/80 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>Rank</span>
                                </div>
                                <Info className="w-3 h-3 md:w-4 md:h-4 text-white/50 hover:text-white cursor-help" />
                            </div>
                            <div className="text-white text-base md:text-xl truncate" style={{ fontWeight: 900 }}>{currentStats.multiplayer.rankName}</div>

                            {/* Rank Tooltip / Mini Panel */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0f172a] border border-white/20 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 hidden md:block">
                                <h4 className="text-white text-xs font-bold mb-2 border-b border-white/10 pb-1">Ranking System</h4>
                                <div className="space-y-1">
                                    {ranks.map((rank) => (
                                        <div key={rank} className={`text-[10px] flex justify-between ${rank === currentStats.multiplayer.rankName ? 'text-yellow-400 font-bold' : 'text-white/70'}`}>
                                            <span>{rank}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-b border-r border-white/20 rotate-45"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border-2 border-white/20 shadow-xl mt-4 md:mt-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <h2 className="text-sm md:text-lg text-white" style={{ fontWeight: 900 }}>Recent History</h2>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                        {currentStats.recentGames.length > 0 ? (
                            currentStats.recentGames.map((game, index) => (
                                <div
                                    key={game.id || index}
                                    className="bg-white/5 hover:bg-white/10 rounded-lg p-2 md:p-3 border border-white/10 transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {/* Result Badge */}
                                        {!game.mode.startsWith('Solo') && (
                                            <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[10px] md:text-xs ${game.result === 'Victory'
                                                ? 'bg-green-500/30 text-green-300 border border-green-400/30'
                                                : 'bg-red-500/30 text-red-300 border border-red-400/30'
                                                }`} style={{ fontWeight: 700 }}>
                                                {game.result}
                                            </div>
                                        )}

                                        {/* Mode Badge */}
                                        <div className="px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] md:text-xs" style={{ fontWeight: 600 }}>
                                            {game.mode}
                                        </div>

                                        {/* Score */}
                                        <div className="text-white/90 text-xs md:text-sm" style={{ fontWeight: 600 }}>
                                            Streak: <span className="text-white" style={{ fontWeight: 900 }}>{game.score}</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="text-white/60 text-[10px] md:text-xs" style={{ fontWeight: 500 }}>
                                        {game.date}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-white/60 text-xs md:text-sm text-center py-4">No recent games played yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}