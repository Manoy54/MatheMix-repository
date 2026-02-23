import React, { useMemo } from 'react';
import { Brain, Trophy, Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMobile } from '../../../hooks/useMobile';

export const QuestionStats = React.memo(({ questionNumber, streak, bestStreak, currentPoints, hintError }) => {
    const isMobile = useMobile();

    if (isMobile) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-xl px-2 py-1 border border-white/20 flex items-center gap-1.5">
                        <Brain className="w-3 h-3 text-cyan-300" />
                        <div className="flex flex-col justify-center">
                            <div className="text-white/70 text-[8px] leading-none mb-0.5">Question</div>
                            <div className="text-white text-xs leading-none font-bold">#{questionNumber}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`rounded-xl px-2 py-1 border flex items-center gap-1.5 transition-colors ${hintError ? 'bg-red-500/40 border-red-500 animate-pulse' : 'bg-white/10 border-white/20'}`}>
                        <Star className="w-3 h-3 text-yellow-400" />
                        <div className="flex flex-col justify-center">
                            <div className="text-white/70 text-[8px] leading-none mb-0.5">Points</div>
                            <div className="text-white text-xs leading-none font-bold">{currentPoints}</div>
                        </div>
                    </div>
                    <FireStreak streak={streak} />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                    <Brain className="w-3 h-3 md:w-4 md:h-4 text-cyan-300" />
                    <div>
                        <div className="text-white/70 text-[10px] md:text-xs">Question</div>
                        <div className="text-white text-lg md:text-xl md:font-bold">#{questionNumber}</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className={`absolute inset-0 rounded-xl blur-lg transition-colors ${hintError ? 'bg-red-500/50 animate-pulse' : 'bg-white/20'}`} />
                    <motion.div
                        animate={hintError ? { x: [-5, 5, -5, 5, 0], backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgb(239, 68, 68)' } : { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255,255,255,0.3)' }}
                        transition={{ duration: 0.4 }}
                        className="relative backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 flex items-center gap-2 shadow-xl"
                    >
                        <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                        <div>
                            <div className="text-white/70 text-[10px] md:text-xs">Points</div>
                            <div className="text-white text-lg md:text-xl md:font-bold">{currentPoints}</div>
                        </div>
                    </motion.div>
                </div>
                <FireStreak streak={streak} />
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-white/30 flex items-center gap-2 shadow-xl">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                        <div>
                            <div className="text-white/70 text-[10px] md:text-xs">Best Streak</div>
                            <div className="text-white text-lg md:text-xl md:font-bold">{bestStreak}</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
});

const FireStreak = React.memo(({ streak }) => {
    const isMobile = useMobile();

    // Static render for mobile
    if (isMobile) {
        return (
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl px-2 py-1 border border-orange-300/30 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-white" />
                <div className="flex flex-col justify-center">
                    <div className="text-orange-100 text-[8px] leading-none mb-0.5">Streak</div>
                    <div className="text-white text-xs leading-none font-bold">{streak}</div>
                </div>
            </div>
        );
    }

    // Standard desktop render
    const particles = useMemo(() => {
        const count = 12;
        return [...Array(count)].map((_, i) => ({
            delay: i * 0.2,
            x: (Math.random() - 0.5) * 80,
            isOrange: i % 2 === 0,
            isLarge: i % 3 === 0
        }));
    }, []);

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur-lg opacity-60" />
            {streak > 0 && (
                <>
                    {particles.map((p, i) => (
                        <motion.div
                            key={`particle-${i}`}
                            className={`absolute bottom-0 left-1/2 ${p.isLarge ? 'w-5 h-5' : 'w-4 h-4'} rounded-full ${p.isOrange ? 'bg-gradient-to-t from-orange-500 to-red-500' : 'bg-gradient-to-t from-yellow-400 to-orange-400'}`}
                            style={{ boxShadow: p.isOrange ? '0 0 20px rgba(251, 146, 60, 1)' : '0 0 20px rgba(250, 204, 21, 1)' }}
                            animate={{ y: [-10, -100], x: [0, p.x], opacity: [1, 0], scale: [1, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: p.delay }}
                        />
                    ))}
                </>
            )}
            <motion.div
                className="relative bg-gradient-to-br from-orange-500 to-red-600 backdrop-blur-sm rounded-xl px-3 py-1 md:px-4 md:py-2 border-2 border-orange-300/50 flex items-center gap-2"
                animate={streak > 0 ? { boxShadow: ['0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)', '0 0 60px rgba(251, 146, 60, 1), 0 0 120px rgba(239, 68, 68, 0.9)', '0 0 40px rgba(251, 146, 60, 0.8), 0 0 80px rgba(239, 68, 68, 0.6)',], } : {}}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
                <motion.div
                    animate={streak > 0 ? { rotate: [-5, 5, -5, 5, -5, 0], scale: [1, 1.2, 1, 1.15, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
                >
                    <Flame className="w-3 h-3 md:w-4 md:h-4 text-white drop-shadow-lg" />
                </motion.div>
                <div>
                    <div className="text-orange-100 text-[10px] md:text-xs">Streak</div>
                    <motion.div className="text-white text-lg md:text-xl font-bold" key={streak} initial={{ scale: 1 }} animate={streak > 0 ? { scale: [1, 1.3, 1] } : {}}>
                        {streak}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
});
