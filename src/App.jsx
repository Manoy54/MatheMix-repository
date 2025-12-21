// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from "./context/LoadingContext";
import { useMobile } from "./hooks/useMobile";

// Pages
import Game from "./pages/Game";
import Lobby from "./pages/multiplayer/Lobby.jsx";
import ModeSelect from "./pages/ModeSelect";
import LoginPage from "./pages/LoginPage";
import CategorySelect from "./pages/CategorySelect.jsx";
import LandingPage from "./pages/LandingPage";
import Leaderboard from "./pages/Leaderboard";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
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
    const isMobile = useMobile();
    const [currentUser, setCurrentUser] = useState(null);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigationType = useNavigationType();
    const lastNavRef = React.useRef("");
    const { isLoading, startLoading } = useLoading();

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

    // Centralized route-entry loading trigger
    useEffect(() => {
        const routesToLoad = ["/mode-select", "/category-select"];
        const currentKey = location.key || "initial";
        const navId = `${currentKey}:${location.pathname}`;

        // Only trigger if entering a specified route AND it's a new navigation event
        if (routesToLoad.includes(location.pathname) && lastNavRef.current !== navId) {
            lastNavRef.current = navId;
            startLoading();
        }
    }, [location.pathname, location.key, startLoading]);

    const handleLogout = async () => {
        await signOut(auth);
        setSidebarOpen(false);
    };

    const { hasFinishedLoading } = useLoading();

    // The loading screen will handle both auth loading and game initialization
    const showLoading = loading || isLoading;

    const fullScreenRoutes = ["/", "/mode-select", "/category-select", "/lobby", "/game", "/stats", "/leaderboard", "/welcome", "/privacy-policy", "/terms-of-service", "/cookie-policy"];
    const isFullScreen = fullScreenRoutes.includes(location.pathname);
    const isPublicPage = ["/", "/welcome"].includes(location.pathname);
    const hasOwnSidebarButton = ["/lobby", "/mode-select", "/category-select", "/game"].includes(location.pathname);

    return (
        <div className="font-nunito min-h-screen w-full relative bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            <AnimatePresence>
                {showLoading && <LoadingScreen key="global-loading" />}
            </AnimatePresence>

            {!isPublicPage && !showLoading && location.pathname !== "/lobby" && !isMobile && <AnimatedBackground />}

            {!isPublicPage && currentUser && (
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
                    <Route path="/welcome" element={<LandingPage />} />
                    <Route path="/mode-select" element={<ProtectedRoute user={currentUser}><ModeSelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/category-select" element={<ProtectedRoute user={currentUser}><CategorySelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/game" element={<ProtectedRoute user={currentUser}><Game onGameEnd={() => { }} onOpenSidebar={() => setSidebarOpen(true)} /></ProtectedRoute>} />
                    <Route path="/lobby" element={<ProtectedRoute user={currentUser}><Lobby user={currentUser} username={username} onOpenSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute user={currentUser}><Suspense fallback={<div className="text-white text-center">Loading Stats...</div>}><Stats user={currentUser} /></Suspense></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute user={currentUser}><Leaderboard /></ProtectedRoute>} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;