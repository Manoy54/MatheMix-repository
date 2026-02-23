import React from 'react';
import { Lightbulb } from 'lucide-react';

const GameControls = React.memo(({ onSkip, onSubmit, isMobile, onHint, currentPoints, hintError }) => {
    return (
        <div className={isMobile ? "fixed bottom-0 left-0 w-full p-4 z-50 pb-8 pt-6" : "w-full max-w-md mt-6 flex gap-4 z-40 relative"}>
            <div className={`flex gap-3 w-full ${isMobile ? 'max-w-md mx-auto' : ''}`}>
                <button
                    onClick={onSkip}
                    className="flex-1 bg-gradient-to-b from-orange-500 to-orange-600 active:from-orange-600 active:to-orange-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/20"
                >
                    Give Up
                </button>
                <button
                    onClick={onHint}
                    className={`flex-1 ${hintError ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-b from-purple-500 to-purple-600 active:from-purple-600 active:to-purple-700 active:scale-[0.98]'} ${currentPoints <= 0 && !hintError ? 'opacity-50' : ''} text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase transition-transform shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1`}
                >
                    <span className="text-xs font-bold">HINT</span>
                    <Lightbulb className="w-4 h-4" strokeWidth={3} />
                </button>
                <button
                    onClick={onSubmit}
                    className="flex-1 bg-gradient-to-b from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform shadow-lg shadow-green-500/20"
                >
                    Submit
                </button>
            </div>
        </div>
    );
});

export default GameControls;
