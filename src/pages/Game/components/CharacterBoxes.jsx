import React, { useMemo, useRef, useEffect } from 'react';
import { CharacterBox } from './CharacterBox';

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

        // Calculate effective width regardless of containerWidth state
        const screenW = (typeof window !== 'undefined') ? window.innerWidth : 360;

        // For mobile, we verify against screen width if containerRef hasn't measured yet
        let effectiveContainerWidth = containerWidth;
        if (isMobile && !effectiveContainerWidth) {
            // Fallback: Screen width minus estimated app padding (32px for px-4, + safety)
            effectiveContainerWidth = screenW - 32;
        }

        if (effectiveContainerWidth > 0) {
            let maxWordWidthNeeded = 0;
            // Get longest word char count for strict clamping
            const maxWordCharCount = Math.max(...words.map(w => w.length));

            words.forEach(word => {
                const width = (word.length * BASE_BOX_WIDTH) + ((word.length - 1) * GAP);
                if (width > maxWordWidthNeeded) maxWordWidthNeeded = width;
            });

            // Safe Padding: 60px total horizontal padding (px-4 Game + px-2 wrapper + strict safety)
            const SAFE_PADDING = isMobile ? 60 : 64;
            const availableWidth = effectiveContainerWidth - SAFE_PADDING;

            // 1. General Scale based on longest line
            if (maxWordWidthNeeded > availableWidth) {
                scale = availableWidth / maxWordWidthNeeded;
            }

            // 2. Strict Per-Char Clamp (Mobile Only) to absolutely prevent overflow for long single words
            if (isMobile && maxWordCharCount > 0) {
                // Formula: The word must fit in available width.
                // (charCount * boxWidth) + ((charCount - 1) * gap) <= availableWidth
                // boxWidth * charCount + gap * charCount - gap <= availableWidth
                // boxWidth <= (availableWidth + gap) / charCount - gap
                // Conservative approximation: boxWidth <= (availableWidth / charCount) - gap

                // Note: boxWidth = BASE_BOX_WIDTH * (scale currently)
                // We need to find if we need to reduce scale further.

                // Let's solve for maxPermissibleBoxWidth directly:
                const maxPermissibleBoxWidth = (availableWidth - ((maxWordCharCount - 1) * GAP)) / maxWordCharCount;

                // The implicit scaled box width:
                const currentScaledBoxWidth = BASE_BOX_WIDTH * scale;

                if (currentScaledBoxWidth > maxPermissibleBoxWidth) {
                    scale = maxPermissibleBoxWidth / BASE_BOX_WIDTH;
                }
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
            className={`flex flex-wrap items-center justify-center ${isMobile ? 'gap-[6px]' : 'gap-x-8 gap-y-6'} max-w-3xl mx-auto min-h-[120px] w-full px-2`}
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
