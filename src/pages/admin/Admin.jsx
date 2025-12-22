import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import AnimatedBackground from '../../components/AnimatedBackground';
import { Menu, X, Layout, Users as UsersIcon, Shield, Settings, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import GameContent from './GameContent';
import EditQuestion from './EditQuestion';
import Users from './Users';

const Admin = ({ username, onLogout }) => {
    // Requirement: The sidebar must be visible by default (open state = true on initial render).
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { setModeDataReady, setBg3DReady } = useLoading();

    useEffect(() => {
        // Signal readiness as soon as the component mounts
        setModeDataReady(true);
        setBg3DReady(true);
    }, [setModeDataReady, setBg3DReady]);

    // Derived view for sidebar highlighting
    const activeView = location.pathname === '/admin' ? 'overview' :
        location.pathname.startsWith('/admin/game-content') ? 'game-content' :
            location.pathname.startsWith('/admin/users') ? 'users' : '';

    // Sidebar items specifically for Admin page if needed, 
    // but the requirement says to use Sidebar.jsx as is.

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            <AnimatedBackground />
            {/* 1. Sidebar Component */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpen={() => setSidebarOpen(true)}
                onLogout={onLogout}
                username={username}
                showBackdrop={false} // Requirement: When the sidebar is open, it should NOT overlay.
                isAdmin={true}
                activeView={activeView}
                onAdminViewChange={(view) => {
                    if (view === 'overview') navigate('/admin');
                    else if (view === 'game-content') navigate('/admin/game-content');
                    else navigate(`/admin/${view}`);
                }}
            />

            {/* 2. Admin Content Area */}
            {/* Requirement: When the sidebar is open, it should NOT overlay the main Admin page area. Instead, it should be a two-column layout. */}
            {/* The Admin content area should appear inset / pushed to the right when sidebar is open. */}
            <main
                className={`relative min-h-screen transition-all duration-[240ms] ease-[0.2,0.8,0.2,1] ${isSidebarOpen ? 'ml-80' : 'ml-0'
                    }`}
            >
                {/* Content based on currentView */}
                <div className="relative z-10 px-6 pt-6 pb-10">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Header Section */}
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-5">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setSidebarOpen(!isSidebarOpen)}
                                                className="bg-white/20 p-2.5 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all shadow-lg text-white"
                                            >
                                                <AnimatePresence mode="wait">
                                                    {isSidebarOpen ? (
                                                        <motion.div key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.1 }}>
                                                            <X className="w-6 h-6" />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="menu" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.1 }}>
                                                            <Menu className="w-6 h-6" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>

                                            <div>
                                                <h1 className="text-white text-4xl font-black tracking-tight drop-shadow-md">Admin Dashboard</h1>
                                                <p className="text-cyan-100/60 font-medium">Control center and system management</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-xl border-2 border-white/30">
                                                <Shield className="w-5 h-5 text-cyan-300" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dashboard Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                        {[
                                            { icon: UsersIcon, label: 'Total Players', value: '1,284', color: 'from-blue-500 to-cyan-400' },
                                            { icon: Activity, label: 'Active Games', value: '42', color: 'from-emerald-500 to-teal-400' },
                                            { icon: Layout, label: 'Game Modes', value: '5', color: 'from-purple-500 to-pink-400' },
                                            { icon: Settings, label: 'System Status', value: 'Online', color: 'from-orange-500 to-yellow-400' },
                                        ].map((stat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all group"
                                            >
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <stat.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                                                <div className="text-white text-3xl font-black">{stat.value}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Main Content Placeholder */}
                                    <div className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 rounded-3xl h-[400px] flex flex-col items-center justify-center text-white/20">
                                        <Layout className="w-16 h-16 mb-4" />
                                        <p className="text-xl font-bold italic">Admin content area ready for modules</p>
                                    </div>
                                </motion.div>
                            } />

                            <Route path="/game-content" element={
                                <motion.div
                                    key="game-content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="mb-6 flex items-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                                            className="bg-white/20 p-2.5 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all shadow-lg text-white"
                                        >
                                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                        </motion.button>
                                        <h2 className="text-white/40 text-sm font-bold uppercase tracking-widest">Admin / Game Content</h2>
                                    </div>
                                    <GameContent />
                                </motion.div>
                            } />

                            <Route path="/game-content/:categoryId" element={
                                <EditQuestionWrapper setSidebarOpen={setSidebarOpen} isSidebarOpen={isSidebarOpen} />
                            } />

                            <Route path="/users" element={
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="mb-6 flex items-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                                            className="bg-white/20 p-2.5 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all shadow-lg text-white"
                                        >
                                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                        </motion.button>
                                        <h2 className="text-white/40 text-sm font-bold uppercase tracking-widest">Admin / User Records</h2>
                                    </div>
                                    <Users />
                                </motion.div>
                            } />

                            <Route path="*" element={
                                <motion.div
                                    key="fallback"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[60vh] flex flex-col items-center justify-center text-white/40"
                                >
                                    <Settings className="w-16 h-16 mb-4 animate-spin-slow" />
                                    <p className="text-xl font-bold italic truncate">Module Not Found</p>
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all"
                                    >
                                        Return to Overview
                                    </button>
                                </motion.div>
                            } />
                        </Routes>
                    </AnimatePresence>
                </div>
            </main>

            {/* Inline Style for Layout Transitions */}
            <style>{`
                body {
                    overflow-x: hidden;
                }
            `}</style>
        </div>
    );
};

const EditQuestionWrapper = ({ setSidebarOpen, isSidebarOpen }) => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    return (
        <motion.div
            key={`edit-${categoryId}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <div className="mb-6 flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="bg-white/20 p-2.5 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all shadow-lg text-white"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.button>
                <h2 className="text-white/40 text-sm font-bold uppercase tracking-widest">
                    Admin / Game Content / {categoryId}
                </h2>
            </div>
            <EditQuestion
                categoryId={categoryId}
                onBack={() => navigate('/admin/game-content')}
            />
        </motion.div>
    );
};

export default Admin;
