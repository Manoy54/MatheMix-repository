// src/pages/Lobby.jsx

import React, { useState, useEffect } from "react";

// FIX 1: Go up one level (../) to find firebaseConfig
import { db } from "../firebaseConfig.js";
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";

// FIX 2: Go up one level, then into components folder
import MultiplayerGame from "../components/MultiplayerGame.jsx";

// FIX 3: Go up one level to find data.js
import { QUESTIONS } from "../data.js";

// Helper function to generate a room code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

function Lobby({ goBack, user }) {
    // UI state
    const [view, setView] = useState("select");
    const [nickname, setNickname] = useState(user.username || "Player");

    // 'roomCode' is the ACTIVE room we are listening to
    const [roomCode, setRoomCode] = useState("");
    // 'joinInput' is just for the text box
    const [joinInput, setJoinInput] = useState("");

    const [error, setError] = useState("");

    // Game state from Firestore
    const [roomData, setRoomData] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);

    const isHost = roomData?.hostId === user.uid;

    // Real-time listener for the room
    useEffect(() => {
        if (!roomCode) return;

        const roomRef = doc(db, "rooms", roomCode);

        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRoomData(data);

                if (data.status === "playing") {
                    setGameStarted(true);
                }

            } else {
                // Only reset if we were already inside a lobby
                if (view === "host" || view === "waiting") {
                    setError("Room not found or has been closed.");
                    setRoomCode("");
                    setRoomData(null);
                    setView("select");
                }
            }
        });

        return () => unsubscribe();

    }, [roomCode, view]);


    // --- Button Handlers ---

    const handleHostGame = async () => {
        if (!nickname) {
            setError("Please enter a nickname.");
            return;
        }
        setError("");

        const newRoomCode = generateRoomCode();
        setRoomCode(newRoomCode);
        setView("host");

        const roomRef = doc(db, "rooms", newRoomCode);
        const newPlayer = { uid: user.uid, nickname, score: 0 };

        // Create the room
        await setDoc(roomRef, {
            hostId: user.uid,
            hostName: nickname,
            roomCode: newRoomCode,
            players: [newPlayer],
            category: "Number & Algebra", // Default
            status: "waiting",
            currentQuestion: null,
            answers: [],
        });
    };

    const handleJoinGame = async () => {
        // Check 'joinInput' here, not roomCode
        if (!nickname || !joinInput) {
            setError("Please enter a nickname and room code.");
            return;
        }
        setError("");

        const codeToJoin = joinInput.toUpperCase();
        const roomRef = doc(db, "rooms", codeToJoin);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            setError("Room not found. Check the code and try again.");
            return;
        }

        const data = roomSnap.data();
        if (data.status === "playing") {
            setError("Game is already in progress. Cannot join.");
            return;
        }

        const newPlayer = { uid: user.uid, nickname, score: 0 };
        await updateDoc(roomRef, {
            players: arrayUnion(newPlayer)
        });

        setRoomCode(codeToJoin); // Set the active room
        setView("waiting");
    };

    const handleStartGame = async () => {
        if (!roomData) return;

        const category = roomData.category;
        const question = QUESTIONS[category][Math.floor(Math.random() * QUESTIONS[category].length)];

        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
        });
    };

    const handleCategoryChange = async (newCategory) => {
        if (!isHost || !roomCode) return;
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            category: newCategory
        });
    };

    // --- Render Logic ---

    if (gameStarted && roomData) {
        return (
            <MultiplayerGame
                roomCode={roomCode}
                roomData={roomData}
                user={user}
            />
        );
    }

    // RENDER: Host Lobby View
    if (view === "host") {
        return (
            <div className="p-6 bg-[#0077b6] rounded-xl shadow-2xl max-w-2xl mx-auto mt-10">
                <h2 className="text-3xl font-bold mb-4 text-center text-white">Host Lobby</h2>

                <div className="bg-[#023e8a] p-6 rounded-xl mb-6 shadow-md text-center">
                    <p className="text-lg mb-2 text-gray-300">Share this code with your friends:</p>
                    <h3 className="text-5xl font-extrabold tracking-widest text-[#FFD700] bg-[#005f8d] inline-block px-8 py-4 rounded-lg border-2 border-[#FFD700] border-dashed">
                        {roomCode}
                    </h3>
                </div>

                <h3 className="text-xl mb-2 text-white font-bold">Players Waiting ({roomData?.players.length || 0}):</h3>
                <ul className="list-disc list-inside bg-[#023e8a] p-4 rounded-lg mb-6 min-h-[100px] shadow-inner text-white">
                    {roomData?.players.map((p) => (
                        <li key={p.uid} className="text-lg">
                            {p.nickname} {p.uid === user.uid && "⭐ (You)"}
                        </li>
                    ))}
                </ul>

                <h3 className="text-xl mb-2 text-white font-bold">Select Category:</h3>
                <select
                    value={roomData?.category || "Number & Algebra"}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-3 rounded-lg text-[#023e8a] font-bold mb-6 text-lg bg-white focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
                >
                    {Object.keys(QUESTIONS).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <button
                    onClick={handleStartGame}
                    className="w-full py-4 bg-[#4CAF50] hover:bg-[#45a049] rounded-lg text-2xl font-bold text-white transition-transform transform hover:scale-105 shadow-lg"
                >
                    Start Game
                </button>
            </div>
        );
    }

    // RENDER: Joiner Lobby View
    if (view === "waiting") {
        return (
            <div className="p-6 bg-[#0077b6] rounded-xl shadow-2xl max-w-2xl mx-auto mt-10">
                <h2 className="text-3xl font-bold mb-4 text-center text-white">Joined Room: <span className="text-[#FFD700]">{roomCode}</span></h2>

                <h3 className="text-xl mb-2 text-white font-bold">Players in Lobby ({roomData?.players.length || 0}):</h3>
                <ul className="list-disc list-inside bg-[#023e8a] p-4 rounded-lg mb-6 min-h-[100px] shadow-inner text-white">
                    {roomData?.players.map((p) => (
                        <li key={p.uid} className="text-lg">
                            {p.nickname}
                            {p.uid === roomData.hostId && " (Host) ⭐"}
                            {p.uid === user.uid && " (You)"}
                        </li>
                    ))}
                </ul>

                <div className="text-center p-4 bg-[#023e8a] rounded-lg">
                    <p className="text-2xl animate-pulse text-[#FFD700] font-bold">Waiting for the host to start...</p>
                </div>
            </div>
        );
    }

    // RENDER: Default Select View (Host or Join)
    return (
        <div className="p-8 bg-[#0077b6] rounded-xl shadow-2xl max-w-3xl mx-auto mt-10">
            <button onClick={goBack} className="bg-transparent text-[#FFD700] hover:text-white text-lg cursor-pointer float-left mb-4 font-bold">
                &larr; Back to Mode Select
            </button>

            {error && (
                <p className="bg-[#F44336] p-3 rounded-lg text-lg clear-both text-white font-bold mb-4 text-center shadow-md">{error}</p>
            )}

            <div className="my-6 clear-both">
                <label htmlFor="nickname" className="text-xl block mb-2 text-white font-bold">Enter Your Nickname</label>
                <input
                    id="nickname"
                    type="text"
                    placeholder="e.g., MathWiz"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full p-4 rounded-lg text-[#023e8a] font-bold text-lg bg-white focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
                />
            </div>

            <div className="flex flex-col md:flex-row gap-6 mt-8">
                {/* Host Game Box */}
                <div className="flex-1 bg-[#023e8a] p-6 rounded-xl shadow-lg border-2 border-transparent hover:border-[#FFD700] transition-all">
                    <h2 className="text-2xl mb-4 text-white font-bold">Host a Game</h2>
                    <p className="mb-6 text-gray-300">Create a new room and get a code to share with friends.</p>
                    <button
                        onClick={handleHostGame}
                        className="w-full py-4 bg-[#0096C7] hover:bg-[#00B4D8] rounded-lg text-xl font-bold text-white shadow-md"
                    >
                        Create Room
                    </button>
                </div>

                {/* Join Game Box */}
                <div className="flex-1 bg-[#023e8a] p-6 rounded-xl shadow-lg border-2 border-transparent hover:border-[#FFD700] transition-all">
                    <h2 className="text-2xl mb-4 text-white font-bold">Join a Game</h2>
                    <label htmlFor="roomCode" className="block mb-2 text-gray-300">Enter Room Code:</label>
                    <input
                        id="roomCode"
                        type="text"
                        placeholder="ABC12"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                        className="w-full p-3 rounded-lg text-[#023e8a] font-bold text-lg uppercase bg-white focus:outline-none focus:ring-4 focus:ring-[#FFD700] mb-4"
                        maxLength={5}
                    />
                    <button
                        onClick={handleJoinGame}
                        className="w-full py-4 bg-[#4CAF50] hover:bg-[#45a049] rounded-lg text-xl font-bold text-white shadow-md"
                    >
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Lobby;