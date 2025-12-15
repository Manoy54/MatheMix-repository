// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

// Pages
import Game from "./pages/Game";
import Lobby from "./pages/multiplayer/Lobby.jsx";
import ModeSelect from "./pages/ModeSelect";
import LoginPage from "./pages/LoginPage";
import CategorySelect from "./pages/CategorySelect.jsx";
const Stats = lazy(() => import("./pages/Stats.jsx"));

// Components
import { Sidebar } from "./components/Sidebar.jsx";
import AnimatedBackground from "./components/AnimatedBackground.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

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
        setSidebarOpen(false);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    const fullScreenRoutes = ["/", "/mode-select", "/category-select", "/lobby", "/game", "/stats"];
    const isFullScreen = fullScreenRoutes.includes(location.pathname);
    const isLoginPage = location.pathname === "/";
    const hasOwnSidebarButton = ["/lobby", "/mode-select", "/category-select", "/game"].includes(location.pathname);

    return (
        <div className="font-nunito min-h-screen w-full relative bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            {location.pathname !== "/" && <AnimatedBackground />}

            {!isLoginPage && currentUser && (
                <>
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        onLogout={handleLogout}
                        username={username}
                    />
                    {!hasOwnSidebarButton && (
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

            <div className={`relative z-10 ${isFullScreen ? "w-full h-full" : "max-w-6xl mx-auto p-4"}`}>
                <Routes>
                    <Route path="/" element={currentUser ? <Navigate to="/mode-select" /> : <LoginPage />} />
                    <Route path="/mode-select" element={<ProtectedRoute user={currentUser}><ModeSelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/category-select" element={<ProtectedRoute user={currentUser}><CategorySelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/game" element={<ProtectedRoute user={currentUser}><Game onGameEnd={() => { }} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/lobby" element={<ProtectedRoute user={currentUser}><Lobby user={currentUser} onOpenSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute user={currentUser}><Suspense fallback={<div className="text-white text-center">Loading Stats...</div>}><Stats user={currentUser} /></Suspense></ProtectedRoute>} />
                </Routes>
            </div>
        </div>
    );
}

export default App;