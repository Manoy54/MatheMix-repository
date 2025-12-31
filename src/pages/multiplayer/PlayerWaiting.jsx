import { Users, LogOut } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

export default function PlayerWaiting({ roomCode, roomData, user, leaveLobby }) {
    const isMobile = useMobile();
    return (
        <div className={`flex flex-col justify-center overflow-hidden h-full md:h-auto p-4 md:p-8 rounded-2xl 
            ${isMobile ? 'bg-white/5 border border-white/10' : 'bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl border-2 border-white/40 shadow-2xl animate-scale-in'}`}>
            <div className="text-center mb-4 md:mb-6">
                <h2 className="text-white text-xl md:text-3xl mb-1" style={{ fontWeight: 900 }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
                        Joined Room: {roomCode}
                    </span>
                </h2>
                <p className="text-white/80 text-xs md:text-base">Waiting for host to start...</p>
            </div>

            {/* Players List */}
            <div className="mb-4 md:mb-6">
                <h3 className="text-white text-sm md:text-lg mb-2 md:mb-3" style={{ fontWeight: 700 }}>
                    Players in Lobby ({roomData?.players.length || 0})
                </h3>
                <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-3 md:p-4 min-h-[120px] md:min-h-[150px]">
                        {roomData?.players.map((p) => (
                            <div key={p.uid} className="text-white text-sm md:text-lg py-1 md:py-2 flex items-center gap-2">
                                <Users className="w-4 h-4 md:w-6 md:h-6" />
                                <span>
                                    {p.nickname}
                                    {p.uid === roomData.hostId && " (Host) ⭐"}
                                    {p.uid === user?.uid && " (You)"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Waiting Message */}
            <div className={`relative mb-4 md:mb-6 ${isMobile ? '' : 'animate-pulse'}`}>
                <div className="absolute inset-0 bg-yellow-400/20 rounded-xl blur-lg" />
                <div className="relative bg-yellow-300/30 backdrop-blur-sm p-3 md:p-6 rounded-xl border-2 border-yellow-200/50 text-center">
                    <p className="text-yellow-100 text-sm md:text-2xl italic" style={{ fontWeight: 600 }}>
                        Waiting for the host to start the game...
                    </p>
                </div>
            </div>

            {/* Leave Lobby Button */}
            <button
                onClick={leaveLobby}
                className="w-full h-9 md:h-14 px-4 md:px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/40 transition-all border-2 border-red-300/50 flex items-center justify-center gap-2 md:gap-3 text-xs md:text-lg hover:scale-105 hover:translate-y-[-2px] active:scale-95 uppercase whitespace-nowrap"
                style={{ fontWeight: 900 }}
            >
                <LogOut className="w-3.5 h-3.5 md:w-6 md:h-6" />
                Leave Lobby
            </button>
        </div>
    );
}