// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Game from "./pages/Game.jsx";
import Lobby from "./pages/Lobby.jsx";
import ModeSelect from "./pages/ModeSelect.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CategorySelect from "./pages/CategorySelect.jsx";
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const ProtectedRoute = ({ user, children }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);

    // Stats for Solo Mode
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);

    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                const userDocRef = doc(db, "users", user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUsername(data.username || "");
                        setLongestStreak(data.longestStreak || 0);
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
    };

    const handleSoloGameEnd = async (didWin) => {
        if (didWin) {
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            if (newStreak > longestStreak) {
                setLongestStreak(newStreak);
                if (currentUser) {
                    await setDoc(doc(db, "users", currentUser.uid), { longestStreak: newStreak }, { merge: true });
                }
            }
        } else {
            setCurrentStreak(0);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#023e8a] text-white min-h-screen p-4 flex justify-center items-center font-sans">
                <h2 className="text-2xl">Loading Mathemix...</h2>
            </div>
        );
    }

    // --- LAYOUT LOGIC ---
    // These pages handle their own full-screen layout.
    // We do NOT want App.jsx to add padding or background to them.
    const fullScreenRoutes = ["/", "/mode-select", "/category-select"];
    const isFullScreen = fullScreenRoutes.includes(location.pathname);

    return (
        <div className={isFullScreen ? "font-nunito" : "bg-[#023e8a] text-white min-h-screen p-4 font-sans"}>

            {/* Only constrain width if NOT full screen */}
            <div className={isFullScreen ? "" : "max-w-4xl mx-auto text-center"}>

                {/* Global Header (Only show on Game/Lobby pages) */}
                {!isFullScreen && currentUser && (
                    <header className="border-b border-gray-600 pb-4 mb-6 relative">
                        <button
                            onClick={handleLogout}
                            className="absolute top-0 right-0 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                            Logout
                        </button>
                        <h1 className="text-4xl font-bold tracking-wider">Mathemix 🧮</h1>

                        {location.pathname === "/game" && (
                            <div className="flex justify-center gap-6 mt-2 text-sm font-bold text-yellow-300">
                                <span>🔥 Streak: {currentStreak}</span>
                                <span>🏆 Best: {longestStreak}</span>
                            </div>
                        )}
                    </header>
                )}

                <Routes>
                    <Route
                        path="/"
                        element={currentUser ? <Navigate to="/mode-select" /> : <LoginPage />}
                    />

                    <Route
                        path="/mode-select"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <ModeSelect username={username} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/category-select"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <CategorySelect />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/game"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <Game onGameEnd={handleSoloGameEnd} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/lobby"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <Lobby user={currentUser} />
                            </ProtectedRoute>
                        }
                    />
                </Routes>

            </div>
        </div>
    );
}

export default App;