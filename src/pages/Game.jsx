// src/pages/Game.jsx

import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Sparkles, Flame, Trophy, Brain } from 'lucide-react'; // Removed ArrowLeft import
import { motion, AnimatePresence } from 'framer-motion';
import { QUESTIONS } from '../data.js';
import Keyboard from '../components/Keyboard.jsx';

export default function Game({ onGameEnd }) {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Get Category & Questions
    const category = location.state?.category || "Number & Algebra";
    const categoryQuestions = QUESTIONS[category] || [];

    const getRandomQuestion = () => {
        if (categoryQuestions.length === 0) return { definition: "No questions found.", answer: "ERROR" };
        return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    };

    // 2. State Management
    const [currentQ, setCurrentQ] = useState(() => getRandomQuestion());
    const [input, setInput] = useState('');
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [answerStatus, setAnswerStatus] = useState(null); // 'correct', 'wrong', or null
    const [pressedKey, setPressedKey] = useState(null); // Track which key is being pressed

    const answer = currentQ.answer.toUpperCase();
    const answerWithSpaces = answer.replace(/ /g, ''); // Remove spaces from answer for comparison
    const displaySlots = answer.split(''); // Keep spaces for display

    // Memoize math symbols so they don't recreate on every render
    const mathSymbols = useMemo(() => {
        const symbols = ['+', '−', '×', '÷', '=', 'π', '∑', '√', '∞', 'α', 'β', 'θ'];
        return symbols.map((symbol, i) => ({
            symbol,
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            fontSize: Math.random() * 80 + 60,
            duration: Math.random() * 10 + 15,
            xOffset: Math.random() * 30 - 15,
            yOffset: Math.random() * 30 - 15,
        }));
    }, []); // Empty dependency array means this only runs once

    // 3. Handlers - Use useCallback to prevent recreating functions
    const handleChar = React.useCallback((char) => {
        setInput(prev => {
            // Count only non-space characters in input
            const nonSpaceInput = prev.replace(/ /g, '');
            if (nonSpaceInput.length < answerWithSpaces.length) {
                return prev + char;
            }
            return prev;
        });
    }, [answerWithSpaces.length]);

    const handleSpace = () => {
        // Space functionality removed as spaces are auto-inserted
    };

    const handleClear = React.useCallback(() => setInput(''), []);
    const handleDelete = React.useCallback(() => setInput(prev => prev.slice(0, -1)), []);

    const handleSubmit = React.useCallback(() => {
        // Compare without spaces
        const inputNoSpaces = input.replace(/ /g, '');
        const answerNoSpaces = answer.replace(/ /g, '');

        if (inputNoSpaces.toUpperCase() === answerNoSpaces) {
            // Correct answer
            setAnswerStatus('correct');
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
            if (onGameEnd) onGameEnd(true);

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setAnswerStatus(null);
                nextQuestion();
            }, 2000);
        } else {
            // Wrong answer
            setAnswerStatus('wrong');
            setStreak(0);
            if (onGameEnd) onGameEnd(false);
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
                setAnswerStatus(null);
            }, 1000); // Reduced from 2000ms to 1000ms
        }
    }, [input, answer, streak, bestStreak, onGameEnd]);

    const handleSkip = () => {
        setAnswerStatus('wrong');
        setStreak(0);
        if (onGameEnd) onGameEnd(false);
        setShowError(true);
        setTimeout(() => {
            setShowError(false);
            setAnswerStatus(null);
            nextQuestion();
        }, 1500);
    };

    const nextQuestion = () => {
        setQuestionNumber(prev => prev + 1);
        setCurrentQ(getRandomQuestion());
        setInput('');
    };

    // 4. Physical Keyboard Support
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent default for keys we handle
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
                e.preventDefault();
            }

            // Handle letter keys and dash
            if (e.key.length === 1 && (/[a-zA-Z]/.test(e.key) || e.key === '-')) {
                const key = e.key.toUpperCase();
                setPressedKey(key);
                handleChar(key);
                setTimeout(() => setPressedKey(null), 150);
            }
            // Handle backspace/delete
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                setPressedKey('DELETE');
                handleDelete();
                setTimeout(() => setPressedKey(null), 150);
            }
            // Handle enter key for submit
            else if (e.key === 'Enter') {
                setPressedKey('ENTER');
                handleSubmit();
                setTimeout(() => setPressedKey(null), 150);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleChar, handleDelete, handleSubmit]); // Use stable function references

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7]">

            {/* --- Animated background elements --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {mathSymbols.map((item) => (
                    <motion.div
                        key={`symbol-${item.id}`}
                        className="absolute text-white/10 select-none"
                        style={{
                            left: `${item.left}%`,
                            top: `${item.top}%`,
                            fontSize: `${item.fontSize}px`,
                        }}
                        animate={{
                            y: [0, item.yOffset, 0],
                            x: [0, item.xOffset, 0],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: item.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatType: "loop",
                        }}
                    >
                        {item.symbol}
                    </motion.div>
                ))}

                {/* Glowing orbs */}
                <motion.div
                    className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
                />
                <motion.div
                    className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
                />
            </div>

            {/* Dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />

            {/* --- Success/Error Notifications --- */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, scale: 0.5 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -100, scale: 0.5 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-green-500/50 border-2 border-green-300/50 flex items-center gap-3">
                            <span className="text-xl">Correct! Streak +1 🔥</span>
                        </div>
                    </motion.div>
                )}
                {showError && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, scale: 0.5 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -100, scale: 0.5 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-red-500/50 border-2 border-red-300/50 flex items-center gap-3">
                            <span className="text-xl">Streak Reset! Keep trying!</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 container mx-auto px-4 py-3 h-screen flex flex-col">

                {/* --- Header --- */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between mb-3 flex-shrink-0"
                >
                    <div className="flex items-center gap-2">
                        {/* REMOVED BACK BUTTON HERE */}
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur-lg opacity-50" />
                            <div className="relative bg-gradient-to-br from-white/20 to-white/10 p-2 rounded-xl border-2 border-white/30 backdrop-blur-sm">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>
                        <div>
                            <h1 className="text-white flex items-center gap-2 text-xl">
                                Mathemix
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                </motion.div>
                            </h1>
                            <p className="text-white/60 text-xs">Solo Mode - {category}</p>
                        </div>
                    </div>
                </motion.div>

                {/* --- Main Game Area - CENTERED --- */}
                <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
                    <div className="w-full max-w-5xl space-y-4">

                        {/* Stats Cards - Above Question */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center justify-between"
                        >
                            {/* Question Number - Left */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                                <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                                    <Brain className="w-4 h-4 text-cyan-300" />
                                    <div>
                                        <div className="text-white/70 text-xs">Question</div>
                                        <div className="text-white text-xl">#{questionNumber}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Streak Stats - Right */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur-lg opacity-60" />

                                    {/* Enhanced flame effects when streak > 0 */}
                                    {streak > 0 && (
                                        <>
                                            {/* 12 Animated Flame Particles - Rising upward (doubled from 6) */}
                                            {[...Array(12)].map((_, i) => {
                                                const randomDelay = i * 0.2;
                                                const randomX = (Math.random() - 0.5) * 80;
                                                const isOrange = i % 2 === 0;
                                                const isLarge = i % 3 === 0; // Every 3rd particle is larger

                                                return (
                                                    <motion.div
                                                        key={`particle-${i}`}
                                                        className={`absolute bottom-0 left-1/2 ${
                                                            isLarge ? 'w-5 h-5' : 'w-4 h-4'
                                                        } rounded-full ${
                                                            isOrange
                                                                ? 'bg-gradient-to-t from-orange-500 to-red-500'
                                                                : 'bg-gradient-to-t from-yellow-400 to-orange-400'
                                                        }`}
                                                        style={{
                                                            boxShadow: isOrange
                                                                ? '0 0 20px rgba(251, 146, 60, 1)'
                                                                : '0 0 20px rgba(250, 204, 21, 1)',
                                                        }}
                                                        animate={{
                                                            y: [-10, -100],
                                                            x: [0, randomX],
                                                            opacity: [1, 0],
                                                            scale: [1, 0.3],
                                                        }}
                                                        transition={{
                                                            duration: 2.5,
                                                            repeat: Infinity,
                                                            ease: "easeOut",
                                                            delay: randomDelay,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* Streak Card with Enhanced Pulsing Glow */}
                                    <motion.div
                                        className="relative bg-gradient-to-br from-orange-500 to-red-600 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-orange-300/50 flex items-center gap-2"
                                        animate={streak > 0 ? {
                                            boxShadow: [
                                                '0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6), 0 10px 40px rgba(251, 146, 60, 0.5)',
                                                '0 0 60px rgba(251, 146, 60, 1), 0 0 120px rgba(239, 68, 68, 0.9), 0 10px 60px rgba(251, 146, 60, 0.8)',
                                                '0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6), 0 10px 40px rgba(251, 146, 60, 0.5)',
                                            ],
                                        } : {
                                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        {/* Animated Flame Icon */}
                                        <motion.div
                                            animate={streak > 0 ? {
                                                rotate: [-5, 5, -5, 5, -5, 0],
                                                scale: [1, 1.2, 1, 1.15, 1],
                                            } : {}}
                                            transition={{
                                                duration: 0.8,
                                                repeat: Infinity,
                                                repeatDelay: 1.5,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            <Flame className="w-4 h-4 text-white drop-shadow-lg" />
                                        </motion.div>
                                        <div>
                                            <div className="text-orange-100 text-xs">Streak</div>
                                            <motion.div
                                                className="text-white text-xl font-bold"
                                                key={streak}
                                                initial={{ scale: 1 }}
                                                animate={streak > 0 ? {
                                                    scale: [1, 1.3, 1],
                                                } : {}}
                                                transition={{
                                                    duration: 0.4,
                                                }}
                                            >
                                                {streak}
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                                        <Trophy className="w-4 h-4 text-yellow-300" />
                                        <div>
                                            <div className="text-white/70 text-xs">Best</div>
                                            <div className="text-white text-xl">{bestStreak}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Question Card */}
                        <motion.div
                            key={questionNumber}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-2xl blur-xl" />
                            <div className="relative bg-white/15 backdrop-blur-xl p-5 rounded-2xl border-2 border-white/30 shadow-2xl">
                                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] px-4 py-1 rounded-full shadow-lg text-sm">
                                    Question #{questionNumber}
                                </div>
                                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs border border-white/30">
                                    {category}
                                </div>
                                <p className="text-white text-lg leading-relaxed mt-6 text-center">
                                    {currentQ.definition}
                                </p>
                            </div>
                        </motion.div>

                        {/* Answer Input Boxes */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center items-center gap-6 flex-wrap max-w-5xl mx-auto"
                        >
                            {(() => {
                                // Split answer into words
                                const words = answer.split(' ');
                                const inputCharsOnly = input.split(''); // Input without tracking spaces
                                let globalInputIndex = 0;

                                return words.map((word, wordIndex) => (
                                    <div key={`word-${wordIndex}`} className="flex gap-2 items-center">
                                        {word.split('').map((char, charIndex) => {
                                            const inputChar = inputCharsOnly[globalInputIndex] || '';
                                            const currentGlobalIndex = globalInputIndex;
                                            globalInputIndex++;

                                            // Determine animation based on answer status
                                            const getAnimation = () => {
                                                if (answerStatus === 'correct') {
                                                    return {
                                                        scale: [1, 1.05, 1],
                                                        rotate: [0, -2, 2, -2, 0],
                                                    };
                                                } else if (answerStatus === 'wrong') {
                                                    return {
                                                        x: [0, -10, 10, -10, 10, 0],
                                                        rotate: [0, -5, 5, -5, 5, 0],
                                                    };
                                                }
                                                return {
                                                    y: 0,
                                                    x: 0,
                                                    scale: 1,
                                                    rotate: 0,
                                                };
                                            };

                                            const getBackgroundColor = () => {
                                                if (answerStatus === 'correct') {
                                                    return 'bg-gradient-to-br from-green-400 to-emerald-500';
                                                } else if (answerStatus === 'wrong') {
                                                    return 'bg-gradient-to-br from-red-400 to-red-600';
                                                }
                                                return 'bg-white/20';
                                            };

                                            const getBorderColor = () => {
                                                if (answerStatus === 'correct') {
                                                    return 'rgba(34, 197, 94, 0.8)';
                                                } else if (answerStatus === 'wrong') {
                                                    return 'rgba(239, 68, 68, 0.8)';
                                                }
                                                return inputChar ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)';
                                            };

                                            return (
                                                <motion.div
                                                    key={`${wordIndex}-${charIndex}`}
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{
                                                        y: 0,
                                                        opacity: 1,
                                                        x: 0,
                                                        scale: 1,
                                                        rotate: 0,
                                                        ...getAnimation()
                                                    }}
                                                    transition={{
                                                        y: { delay: 0.3 + currentGlobalIndex * 0.03 },
                                                        opacity: { delay: 0.3 + currentGlobalIndex * 0.03 },
                                                        x: { duration: answerStatus ? 0.5 : 0 },
                                                        scale: {
                                                            duration: answerStatus === 'correct' ? 0.8 : 0,
                                                            repeat: answerStatus === 'correct' ? Infinity : 0,
                                                            repeatType: 'reverse',
                                                            repeatDelay: 0.3,
                                                        },
                                                        rotate: { duration: answerStatus ? 0.5 : 0 },
                                                    }}
                                                    className="relative"
                                                >
                                                    <div
                                                        className={`absolute inset-0 rounded-xl blur-md ${
                                                            answerStatus === 'correct' ? 'bg-green-400/50' :
                                                                answerStatus === 'wrong' ? 'bg-red-400/50' :
                                                                    'bg-cyan-400/30'
                                                        }`}
                                                    />
                                                    <motion.div
                                                        className={`relative w-12 h-16 ${getBackgroundColor()} backdrop-blur-sm border-2 rounded-xl flex items-center justify-center shadow-xl transition-colors duration-300`}
                                                        animate={{
                                                            borderColor: getBorderColor(),
                                                        }}
                                                    >
                                                        <span className="text-white text-3xl font-bold">
                                                            {inputChar}
                                                        </span>
                                                    </motion.div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </motion.div>

                        {/* Keyboard Component with improved design */}
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Keyboard
                                onChar={handleChar}
                                onDelete={handleDelete}
                                onClear={handleClear}
                                onSpace={handleSpace}
                                onSubmit={handleSubmit}
                                onSkip={handleSkip}
                                pressedKey={pressedKey}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}