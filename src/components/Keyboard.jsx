import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';

const Keyboard = React.memo(({ onChar, onDelete, onClear, onSpace, onSubmit, onSkip, pressedKey }) => {
    const isMobile = useMobile();

    const row1 = useMemo(() => ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '-'], []);
    const row2 = useMemo(() => ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], []);
    const row3 = useMemo(() => ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], []);

    const containerClasses = isMobile
        ? "fixed bottom-0 left-0 right-0 z-[60] bg-[#023e8a]/95 backdrop-blur-2xl p-3 border-t-2 border-white/20 pb-[env(safe-area-inset-bottom,1.5rem)]"
        : "relative bg-white/10 backdrop-blur-xl p-4 rounded-2xl border-2 border-white/20 space-y-2.5";

    const rowClasses = isMobile ? "flex gap-1 justify-center mb-1.5" : "flex gap-2.5 justify-center";
    const controlKeySize = isMobile ? "px-3 h-12 text-xs" : "px-5 h-14 text-sm";
    const actionButtonSize = isMobile ? "h-11 text-xs" : "h-12 text-sm";

    return (
        <div className={isMobile ? "w-full" : "relative"}>
            {!isMobile && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#023e8a]/40 to-transparent rounded-2xl blur-xl" />
            )}

            <div className={containerClasses + (!isMobile ? " space-y-2.5" : "")}>
                {/* Row 1 */}
                <div className={rowClasses}>
                    {row1.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} isMobile={isMobile} />
                    ))}
                </div>

                {/* Row 2 */}
                <div className={rowClasses}>
                    {row2.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} isMobile={isMobile} />
                    ))}
                </div>

                {/* Row 3 */}
                <div className={rowClasses + " items-center"}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            scale: pressedKey === 'CLEAR' ? 0.95 : 1,
                            y: pressedKey === 'CLEAR' ? -2 : 0,
                        }}
                        onClick={onClear}
                        className={`${controlKeySize} text-white rounded-xl transition-all border-2 font-semibold ${pressedKey === 'CLEAR'
                            ? 'bg-white/40 border-white/50'
                            : 'bg-white/20 hover:bg-white/30 border-white/30'
                            }`}
                    >
                        {isMobile ? 'CLR' : 'CLEAR'}
                    </motion.button>
                    {row3.map((key) => (
                        <KeyButton key={key} char={key} onClick={onChar} isPressed={pressedKey === key} isMobile={isMobile} />
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                            scale: pressedKey === 'DELETE' ? 0.95 : 1,
                            y: pressedKey === 'DELETE' ? -2 : 0,
                        }}
                        onClick={onDelete}
                        className={`${controlKeySize} text-white rounded-xl transition-all border-2 font-semibold ${pressedKey === 'DELETE'
                            ? 'bg-white/40 border-white/50'
                            : 'bg-white/20 hover:bg-white/30 border-white/30'
                            }`}
                    >
                        {isMobile ? 'DEL' : 'DELETE'}
                    </motion.button>
                </div>

                {/* Action Buttons */}
                <div className={`flex ${isMobile ? 'gap-2 pt-2' : 'gap-3 pt-1'}`}>
                    <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onSkip}
                        className={`flex-1 ${actionButtonSize} bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all border-2 border-orange-300/50 font-semibold`}
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
                        className={`flex-1 ${actionButtonSize} text-white rounded-xl transition-all border-2 font-semibold flex items-center justify-center gap-2 ${pressedKey === 'ENTER'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-200'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 border-green-300/50'
                            }`}
                    >
                        <span>SUBMIT</span>
                        <Check className={isMobile ? "w-4 h-4" : "w-5 h-5"} strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
});

// Key Button Component
const KeyButton = React.memo(({ char, onClick, isPressed, isMobile }) => {
    const keySizeClass = isMobile ? "flex-1 h-12 text-base" : "w-14 h-14 text-xl";

    return (
        <motion.button
            whileHover={!isMobile ? { scale: 1.1, y: -2 } : {}}
            whileTap={{ scale: 0.95 }}
            animate={{
                scale: isPressed ? 0.95 : 1,
                y: isPressed ? -2 : 0,
            }}
            onClick={() => onClick(char)}
            className={`${keySizeClass} bg-gradient-to-br rounded-lg transition-all border-2 text-white font-bold ${isPressed
                ? 'from-[#48cae4] to-[#0077b6] border-cyan-300'
                : 'from-[#0077b6] to-[#023e8a] hover:from-[#48cae4] hover:to-[#0077b6] border-white/30'
                }`}
            transition={{ duration: 0.1 }}
        >
            {char}
        </motion.button>
    );
});

export default Keyboard;
