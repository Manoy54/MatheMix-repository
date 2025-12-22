import React from 'react';
import { motion } from 'framer-motion';
import {
    Calculator,
    Ruler,
    PieChart,
    BookOpen,
    PlusCircle,
    MinusCircle,
    RefreshCw,
    ChevronRight,
    Layout,
    Database,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GameContent = () => {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'Number & Algebra',
            slug: 'number-algebra',
            name: 'Number and Algebra',
            description: 'Master arithmetic operations, equations, and algebraic thinking.',
            icon: Calculator,
            color: 'from-purple-600/80 to-violet-600/80',
            borderColor: 'border-purple-400/30'
        },
        {
            id: 'Measurement & Geometry',
            slug: 'measurement-geometry',
            name: 'Measurement and Geometry',
            description: 'Explore shapes, sizes, patterns, and spatial relationships.',
            icon: Ruler,
            color: 'from-blue-600/80 to-cyan-600/80',
            borderColor: 'border-blue-400/30'
        },
        {
            id: 'Data & probability',
            slug: 'data-probability',
            name: 'Data and Probability',
            description: 'Analyze data, understand statistics, and predict outcomes.',
            icon: PieChart,
            color: 'from-emerald-600/80 to-green-600/80',
            borderColor: 'border-emerald-400/30'
        },
    ];

    return (
        <div className="w-full bg-transparent text-white">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* 1. Explanation Section */}
                <motion.section
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl border-2 border-white/30 shadow-lg">
                            <Database className="w-8 h-8 text-cyan-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight drop-shadow-md">
                                Game Content
                            </h1>
                            <p className="text-cyan-100/60 font-medium">Content Management Overview</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-cyan-300">
                                    <BookOpen className="w-5 h-5" />
                                    Purpose
                                </h3>
                                <p className="text-white/80 leading-relaxed">
                                    This module serves as the centralized hub for administrators to manage all mathematical content within the Mathemix ecosystem.
                                    It is designed to give you full control over the question banks, definitions, and answers that drive the game experience.
                                </p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
                                    <Layout className="w-5 h-5" />
                                    Admin Capabilities
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        { icon: PlusCircle, text: 'Add new mathematical definitions and rules', color: 'text-emerald-400' },
                                        { icon: MinusCircle, text: 'Remove outdated or redundant content', color: 'text-red-400' },
                                        { icon: RefreshCw, text: 'Update existing definitions and answer keys', color: 'text-blue-400' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white/70 text-sm font-medium">
                                            <item.icon className={`w-4 h-4 ${item.color}`} />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 bg-white/5 -mx-8 -mb-8 px-8 py-4 rounded-b-3xl">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            <p className="text-yellow-200/70 text-sm font-bold italic tracking-wide">
                                Note: Content management tools (forms, editors, and delete actions) will be added in a future update.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* 2. Category Display Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-2xl font-black text-white/90 underline decoration-cyan-500/50 underline-offset-8">
                            Mathematical Categories
                        </h2>
                        <span className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
                            Total Workspaces: 3
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => navigate(`/admin/game-content/${category.slug}`)}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{
                                    scale: { type: "spring", stiffness: 400, damping: 17 },
                                    y: { duration: 0.2 },
                                    default: { delay: 0.4 + (index * 0.1) }
                                }}
                                className={`group relative bg-gradient-to-br ${category.color} border-2 ${category.borderColor} p-8 rounded-[2rem] shadow-2xl hover:brightness-110 hover:shadow-cyan-500/20 transition-all cursor-pointer overflow-hidden`}
                            >
                                {/* Background Decorative Element */}
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <category.icon className="w-32 h-32 rotate-12" />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="bg-white/20 p-4 rounded-2xl border border-white/30 shadow-inner">
                                            <category.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Active</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-3">
                                            {category.name}
                                        </h3>
                                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                                            {category.description}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-white/20 flex items-center justify-between">
                                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider italic">
                                            Content Locked
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Footer Placeholder */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-12 text-center"
                >
                    <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">
                        Mathemix Administration &bull; Game Engine v1.0
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default GameContent;
