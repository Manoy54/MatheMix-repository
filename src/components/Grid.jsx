// src/Grid.jsx

import React from "react";

function Grid({ guess, answer, status }) {
    const boxes = [];
    let guessIndex = 0; // Index for the 'guess' string (e.g., "WHOLENUMBER")

    // Loop through the *full* answer string (e.g., "WHOLE NUMBER")
    for (let i = 0; i < answer.length; i++) {
        const answerChar = answer[i];

        // Check for non-guessable characters (spaces, parentheses, etc.)
        if (!answerChar.match(/^[A-Z0-9]$/)) {
            if (answerChar === " ") {
                // Render a skinny spacer for a space
                boxes.push(<div key={i} className="w-8 h-16"></div>);
            } else {
                // Render the character itself (e.g., '(', ')')
                boxes.push(
                    <div key={i} className="w-16 h-16 flex justify-center items-center text-3xl font-bold uppercase">
                        {answerChar}
                    </div>
                );
            }
        } else {
            // This is a regular, guessable letter/number box
            let char = guess[guessIndex] || "";
            let boxClass =
                "w-16 h-16 border-2 border-gray-500 flex justify-center items-center text-3xl font-bold uppercase";

            // --- NEW FEATURE: Active Box Highlight ---
            if (status === 'playing' && guessIndex === guess.length) {
                boxClass += " border-blue-400 border-[3px]"; // Adds the highlight
            }

            // --- (Rest of the status logic is the same) ---
            if (status === "reveal") {
                char = answer[i];
                boxClass += " bg-blue-600 border-blue-600";
            }
            if (status === "won") {
                boxClass += " bg-green-600 border-green-600";
            } else if (status === "lost") {
                boxClass += " bg-red-600 border-red-600";
            }

            boxes.push(
                <div key={i} className={boxClass}>
                    {char}
                </div>
            );

            // Only increment the guess index for guessable boxes
            guessIndex++;
        }
    }

    return (
        <div className="flex flex-wrap justify-center items-center gap-1.5 mb-6">
            {boxes}
        </div>
    );
}

export default Grid;