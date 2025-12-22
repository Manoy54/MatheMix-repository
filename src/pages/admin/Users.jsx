import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users as UsersIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    Calendar,
    Mail,
    Trophy,
    Target,
    Zap,
    Gamepad2,
    CheckCircle,
    Brain
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    startAfter,
    startAt,
    endAt,
    doc,
    getDoc
} from 'firebase/firestore';

const PAGE_SIZE = 10;

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [firstDoc, setFirstDoc] = useState(null);
    const [lastDoc, setLastDoc] = useState(null);
    const [pageHistory, setPageHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const fetchUsers = useCallback(async (direction = 'initial', currentSearchTerm = searchTerm) => {
        setLoading(true);
        setError(null);

        try {
            const usersRef = collection(db, 'users');
            let q;

            if (currentSearchTerm.trim()) {
                // Prefix search logic for Firestore
                const term = currentSearchTerm.trim().toLowerCase();
                // Note: This assumes usernames/emails are stored or indexed in a way that supports range queries.
                // For simplicity, we search by username prefix.
                q = query(
                    usersRef,
                    orderBy('username'),
                    startAt(term),
                    endAt(term + '\uf8ff'),
                    limit(PAGE_SIZE + 1)
                );
            } else {
                if (direction === 'next' && lastDoc) {
                    q = query(usersRef, orderBy('username'), startAfter(lastDoc), limit(PAGE_SIZE + 1));
                } else if (direction === 'prev' && pageHistory.length > 0) {
                    const prevCursor = pageHistory[pageHistory.length - 2] || null;
                    if (prevCursor) {
                        q = query(usersRef, orderBy('username'), startAfter(prevCursor), limit(PAGE_SIZE + 1));
                    } else {
                        q = query(usersRef, orderBy('username'), limit(PAGE_SIZE + 1));
                    }
                } else {
                    q = query(usersRef, orderBy('username'), limit(PAGE_SIZE + 1));
                }
            }

            const snapshot = await getDocs(q);
            const userDocs = snapshot.docs;

            const fetchedHasMore = userDocs.length > PAGE_SIZE;
            const pageDocs = fetchedHasMore ? userDocs.slice(0, PAGE_SIZE) : userDocs;

            const usersWithStats = await Promise.all(pageDocs.map(async (userDoc) => {
                const userData = userDoc.data();
                const userId = userDoc.id;

                let statsData = null;
                try {
                    const statsRef = doc(db, 'userStats', userId);
                    const statsSnap = await getDoc(statsRef);
                    if (statsSnap.exists()) {
                        statsData = statsSnap.data();
                    } else if (userData.email) {
                        const emailStatsRef = doc(db, 'userStats', userData.email);
                        const emailStatsSnap = await getDoc(emailStatsRef);
                        if (emailStatsSnap.exists()) {
                            statsData = emailStatsSnap.data();
                        }
                    }
                } catch (err) {
                    console.warn(`Could not fetch stats for user ${userId}:`, err);
                }

                return {
                    id: userId,
                    ...userData,
                    stats: statsData
                };
            }));

            setUsers(usersWithStats);
            setFirstDoc(pageDocs[0]);
            setLastDoc(pageDocs[pageDocs.length - 1]);
            setHasMore(fetchedHasMore);

            if (direction === 'next') {
                setPageHistory(prev => [...prev, lastDoc]);
                setCurrentPage(prev => prev + 1);
            } else if (direction === 'prev') {
                setPageHistory(prev => prev.slice(0, -1));
                setCurrentPage(prev => prev - 1);
            } else {
                setPageHistory([]);
                setCurrentPage(1);
            }

        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load user records. Search might require an index if this is the first time.");
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [lastDoc, pageHistory, searchTerm]);

    // Initial load
    useEffect(() => {
        fetchUsers();
    }, []);

    // Debounced search effect
    useEffect(() => {
        if (searchTerm === '') {
            fetchUsers('initial', '');
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            fetchUsers('initial', searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleNext = () => {
        if (!loading && hasMore) {
            fetchUsers('next');
        }
    };

    const handlePrev = () => {
        if (!loading && currentPage > 1) {
            fetchUsers('prev');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Search Bar Row */}
            <div className="flex items-center justify-between gap-10">
                {/* Title & Subtitle */}
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">User Records</h1>
                    <p className="text-cyan-100/60 font-medium whitespace-nowrap">View user profiles and stats.</p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5 text-white/40" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search username..."
                        className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-md transition-all font-medium shadow-lg"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-200">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-cyan-200">User Profile</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-cyan-200">Birthday</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-cyan-200 text-center">Streaks</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-cyan-200 text-center">Accuracy</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-cyan-200 text-center">Engagement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {loading ? (
                                    <tr key="loading">
                                        <td colSpan="5" className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                                <p className="text-white/40 font-bold italic tracking-wider">Syncing user database...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr key="empty">
                                        <td colSpan="5" className="p-20 text-center">
                                            <p className="text-white/20 font-bold text-xl">No user records found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            {/* Profile Column */}
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
                                                        {(user.username || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-black text-lg">{user.username || 'Anonymous'}</div>
                                                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email || 'No email provided'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Birthday Column */}
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-white/70">
                                                    <Calendar className="w-4 h-4 text-purple-400" />
                                                    <span className="font-medium text-sm">{user.birthday || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Streaks Column */}
                                            <td className="p-5">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                                        <Trophy className="w-3.5 h-3.5 text-orange-400" />
                                                        <span className="text-xs font-black text-white">{user.longestStreak || 0}</span>
                                                        <span className="text-[10px] text-white/40 uppercase font-black tracking-tighter">Profile</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                                        <span className="text-xs font-black text-white">{user.stats?.longestStreak || '—'}</span>
                                                        <span className="text-[10px] text-white/40 uppercase font-black tracking-tighter">Live</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Accuracy Column */}
                                            <td className="p-5 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <div className="relative">
                                                        <Target className="w-6 h-6 text-emerald-400/20" />
                                                        <CheckCircle className="w-3 h-3 text-emerald-400 absolute bottom-0 right-0" />
                                                    </div>
                                                    <span className="text-xl font-black text-white">{user.stats?.accuracy ? `${user.stats.accuracy}%` : '—'}</span>
                                                </div>
                                            </td>

                                            {/* Engagement Column */}
                                            <td className="p-5">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white">{user.stats?.totalGames || '0'}</span>
                                                            <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">Games</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white">{user.stats?.totalWins || '0'}</span>
                                                            <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">Wins</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Brain className="w-3.5 h-3.5 text-cyan-400" />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white">{user.stats?.totalQuestions || '0'}</span>
                                                            <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">Qs</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-white/5 p-4 border-t border-white/10 flex items-center justify-between">
                    <div className="text-white/40 text-sm font-bold">
                        Showing page <span className="text-white font-black">{currentPage}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={loading || currentPage === 1}
                            className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2 group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Prev</span>
                        </button>

                        <div className="h-4 w-[2px] bg-white/10" />

                        <button
                            onClick={handleNext}
                            disabled={loading || !hasMore}
                            className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2 group"
                        >
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Next</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Users;
