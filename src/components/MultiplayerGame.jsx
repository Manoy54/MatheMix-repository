// src/components/MultiplayerGame.jsx

import React, { useState, useEffect, useCallback } from "react";
// FIX IMPORTS: Go up one level (../) to find these files
import { db } from "../firebaseConfig.js";
import { QUESTIONS } from "../data.js";

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import Grid from "./Grid.jsx";         // In same folder
import Keyboard from "./Keyboard.jsx"; // In same folder

function MultiplayerGame({ roomCode, roomData, user }) {
    // ... (The rest of the code stays EXACTLY the same as the last version I gave you) ...
    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState("playing");
    const [scoreMessage, setScoreMessage] = useState("");
    const [nextCategory, setNextCategory] = useState(roomData.category);

    const {
        currentQuestion,
        players,
        hostId,
        answers = [],
        roundStartTime,
    } = roomData;

    const answer = currentQuestion.answer.toUpperCase();
    const pureAnswer = answer.replace(/[^A-Z0-9]/g, '');
    const numGuessableBoxes = pureAnswer.length;

    const isHost = hostId === user.uid;
    const hasAnswered = answers.some(a => a.uid === user.uid);

    useEffect(() => {
        setGuess("");
        setStatus("playing");
        setScoreMessage("");
    }, [currentQuestion]);

    const handleKey = (key) => {
        if (status !== "playing" || hasAnswered || guess.length >= numGuessableBoxes) return;
        setGuess(guess + key);
    };
    const handleClear = () => setGuess("");
    const handleDelete = () => setGuess(guess.slice(0, -1));

    const handleSubmit = async () => {
        if (status !== "playing" || hasAnswered || guess.length !== numGuessableBoxes) return;

        let score = 0;
        let isCorrect = false;

        if (guess.trim().toUpperCase() === pureAnswer) {
            isCorrect = true;
            const timeTaken = (Date.now() - roundStartTime) / 1000;
            score = Math.max(10, 100 - Math.floor(timeTaken * 2));
            setStatus("correct");
            setScoreMessage(`+${score} points!`);
        } else {
            setStatus("wrong");
            setScoreMessage("Wrong answer!");
        }

        const roomRef = doc(db, "rooms", roomCode);
        const answerData = {
            uid: user.uid,
            nickname: user.username,
            guess: guess.toUpperCase(),
            isCorrect,
            score,
        };

        await updateDoc(roomRef, {
            answers: arrayUnion(answerData)
        });
    };

    const handleNextRound = async () => {
        if (!isHost) return;

        const category = nextCategory;
        const question = QUESTIONS[category][Math.floor(Math.random() * QUESTIONS[category].length)];
        const roomRef = doc(db, "rooms", roomCode);

        const updatedPlayers = players.map(p => {
            const answer = answers.find(a => a.uid === p.uid);
            if (answer && answer.isCorrect) {
                return { ...p, score: p.score + answer.score };
            }
            return p;
        });

        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(),
            answers: [],
            players: updatedPlayers,
            category: category
        });
    };

    const handleKeyDown = useCallback(
        (e) => {
            const key = e.key.toUpperCase();
            if (key === "ENTER") handleSubmit();
            else if (key === "BACKSPACE") handleDelete();
            else if (key === " ") { e.preventDefault(); }
            else if (key.match(/^[A-Z0-9()]$/)) handleKey(key);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [guess, status, hasAnswered]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const allPlayersAnswered = players.length === answers.length;
    const revealedAnswer = allPlayersAnswered ? answer : null;
    const answerMask = answer.replace(/[A-Z0-9]/g, '_');

    return (
        <div className="w-full flex flex-col md:flex-row gap-6 p-4 bg-[#023e8a] rounded-xl shadow-2xl">
            <div className="w-full md:w-2/3">
                <div className="bg-[#0077b6] border border-[#0077b6] rounded-xl p-6 my-6 text-xl min-h-[100px] flex items-center justify-center shadow-md">
                    <p className="text-white">{currentQuestion.definition}</p>
                </div>

                {allPlayersAnswered && (
                    <div className="my-4 p-4 bg-[#0077b6] rounded-xl shadow-md">
                        <p className="text-xl text-white">The answer was: <strong className="text-yellow-300">{revealedAnswer}</strong></p>
                        {isHost && (
                            <div className="mt-4">
                                <label className="block text-lg mb-2 text-white">Category for Next Round:</label>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={nextCategory}
                                        onChange={(e) => setNextCategory(e.target.value)}
                                        className="p-2 rounded-lg text-gray-900 text-lg bg-gray-200"
                                    >
                                        {Object.keys(QUESTIONS).map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleNextRound} className="p-2 px-4 text-lg bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg cursor-pointer shadow-sm">
                                        Next Round
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {status !== 'playing' && !allPlayersAnswered && (
                    <div className={`my-4 p-4 rounded-xl shadow-md ${status === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                        <p className="text-xl text-white font-bold">{scoreMessage}</p>
                    </div>
                )}

                {hasAnswered && !allPlayersAnswered && (
                    <p className="text-xl text-yellow-300 animate-pulse text-center my-4">Waiting for other players...</p>
                )}

                <Grid
                    guess={guess}
                    answer={revealedAnswer || answerMask}
                    status={revealedAnswer ? "reveal" : "playing"}
                />

                <Keyboard
                    onKey={handleKey}
                    onClear={handleClear}
                    onDelete={handleDelete}
                    onSubmit={handleSubmit}
                    onGiveUp={null}
                />
            </div>

            <div className="w-full md:w-1/3 p-4 bg-[#0077b6] rounded-xl shadow-md mt-6">
                <h2 className="text-2xl font-bold mb-4 border-b border-[#023e8a] pb-2 text-white">Leaderboard</h2>
                <ul className="space-y-2">
                    {players.sort((a, b) => b.score - a.score).map((p, index) => (
                        <li key={p.uid} className="flex justify-between text-lg p-3 rounded-lg bg-[#023e8a] text-white shadow-sm">
                            <span>{index + 1}. {p.nickname} {p.uid === user.uid && "(You)"}</span>
                            <span className="font-bold">{p.score}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MultiplayerGame;