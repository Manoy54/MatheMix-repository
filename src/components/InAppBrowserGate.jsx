// src/components/InAppBrowserGate.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, ExternalLink, Chrome, Compass, AlertCircle } from 'lucide-react';
import { detectSource, openInChromeAndroid } from '../utils/inappBrowser';

const InAppBrowserGate = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [source, setSource] = useState(null);

    useEffect(() => {
        const { shouldGate, ...details } = detectSource();
        const hasDismissed = sessionStorage.getItem('iabDismissed') === '1';

        if (shouldGate && !hasDismissed) {
            setSource(details);
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem('iabDismissed', '1');
        setIsVisible(false);
    };

    const handleOpenInBrowser = () => {
        openInChromeAndroid(window.location.href);
    };

    const getSourceName = () => {
        if (source?.isMessenger) return 'Messenger';
        if (source?.isInstagram) return 'Instagram';
        if (source?.isTelegram) return 'Telegram';
        return 'your in-app browser';
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white text-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        {/* Header Image/Icon Section */}
                        <div className="bg-gradient-to-br from-[#023e8a] to-[#0096c7] p-8 text-white flex flex-col items-center text-center relative">
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="mb-4 bg-white/20 p-4 rounded-2xl backdrop-blur-md"
                            >
                                <Globe size={48} />
                            </motion.div>

                            <h2 className="text-2xl font-bold mb-2">Better Experience Awaits</h2>
                            <p className="text-white/80 text-sm">
                                You're currently using the {getSourceName()} browser.
                            </p>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 md:p-8">
                            <div className="space-y-4 mb-8">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
                                        <Compass size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Faster Performance</p>
                                        <p className="text-slate-500 text-sm">Enjoy smoother animations and faster load times in a real browser.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-green-100 p-2 rounded-lg text-green-600 mt-1">
                                        <ExternalLink size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Better Compatibility</p>
                                        <p className="text-slate-500 text-sm">Standard browsers support all the advanced features of Mathemix.</p>
                                    </div>
                                </div>
                            </div>

                            {isIOS ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                                    <div className="flex gap-2 items-center text-amber-800 font-bold mb-2 uppercase text-xs tracking-wider">
                                        <AlertCircle size={14} /> iOS Instructions
                                    </div>
                                    <p className="text-sm text-amber-900 leading-relaxed">
                                        Tap the <strong>...</strong> menu or the <strong>Share</strong> icon and select <strong>"Open in Safari"</strong> or <strong>"Open in Browser"</strong>.
                                    </p>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleOpenInBrowser}
                                    className="w-full py-4 bg-[#0077b6] hover:bg-[#023e8a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-colors mb-4"
                                >
                                    <Chrome size={20} />
                                    Open in Chrome
                                </motion.button>
                            )}

                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                            >
                                Continue here anyway
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InAppBrowserGate;
