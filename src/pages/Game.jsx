// src/pages/Game.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data.js"; // Fixed path (../)
import Grid from "../components/Grid.jsx"; // Fixed path (../components)
import Keyboard from "../components/Keyboard.jsx"; // Fixed path (../components)

const getRandomQuestion = (category) => {
    const questions = QUESTIONS[category];
    return questions[Math.floor(Math.random() * questions.length)];
};

// Added default category to prevent crash if prop is missing
function Game({ category = "Number & Algebra", onGameEnd }) {
    const navigate = useNavigate();
    const [question, setQuestion] = useState(getRandomQuestion(category));
    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState("playing");

    const answer = question.answer.toUpperCase();
    const pureAnswer = answer.replace(/[^A-Z0-9]/g, '');
    const numGuessableBoxes = pureAnswer.length;

    const handleKey = (key) => {
        if (status !== "playing") return;
        if (guess.length < numGuessableBoxes) {
            setGuess(guess + key);
        }
    };

    const handleClear = () => {
        if (status !== "playing") return;
        setGuess("");
    };

    const handleDelete = () => {
        if (status !== "playing") return;
        setGuess(guess.slice(0, -1));
    };

    const handleSubmit = () => {
        if (status !== "playing" || guess.length !== numGuessableBoxes) return;

        if (guess === pureAnswer) {
            setStatus("won");
            // We don't need onGameEnd logic for simple solo play right now
        } else {
            setStatus("lost");
        }
    };

    const handleGiveUp = () => {
        if (status !== "playing") return;
        setStatus("reveal");
    };

    const handleNext = () => {
        setQuestion(getRandomQuestion(category));
        setGuess("");
        setStatus("playing");
    };

    const handleKeyDown = useCallback(
        (e) => {
            const key = e.key.toUpperCase();
            if (key === "ENTER") {
                if (status === "playing") handleSubmit();
                else handleNext();
            } else if (key === "BACKSPACE") {
                handleDelete();
            } else if (key === " ") {
                e.preventDefault();
            } else if (key.match(/^[A-Z0-9()]$/)) {
                handleKey(key);
            }
        },
        [guess, status]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="w-full p-4 bg-blue-700 rounded-xl shadow-2xl">
            <button
                onClick={() => navigate("/mode-select")}
                className="bg-transparent text-yellow-400 hover:text-white text-lg cursor-pointer float-left mb-4 font-semibold"
            >
                &larr; Back to Menu
            </button>

            <div className="bg-blue-500 border border-blue-400 rounded-xl p-6 my-6 text-xl min-h-[100px] flex items-center justify-center clear-both shadow-md">
                <p className="text-white">{question.definition}</p>
            </div>

            <Grid guess={guess} answer={answer} status={status} />

            {/* --- CONDITIONAL RENDERING --- */}

            {status === "playing" ? (
                // 1. If Playing: Show Keyboard
                <Keyboard
                    onKey={handleKey}
                    onClear={handleClear}
                    onDelete={handleDelete}
                    onSubmit={handleSubmit}
                    onGiveUp={handleGiveUp}
                />
            ) : (
                // 2. If Not Playing: Show Inline Result Box + Next Button
                // (Replaces the keyboard area)
                <div className={`mt-8 p-6 rounded-xl text-center shadow-lg border-2 border-white ${status === "won" ? "bg-green-600" : "bg-red-600"}`}>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {status === "won" ? "Correct! 🎉" : "Game Over"}
                    </h2>

                    {/* Show answer if lost or gave up */}
                    {(status === "reveal" || status === "lost") && (
                        <p className="text-lg text-white mb-4">The answer was: <strong>{answer}</strong></p>
                    )}

                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-white text-blue-900 font-bold rounded-lg text-xl hover:bg-gray-200 transition-colors shadow-md mt-4 inline-block"
                    >
                        Next Question &rarr;
                    </button>
                </div>
            )}

        </div>
    );
}

export default Game;