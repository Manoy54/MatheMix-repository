import { useState, useEffect } from 'react';
// FIX 1: Change import from 'motion/react' to 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Play, LogOut, ChevronDown } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

export default function HostLobby({
    roomCode,
    roomData,
    categories,
    user,
    onStartGame,
    onCategoryChange,
    onRoundsChange,
    leaveLobby,
}) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [localRounds, setLocalRounds] = useState(roomData?.rounds?.toString() || "5");

    // Keep local state in sync with external updates (if any)
    useEffect(() => {
        if (roomData?.rounds) {
            setLocalRounds(prev => {
                const currentVal = parseInt(prev);
                return currentVal === roomData.rounds ? prev : roomData.rounds.toString();
            });
        }
    }, [roomData?.rounds]);

    const handleLocalRoundsChange = (val) => {
        // Allow numeric typing and empty string for free editing
        if (val === "" || /^\d+$/.test(val)) {
            setLocalRounds(val);

            const num = parseInt(val);
            if (!isNaN(num) && num >= 1 && num <= 20) {
                onRoundsChange(num);
            }
        }
    };

    const copyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const isMobile = useMobile();

    return (
        <div className={`flex flex-col justify-center overflow-hidden h-full md:h-auto p-4 md:p-6 max-w-4xl mx-auto rounded-2xl
            ${isMobile ? 'bg-white/5 border border-white/10' : 'bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl border-2 border-white/40 shadow-2xl animate-scale-in'}`}>
            {/* Hide native number spinners */}
            <style>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            <div className="text-center mb-4 md:mb-5">
                <h2 className="text-white text-xl md:text-2xl mb-1" style={{ fontWeight: 900 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                        Host Lobby
                    </span>
                </h2>
                <p className="text-white/80 text-xs md:text-sm">Waiting for players to join...</p>
            </div>

            {/* Room Code Display */}
            <div className={`mb-4 md:mb-5 relative ${isMobile ? '' : 'animate-scale-in'}`}>
                <div className="relative bg-gradient-to-r from-yellow-300 to-orange-300 p-3 md:p-4 rounded-xl border-2 border-yellow-200/50 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[#023e8a] text-[10px] md:text-xs mb-0.5 md:mb-1" style={{ fontWeight: 700 }}>ROOM CODE</p>
                        <p className="text-[#023e8a] text-2xl md:text-3xl tracking-widest" style={{ fontWeight: 900 }}>
                            {roomCode}
                        </p>
                    </div>
                    <button
                        onClick={copyCode}
                        className="bg-white/90 hover:bg-white p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg transition-all hover:scale-110 active:scale-90"
                    >
                        {copiedCode ? (
                            <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        ) : (
                            <Copy className="w-4 h-4 md:w-5 md:h-5 text-[#023e8a]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Players List */}
            <div className="mb-4 md:mb-5">
                <h3 className="text-white text-sm md:text-base mb-2" style={{ fontWeight: 700 }}>
                    Players Waiting ({roomData?.players.length || 0})
                </h3>
                <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-3 md:p-3 min-h-[80px] md:min-h-[100px]">
                        {roomData?.players.map((p) => (
                            <div key={p.uid} className="text-white text-sm md:text-base py-1 flex items-center gap-2">
                                <Users className="w-4 h-4 md:w-5 md:h-5" />
                                {p.nickname} {p.uid === user?.uid && "⭐ (You)"}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-5">
                {/* Category Selection */}
                <div>
                    <label className="block text-white text-[10px] md:text-xs mb-1 uppercase tracking-wide" style={{ fontWeight: 700 }}>
                        Select Category
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-3 py-1 md:py-2 h-8 md:h-10 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-lg md:rounded-xl focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all text-gray-800 shadow-lg text-xs md:text-sm text-left uppercase flex items-center justify-between"
                            style={{ fontWeight: 700 }}
                        >
                            <span className="truncate">{roomData?.category || "Number & Algebra"}</span>
                            <ChevronDown className={`w-4 h-4 md:w-4 md:h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <motion.div
                                        initial={isMobile ? {} : { opacity: 0, y: -10 }}
                                        animate={isMobile ? {} : { opacity: 1, y: 0 }}
                                        exit={isMobile ? {} : { opacity: 0, y: -10 }}
                                        transition={isMobile ? { duration: 0 } : {}}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-20 py-1 max-h-48 overflow-y-auto border-2 border-purple-100"
                                    >
                                        {categories.map((cat) => (
                                            <div
                                                key={cat}
                                                onClick={() => {
                                                    onCategoryChange(cat);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors flex items-center justify-between ${roomData?.category === cat ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {cat}
                                                {roomData?.category === cat && (
                                                    <motion.div layoutId="activeIndicator" className="w-1 h-3 rounded-full bg-purple-500" />
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Rounds Selection */}
                <div>
                    <label className="block text-white text-[10px] md:text-xs mb-1 uppercase tracking-wide" style={{ fontWeight: 700 }}>
                        Number of Rounds
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder="1-20"
                            value={localRounds}
                            onChange={(e) => handleLocalRoundsChange(e.target.value)}
                            onBlur={() => {
                                const num = parseInt(localRounds);
                                if (isNaN(num) || num < 1 || num > 20) {
                                    setLocalRounds(roomData?.rounds?.toString() || "5");
                                }
                            }}
                            className="w-full pl-3 pr-4 py-1 md:py-2 h-8 md:h-10 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-lg md:rounded-xl focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all text-gray-800 shadow-lg text-xs md:text-sm text-left uppercase"
                            style={{ fontWeight: 700 }}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                    onClick={leaveLobby}
                    className="w-full h-9 md:h-12 px-2 md:px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/40 transition-all border-2 border-red-300/50 flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-sm hover:scale-105 hover:translate-y-[-2px] active:scale-95 whitespace-nowrap uppercase"
                    style={{ fontWeight: 900 }}
                >
                    <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Leave
                </button>
                <button
                    onClick={onStartGame}
                    className="w-full h-9 md:h-12 px-2 md:px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/40 transition-all border-2 border-green-300/50 flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-sm hover:scale-105 hover:translate-y-[-2px] active:scale-95 whitespace-nowrap uppercase"
                    style={{ fontWeight: 900 }}
                    disabled={roomData?.players.length < 2}
                >
                    <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Start Game
                </button>
            </div>
            {roomData?.players.length < 2 && (
                <p className="text-center text-white/70 text-xs md:text-sm mt-3 md:mt-4">
                    You need at least 2 players to start the game.
                </p>
            )}
        </div>
    );
}