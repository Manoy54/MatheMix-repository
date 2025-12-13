import { useState } from 'react';
// FIX 1: Change import from 'motion/react' to 'framer-motion'
import { motion } from 'framer-motion';
import { Users, Copy, Check, Play, LogOut } from 'lucide-react';

export default function HostLobby({
                                      roomCode,
                                      roomData,
                                      categories,
                                      user,
                                      onStartGame,
                                      onCategoryChange,
                                      leaveLobby,
                                  }) {
    const [copiedCode, setCopiedCode] = useState(false);

    const copyCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    return (
        <div className="bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-8 animate-scale-in">
            <div className="text-center mb-6">
                <h2 className="text-white text-3xl mb-2" style={{ fontWeight: 900 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                        Host Lobby
                    </span>
                </h2>
                <p className="text-white/80">Waiting for players to join...</p>
            </div>

            {/* Room Code Display */}
            <div className="mb-6 relative animate-scale-in">
                <div className="relative bg-gradient-to-r from-yellow-300 to-orange-300 p-6 rounded-xl border-2 border-yellow-200/50 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[#023e8a] text-xs mb-1" style={{ fontWeight: 700 }}>ROOM CODE</p>
                        <p className="text-[#023e8a] text-4xl tracking-widest" style={{ fontWeight: 900 }}>
                            {roomCode}
                        </p>
                    </div>
                    <button
                        onClick={copyCode}
                        className="bg-white/90 hover:bg-white p-3 rounded-xl shadow-lg transition-all hover:scale-110 active:scale-90"
                    >
                        {copiedCode ? (
                            <Check className="w-6 h-6 text-green-600" />
                        ) : (
                            <Copy className="w-6 h-6 text-[#023e8a]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Players List */}
            <div className="mb-6">
                <h3 className="text-white text-lg mb-3" style={{ fontWeight: 700 }}>
                    Players Waiting ({roomData?.players.length || 0})
                </h3>
                <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-4 min-h-[100px]">
                        {roomData?.players.map((p) => (
                            <div key={p.uid} className="text-white text-lg py-2 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {p.nickname} {p.uid === user?.uid && "⭐ (You)"}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Selection */}
            <div className="mb-6">
                <label className="block text-white text-sm mb-2" style={{ fontWeight: 700 }}>
                    SELECT CATEGORY
                </label>
                <div className="relative">
                    <select
                        // Ensure 'value' reads the current room category state
                        value={roomData?.category || "Number & Algebra"}
                        // When changed, call the parent function
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/30 outline-none transition-all text-gray-800 shadow-xl"
                        style={{ fontWeight: 600 }}
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={leaveLobby}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/40 transition-all border-2 border-red-300/50 flex items-center justify-center gap-2 text-lg hover:scale-105 hover:translate-y-[-2px] active:scale-95"
                    style={{ fontWeight: 700 }}
                >
                    <LogOut className="w-6 h-6" />
                    Leave
                </button>
                <button
                    onClick={onStartGame}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/40 transition-all border-2 border-green-300/50 flex items-center justify-center gap-2 text-lg hover:scale-105 hover:translate-y-[-2px] active:scale-95"
                    style={{ fontWeight: 700 }}
                    disabled={roomData?.players.length < 2}
                >
                    <Play className="w-6 h-6" />
                    Start Game
                </button>
            </div>
            {roomData?.players.length < 2 && (
                <p className="text-center text-white/70 text-xs mt-3">
                    You need at least 2 players to start the game.
                </p>
            )}
        </div>
    );
}