import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path matches your project structure
import { Trophy, Target, Zap, Brain, TrendingUp, Clock, Award, Flame, Users, Gamepad2, Swords, Info } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function Stats({ user }) {
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
    const winRate = currentStats.totalGames > 0
        ? ((currentStats.totalWins / currentStats.totalGames) * 100).toFixed(1)
        : 0;

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
        <div className="w-full max-w-6xl mx-auto p-4 space-y-8 pb-20">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-purple-400/30 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white text-sm" style={{ fontWeight: 700 }}>Your Statistics</span>
                </div>
                <h1 className="text-white text-3xl mb-1" style={{ fontWeight: 900 }}>
                    Performance <span className="text-purple-400">Dashboard</span>
                </h1>
                <p className="text-white/80 text-sm" style={{ fontWeight: 500 }}>Track your progress across all game modes</p>
            </div>

            {/* --- SECTION 1: SOLO MODE --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                    <div className="bg-gradient-to-br from-[#023e8a] to-[#0077b6] p-2 rounded-xl shadow-lg border border-white/20">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl text-white font-black tracking-tight">Solo Mode</h2>
                        <p className="text-white/50 text-sm">Individual practice and mastery</p>
                    </div>
                </div>

                {/* Core Engagement Stats - Solo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* Total Games */}
                    <div className="bg-gradient-to-br from-blue-600/80 to-blue-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Total Games</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{currentStats.totalGames}</div>
                    </div>

                    {/* Total Wins */}
                    <div className="bg-gradient-to-br from-green-600/80 to-green-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <Award className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Total Wins</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{currentStats.totalWins}</div>
                    </div>

                    {/* Win Rate */}
                    <div className="bg-gradient-to-br from-purple-600/80 to-purple-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Win Rate</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{winRate}%</div>
                    </div>

                    {/* Play Time */}
                    <div className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Play Time</span>
                        </div>
                        <div className="text-white text-xl" style={{ fontWeight: 900 }}>{formatPlayTime(currentStats.totalPlayTime)}</div>
                    </div>
                </div>

                {/* Skill & Accuracy + Speed & Reflexes */}
                <div className="grid md:grid-cols-2 gap-3">
                    {/* Skill & Accuracy */}
                    <div className="bg-gradient-to-br from-cyan-600/60 to-blue-600/60 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-white/20 rounded-lg p-2">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-white" style={{ fontWeight: 900 }}>Skill & Accuracy</h2>
                        </div>

                        <div className="space-y-3">
                            {/* Global Accuracy */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Global Accuracy</span>
                                    <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.accuracy}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full transition-all"
                                        style={{ width: `${currentStats.accuracy}%` }}
                                    />
                                </div>
                            </div>

                            {/* Longest Streak */}
                            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2 border border-white/20">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Longest Streak</span>
                                </div>
                                <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.longestStreak}</span>
                            </div>

                            {/* Total Questions */}
                            <div className="flex items-center justify-between bg-white/10 rounded-lg p-2 border border-white/20">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-400" />
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Total Questions</span>
                                </div>
                                <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.totalQuestions}</span>
                            </div>
                        </div>
                    </div>

                    {/* Speed & Reflexes */}
                    <div className="bg-gradient-to-br from-yellow-600/60 to-orange-600/60 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-white/20 rounded-lg p-2">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-white" style={{ fontWeight: 900 }}>Speed & Reflexes</h2>
                        </div>

                        <div className="space-y-3">
                            {/* Average Speed */}
                            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                                <div className="text-white/80 text-xs mb-1" style={{ fontWeight: 600 }}>Average Speed</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white text-3xl" style={{ fontWeight: 900 }}>{currentStats.avgAnswerTime}</span>
                                    <span className="text-white/70 text-sm" style={{ fontWeight: 600 }}>seconds</span>
                                </div>
                                <div className="text-white/60 text-xs mt-1" style={{ fontWeight: 500 }}>per correct answer</div>
                            </div>

                            {/* Fastest Reflex */}
                            <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-lg p-3 border-2 border-yellow-400/40">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                    <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Fastest Reflex</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white text-3xl" style={{ fontWeight: 900 }}>{currentStats.fastestAnswer}</span>
                                    <span className="text-white/70 text-sm" style={{ fontWeight: 600 }}>seconds</span>
                                </div>
                                <div className="text-yellow-300 text-xs mt-1" style={{ fontWeight: 600 }}>🏆 Personal Best</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Mastery - Solo only usually */}
                <div className="bg-gradient-to-br from-indigo-600/60 to-purple-600/60 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-white/20 rounded-lg p-2">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-white" style={{ fontWeight: 900 }}>Subject Mastery</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Radar Chart */}
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={masteryData}>
                                    <PolarGrid stroke="#ffffff40" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={90}
                                        domain={[0, 100]}
                                        tick={{ fill: '#ffffff80', fontSize: 10 }}
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
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Algebra</span>
                                    <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.algebra}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.algebra}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Geometry</span>
                                    <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.geometry}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.geometry}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-white/90 text-sm" style={{ fontWeight: 600 }}>Statistics</span>
                                    <span className="text-white text-sm" style={{ fontWeight: 900 }}>{currentStats.mastery.statistics}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${currentStats.mastery.statistics}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: MULTIPLAYER MODE --- */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-xl shadow-lg border border-white/20">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl text-white font-black tracking-tight">Multiplayer Mode</h2>
                        <p className="text-white/50 text-sm">Competitive battles and rankings</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* MP Games */}
                    <div className="bg-gradient-to-br from-red-600/80 to-red-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <Swords className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Battles</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{currentStats.multiplayer.gamesPlayed}</div>
                    </div>

                    {/* MP Wins */}
                    <div className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Victories</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{currentStats.multiplayer.wins}</div>
                    </div>

                    {/* MP Win Rate */}
                    <div className="bg-gradient-to-br from-pink-600/80 to-pink-700/80 backdrop-blur-sm rounded-xl p-3 border-2 border-white/20 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-white/20 rounded-lg p-1.5">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Win Rate</span>
                        </div>
                        <div className="text-white text-2xl" style={{ fontWeight: 900 }}>{mpWinRate}%</div>
                    </div>

                    {/* Rank with Tooltip */}
                    <div className="group relative bg-gradient-to-br from-purple-800/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-400/30 shadow-xl">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 rounded-lg p-1.5">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white/80 text-xs" style={{ fontWeight: 600 }}>Current Rank</span>
                            </div>
                            <Info className="w-4 h-4 text-white/50 hover:text-white cursor-help" />
                        </div>
                        <div className="text-white text-xl" style={{ fontWeight: 900 }}>{currentStats.multiplayer.rankName}</div>

                        {/* Rank Tooltip / Mini Panel */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0f172a] border border-white/20 rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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
            <div className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 shadow-xl mt-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-white/20 rounded-lg p-2">
                        <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-white" style={{ fontWeight: 900 }}>Recent History</h2>
                </div>

                <div className="space-y-2">
                    {currentStats.recentGames.length > 0 ? (
                        currentStats.recentGames.map((game, index) => (
                            <div
                                key={game.id || index}
                                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Result Badge */}
                                    <div className={`px-2 py-1 rounded-lg text-xs ${game.result === 'Victory'
                                        ? 'bg-green-500/30 text-green-300 border border-green-400/30'
                                        : 'bg-red-500/30 text-red-300 border border-red-400/30'
                                        }`} style={{ fontWeight: 700 }}>
                                        {game.result}
                                    </div>

                                    {/* Mode Badge */}
                                    <div className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs" style={{ fontWeight: 600 }}>
                                        {game.mode}
                                    </div>

                                    {/* Score */}
                                    <div className="text-white/90 text-sm" style={{ fontWeight: 600 }}>
                                        Streak: <span className="text-white" style={{ fontWeight: 900 }}>{game.score}</span>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="text-white/60 text-xs" style={{ fontWeight: 500 }}>
                                    {game.date}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-white/60 text-sm text-center py-4">No recent games played yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}