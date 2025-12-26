import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export const CharacterBoxes = React.memo(({ answer, input, answerStatus, isMobile, containerWidth, activeBoxIndex, onBoxClick, onBoxInput, onBoxBackspace }) => {
    const words = useMemo(() => answer.split(' '), [answer]);
    // Allow sparse input for mapping
    const inputCharsOnly = useMemo(() => {
        const chars = input.split('');
        // Ensure we respect spaces/indices
        return chars;
    }, [input]);

    // Refs for all inputs
    const inputsRef = useRef([]);

    // Auto-focus active box input on mobile
    useEffect(() => {
        if (isMobile && inputsRef.current[activeBoxIndex]) {
            inputsRef.current[activeBoxIndex].focus();
        }
    }, [activeBoxIndex, isMobile]);

    const layout = useMemo(() => {
        const GAP = isMobile ? 4 : 8;
        const BASE_BOX_WIDTH = isMobile ? 32 : 48;
        const BASE_BOX_HEIGHT = isMobile ? 40 : 64;
        const BASE_FONT_SIZE = isMobile ? 18 : 30;

        let scale = 1;
        if (containerWidth > 0) {
            let maxWordWidthNeeded = 0;
            words.forEach(word => {
                const width = (word.length * BASE_BOX_WIDTH) + ((word.length - 1) * GAP);
                if (width > maxWordWidthNeeded) maxWordWidthNeeded = width;
            });

            // Available width: measurements usually include padding if box-sizing border-box.
            // But we want content width.
            // Mobile Safeguard: Trust window width if container seems suspiciously wide (or 0).
            // This prevents the container from stretching to fit overflow, defeating the check.
            const effectiveContainerWidth = (isMobile && typeof window !== 'undefined')
                ? (containerWidth > 0 ? Math.min(containerWidth, window.innerWidth) : window.innerWidth)
                : containerWidth;

            // Subtract Safe Padding:
            // Game px-4 (32) + Wrapper px-2 (16) = 48px strict minimum.
            // Using 50px to be safe.
            const availableWidth = effectiveContainerWidth - (isMobile ? 50 : 64);

            if (maxWordWidthNeeded > availableWidth) {
                scale = availableWidth / maxWordWidthNeeded;
            }

            // Heuristic: If the answer is long, shrink a bit more to prevent edge-crowding
            // and ensure better aesthetics on small screens.
            if (answer.length > 8) {
                scale *= 0.9;
            }

            // Limit scale range
            scale = Math.max(0.3, Math.min(1, scale));
        }

        return {
            boxWidth: BASE_BOX_WIDTH * scale,
            boxHeight: BASE_BOX_HEIGHT * scale,
            fontSize: Math.max(10, BASE_FONT_SIZE * scale),
            currentGap: GAP * scale
        };
    }, [words, isMobile, containerWidth]);

    let globalInputIndex = 0;

    return (
        <div
            className={`flex flex-wrap items-center justify-center ${isMobile ? 'gap-[10px]' : 'gap-x-8 gap-y-6'} max-w-5xl mx-auto min-h-[120px] w-full px-2`}
        >
            {words.map((word, wordIndex) => (
                <div
                    key={`word-${wordIndex}`}
                    className="flex flex-nowrap justify-center"
                    style={{ gap: layout.currentGap }}
                >
                    {word.split('').map((char, charIndex) => {
                        const inputChar = inputCharsOnly[globalInputIndex] || '';
                        const currentGlobalIndex = globalInputIndex;
                        globalInputIndex++;

                        return (
                            <CharacterBox
                                key={`${wordIndex}-${charIndex}`}
                                inputChar={inputChar}
                                index={currentGlobalIndex}
                                answerStatus={answerStatus}
                                boxWidth={layout.boxWidth}
                                boxHeight={layout.boxHeight}
                                fontSize={layout.fontSize}
                                isMobile={isMobile}
                                isActive={isMobile && activeBoxIndex === currentGlobalIndex}
                                onBoxClick={() => onBoxClick && onBoxClick(currentGlobalIndex)}
                                onInput={(val) => onBoxInput && onBoxInput(currentGlobalIndex, val)}
                                onBackspace={() => onBoxBackspace && onBoxBackspace(currentGlobalIndex)}
                                inputRef={isMobile ? (el) => inputsRef.current[currentGlobalIndex] = el : null}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

const CharacterBox = React.memo(({ inputChar, index, answerStatus, boxWidth, boxHeight, fontSize, isMobile, isActive, onBoxClick, onInput, onBackspace, inputRef }) => {
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
