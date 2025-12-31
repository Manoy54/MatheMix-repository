import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { useMobile } from '../../hooks/useMobile';
import StandardHeader from '../../components/StandardHeader';
import Keyboard from '../../components/Keyboard.jsx';

import { useGameLogic } from './hooks/useGameLogic';
import { QuestionStats } from './components/QuestionStats';
import { QuestionCard } from './components/QuestionCard';
import { CharacterBoxes } from './components/CharacterBoxes';
import { GameModals } from './components/GameModals';
import { MobileControls } from './components/MobileControls';

export default function Game({ onGameEnd, onOpenSidebar }) {
    const isMobile = useMobile();

    const {
        category,
        currentQ,
        loadingQuestions,
        input,
        streak,
        bestStreak,
        questionNumber,
        showGiveUpModal,
        isGameOver,
        answerStatus,
        pressedKey,
        activeBoxIndex,
        hiddenInputRef,
        keyboardContainerRef,
        answer,
        navigate,
        handleChar,
        handleDelete,
        handleClear,
        handleSubmit,
        handleSkip,
        confirmGiveUp,
        cancelGiveUp,
        resetGame,
        handleBoxInput,
        handleBoxBackspaceNav,
        setActiveBoxIndex,
        handleGameAreaClick
    } = useGameLogic(onGameEnd);

    // --- Container Measurement for CharacterBoxes ---
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    if (loadingQuestions) {
        return (
            <div className="min-h-screen bg-[#023e8a] md:bg-gradient-to-br md:from-[#023e8a] md:via-[#0077b6] md:to-[#0096c7] flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400 md:blur-2xl opacity-20 animate-pulse hidden md:block" />
                    <Loader2 className="w-16 h-16 text-white animate-spin relative z-10" />
                </div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white font-bold italic mt-6 tracking-widest uppercase text-sm"
                >
                    Fetching challenges...
                </motion.p>
            </div>
        );
    }

    if (!currentQ) {
        return (
            <div className="min-h-screen bg-[#023e8a] md:bg-gradient-to-br md:from-[#023e8a] md:via-[#0077b6] md:to-[#0096c7] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-white/40 mb-4" />
                <h1 className="text-white text-2xl font-black mb-2">Oops! No questions found</h1>
                <p className="text-white/60 mb-6">We couldn't find any questions for this category.</p>
                <button onClick={() => navigate('/category-select')} className="px-8 py-3 bg-white/10 active:bg-white/20 md:hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={`px-4 pb-3 h-full flex flex-col ${isMobile ? 'pb-[50px] pt-[env(safe-area-inset-top)]' : ''}`} onClick={handleGameAreaClick}>

            <GameModals
                showGiveUpModal={showGiveUpModal}
                isGameOver={isGameOver}
                streak={streak}
                bestStreak={bestStreak}
                onCancelGiveUp={cancelGiveUp}
                onConfirmGiveUp={confirmGiveUp}
                onResetGame={resetGame}
            />

            <StandardHeader onOpenSidebar={onOpenSidebar} subtitle={`Solo Mode - ${category}`} />

            <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
                <div className={`mx-auto ${isMobile ? 'w-full px-2 space-y-[10px]' : 'w-[85%] md:w-full max-w-5xl space-y-4'}`}>
                    <QuestionStats
                        questionNumber={questionNumber}
                        streak={streak}
                        bestStreak={bestStreak}
                    />

                    <QuestionCard
                        questionNumber={questionNumber}
                        category={category}
                        definition={currentQ.definition}
                        isMobile={isMobile}
                    />

                    <div className="relative" ref={containerRef}>
                        <CharacterBoxes
                            answer={answer}
                            input={input}
                            answerStatus={answerStatus}
                            isMobile={isMobile}
                            containerWidth={containerWidth}
                            activeBoxIndex={activeBoxIndex}
                            onBoxClick={setActiveBoxIndex}
                            onBoxInput={handleBoxInput}
                            onBoxBackspace={handleBoxBackspaceNav}
                        />
                    </div>

                    {!isMobile && (
                        <motion.div
                            ref={keyboardContainerRef}
                            className=""
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                pointerEvents: (showGiveUpModal || isGameOver) ? 'none' : 'auto',
                                zIndex: (showGiveUpModal || isGameOver) ? 40 : 60,
                                filter: (showGiveUpModal || isGameOver) ? 'blur(2px)' : 'none'
                            }}
                        >
                            <Keyboard
                                onChar={handleChar}
                                onDelete={handleDelete}
                                onClear={handleClear}
                                onSpace={() => { }} // handleSpace was empty
                                onSubmit={handleSubmit}
                                onSkip={handleSkip}
                                pressedKey={pressedKey}
                            />
                        </motion.div>
                    )}
                    {isMobile && (
                        <MobileControls
                            onSkip={handleSkip}
                            onSubmit={handleSubmit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
