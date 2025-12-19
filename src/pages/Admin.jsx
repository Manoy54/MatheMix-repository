import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Menu, X, Layout, Users, Shield, Settings, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Admin = ({ username, onLogout }) => {
    // Requirement: The sidebar must be visible by default (open state = true on initial render).
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Sidebar items specifically for Admin page if needed, 
    // but the requirement says to use Sidebar.jsx as is.

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            {/* 1. Sidebar Component */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpen={() => setSidebarOpen(true)}
                onLogout={onLogout}
                username={username}
                showBackdrop={false} // Requirement: When the sidebar is open, it should NOT overlay.
            />

            {/* 2. Admin Content Area */}
            {/* Requirement: When the sidebar is open, it should NOT overlay the main Admin page area. Instead, it should be a two-column layout. */}
            {/* The Admin content area should appear inset / pushed to the right when sidebar is open. */}
            <main
                className={`relative min-h-screen transition-all duration-[240ms] ease-[0.2,0.8,0.2,1] ${isSidebarOpen ? 'ml-80' : 'ml-0'
                    }`}
            >
                {/* Updated padding to px-6 to match Sidebar.jsx header padding, reduced pt-10 to pt-6 */}
                <div className="relative z-10 px-6 pt-6 pb-10">

                    {/* Header Section - Layout matches Sidebar justify-between behavior */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-10"
                    >
                        <div className="flex items-center gap-5">
                            {/* Dashboard Toggle - Visible only on /admin layout */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSidebarOpen(!isSidebarOpen)}
                                className="bg-white/20 p-2.5 rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all shadow-lg text-white"
                            >
                                <AnimatePresence mode="wait">
                                    {isSidebarOpen ? (
                                        <motion.div
                                            key="x"
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 90 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <X className="w-6 h-6" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ scale: 0, rotate: 90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: -90 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <Menu className="w-6 h-6" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            <div>
                                <h1 className="text-white text-4xl font-black tracking-tight drop-shadow-md">
                                    Admin Dashboard
                                </h1>
                                <p className="text-cyan-100/60 font-medium">Control center and system management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Status Icon - Styled to match Sidebar header icons */}
                            <div className="bg-white/20 p-2 rounded-xl border-2 border-white/30">
                                <Shield className="w-5 h-5 text-cyan-300" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {[
                            { icon: Users, label: 'Total Players', value: '1,284', color: 'from-blue-500 to-cyan-400' },
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 rounded-3xl h-[400px] flex flex-col items-center justify-center text-white/20"
                    >
                        <Layout className="w-16 h-16 mb-4" />
                        <p className="text-xl font-bold italic">Admin content area ready for modules</p>
                    </motion.div>
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

export default Admin;
