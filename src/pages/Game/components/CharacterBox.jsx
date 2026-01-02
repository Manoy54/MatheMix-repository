import React from 'react';
import { motion } from 'framer-motion';

export const CharacterBox = React.memo(({ inputChar, index, answerStatus, boxWidth, boxHeight, fontSize, isMobile, isActive, onBoxClick, onInput, onBackspace, inputRef }) => {
    const getAnimation = () => {
        if (answerStatus === 'correct') return { scale: [1, 1.05, 1], rotate: [0, -2, 2, -2, 0] };
        if (answerStatus === 'wrong') return { x: [0, -10, 10, -10, 10, 0] };
        if (answerStatus === 'revealed') return { rotateX: [0, 90, 0], transition: { delay: index * 0.1, duration: 0.6 } };
        return { y: 0, x: 0, scale: 1, rotate: 0 };
    };

    const getBackgroundColor = () => {
        if (answerStatus === 'correct') return 'bg-gradient-to-br from-green-400 to-emerald-500';
        if (answerStatus === 'wrong') return 'bg-gradient-to-br from-red-400 to-red-600';
        if (answerStatus === 'revealed') return 'bg-gradient-to-br from-orange-400 to-orange-600';
        return 'bg-white/20';
    };

    if (isMobile) {
        // Mobile View: Plain Divs, No Framer Motion, No Blurs, No Shadows
        const bgColor = (() => {
            if (answerStatus === 'correct') return 'bg-green-500/80';
            if (answerStatus === 'wrong') return 'bg-red-500/80';
            if (answerStatus === 'revealed') return 'bg-orange-500/80';
            return 'bg-white/20';
        })();

        const borderColor = (inputChar && inputChar !== ' ') ? 'border-white/60' : 'border-white/20';

        return (
            <div
                className="relative"
                style={{ width: boxWidth, height: boxHeight }}
                onClick={onBoxClick}
            >
                <input
                    ref={inputRef}
                    value={inputChar === ' ' ? '' : inputChar}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                            // Detected deletion (mobile backspace often just clears)
                            onBackspace();
                        } else {
                            // Detected input (taking the last char handled by parent logic mostly, but passing raw val)
                            onInput(val);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                            onBackspace();
                        }
                    }}
                    className={`absolute inset-0 w-full h-full text-center bg-transparent border-none outline-none text-white font-bold p-0 m-0 z-20 ${answerStatus ? 'pointer-events-none' : ''}`}
                    style={{
                        fontSize: fontSize,
                        caretColor: 'white',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        textAlign: 'center'
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                // Removed maxLength to allow 'typing over' a character
                />
                <div
                    className={`absolute inset-0 w-full h-full ${bgColor} border-2 rounded-xl flex items-center justify-center transition-colors duration-200 pointer-events-none ${borderColor}`}
                >
                    {/* Clean solid box, no blur, no shadow */}
                </div>
            </div>
        );
    }

    // Desktop View
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, x: 0, ...getAnimation() }}
            transition={{ y: { delay: 0.3 + index * 0.03 }, opacity: { delay: 0.3 + index * 0.03 } }}
            className="relative perspective-1000"
            style={{ width: boxWidth, height: boxHeight }}
        >
            <div className={`absolute inset-0 rounded-xl blur-md ${answerStatus === 'correct' ? 'bg-green-400/50' : answerStatus === 'wrong' ? 'bg-red-400/50' : 'bg-cyan-400/30'}`} />
            <motion.div
                className={`relative w-full h-full ${getBackgroundColor()} backdrop-blur-sm border-2 rounded-xl flex items-center justify-center shadow-xl transition-colors duration-300`}
                style={{
                    borderColor: inputChar ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: fontSize
                }}
            >
                <span className="text-white font-bold">
                    {inputChar}
                </span>
            </motion.div>
        </motion.div>
    );
});
