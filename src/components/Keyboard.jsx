// src/components/Keyboard.jsx

import React from "react";

function Keyboard({ onKey, onClear, onDelete, onSubmit, onGiveUp }) {

    const numberRow = "1234567890()".split("");
    const row1 = "QWERTYUIOP".split("");
    const row2 = "ASDFGHJKL".split("");
    const row3 = "ZXCVBNM".split("");

    // Common style for all keys
    // White background, Blue text, nicely rounded
    const baseKeyClass =
        "flex-1 h-12 rounded-md font-bold text-lg shadow-md transition-transform active:scale-95 flex justify-center items-center select-none cursor-pointer bg-white text-blue-900 hover:bg-gray-100";

    // Style for action buttons (Enter, Del, Clear) to make them distinct
    const actionKeyClass =
        "flex-[1.5] h-12 rounded-md font-bold text-lg shadow-md transition-transform active:scale-95 flex justify-center items-center select-none cursor-pointer text-white";

    return (
        <div className="w-full max-w-3xl mx-auto mt-6 space-y-2">

            {/* 1. Number Row */}
            <div className="flex gap-1">
                {numberRow.map((key) => (
                    <button
                        key={key}
                        onClick={() => onKey(key)}
                        className={baseKeyClass}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* 2. QWERTY Row */}
            <div className="flex gap-1">
                {row1.map((key) => (
                    <button
                        key={key}
                        onClick={() => onKey(key)}
                        className={baseKeyClass}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* 3. ASDF Row */}
            <div className="flex gap-1 px-4">
                {row2.map((key) => (
                    <button
                        key={key}
                        onClick={() => onKey(key)}
                        className={baseKeyClass}
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* 4. ZXCV Row + Clear/Del */}
            <div className="flex gap-1">
                <button
                    onClick={onClear}
                    className={`${actionKeyClass} bg-red-500 hover:bg-red-600 text-sm`}
                >
                    CLR
                </button>

                {row3.map((key) => (
                    <button
                        key={key}
                        onClick={() => onKey(key)}
                        className={baseKeyClass}
                    >
                        {key}
                    </button>
                ))}

                <button
                    onClick={onDelete}
                    className={`${actionKeyClass} bg-red-500 hover:bg-red-600 text-sm`}
                >
                    DEL
                </button>
            </div>

            {/* 5. Submit / Give Up Row */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={onSubmit}
                    className="flex-[3] h-14 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xl shadow-lg transition-transform active:scale-95"
                >
                    SUBMIT
                </button>

                {/* Only render Give Up if the prop is provided (non-null) */}
                {onGiveUp && (
                    <button
                        onClick={onGiveUp}
                        className="flex-1 h-14 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-sm shadow-lg transition-transform active:scale-95"
                    >
                        GIVE UP
                    </button>
                )}
            </div>

        </div>
    );
}

export default Keyboard;