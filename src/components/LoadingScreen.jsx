import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, Zap } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#0096c7] flex flex-col items-center justify-center text-white overflow-hidden"
        >

            {/* Background geometric shapes for depth */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Main Loading Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo/Icon Animation */}
                <div className="relative mb-8">
                    <motion.div
                        className="absolute inset-0 bg-yellow-400 rounded-2xl blur-xl opacity-40"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl relative"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Calculator className="w-16 h-16 text-white" />
                        </motion.div>

                        <motion.div
                            className="absolute -top-2 -right-2 bg-yellow-400 text-[#023e8a] p-1.5 rounded-full shadow-lg"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <Zap className="w-4 h-4 fill-current" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Text Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                >
                    <h2 className="text-4xl font-black tracking-tight mb-3 flex items-center gap-2">
                        Loading
                        <span className="text-yellow-300">Mathemix</span>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            ...
                        </motion.span>
                    </h2>

                    {/* Loading Bar */}
                    <div className="w-64 h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm mt-4">
                        <motion.div
                            className="h-full bg-yellow-400"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    <p className="mt-4 text-white/60 text-sm font-medium">Preparing your math adventure</p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default React.memo(LoadingScreen);
