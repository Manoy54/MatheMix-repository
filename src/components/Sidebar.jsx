import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Gamepad2, Trophy, BarChart3, Award, Settings, HelpCircle, LogOut, X, Menu, Layout, Users, Shield, Activity } from 'lucide-react';

export function Sidebar({ isOpen, onClose, onOpen, onLogout, username, showBackdrop = true, isAdmin = false, activeView = 'overview', onAdminViewChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    const menuItems = {
        core: [
            { icon: LayoutGrid, label: 'Game Modes', action: () => handleNavigation('/mode-select') },
            { icon: Gamepad2, label: 'Multiplayer Lobby', action: () => handleNavigation('/lobby') },
        ],
        progression: [
            { icon: Trophy, label: 'Leaderboard', action: () => handleNavigation('/leaderboard') },
            { icon: BarChart3, label: 'My Statistics', action: () => handleNavigation('/stats') },
            { icon: Award, label: 'Achievements', action: () => handleNavigation('/achievements') },
        ],
        utility: [
            { icon: Settings, label: 'Settings', action: () => console.log('Settings') },
            { icon: HelpCircle, label: 'How to Play', action: () => handleNavigation('/welcome#how-to-play') },
            { icon: LogOut, label: 'Logout', action: onLogout },
        ],
    };

    const adminItems = {
        core: [
            { id: 'overview', icon: Layout, label: 'Overview', action: () => onAdminViewChange ? onAdminViewChange('overview') : handleNavigation('/admin') },
            { id: 'users', icon: Users, label: 'User Records', action: () => onAdminViewChange ? onAdminViewChange('users') : null },
            { id: 'game-content', icon: Gamepad2, label: 'Game Content', action: () => onAdminViewChange ? onAdminViewChange('game-content') : handleNavigation('/admin/game-content') },
        ],
        progression: [
            { id: 'analytics', icon: BarChart3, label: 'System Analytics', action: () => onAdminViewChange ? onAdminViewChange('analytics') : null },
            { id: 'logs', icon: Activity, label: 'System Logs', action: () => onAdminViewChange ? onAdminViewChange('logs') : null },
        ],
        utility: [
            { id: 'security', icon: Shield, label: 'Security', action: () => onAdminViewChange ? onAdminViewChange('security') : null },
            { id: 'config', icon: Settings, label: 'System Config', action: () => onAdminViewChange ? onAdminViewChange('config') : null },
            { icon: LogOut, label: 'Logout', action: onLogout },
        ],
    };

    const labels = isAdmin ? {
        core: 'Admin Control',
        progression: 'Data Insights',
        utility: 'Maintenance'
    } : {
        core: 'Navigation',
        progression: 'Progression',
        utility: 'System'
    };

    const activeItems = isAdmin ? adminItems : menuItems;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div key="full-sidebar">
                    {/* Backdrop */}
                    {showBackdrop && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                    )}

                    {/* Sidebar */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{
                            type: 'tween',
                            ease: [0.2, 0.8, 0.2, 1],
                            duration: 0.24
                        }}
                        style={{ willChange: 'transform' }}
                        className="fixed left-0 top-0 h-full w-80 z-50 flex flex-col"
                    >
                        {/* Glowing background effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] opacity-95" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                        {/* Main sidebar content */}
                        <div className="relative h-full bg-white/10 backdrop-blur-2xl border-r-2 border-white/20 flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-white text-2xl font-black tracking-wider">
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                                                Mathemix
                                            </span>
                                        </h2>
                                        <p className="text-white/60 text-sm mt-1">Control Center</p>
                                    </div>
                                    {!isAdminRoute && (
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={onClose}
                                            className="relative group"
                                        >
                                            <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative bg-white/20 p-2 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all">
                                                <X className="w-5 h-5 text-white" />
                                            </div>
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Sections */}
                            <div className="flex-1 p-4 space-y-6">
                                {/* Core Navigation */}
                                <div>
                                    <h3 className="text-cyan-200 text-xs uppercase tracking-wider px-3 mb-3 font-semibold">{labels.core}</h3>
                                    <div className="space-y-1">
                                        {activeItems.core.map((item, index) => (
                                            <motion.button
                                                key={index}
                                                whileHover={{ x: 4, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={item.action}
                                                className="relative w-full group"
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl blur-md transition-opacity ${isAdmin && activeView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                                <div className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${isAdmin && activeView === item.id
                                                    ? 'bg-white/25 border-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.3)]'
                                                    : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-cyan-300/50'}`}>
                                                    <div className="relative">
                                                        <div className={`absolute inset-0 bg-cyan-400 rounded-lg blur-md transition-opacity ${isAdmin && activeView === item.id ? 'opacity-50' : 'opacity-0 group-hover:opacity-50'}`} />
                                                        <item.icon className={`relative w-5 h-5 ${isAdmin && activeView === item.id ? 'text-white' : 'text-cyan-200'}`} />
                                                    </div>
                                                    <span className={`font-medium ${isAdmin && activeView === item.id ? 'text-white' : 'text-white/90'}`}>{item.label}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Player Progression */}
                                <div>
                                    <h3 className="text-purple-200 text-xs uppercase tracking-wider px-3 mb-3 font-semibold">{labels.progression}</h3>
                                    <div className="space-y-1">
                                        {activeItems.progression.map((item, index) => (
                                            <motion.button
                                                key={index}
                                                whileHover={{ x: 4, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={item.action}
                                                className="relative w-full group"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-300/50 transition-all">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-purple-400 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
                                                        <item.icon className="relative w-5 h-5 text-purple-200" />
                                                    </div>
                                                    <span className="text-white font-medium">{item.label}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Utility */}
                                <div>
                                    <h3 className="text-white/60 text-xs uppercase tracking-wider px-3 mb-3 font-semibold">{labels.utility}</h3>
                                    <div className="space-y-1">
                                        {activeItems.utility.map((item, index) => (
                                            <motion.button
                                                key={index}
                                                whileHover={{ x: 4, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={item.action}
                                                className="relative w-full group"
                                            >
                                                <div className="absolute inset-0 bg-white/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-white rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                                                        <item.icon className="relative w-5 h-5 text-white/80" />
                                                    </div>
                                                    <span className="text-white font-medium">{item.label}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/20">
                                <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                                    <p className="text-white/80 text-sm">Logged in as:</p>
                                    <p className="text-white font-bold truncate">{username || "Player"}</p>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
