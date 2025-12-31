// src/pages/ModeSelect.jsx

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Trophy, Zap, Target, Sparkles, Brain, Calculator, Star, Award, Crown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const Background3D = React.lazy(() => import('../components/Background3D.jsx'));
import StandardHeader from '../components/StandardHeader';
import { useMobile } from '../hooks/useMobile';
import { useLoading } from '../context/LoadingContext';

const ModeSelect = React.memo(function ModeSelect({ username, onOpenSidebar }) {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const { setModeDataReady, setBg3DReady } = useLoading();
    const [hoveredMode, setHoveredMode] = useState(null);
    const [isBackgroundReady, setBackgroundReady] = useState(false);
    const [cardBounds, setCardBounds] = useState({ solo: null, multi: null });

    const soloCardRef = useRef(null);
    const multiCardRef = useRef(null);

    // Simulate data fetching readiness
    useEffect(() => {
        const timer = setTimeout(() => {
            setModeDataReady(true);
        }, 800);
        return () => clearTimeout(timer);
    }, [setModeDataReady]);

    const updateCardBounds = useCallback(() => {
        const bounds = {};
        if (soloCardRef.current) {
            const rect = soloCardRef.current.getBoundingClientRect();
            bounds.solo = {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            };
        }
        if (multiCardRef.current) {
            const rect = multiCardRef.current.getBoundingClientRect();
            bounds.multi = {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            };
        }
        setCardBounds(bounds);
    }, []);

    useEffect(() => {
        // Only track bounds on Desktop where 3D background needs them for magnetic effects
        if (isMobile) return;

        updateCardBounds();
        window.addEventListener('resize', updateCardBounds);
        window.addEventListener('scroll', updateCardBounds);
        return () => {
            window.removeEventListener('resize', updateCardBounds);
            window.removeEventListener('scroll', updateCardBounds);
        };
    }, [updateCardBounds, isBackgroundReady, isMobile]);

    const handleBackgroundLoaded = React.useCallback(() => {
        // Signal global loading context that 3D is ready
        setBg3DReady(true);
        // Local state for UI components in this page
        setTimeout(() => setBackgroundReady(true), 100);
    }, [setBg3DReady]);

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

    useEffect(() => {
        if (isMobile) {
            handleBackgroundLoaded();
        }
    }, [isMobile, handleBackgroundLoaded]);

    return (
        <div className={`w-full relative ${isMobile ? 'min-h-screen' : 'min-h-screen overflow-hidden'} bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]`}>

            {/* 1. 3D Background Layer */}
            {!isMobile && (
                <Suspense fallback={null}>
                    <Background3D
                        onLoaded={handleBackgroundLoaded}
                        interactive={!isMobile && (!hoveredMode || (hoveredMode !== 'ui'))}
                        activeCardId={!isMobile && (hoveredMode === 'solo' || hoveredMode === 'multi') ? hoveredMode : null}
                        cardBounds={isMobile ? null : cardBounds}
                    />
                </Suspense>
            )}

            {/* Local Loading Overlay removed - now handled globally in App.jsx */}

            {/* 2. Main Content Layer - RESTRUCTURED */}
            {isBackgroundReady && (
                <div className={`relative z-10 px-4 flex flex-col ${isMobile ? 'min-h-screen pt-[env(safe-area-inset-top)] pb-8' : 'min-h-screen'}`}>

                    {/* Header */}
                    <div
                        onMouseEnter={() => setHoveredMode('ui')}
                        onMouseLeave={() => setHoveredMode(null)}
                    >
                        <StandardHeader onOpenSidebar={onOpenSidebar} />
                    </div>



                    {/* Centered Content and Footer Wrapper */}
                    <div className="container mx-auto flex-1 flex flex-col">
                        {/* Scrollable Content Area - Centered */}
                        <div className={`flex-1 flex flex-col items-center ${isMobile ? 'justify-start pt-8' : 'justify-center'}`}>
                            {/* Reduced max-width to keep things tighter */}
                            <div className={`w-full max-w-5xl flex flex-col ${isMobile ? 'justify-start' : 'justify-center'}`}>

                                {/* Welcome Section - Reduced margins and text size */}
                                <motion.div
                                    initial={isMobile ? {} : { scale: 0.9, opacity: 0 }}
                                    animate={isMobile ? {} : { scale: 1, opacity: 1 }}
                                    transition={isMobile ? { duration: 0 } : { delay: 0.2 }}
                                    onMouseEnter={() => setHoveredMode('ui')}
                                    onMouseLeave={() => setHoveredMode(null)}
                                    className="text-center mb-6 w-[85%] md:w-full mx-auto"
                                >
                                    <div className="inline-flex items-center gap-2 bg-white/10 md:bg-gradient-to-r md:from-white/20 md:to-white/10 md:backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-3 md:shadow-lg">
                                        <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                        <span className="text-white text-sm md:text-base font-bold">Welcome back, {username || "Player"}!</span>
                                    </div>

                                    <h2 className="text-white text-3xl md:text-5xl mb-2 leading-tight font-black drop-shadow-lg">
                                        Ready to Challenge Your <span className="text-yellow-300">Math Skills?</span>
                                    </h2>
                                    <p className="text-white/80 text-sm md:text-lg font-medium">Choose your battle mode and prove you're a math champion!</p>
                                </motion.div>

                                {/* Game Mode Cards - Reduced padding and gap - Width constrained on mobile */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8 w-[85%] md:w-full mx-auto">

                                    {/* Solo Mode */}
                                    <motion.div
                                        initial={isMobile ? {} : { x: -50, opacity: 0 }}
                                        animate={isMobile ? {} : { x: 0, opacity: 1 }}
                                        transition={isMobile ? { duration: 0 } : { delay: 0.4 }}
                                        onMouseEnter={() => !isMobile && setHoveredMode('solo')}
                                        onMouseLeave={() => !isMobile && setHoveredMode(null)}
                                        className="relative group h-full"
                                    >
                                        <motion.button
                                            ref={soloCardRef}
                                            onClick={() => navigate('/category-select')}
                                            whileHover={isMobile ? {} : { scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            // Reduced padding from p-10 to p-6
                                            className="w-full h-full relative overflow-hidden rounded-3xl p-5 md:p-6 bg-[#023e8a]/80 md:bg-gradient-to-br md:from-[#023e8a]/80 md:to-[#0077b6]/80 border-2 border-white/30 md:shadow-2xl text-left md:backdrop-blur-sm"
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full md:group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-white/20 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                                        <Brain className="w-6 h-6 md:w-9 md:h-9 text-white" />
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${hoveredMode === 'solo' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-white/20'}`} />
                                                </div>

                                                <div>
                                                    <h3 className="text-white text-2xl md:text-3xl font-black mb-2">Solo Mode</h3>
                                                    <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed">
                                                        Challenge yourself and improve your skills at your own pace.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </motion.div>

                                    {/* Multiplayer Mode */}
                                    <motion.div
                                        initial={isMobile ? {} : { x: 50, opacity: 0 }}
                                        animate={isMobile ? {} : { x: 0, opacity: 1 }}
                                        transition={isMobile ? { duration: 0 } : { delay: 0.4 }}
                                        onMouseEnter={() => !isMobile && setHoveredMode('multi')}
                                        onMouseLeave={() => !isMobile && setHoveredMode(null)}
                                        className="relative group h-full"
                                    >
                                        <motion.button
                                            ref={multiCardRef}
                                            onClick={() => navigate('/lobby')}
                                            whileHover={isMobile ? {} : { scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            // Reduced padding from p-10 to p-6
                                            className="w-full h-full relative overflow-hidden rounded-3xl p-5 md:p-6 bg-green-600/80 md:bg-gradient-to-br md:from-green-600/80 md:to-emerald-600/80 border-2 border-white/30 md:shadow-2xl text-left md:backdrop-blur-sm"
                                        >
                                            {/* SHINE EFFECT */}
                                            <div className="absolute inset-0 -translate-x-full md:group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-white/20 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                                        <Users className="w-6 h-6 md:w-9 md:h-9 text-white" />
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${hoveredMode === 'multi' ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]' : 'bg-white/20'}`} />
                                                </div>

                                                <div>
                                                    <h3 className="text-white text-2xl md:text-3xl font-black mb-2">Multiplayer Mode</h3>
                                                    <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed">
                                                        Compete with friends in real-time and climb the leaderboard.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                </div>

                                {/* Stats and Achievements Grid - Reduced padding and gap - Width constrained on mobile */}
                                <div className="grid md:grid-cols-2 gap-5 w-[85%] md:w-full mx-auto">
                                    {/* Stats Section */}
                                    <motion.div
                                        initial={isMobile ? {} : { y: 30, opacity: 0 }}
                                        animate={isMobile ? {} : { y: 0, opacity: 1 }}
                                        transition={isMobile ? { duration: 0 } : { delay: 0.6 }}
                                        onMouseEnter={() => setHoveredMode('ui')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="bg-white/10 md:backdrop-blur-md rounded-2xl p-5 border border-white/10"
                                    >
                                        <h3 className="text-white/90 text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <Trophy className="w-4 h-4 text-yellow-300" /> Your Stats
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {stats.map((stat, index) => (
                                                <div key={index} className="text-center p-2 rounded-lg bg-black/20 border border-white/5 active:bg-white/10 md:hover:bg-white/10 transition-colors">
                                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-1 md:shadow-lg`}>
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
                                        initial={isMobile ? {} : { y: 30, opacity: 0 }}
                                        animate={isMobile ? {} : { y: 0, opacity: 1 }}
                                        transition={isMobile ? { duration: 0 } : { delay: 0.7 }}
                                        onMouseEnter={() => setHoveredMode('ui')}
                                        onMouseLeave={() => setHoveredMode(null)}
                                        className="bg-white/10 md:backdrop-blur-md rounded-2xl p-5 border border-white/10"
                                    >
                                        <h3 className="text-white/90 text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                                            <Award className="w-4 h-4 text-yellow-300" /> Recent Achievements
                                        </h3>
                                        <div className="space-y-2">
                                            {achievements.map((achievement, index) => (
                                                <div key={index} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${achievement.earned
                                                    ? 'bg-white/20 border-white/30 active:bg-white/30 md:hover:bg-white/30'
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