import React from 'react';
import { motion } from 'framer-motion';

export const QuestionCard = React.memo(({ questionNumber, category, definition, isMobile }) => {
    if (isMobile) {
        return (
            <div className="relative">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/20 flex flex-col items-center justify-center shadow-sm min-h-[140px] relative">
                    {/* Absolutely positioned badges */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 text-[8px] bg-white/20 text-white rounded-full border border-white/30 font-bold uppercase tracking-wide">
                        {category}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 text-[8px] bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] rounded-full font-black uppercase tracking-wide">
                        Question #{questionNumber}
                    </div>

                    <p className="text-white text-sm mt-4 leading-snug text-center font-medium w-full">
                        {definition}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            key={questionNumber}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
        >
            <div className="absolute inset-0 md:bg-gradient-to-r md:from-cyan-400/30 md:to-blue-400/30 rounded-2xl md:blur-xl" />
            <div className="relative bg-white/15 md:backdrop-blur-xl p-5 rounded-2xl border-2 border-white/30 md:shadow-2xl transition-all flex flex-col">
                <div className="flex items-center justify-between w-full mb-2">
                    <div className="px-3 py-1 text-xs bg-white/20 md:backdrop-blur-sm text-white rounded-full border border-white/30 shadow-sm md:shadow-none">
                        {category}
                    </div>
                    <div className="px-4 py-1 text-sm bg-gradient-to-r from-yellow-300 to-orange-300 text-[#023e8a] rounded-full md:shadow-lg font-bold">
                        Question #{questionNumber}
                    </div>
                </div>

                <p className="text-white text-lg leading-relaxed mt-4 text-center font-medium w-full">
                    {definition}
                </p>
            </div>
        </motion.div>
    );
});
