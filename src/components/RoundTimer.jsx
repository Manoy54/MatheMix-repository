
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const RoundTimer = ({ startTime, duration = 60, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [progress, setProgress] = useState(100);

    const [skewCorrection, setSkewCorrection] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const startMillis = startTime?.toMillis ? startTime.toMillis() : (startTime || Date.now());
        const now = Date.now();

        // If local time is BEHIND server time (negative elapsed), offset local time forward
        if (now < startMillis) {
            setSkewCorrection(startMillis - now);
        } else {
            setSkewCorrection(0);
        }
    }, [startTime]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now() + skewCorrection;
            const startMillis = startTime?.toMillis ? startTime.toMillis() : (startTime || now);
            const elapsed = Math.max(0, (now - startMillis) / 1000);
            const remaining = Math.min(duration, Math.max(0, duration - elapsed));

            setTimeLeft(Math.ceil(remaining));
            setProgress((remaining / duration) * 100);

            if (remaining <= 0) {
                clearInterval(interval);
                if (onTimeUp) onTimeUp();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [startTime, duration, onTimeUp]);



    return (
        <div className="w-full max-w-3xl px-4 mt-4 mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between text-white font-bold text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/70" />
                    <span>Time Left</span>
                </div>
                <span className={`${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
                {/* Progress Fill */}
                <motion.div
                    className="h-full absolute left-0 top-0 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>
        </div>
    );
};

export default RoundTimer;
