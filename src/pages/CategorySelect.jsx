// src/pages/CategorySelect.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Background3D from '../components/Background3D.jsx';
import {
    Calculator, Sparkles, Ruler, PieChart, Flame, Info,
    // Math Symbols
    Plus, Minus, X, Divide,
    // Geometry Symbols
    Triangle, Square, Circle, Compass,
    // Data Symbols
    BarChart, LineChart, TrendingUp, Percent
} from 'lucide-react';

export default function CategorySelect({ username, onLogout }) {
    const navigate = useNavigate();
    const [hoveredCategory, setHoveredCategory] = useState(null);

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

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">

            {/* 3D Background Layer */}
            <Background3D />

            {/* Main Content Layer */}
            {/* Added pointer-events-none to container so mouse reaches 3D bg */}
            <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col pointer-events-none">

                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between pt-4 pb-2 shrink-0 pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
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
                    {/* Back Button Removed Here */}
                </motion.div>

                {/* Centered Content */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="w-full max-w-5xl flex flex-col justify-center">

                        {/* Welcome Section */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-8"
                        >
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-3 shadow-lg">
                                <Flame className="w-4 h-4 text-orange-300" />
                                <span className="text-white text-base font-bold">Solo Mode</span>
                            </div>

                            <h2 className="text-white text-4xl md:text-5xl mb-2 leading-tight font-black drop-shadow-lg">
                                Choose Your <span className="text-yellow-300">Category</span>
                            </h2>
                            <p className="text-white/80 text-lg font-medium">Build your streak by answering questions continuously!</p>
                        </motion.div>

                        {/* Info Card */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-4 border border-yellow-400/30 mb-6 shadow-lg pointer-events-auto"
                        >
                            <div className="flex items-start gap-3">
                                <div className="bg-yellow-400/30 rounded-lg p-2 mt-0.5">
                                    <Info className="w-5 h-5 text-yellow-200" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-base mb-1">How Solo Mode Works</h3>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        Answer questions continuously to build your streak! There's no question limit—keep going until you stop or can't answer anymore. Challenge yourself to beat your highest streak!
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Category Cards */}
                        <div className="grid md:grid-cols-3 gap-5 pointer-events-auto">
                            {categories.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    onMouseEnter={() => setHoveredCategory(category.id)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                    className="relative group"
                                >
                                    <motion.button
                                        onClick={() => handleSelect(category.id)}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full h-full relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${category.color} border-2 border-white/30 shadow-2xl text-left backdrop-blur-sm transition-all ${
                                            hoveredCategory === category.id ? category.glowColor : ''
                                        }`}
                                    >
                                        {/* SHINE EFFECT */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />

                                        <div className="relative z-10 flex flex-col h-full min-h-[280px] justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`bg-gradient-to-br ${category.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm`}>
                                                        <category.icon className="w-9 h-9 text-white" />
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full transition-all ${
                                                        hoveredCategory === category.id
                                                            ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                                            : 'bg-white/20'
                                                    }`} />
                                                </div>

                                                <h3 className="text-white text-2xl font-black mb-2 leading-tight">
                                                    {category.name}
                                                </h3>
                                                <p className="text-white/80 text-sm font-medium leading-relaxed">
                                                    {category.description}
                                                </p>
                                            </div>

                                            {/* Category Symbols */}
                                            {category.symbols.length > 0 && (
                                                <div className="flex gap-2 mt-4">
                                                    {category.symbols.map((Symbol, idx) => (
                                                        <div key={idx} className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                                                            <Symbol className="w-4 h-4 text-white/60" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Streak Info - ADDED HERE */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 pointer-events-auto"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                                        <Flame className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg">Current Streak</h3>
                                        <p className="text-white/60 text-sm font-medium">Consecutive correct answers</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white text-4xl font-black">0</div>
                                    <div className="text-white/60 text-xs font-bold uppercase tracking-wider">Questions</div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-center text-white/40 text-xs font-semibold py-3"
                >
                    <p>Select a category to start building your streak! 🔥</p>
                </motion.div>
            </div>

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