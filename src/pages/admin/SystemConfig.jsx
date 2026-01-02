import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Shield, User, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, deleteField, limit, orderBy, startAfter, startAt, endAt } from 'firebase/firestore';

const PAGE_SIZE = 10;

const SystemConfig = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    // Pagination state
    const [lastDoc, setLastDoc] = useState(null);
    const [pageHistory, setPageHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchUsers = async (direction = 'initial', currentSearchTerm = searchTerm) => {
        setLoading(true);
        setMessage(null);
        try {
            const usersRef = collection(db, 'users');
            let q;

            if (currentSearchTerm.trim()) {
                const term = currentSearchTerm.trim();
                q = query(
                    usersRef,
                    orderBy('username'),
                    where('username', '>=', term),
                    where('username', '<=', term + '\uf8ff'),
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

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs;

            const fetchedHasMore = docs.length > PAGE_SIZE;
            const pageDocs = fetchedHasMore ? docs.slice(0, PAGE_SIZE) : docs;

            const results = pageDocs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(results);
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

            if (results.length === 0 && currentSearchTerm) {
                setMessage({ type: 'info', text: 'No users found matching "' + currentSearchTerm + '"' });
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setMessage({ type: 'error', text: 'Failed to load users.' });
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const fetchCurrentUserRole = async () => {
        if (!auth.currentUser) return;
        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setCurrentUserRole(userSnap.data().role);
            }
        } catch (error) {
            console.error("Error fetching current user role:", error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchUsers('initial', '');
        fetchCurrentUserRole();
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

    const revokeAdmin = async (userId, currentUsername) => {
        setActionLoading(userId);
        try {
            const userRef = doc(db, 'users', userId);
            // Remove the role field from the document
            await updateDoc(userRef, {
                role: deleteField()
            });

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: null } : u));
            setMessage({ type: 'success', text: `Admin access for ${currentUsername} has been revoked.` });
        } catch (error) {
            console.error("Error revoking admin access:", error);
            setMessage({ type: 'error', text: 'Failed to revoke admin access.' });
        } finally {
            setActionLoading(null);
        }
    };

    const promoteToAdmin = async (userId, currentUsername) => {
        setActionLoading(userId);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: 'ADMIN'
            });

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'ADMIN' } : u));
            setMessage({ type: 'success', text: `${currentUsername} has been promoted to ADMIN!` });
        } catch (error) {
            console.error("Error promoting user:", error);
            setMessage({ type: 'error', text: 'Failed to promote user.' });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Page Header */}
            <div>
                <h1 className="text-white text-3xl font-black tracking-tight drop-shadow-md flex items-center gap-3">
                    <Shield className="w-8 h-8 text-cyan-300" />
                    System Configuration
                </h1>
                <p className="text-cyan-100/60 font-medium">Manage system roles and administrative access</p>
            </div>

            {/* Admin Access Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-cyan-300" />
                            Add Admin Users
                        </h2>
                        <p className="text-white/60 text-sm">Search for users to grant administrative privileges</p>
                    </div>

                    <div className="relative group w-full md:w-96">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-3 px-5 pl-12 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' :
                                message.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                                    'bg-blue-500/20 border-blue-500/30 text-blue-300'
                                }`}
                        >
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                                    <AlertCircle className="w-5 h-5" />}
                            <span className="font-medium text-sm">{message.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results List */}
                <div className="space-y-3 mb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/40">
                            <Loader2 className="w-10 h-10 animate-spin mb-2" />
                            <p className="font-bold">Syncing user database...</p>
                        </div>
                    ) : users.length > 0 ? (
                        users.map((user) => (
                            <motion.div
                                key={user.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                                        <User className="w-6 h-6 text-cyan-300 transition-transform group-hover:scale-110" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{user.username || 'Anonymous'}</div>
                                        <div className="text-white/40 text-xs flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                                            Role: <span className={user.role === 'ADMIN' ? 'text-cyan-300' : 'text-white/60'}>
                                                {user.role || 'USER'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => promoteToAdmin(user.id, user.username)}
                                        disabled={actionLoading === user.id}
                                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-4 py-2 rounded-xl border border-cyan-400/30 font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === user.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Promoting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-4 h-4" />
                                                <span>Make Admin</span>
                                            </>
                                        )}
                                    </motion.button>
                                ) : user.role === 'ADMIN' ? (
                                    currentUserRole === 'SUPERADMIN' ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => revokeAdmin(user.id, user.username)}
                                            disabled={actionLoading === user.id}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl border border-red-500/30 font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading === user.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Revoking...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>Revoke Admin Access</span>
                                                </>
                                            )}
                                        </motion.button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm bg-cyan-400/10 px-4 py-2 rounded-xl border border-cyan-400/20">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Already Admin</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm bg-cyan-400/10 px-4 py-2 rounded-xl border border-cyan-400/20">
                                        <Shield className="w-4 h-4" />
                                        <span>Super Admin</span>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        !message && (
                            <div className="flex flex-col items-center justify-center py-12 text-white/20 border-2 border-dashed border-white/10 rounded-3xl">
                                <Search className="w-12 h-12 mb-3" />
                                <p className="text-lg font-bold italic">No user records found.</p>
                            </div>
                        )
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="text-white/40 text-sm font-bold">
                        Showing page <span className="text-white font-black">{currentPage}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={loading || currentPage === 1}
                            className="p-2 md:p-2.5 rounded-xl bg-white/10 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2 group"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Prev</span>
                        </button>

                        <div className="h-4 w-[2px] bg-white/10" />

                        <button
                            onClick={handleNext}
                            disabled={loading || !hasMore}
                            className="p-2 md:p-2.5 rounded-xl bg-white/10 border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 transition-all flex items-center gap-2 group"
                        >
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemConfig;
