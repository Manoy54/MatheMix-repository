import { Users, LogOut } from 'lucide-react';

export default function PlayerWaiting({ roomCode, roomData, user, leaveLobby }) {
    return (
        <div className="bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-8 animate-scale-in">
            <div className="text-center mb-6">
                <h2 className="text-white text-3xl mb-2" style={{ fontWeight: 900 }}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-200">
            Joined Room: {roomCode}
          </span>
                </h2>
            </div>

            {/* Players List */}
            <div className="mb-6">
                <h3 className="text-white text-lg mb-3" style={{ fontWeight: 700 }}>
                    Players in Lobby ({roomData?.players.length || 0})
                </h3>
                <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                    <div className="relative bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/30 p-4 min-h-[150px]">
                        {roomData?.players.map((p) => (
                            <div key={p.uid} className="text-white text-lg py-2 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {p.nickname}
                                {p.uid === roomData.hostId && " (Host) ⭐"}
                                {p.uid === user?.uid && " (You)"}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Waiting Message */}
            <div className="relative animate-pulse mb-6">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-xl blur-lg" />
                <div className="relative bg-yellow-300/30 backdrop-blur-sm p-6 rounded-xl border-2 border-yellow-200/50 text-center">
                    <p className="text-yellow-100 text-2xl" style={{ fontWeight: 700 }}>
                        Waiting for the host to start...
                    </p>
                </div>
            </div>

            {/* Leave Lobby Button */}
            <button
                onClick={leaveLobby}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/40 transition-all border-2 border-red-300/50 flex items-center justify-center gap-2 text-lg hover:scale-105 hover:translate-y-[-2px] active:scale-95"
                style={{ fontWeight: 700 }}
            >
                <LogOut className="w-6 h-6" />
                Leave Lobby
            </button>
        </div>
    );
}