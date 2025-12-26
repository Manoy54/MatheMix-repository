import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Trophy, Layout, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GameModals = ({
    showGiveUpModal,
    isGameOver,
    streak,
    bestStreak,
    onCancelGiveUp,
    onConfirmGiveUp,
    onResetGame
}) => {
    const navigate = useNavigate();

    return (
        <>
            <AnimatePresence>
                {showGiveUpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-[#023e8a] border-2 border-white/20 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4">
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Give Up?</h2>
                            <p className="text-white/70">
                                This will reset your streak to 0 and reveal the answer. Are you sure?
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={onCancelGiveUp} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">
                                    Keep Trying
                                </button>
                                <button onClick={onConfirmGiveUp} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all">
                                    Yes, Give Up
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGameOver && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0f172a] border-2 border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
                            <div className="flex flex-col items-center gap-2">
                                <Trophy className="w-12 h-12 text-yellow-400" />
                                <h2 className="text-3xl font-black text-white">Game Over</h2>
                                <p className="text-white/60">Good effort! Here's how you did:</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="text-white/60 text-sm mb-1">Final Streak</div>
                                    <div className="text-3xl font-bold text-white">{streak}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="text-white/60 text-sm mb-1">Best Streak</div>
                                    <div className="text-3xl font-bold text-yellow-400">{Math.max(streak, bestStreak)}</div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => navigate('/category-select')}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                >
                                    <Layout className="w-5 h-5" />
                                    <span>Categories</span>
                                </button>
                                <button
                                    onClick={onResetGame}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>Play Again</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
