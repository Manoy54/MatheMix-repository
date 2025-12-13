import { useState } from 'react';
import { Users, Plus, LogIn, Info } from 'lucide-react';

export default function RoomSelection({
                                          nickname,
                                          setNickname,
                                          onHostGame,
                                          onJoinGame,
                                          error
                                      }) {
    const [joinInput, setJoinInput] = useState("");

    const handleHostClick = () => {
        if (!nickname.trim()) {
            onHostGame("");
            return;
        }
        onHostGame(nickname);
    };

    const handleJoinClick = () => {
        if (!nickname.trim() || !joinInput.trim()) {
            onJoinGame("", "");
            return;
        }
        onJoinGame(nickname, joinInput.toUpperCase());
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 mb-2 shadow-lg">
                    <Users className="w-4 h-4 text-cyan-300" />
                    <span className="text-white text-sm" style={{ fontWeight: 700 }}>Multiplayer Mode</span>
                </div>

                <h2 className="text-white text-2xl md:text-3xl mb-2 leading-tight drop-shadow-lg" style={{ fontWeight: 900 }}>
                    Compete with <span className="text-yellow-300">Friends</span>
                </h2>
                <p className="text-white/80 text-sm" style={{ fontWeight: 500 }}>Challenge your friends in real-time math battles!</p>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-3 border border-yellow-400/30 mb-3 shadow-lg opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-start gap-3">
                    <div className="bg-yellow-400/30 rounded-lg p-2 mt-0.5">
                        <Info className="w-4 h-4 text-yellow-200" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white text-xs mb-1" style={{ fontWeight: 700 }}>How Multiplayer Works</h3>
                        <p className="text-white/90 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                            One player hosts a game and shares the room code. Others can join using that code.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-3 relative animate-scale-in">
                    <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-lg" />
                    <div className="relative bg-red-500/90 backdrop-blur-sm p-3 rounded-xl border-2 border-red-300/50 text-white text-center text-sm font-semibold">
                        {error}
                    </div>
                </div>
            )}

            {/* Nickname Input */}
            <div className="mb-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <label className="block text-white/90 mb-2 text-xs" style={{ fontWeight: 700 }}>
                    ENTER YOUR NICKNAME
                </label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Player123"
                    className="w-full px-4 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-xl text-sm"
                    style={{ fontWeight: 600 }}
                />
            </div>

            {/* Host & Join Cards - Now Single Column */}
            <div className="space-y-3 mb-3">
                {/* Host a Game */}
                <div
                    className="relative opacity-0 animate-fade-in-up"
                    style={{ animationDelay: '0.5s' }}
                >
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-purple-600/80 to-violet-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all">
                        <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="bg-gradient-to-br from-purple-500/30 to-violet-500/30 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm flex-shrink-0">
                                    <Plus className="w-7 h-7 text-white" />
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-white text-lg mb-0.5 leading-tight" style={{ fontWeight: 900 }}>
                                        Host a Game
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                                        Create a new room and share the code
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleHostClick}
                                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                                style={{ fontWeight: 700 }}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Create</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Join a Game */}
                <div
                    className="relative opacity-0 animate-fade-in-up"
                    style={{ animationDelay: '0.6s' }}
                >
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-600/80 to-cyan-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm flex-shrink-0">
                                    <LogIn className="w-7 h-7 text-white" />
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-white text-lg mb-0.5 leading-tight" style={{ fontWeight: 900 }}>
                                        Join a Game
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                                        Enter the room code from your friend
                                    </p>
                                </div>
                            </div>

                            {/* Room Code Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={joinInput}
                                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                                    placeholder="ABC123"
                                    className="flex-1 px-4 py-2.5 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-white focus:ring-4 focus:ring-white/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-lg tracking-widest text-center text-sm"
                                    style={{ fontWeight: 700 }}
                                    maxLength={6}
                                />
                                
                                <button
                                    onClick={handleJoinClick}
                                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                                    style={{ fontWeight: 700 }}
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="text-sm">Join</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}