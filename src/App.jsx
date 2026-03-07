// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigationType, useNavigate } from "react-router-dom";
import { Menu, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from "./context/LoadingContext";
import { useMobile } from "./hooks/useMobile";

// Pages
const Game = lazy(() => import("./pages/Game"));
const Lobby = lazy(() => import("./pages/multiplayer/Lobby.jsx"));
const ModeSelect = lazy(() => import("./pages/ModeSelect"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CategorySelect = lazy(() => import("./pages/CategorySelect.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const Stats = lazy(() => import("./pages/Stats.jsx"));
const Admin = lazy(() => import("./pages/admin/Admin.jsx"));

// Components
import { Sidebar } from "./components/Sidebar.jsx";

const AnimatedBackground = lazy(() => import("./components/AnimatedBackground.jsx"));
import LoadingScreen from "./components/LoadingScreen.jsx";
import MobileLoadingFallback from "./components/MobileLoadingFallback.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useMusic } from "./context/MusicContext.jsx";

const ProtectedRoute = ({ user, loading, children }) => {
    if (loading) return null;
    if (!user) return <Navigate to="/welcome" replace />;
    return children;
};

const PublicRoute = ({ user, loading, role, children }) => {
    if (loading) return null;
    if (user) {
        if (role === "ADMIN" || role === "SUPERADMIN") return <Navigate to="/admin" replace />;
        return <Navigate to="/mode-select" replace />;
    }
    return children;
};

function App() {
    const isMobile = useMobile();
    const [currentUser, setCurrentUser] = useState(null);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
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
                        const data = docSnap.data();
                        setUsername(data.username || "");
                        setRole(data.role || "");
                    }
                });
            } else {
                setCurrentUser(null);
                setUsername("");
                setRole("");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Redirect unauthenticated users to /welcome
    useEffect(() => {
        const publicPaths = ["/welcome", "/login", "/privacy-policy", "/terms-of-service", "/cookie-policy"];
        if (!loading && !currentUser && !publicPaths.includes(location.pathname)) {
            navigate("/welcome", { replace: true });
        }
    }, [currentUser, loading, location.pathname, navigate]);


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

    // We define isPublicPage to rely on path or if user is not logged in
    const isPublicPage = location.pathname === "/welcome" || location.pathname === "/login";
    const { isMuted, toggleMute } = useMusic();

    return (
        <div className="font-nunito min-h-screen w-full relative bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">
            <AnimatePresence>
                {showLoading && (isMobile ? <MobileLoadingFallback key="mobile-loading" /> : <LoadingScreen key="global-loading" />)}
            </AnimatePresence>

            {location.pathname !== "/login" && !showLoading && location.pathname !== "/lobby" && !isMobile && (
                <Suspense fallback={null}>
                    <AnimatedBackground />
                </Suspense>
            )}

            {!isPublicPage && currentUser && !location.pathname.startsWith("/admin") && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={handleLogout}
                    username={username}
                />
            )}

            <div className={`relative z-10 w-full h-full`}>
                <Routes>
                    <Route path="/welcome" element={
                        <Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}>
                            <LandingPage user={currentUser} />
                        </Suspense>
                    } />
                    <Route path="/login" element={
                        <PublicRoute user={currentUser} loading={loading} role={role}>
                            <Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}>
                                <LoginPage />
                            </Suspense>
                        </PublicRoute>
                    } />
                    <Route path="/mode-select" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><ModeSelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></Suspense></ProtectedRoute>} />
                    <Route path="/category-select" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><CategorySelect username={username} onLogout={handleLogout} onOpenSidebar={() => setSidebarOpen(true)} /></Suspense></ProtectedRoute>} />
                    <Route path="/game" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><Game onGameEnd={() => { }} onOpenSidebar={() => setSidebarOpen(true)} /></Suspense></ProtectedRoute>} />
                    <Route path="/lobby" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><Lobby user={currentUser} username={username} onOpenSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} /></Suspense></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><Stats user={currentUser} onOpenSidebar={() => setSidebarOpen(true)} /></Suspense></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><Leaderboard onOpenSidebar={() => setSidebarOpen(true)} /></Suspense></ProtectedRoute>} />
                    <Route path="/privacy-policy" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><PrivacyPolicy /></Suspense></ProtectedRoute>} />
                    <Route path="/terms-of-service" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><TermsOfService /></Suspense></ProtectedRoute>} />
                    <Route path="/cookie-policy" element={<ProtectedRoute user={currentUser} loading={loading}><Suspense fallback={isMobile ? <MobileLoadingFallback /> : <LoadingScreen />}><CookiePolicy /></Suspense></ProtectedRoute>} />
                    <Route path="/admin/*" element={
                        <AdminRoute>
                            <Suspense fallback={<div className="text-white text-center">Loading Admin...</div>}>
                                <Admin username={username} onLogout={handleLogout} />
                            </Suspense>
                        </AdminRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to={currentUser ? "/mode-select" : "/welcome"} replace />} />
                </Routes>
            </div>

            {/* Music Mute/Unmute Toggle */}
            {!isPublicPage && currentUser && !showLoading && (
                <button
                    onClick={toggleMute}
                    className="fixed bottom-4 right-4 z-[100] p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
                    title={isMuted ? 'Unmute Music' : 'Mute Music'}
                    aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}
        </div>
    );
}

export default App;