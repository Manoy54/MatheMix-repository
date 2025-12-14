import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
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
    }, []);

    return (
        <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {mathSymbols.map((item) => (
                    <motion.div
                        key={`symbol-${item.id}`}
                        className="absolute text-white/10 select-none"
                        style={{ left: `${item.left}%`, top: `${item.top}%`, fontSize: `${item.fontSize}px` }}
                        animate={{ y: [0, item.yOffset, 0], x: [0, item.xOffset, 0], rotate: [0, 360] }}
                        transition={{ duration: item.duration, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
                    >
                        {item.symbol}
                    </motion.div>
                ))}
                <motion.div
                    className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
                />
                <motion.div
                    className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
                />
            </div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </>
    );
}
