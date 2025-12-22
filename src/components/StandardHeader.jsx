import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Calculator, Sparkles } from 'lucide-react';

export default function StandardHeader({ onOpenSidebar, subtitle, className = "", size = "normal" }) {
    const isLarge = size === "large";
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`flex items-center ${isLarge ? 'justify-center flex-col gap-6' : 'justify-between pt-4 pb-2'} shrink-0 ${className}`}
        >
            <div className={`flex items-center ${isLarge ? 'flex-col gap-6' : 'gap-3'}`}>
                {/* Hamburger Menu Button */}
                {onOpenSidebar && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onOpenSidebar}
                        className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </motion.button>
                )}

                {/* Rotating Symbol */}
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 ${isLarge ? 'rounded-3xl blur-2xl opacity-60' : 'rounded-xl blur-md opacity-50'}`} />
                    <div className={`relative bg-gradient-to-br from-white/20 to-white/10 ${isLarge ? 'p-6 rounded-3xl border-2' : 'p-2 rounded-xl border'} border-white/30 backdrop-blur-sm`}>
                        <Calculator className={`${isLarge ? 'w-24 h-24 drop-shadow-lg' : 'w-6 h-6'} text-white`} />
                    </div>
                </motion.div>

                {/* Mathemix Title */}
                <div>
                    <h1 className={`text-white flex items-center gap-2 font-black ${isLarge ? 'text-6xl md:text-9xl tracking-tight drop-shadow-xl gap-4' : 'text-3xl drop-shadow-md'}`}>
                        Mathemix
                        <motion.div
                            animate={isLarge ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : { rotate: [0, 15, -15, 0] }}
                            transition={isLarge ? { duration: 2, repeat: Infinity, repeatType: "mirror" } : { duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className={`${isLarge ? 'w-16 h-16 md:w-24 md:h-24 drop-shadow-lg' : 'w-5 h-5'} text-yellow-300`} />
                        </motion.div>
                    </h1>
                    {subtitle && (
                        <p className="text-white/60 text-xs">{subtitle}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
