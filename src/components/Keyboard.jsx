import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Keyboard({ onChar, onDelete, onClear, onSpace, onSubmit, onSkip, pressedKey }) {
    const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '-'];
    const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

    return (
        <div className="relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#023e8a]/40 to-transparent rounded-2xl blur-xl" />

            <div className="relative bg-white/10 backdrop-blur-xl p-4 rounded-2xl border-2 border-white/20 shadow-2xl space-y-2.5">
                {/* Row 1 */}
                <div className="flex gap-2.5 justify-center">
                    {row1.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} />
                    ))}
                </div>

                {/* Row 2 */}
                <div className="flex gap-2.5 justify-center">
                    {row2.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} />
                    ))}
                </div>

                {/* Row 3 */}
                <div className="flex gap-2.5 justify-center items-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            scale: pressedKey === 'CLEAR' ? 0.95 : 1,
                            y: pressedKey === 'CLEAR' ? -2 : 0,
                        }}
                        onClick={onClear}
                        className={`px-5 h-14 text-white text-sm rounded-xl shadow-lg transition-all border-2 font-semibold ${
                            pressedKey === 'CLEAR'
                                ? 'bg-white/40 border-white/50'
                                : 'bg-white/20 hover:bg-white/30 border-white/30'
                        }`}
                    >
                        CLEAR
                    </motion.button>
                    {row3.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} />
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            scale: pressedKey === 'DELETE' ? 0.95 : 1,
                            y: pressedKey === 'DELETE' ? -2 : 0,
                        }}
                        onClick={onDelete}
                        className={`px-5 h-14 text-white text-sm rounded-xl shadow-lg transition-all border-2 font-semibold ${
                            pressedKey === 'DELETE'
                                ? 'bg-white/40 border-white/50'
                                : 'bg-white/20 hover:bg-white/30 border-white/30'
                        }`}
                    >
                        DEL
                    </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                    <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onSkip}
                        className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm rounded-xl shadow-xl shadow-orange-500/40 transition-all border-2 border-orange-300/50 font-semibold"
                    >
                        GIVE UP
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        animate={{
                            scale: pressedKey === 'ENTER' ? 0.97 : 1,
                            y: pressedKey === 'ENTER' ? -2 : 0,
                        }}
                        onClick={onSubmit}
                        className={`flex-1 h-12 text-white text-sm rounded-xl shadow-xl transition-all border-2 font-semibold flex items-center justify-center gap-2 ${
                            pressedKey === 'ENTER'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-200 shadow-green-400/60'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 border-green-300/50 shadow-green-500/40'
                        }`}
                    >
                        <span>SUBMIT</span>
                        <Check className="w-5 h-5" strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

// Key Button Component
function KeyButton({ char, onClick, isPressed }) {
    return (
        <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            animate={{
                scale: isPressed ? 0.95 : 1,
                y: isPressed ? -2 : 0,
            }}
            onClick={() => onClick(char)}
            className={`w-14 h-14 bg-gradient-to-br rounded-xl shadow-lg transition-all border-2 text-white text-xl font-bold ${
                isPressed
                    ? 'from-[#48cae4] to-[#0077b6] border-cyan-300 shadow-cyan-400/50'
                    : 'from-[#0077b6] to-[#023e8a] hover:from-[#48cae4] hover:to-[#0077b6] border-white/30'
            }`}
            transition={{ duration: 0.1 }}
        >
            {char}
        </motion.button>
    );
}