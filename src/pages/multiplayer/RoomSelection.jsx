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
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleHostClick = () => {
        if (!nickname.trim()) {
            // Error will be handled by parent
            onHostGame("");
            return;
        }
        onHostGame(nickname);
    };

    const handleJoinClick = () => {
        if (!nickname.trim() || !joinInput.trim()) {
            // Error will be handled by parent
            onJoinGame("", "");
            return;
        }
        onJoinGame(nickname, joinInput.toUpperCase());
    };

    return (
        <>
            {/* Welcome Section */}
            <div className="text-center mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/30 mb-2 shadow-lg">
                    <Users className="w-4 h-4 text-cyan-300" />
                    <span className="text-white text-base" style={{ fontWeight: 700 }}>Multiplayer Mode</span>
                </div>

                <h2 className="text-white text-3xl md:text-4xl mb-2 leading-tight drop-shadow-lg" style={{ fontWeight: 900 }}>
                    Compete with <span className="text-yellow-300">Friends</span>
                </h2>
                <p className="text-white/80 text-base" style={{ fontWeight: 500 }}>Challenge your friends in real-time math battles!</p>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-3 border border-yellow-400/30 mb-4 shadow-lg opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-start gap-3">
                    <div className="bg-yellow-400/30 rounded-lg p-2 mt-0.5">
                        <Info className="w-4 h-4 text-yellow-200" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white text-sm mb-1" style={{ fontWeight: 700 }}>How Multiplayer Works</h3>
                        <p className="text-white/90 text-xs leading-relaxed" style={{ fontWeight: 500 }}>
                            One player hosts a game and shares the room code. Others can join using that code. Enter your nickname below to get started!
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
            <div className="mb-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <label className="block text-white/90 mb-2 text-xs" style={{ fontWeight: 700 }}>
                    ENTER YOUR NICKNAME
                </label>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Player123"
                    className="w-full px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-xl"
                    style={{ fontWeight: 600 }}
                />
            </div>

            {/* Host & Join Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Host a Game */}
                <div
                    onMouseEnter={() => setHoveredCard('host')}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="relative group opacity-0 animate-fade-in-left"
                    style={{ animationDelay: '0.5s' }}
                >
                    <div
                        className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-600/80 to-violet-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.03] hover:translate-y-[-5px] active:scale-[0.98] ${
                            hoveredCard === 'host' ? 'shadow-[0_0_30px_rgba(168,85,247,0.4)]' : ''
                        }`}
                    >
                        {/* SHINE EFFECT */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="relative z-10 flex flex-col h-full min-h-[280px] justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gradient-to-br from-purple-500/30 to-violet-500/30 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm">
                                        <Plus className="w-9 h-9 text-white" />
                                    </div>
                                    <div className={`w-3 h-3 rounded-full transition-all ${
                                        hoveredCard === 'host'
                                            ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                            : 'bg-white/20'
                                    }`} />
                                </div>

                                <h3 className="text-white text-xl mb-2 leading-tight" style={{ fontWeight: 900 }}>
                                    Host a Game
                                </h3>
                                <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontWeight: 500 }}>
                                    Create a new room and get a code to share with friends.
                                </p>
                            </div>

                            <button
                                onClick={handleHostClick}
                                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                style={{ fontWeight: 700 }}
                            >
                                <Plus className="w-4 h-4" />
                                Create Room
                            </button>
                        </div>
                    </div>
                </div>

                {/* Join a Game */}
                <div
                    onMouseEnter={() => setHoveredCard('join')}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="relative group opacity-0 animate-fade-in-right"
                    style={{ animationDelay: '0.5s' }}
                >
                    <div
                        className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-600/80 to-cyan-600/80 border-2 border-white/30 shadow-2xl backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.03] hover:translate-y-[-5px] active:scale-[0.98] ${
                            hoveredCard === 'join' ? 'shadow-[0_0_30px_rgba(59,130,246,0.4)]' : ''
                        }`}
                    >
                        {/* SHINE EFFECT */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="relative z-10 flex flex-col h-full min-h-[320px] justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 backdrop-blur-sm">
                                        <LogIn className="w-9 h-9 text-white" />
                                    </div>
                                    <div className={`w-3 h-3 rounded-full transition-all ${
                                        hoveredCard === 'join'
                                            ? 'bg-yellow-300 shadow-[0_0_10px_#fde047]'
                                            : 'bg-white/20'
                                    }`} />
                                </div>

                                <h3 className="text-white text-xl mb-2 leading-tight" style={{ fontWeight: 900 }}>
                                    Join a Game
                                </h3>
                                <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontWeight: 500 }}>
                                    Enter the room code provided by your friend.
                                </p>

                                {/* Room Code Input */}
                                <div className="mb-3">
                                    <label className="block text-white/90 text-xs mb-2" style={{ fontWeight: 700 }}>
                                        ENTER ROOM CODE
                                    </label>
                                    <input
                                        type="text"
                                        value={joinInput}
                                        onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                                        placeholder="ABC123"
                                        className="w-full px-5 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl focus:border-white focus:ring-4 focus:ring-white/30 outline-none transition-all placeholder-gray-400 text-gray-800 shadow-lg tracking-widest text-center"
                                        style={{ fontWeight: 700 }}
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleJoinClick}
                                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl shadow-lg transition-all border-2 border-white/40 backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                style={{ fontWeight: 700 }}
                            >
                                <LogIn className="w-4 h-4" />
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}