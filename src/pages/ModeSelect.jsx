// src/pages/ModeSelect.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Trophy, Zap, Target, Sparkles, Brain, Calculator, Star, Award, Crown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Background3D from '../components/Background3D.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

const ModeSelect = React.memo(function ModeSelect({ username, onOpenSidebar }) {
    const navigate = useNavigate();
    const [hoveredMode, setHoveredMode] = useState(null);
    const [isBackgroundReady, setBackgroundReady] = useState(false);

    const handleBackgroundLoaded = React.useCallback(() => {
        // Add a small delay to ensure canvas is painted
        setTimeout(() => setBackgroundReady(true), 100);
    }, []);

    const stats = [
        { icon: Trophy, label: 'Games Won', value: '12', color: 'from-yellow-400 to-orange-500' },
        { icon: Target, label: 'Accuracy', value: '94%', color: 'from-green-400 to-emerald-500' },
        { icon: Zap, label: 'Streak', value: '5 Days', color: 'from-purple-400 to-pink-500' },
    ];

    const achievements = [
        { icon: Star, label: 'Quick Thinker', earned: true },
        { icon: Award, label: 'Perfect Score', earned: true },
        { icon: Crown, label: 'Champion', earned: false },
    ];

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">

            {/* 1. 3D Background Layer */}
            <Background3D onLoaded={handleBackgroundLoaded} interactive={!hoveredMode} />

            {/* Loading Overlay */}
            <AnimatePresence>
                {!isBackgroundReady && <LoadingScreen key="loading-screen" />}
            </AnimatePresence>

            {/* 2. Main Content Layer - RESTRUCTURED */}
            {isBackgroundReady && (
                <div className="relative z-10 px-4 h-screen flex flex-col">

                    {/* Header - Now full-width with padding */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onMouseEnter={() => setHoveredMode('ui')}
                        onMouseLeave={() => setHoveredMode(null)}
                        className="flex items-center justify-between pt-4 pb-2 shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            {/* Hamburger Menu Button */}
                            {onOpenSidebar && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onOpenSidebar}
                                    className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
                                >
                                    <Menu className="w-6 h-6" />
                                </motion.button>
                            )}
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-md opacity-50" />
                                <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border border-white/30 backdrop-blur-sm">
                                    <Calculator className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                            <div>
                                <h1 className="text-white flex items-center gap-2 font-black text-3xl drop-shadow-md">
                                    Mathemix
                                    <motion.div
                                        animate={{ rotate: [0, 15, -15, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-5 h-5 text-yellow-300" />
                                    </motion.div>
                                </h1>
                            </div>
                        </div>

                    </motion.div>

                    {/* Centered Content and Footer Wrapper */}
                    <div className="container mx-auto flex-1 flex flex-col">
                        {/* Scrollable Content Area - Centered */}
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            {/* Reduced max-width to keep things tighter */}
                            <div className="w-full max-w-5xl flex flex-col justify-center">

                                {/* Welcome Section - Reduced margins and text size */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    onMouseEnter={() => setHoveredMode('ui')}
                                    onMouseLeave={() => setHoveredMode(null)}
                                    className="text-center mb-6"
                                >
                                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-3 shadow-lg">
                                        <User className="w-4 h-4 text-white" />
                                        <span className="text-white text-base font-bold">Welcome back, {username || "Player"}!</span>
                                    </div>

                                    <h2 className="text-white text-4xl md:text-5xl mb-2 leading-tight font-black drop-shadow-lg">
                                        Ready to Challenge Your <span className="text-yellow-300">Math Skills?</span>
                                    </h2>
                                    <p className="text-white/80 text-lg font-medium">Choose your battle mode and prove you're a math champion!</p>
                                </motion.div>

                                {/* Game Mode Cards - Reduced padding and gap */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">

                                    {/* Solo Mode */}
                                    <motion.div
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        onMouseEnter={() => setHoveredMode('solo')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="relative group h-full"
                                    >
                                        <motion.button
                                            onClick={() => navigate('/category-select')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            // Reduced padding from p-10 to p-6
                                            className="w-full h-full relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#023e8a]/80 to-[#0077b6]/80 border-2 border-white/30 shadow-2xl text-left backdrop-blur-sm"
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                                        <Brain className="w-9 h-9 text-white" />
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${hoveredMode === 'solo' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-white/20'}`} />
                                                </div>

                                                <div>
                                                    <h3 className="text-white text-3xl font-black mb-2">Solo Mode</h3>
                                                    <p className="text-white/80 text-base font-medium leading-relaxed">
                                                        Challenge yourself and improve your skills at your own pace.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </motion.div>

                                    {/* Multiplayer Mode */}
                                    <motion.div
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        onMouseEnter={() => setHoveredMode('multi')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="relative group h-full"
                                    >
                                        <motion.button
                                            onClick={() => navigate('/lobby')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            // Reduced padding from p-10 to p-6
                                            className="w-full h-full relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-green-600/80 to-emerald-600/80 border-2 border-white/30 shadow-2xl text-left backdrop-blur-sm"
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                                        <Users className="w-9 h-9 text-white" />
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${hoveredMode === 'multi' ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]' : 'bg-white/20'}`} />
                                                </div>

                                                <div>
                                                    <h3 className="text-white text-3xl font-black mb-2">Multiplayer Mode</h3>
                                                    <p className="text-white/80 text-base font-medium leading-relaxed">
                                                        Compete with friends in real-time and climb the leaderboard.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                </div>

                                {/* Stats and Achievements Grid - Reduced padding and gap */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    {/* Stats Section */}
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        onMouseEnter={() => setHoveredMode('ui')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10"
                                    >
                                        <h3 className="text-white/90 text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <Trophy className="w-4 h-4 text-yellow-300" /> Your Stats
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {stats.map((stat, index) => (
                                                <div key={index} className="text-center p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-1 shadow-lg`}>
                                                        <stat.icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="text-white text-xl font-black">{stat.value}</div>
                                                    <div className="text-white/60 text-[10px] font-bold uppercase">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Achievements Section */}
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                        onMouseEnter={() => setHoveredMode('ui')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10"
                                    >
                                        <h3 className="text-white/90 text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <Award className="w-4 h-4 text-yellow-300" /> Recent Achievements
                                        </h3>
                                        <div className="space-y-2">
                                            {achievements.map((achievement, index) => (
                                                <div key={index} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${achievement.earned
                                                    ? 'bg-white/20 border-white/30 hover:bg-white/30'
                                                    : 'bg-white/5 border-white/10 opacity-60'
                                                    }`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${achievement.earned
                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                        : 'bg-white/10'
                                                        }`}>
                                                        <achievement.icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-white text-sm font-bold flex-1">{achievement.label}</span>
                                                    {achievement.earned && (
                                                        <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                                            Earned
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                            </div>
                        </div>

                        {/* Footer - Reduced padding */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            onMouseEnter={() => setHoveredMode('ui')}
                            onMouseLeave={() => setHoveredMode(null)}
                            className="text-center text-white/40 text-xs font-semibold py-3"
                        >
                            <p>Choose wisely and may the best mathematician win! 🎯</p>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* --- CSS FOR SHINE ANIMATION --- */}
            <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
      `}</style>
        </div>
    );
});

export default ModeSelect;