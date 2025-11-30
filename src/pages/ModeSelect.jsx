// src/pages/ModeSelect.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Trophy, Zap, Target, LogOut, Sparkles, Brain, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

// IMPORT THE NEW 3D BACKGROUND
import Background3D from '../components/Background3D.jsx';

export default function ModeSelect({ username, onLogout }) {
    const navigate = useNavigate();
    const [hoveredMode, setHoveredMode] = useState(null);

    const stats = [
        { icon: Trophy, label: 'Games Won', value: '12', color: 'from-yellow-400 to-orange-500' },
        { icon: Target, label: 'Accuracy', value: '94%', color: 'from-green-400 to-emerald-500' },
        { icon: Zap, label: 'Streak', value: '5', color: 'from-purple-400 to-pink-500' },
    ];

    return (
        <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">

            {/* --- 1. THE NEW 3D BACKGROUND --- */}
            {/* This sits behind everything */}
            <Background3D />

            {/* --- 2. HEADER (Z-index ensures it sits on top of 3D) --- */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
                {/* pointer-events-none on container, auto on buttons so you can click through to the 3D background if needed */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="bg-white/20 p-2 rounded-xl border-2 border-white/30 backdrop-blur-sm shadow-lg"
                    >
                        <Calculator className="w-6 h-6 text-white" />
                    </motion.div>

                    <h1 className="text-3xl font-black text-white tracking-wider flex items-center gap-2 drop-shadow-md">
                        Mathemix
                        <motion.div
                            animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                        </motion.div>
                    </h1>
                </div>

                <button
                    onClick={onLogout}
                    className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform transform hover:scale-105"
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>

            {/* --- 3. MAIN CONTENT --- */}
            <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center pointer-events-none">
                {/* Wrapper div to allow clicks on buttons */}
                <div className="w-full max-w-4xl pointer-events-auto">

                    {/* Welcome Section */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-10"
                    >
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full border-2 border-white/30 mb-3 backdrop-blur-md"
                        >
                            <User className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-bold">Hello, {username || "Player"}!</span>
                        </motion.div>

                        <h2 className="text-white text-5xl mb-4 font-black leading-tight drop-shadow-lg">
                            Ready to Challenge Your
                            <br />
                            <span className="relative inline-block">
                <span className="relative z-10 text-[#FFD700]">
                  Math Skills?
                </span>
              </span>
                        </h2>
                        <p className="text-white/90 text-xl font-semibold drop-shadow-md">Select a game mode to start your adventure</p>
                    </motion.div>

                    {/* Game Mode Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">

                        {/* Solo Mode Button */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            onMouseEnter={() => setHoveredMode('solo')}
                            onMouseLeave={() => setHoveredMode(null)}
                        >
                            <motion.button
                                onClick={() => navigate('/game')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full relative overflow-hidden rounded-3xl p-8 bg-[#023e8a]/60 backdrop-blur-md border-2 border-white/30 shadow-xl group text-left h-full hover:bg-[#023e8a]/80 transition-all"
                            >
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-inner border border-white/20">
                                        <Brain className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-white text-3xl mb-3 font-black">Solo Mode</h3>
                                    <p className="text-white/90 mb-0 font-medium text-sm leading-relaxed">
                                        Challenge yourself and improve your skills at your own pace.
                                    </p>
                                </div>
                            </motion.button>
                        </motion.div>

                        {/* Multiplayer Mode Button */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            onMouseEnter={() => setHoveredMode('multi')}
                            onMouseLeave={() => setHoveredMode(null)}
                        >
                            <motion.button
                                onClick={() => navigate('/lobby')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full relative overflow-hidden rounded-3xl p-8 bg-[#10b981]/60 backdrop-blur-md border-2 border-white/30 shadow-xl group text-left h-full hover:bg-[#10b981]/80 transition-all"
                            >
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-inner border border-white/20">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-white text-3xl mb-3 font-black">Multiplayer Mode</h3>
                                    <p className="text-white/90 mb-0 font-medium text-sm leading-relaxed">
                                        Compete with friends in real-time and climb the leaderboard.
                                    </p>
                                </div>
                            </motion.button>
                        </motion.div>
                    </div>

                    {/* Stats Section */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-3 gap-6"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border-2 border-white/30 text-center hover:bg-white/30 transition-colors"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-white text-2xl font-black">{stat.value}</div>
                                <div className="text-white/90 text-xs font-bold uppercase tracking-wide">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}