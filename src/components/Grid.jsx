// src/components/Grid.jsx

import React from "react";

function Grid({ guess, answer, status }) {
    const boxes = [];
    let guessIndex = 0; // Tracks which letter of the user's guess we are displaying

    // Loop through the FULL answer string (including spaces)
    for (let i = 0; i < answer.length; i++) {
        const answerChar = answer[i];

        // 1. IF IT'S A SPACE -> Render a gap (Visual separation)
        if (answerChar === " ") {
            boxes.push(
                <div key={i} className="w-6 h-16 md:w-8 flex items-center justify-center">
                    {/* Optional: A dash or just empty space */}
                </div>
            );
            // We do NOT increment guessIndex here, so the next user letter goes to the next box
        }
        // 2. IF IT'S A SYMBOL (like - or .) -> Show it automatically
        else if (!answerChar.match(/^[A-Z0-9]$/)) {
            boxes.push(
                <div key={i} className="w-10 h-14 md:w-14 md:h-16 flex justify-center items-center text-2xl font-bold text-white">
                    {answerChar}
                </div>
            );
        }
        // 3. IF IT'S A LETTER -> Render a Box
        else {
            let char = guess[guessIndex] || "";

            // Default Box Style
            let boxClass = "w-10 h-14 md:w-14 md:h-16 border-2 border-white/20 bg-white/10 rounded-lg flex justify-center items-center text-2xl md:text-3xl font-bold text-white transition-all";

            // Highlight the box the user is about to type in
            if (status === 'playing' && guessIndex === guess.length) {
                boxClass += " border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.5)] scale-110 bg-white/20";
            }

            // Status Colors
            if (status === "reveal") {
                char = answer[i];
                boxClass += " bg-blue-500 border-blue-400";
            } else if (status === "won") {
                boxClass += " bg-green-500 border-green-400";
            } else if (status === "lost") {
                boxClass += " bg-red-500 border-red-400";
            } else if (char) {
                // User has typed a letter here
                boxClass += " border-white bg-white/30";
            }

            boxes.push(
                <div key={i} className={boxClass}>
                    {char}
                </div>
            );

            // Move to the next letter of the user's guess
            guessIndex++;
        }
    }

    return (
        <div className="flex flex-wrap justify-center items-center gap-1.5 mb-4 px-2">
            {boxes}
        </div>
    );
}

export default Grid;