// src/pages/CategorySelect.jsx

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
const Background3D = React.lazy(() => import('../components/Background3D.jsx'));
import StandardHeader from '../components/StandardHeader';
import { useMobile } from '../hooks/useMobile.jsx';
import { useLoading } from '../context/LoadingContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
    Calculator, Sparkles, Ruler, PieChart, Flame, Info, Menu,
    // Math Symbols
    Plus, Minus, X, Divide,
    // Geometry Symbols
    Triangle, Square, Circle, Compass,
    // Data Symbols
    BarChart, LineChart, TrendingUp, Percent
} from 'lucide-react';

export default function CategorySelect({ username, onOpenSidebar }) {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const { setModeDataReady, setBg3DReady } = useLoading();
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [isBackgroundReady, setBackgroundReady] = useState(false);
    const [cardBounds, setCardBounds] = useState({});
    const [bestStreak, setBestStreak] = useState(0);

    // Simulate data fetching readiness
    useEffect(() => {
        const timer = setTimeout(() => {
            setModeDataReady(true);
        }, 600);
        return () => clearTimeout(timer);
    }, [setModeDataReady]);

    // Fetch User Stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!auth.currentUser) return;
            try {
                const docRef = doc(db, 'userStats', auth.currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setBestStreak(docSnap.data().longestStreak || 0);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    const handleBackgroundLoaded = React.useCallback(() => {
        setBg3DReady(true);
        setTimeout(() => setBackgroundReady(true), 100);
    }, [setBg3DReady]);

    // Create refs for each category card
    const cardRefs = useRef({});

    const updateCardBounds = useCallback(() => {
        const bounds = {};
        Object.entries(cardRefs.current).forEach(([id, ref]) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                bounds[id] = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }
        });
        setCardBounds(bounds);
    }, []);

    useEffect(() => {
        updateCardBounds();
        window.addEventListener('resize', updateCardBounds);
        window.addEventListener('scroll', updateCardBounds);
        return () => {
            window.removeEventListener('resize', updateCardBounds);
            window.removeEventListener('scroll', updateCardBounds);
        };
    }, [updateCardBounds]);

    const categories = [
        {
            id: 'Number & Algebra',
            name: 'Number and Algebra',
            description: 'Master arithmetic operations, equations, and algebraic thinking.',
            icon: Calculator,
            color: 'from-purple-600/80 to-violet-600/80',
            iconBg: 'from-purple-500/30 to-violet-500/30',
            glowColor: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
            // Existing symbols
            symbols: [Plus, Minus, X, Divide],
        },
        {
            id: 'Measurement & Geometry',
            name: 'Measurement and Geometry',
            description: 'Explore shapes, sizes, patterns, and spatial relationships.',
            icon: Ruler,
            color: 'from-blue-600/80 to-cyan-600/80',
            iconBg: 'from-blue-500/30 to-cyan-500/30',
            glowColor: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]',
            // NEW: Geometry symbols added here
            symbols: [Triangle, Square, Circle, Compass],
        },
        {
            id: 'Data & probability',
            name: 'Data and Probability',
            description: 'Analyze data, understand statistics, and predict outcomes.',
            icon: PieChart,
            color: 'from-emerald-600/80 to-green-600/80',
            iconBg: 'from-emerald-500/30 to-green-500/30',
            glowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
            // NEW: Data symbols added here
            symbols: [BarChart, LineChart, TrendingUp, Percent],
        },
    ];

    const handleSelect = (categoryId) => {
        navigate('/game', { state: { category: categoryId } });
    };

    useEffect(() => {
        if (isMobile) {
            handleBackgroundLoaded();
        }
    }, [isMobile, handleBackgroundLoaded]);

    return (
        <div className={`w-full relative font-nunito ${isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'} bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]`}>

            {/* 3D Background Layer */}
            {!isMobile && (
                <Suspense fallback={null}>
                    <Background3D
                        onLoaded={handleBackgroundLoaded}
                        interactive={!isMobile && (!hoveredCategory || (hoveredCategory !== 'ui'))}
                        activeCardId={!isMobile ? hoveredCategory : null}
                        cardBounds={isMobile ? null : cardBounds}
                    />
                </Suspense>
            )}

            {/* Main Content Layer */}
            {(isBackgroundReady || isMobile) && (
                <div className={`relative z-10 px-4 flex flex-col pointer-events-none ${isMobile ? 'min-h-screen pt-[env(safe-area-inset-top)] pb-8' : 'h-screen'}`}>

                    {/* Header */}
                    <motion.div
                        initial={isMobile ? {} : { y: -20, opacity: 0 }}
                        animate={isMobile ? {} : { y: 0, opacity: 1 }}
                        onMouseEnter={() => !isMobile && setHoveredCategory('ui')}
                        onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                        className="pointer-events-auto"
                    >
                        <StandardHeader onOpenSidebar={onOpenSidebar} />
                    </motion.div>

                    {/* Centered Content - Adjusted to push content up */}
                    <div className={`flex-1 flex flex-col items-center ${isMobile ? 'justify-start pt-8' : 'justify-center'} min-h-0`}>
                        <div className={`w-[85%] md:w-full max-w-5xl mx-auto flex flex-col ${isMobile ? 'justify-start' : 'justify-center'}`}>

                            {/* Welcome Section */}
                            <motion.div
                                initial={isMobile ? {} : { scale: 0.9, opacity: 0 }}
                                animate={isMobile ? {} : { scale: 1, opacity: 1 }}
                                transition={isMobile ? { duration: 0 } : { delay: 0.2 }}
                                className="text-center mb-5"
                            >
                                <div className="inline-flex items-center gap-2 bg-white/10 md:bg-gradient-to-r md:from-white/20 md:to-white/10 md:backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-3 md:shadow-lg">
                                    <Flame className="w-4 h-4 text-orange-300" />
                                    <span className="text-white text-sm font-bold">Solo Mode</span>
                                </div>

                                <h2 className="text-white text-3xl md:text-5xl mb-2 leading-tight font-black drop-shadow-lg">
                                    Choose Your <span className="text-yellow-300">Category</span>
                                </h2>
                                <p className="text-white/80 text-sm md:text-lg font-medium">Build your streak by answering questions continuously!</p>
                            </motion.div>

                            {/* Info Card - Slightly larger */}
                            <motion.div
                                initial={isMobile ? {} : { y: -20, opacity: 0 }}
                                animate={isMobile ? {} : { y: 0, opacity: 1 }}
                                transition={isMobile ? { duration: 0 } : { delay: 0.3 }}
                                onMouseEnter={() => !isMobile && setHoveredCategory('ui')}
                                onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                                className="bg-white/10 md:bg-gradient-to-r md:from-yellow-500/20 md:to-orange-500/20 md:backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/10 md:border-yellow-400/30 mb-4 md:mb-6 md:shadow-lg pointer-events-auto"
                            >
                                <div className="flex items-start gap-2 md:gap-3">
                                    <div className="bg-yellow-400/30 rounded-lg p-1.5 md:p-2 mt-0.5">
                                        <Info className="w-3 h-3 md:w-5 md:h-5 text-yellow-200" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-xs md:text-base mb-0 md:mb-1">How Solo Mode Works</h3>
                                        <p className="text-white/90 text-xs md:text-sm leading-tight md:leading-relaxed">
                                            Answer questions continuously to build your streak! There's no question limit—keep going until you stop or can't answer anymore. Challenge yourself to beat your highest streak!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Category Cards - Medium Size */}
                            <div className="grid md:grid-cols-3 gap-4 pointer-events-auto">
                                {categories.map((category, index) => (
                                    <motion.div
                                        key={category.id}
                                        initial={isMobile ? {} : { y: 50, opacity: 0 }}
                                        animate={isMobile ? {} : { y: 0, opacity: 1 }}
                                        transition={isMobile ? { duration: 0 } : { delay: 0.4 + index * 0.1 }}
                                        onMouseEnter={() => !isMobile && setHoveredCategory(category.id)}
                                        onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                                        className="relative group"
                                    >
                                        <motion.button
                                            ref={(el) => (cardRefs.current[category.id] = el)}
                                            onClick={() => handleSelect(category.id)}
                                            whileHover={isMobile ? {} : { scale: 1.05, y: -5 }}
                                            whileTap={isMobile ? { scale: 0.98 } : { scale: 0.98 }}
                                            className={`w-full h-full relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-5 
                                                bg-gradient-to-br ${category.color} 
                                                ${isMobile ? 'border border-white/10' : 'border-2 border-white/30 shadow-2xl backdrop-blur-sm'} 
                                                text-left transition-all ${!isMobile && hoveredCategory === category.id ? category.glowColor : ''}
                                                `}
                                        >
                                            {/* SHINE EFFECT - Desktop Only */}
                                            <div className="hidden md:block absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                            <div className="relative z-10 flex flex-col h-full min-h-[90px] md:min-h-[240px] justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1.5 md:mb-4">
                                                        <div className={`bg-gradient-to-br ${category.iconBg} w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm`}>
                                                            <category.icon className="w-4 h-4 md:w-8 md:h-8 text-white" />
                                                        </div>
                                                        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all ${hoveredCategory === category.id
                                                            ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                                            : 'bg-white/20'
                                                            }`} />
                                                    </div>

                                                    <h3 className="text-white text-base md:text-xl font-black mb-0.5 md:mb-2 leading-tight">
                                                        {category.name}
                                                    </h3>
                                                    <p className="text-white/80 text-xs md:text-sm font-medium leading-tight md:leading-relaxed line-clamp-2 md:line-clamp-none">
                                                        {category.description}
                                                    </p>
                                                </div>

                                                {/* Category Symbols */}
                                                {category.symbols.length > 0 && (
                                                    <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-4">
                                                        {category.symbols.map((Symbol, idx) => (
                                                            <div key={idx} className="bg-white/10 rounded-md md:rounded-lg p-1 md:p-2 backdrop-blur-sm">
                                                                <Symbol className="w-2.5 h-2.5 md:w-4 md:h-4 text-white/60" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Streak Info */}
                            <motion.div
                                initial={isMobile ? {} : { y: 30, opacity: 0 }}
                                animate={isMobile ? {} : { y: 0, opacity: 1 }}
                                transition={isMobile ? { duration: 0 } : { delay: 0.8 }}
                                onMouseEnter={() => !isMobile && setHoveredCategory('ui')}
                                onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                                className={`mt-4 md:mt-6 rounded-2xl p-4 md:p-5 pointer-events-auto ${isMobile ? 'bg-white/10 border border-white/10' : 'bg-white/10 backdrop-blur-md border border-white/10'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="bg-gradient-to-br from-orange-500 to-red-500 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                                            <Flame className="w-4 h-4 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-sm md:text-lg">Best Streak</h3>
                                            <p className="text-white/60 text-[10px] md:text-sm font-medium">Consecutive correct answers</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white text-2xl md:text-4xl font-black">{bestStreak}</div>
                                        <div className="text-white/60 text-[8px] md:text-xs font-bold uppercase tracking-wider">Questions</div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>

                    {/* Footer - Pushed to bottom */}
                    <motion.div
                        initial={isMobile ? {} : { opacity: 0 }}
                        animate={isMobile ? {} : { opacity: 1 }}
                        transition={isMobile ? { duration: 0 } : { delay: 0.9 }}
                        onMouseEnter={() => !isMobile && setHoveredCategory('ui')}
                        onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                        className="text-center text-white/40 text-xs font-semibold py-4 mt-auto"
                    >
                        <p>Select a category to start building your streak! 🔥</p>
                    </motion.div>
                </div>
            )}

            {/* CSS FOR SHINE ANIMATION */}
            <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
      `}</style>
        </div>
    );
}