// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Game from "./pages/Game.jsx";
import Lobby from "./pages/Lobby.jsx";
import ModeSelect from "./pages/ModeSelect.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

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
    };

    if (loading) {
        return (
            <div className="bg-[#023e8a] text-white min-h-screen p-4 flex justify-center items-center font-sans">
                <h2 className="text-2xl">Loading Mathemix...</h2>
            </div>
        );
    }

    // FIX: Treat both "/" (Login) AND "/mode-select" as full-screen pages
    const isFullScreenPage = location.pathname === "/" || location.pathname === "/mode-select";

    return (
        // If it's a full screen page, we use a plain div. If it's Game/Lobby, we use the blue background.
        <div className={isFullScreenPage ? "font-nunito" : "bg-[#023e8a] text-white min-h-screen p-4 font-sans"}>

            {/* If it's a full screen page, we don't constrain the width */}
            <div className={isFullScreenPage ? "" : "max-w-4xl mx-auto text-center"}>

                {/* Header: Show on Game/Lobby pages, or specifically on ModeSelect if you want the logout button there */}
                {!isFullScreenPage && currentUser && (
                    <header className="border-b border-gray-600 pb-4 mb-6 relative">
                        <button
                            onClick={handleLogout}
                            className="absolute top-0 right-0 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                            Logout
                        </button>
                        <h1 className="text-4xl font-bold tracking-wider">Mathemix 🧮</h1>
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
                                {/* Pass handleLogout so ModeSelect can use its own logout button */}
                                <ModeSelect username={username} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/game"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <Game />
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