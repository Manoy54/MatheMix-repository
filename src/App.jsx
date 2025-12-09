// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

// Pages
import Game from "./pages/Game.jsx";
import Lobby from "./pages/multiplayer/Lobby.jsx";
import ModeSelect from "./pages/ModeSelect.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CategorySelect from "./pages/CategorySelect.jsx";

// Components
import { Sidebar } from "./components/Sidebar.jsx";

import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const ProtectedRoute = ({ user, children }) => {
    if (!user) return <Navigate to="/" replace />;
    return children;
};

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);

    // Sidebar Control State
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                const userDocRef = doc(db, "users", user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUsername(docSnap.data().username || "");
                    }
                });
            } else {
                setCurrentUser(null);
                setUsername("");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setSidebarOpen(false); // Close sidebar on logout
    };

    const handleSoloGameEnd = async (didWin) => {
        // Logic handled in Game.jsx usually
    };

    if (loading) {
        return (
            <div className="bg-[#023e8a] text-white min-h-screen p-4 flex justify-center items-center font-sans">
                <h2 className="text-2xl">Loading Mathemix...</h2>
            </div>
        );
    }

    // List of pages that handle their own full-screen layout
    const fullScreenRoutes = [
        "/",
        "/mode-select",
        "/category-select",
        "/lobby",
        "/game"
    ];

    const isFullScreen = fullScreenRoutes.includes(location.pathname);
    const isLoginPage = location.pathname === "/";

    // NEW: Check if we are specifically in the lobby, mode select, category select, or game screens
    // These screens have their own internal sidebar toggle buttons
    const isLobbyOrModeSelect = location.pathname === "/lobby" || location.pathname === "/mode-select" || location.pathname === "/category-select" || location.pathname === "/game";

    return (
        <div className={isFullScreen ? "font-nunito min-h-screen w-full relative" : "bg-[#023e8a] text-white min-h-screen p-4 font-sans relative"}>

            {/* --- SIDEBAR SYSTEM --- */}
            {!isLoginPage && currentUser && (
                <>
                    {/* The Sidebar Component */}
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        onLogout={handleLogout}
                        username={username}
                    />

                    {/* FLOATING MENU BUTTON */}
                    {/* CHANGE: We hide this floating button on lobby, mode-select, category-select, and game
                        because they now have their own integrated buttons. */}
                    {!isLobbyOrModeSelect && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSidebarOpen(true)}
                            className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </motion.button>
                    )}
                </>
            )}

            <div className={isFullScreen ? "w-full h-full" : "max-w-4xl mx-auto text-center"}>

                {/* Routes */}
                <Routes>
                    <Route
                        path="/"
                        element={currentUser ? <Navigate to="/mode-select" /> : <LoginPage />}
                    />

                    <Route
                        path="/mode-select"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <ModeSelect
                                    username={username}
                                    onLogout={handleLogout}
                                    onOpenSidebar={() => setSidebarOpen(true)}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/category-select"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <CategorySelect
                                    username={username}
                                    onLogout={handleLogout}
                                    onOpenSidebar={() => setSidebarOpen(true)}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/game"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <Game
                                    onGameEnd={handleSoloGameEnd}
                                    onOpenSidebar={() => setSidebarOpen(true)}
                                    onLogout={handleLogout}
                                />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/lobby"
                        element={
                            <ProtectedRoute user={currentUser}>
                                {/* CHANGE: We pass 'onOpenSidebar' function down to Lobby */}
                                <Lobby
                                    user={currentUser}
                                    onOpenSidebar={() => setSidebarOpen(true)}
                                    onLogout={handleLogout}
                                />
                            </ProtectedRoute>
                        }
                    />
                </Routes>

            </div>
        </div>
    );
}

export default App;