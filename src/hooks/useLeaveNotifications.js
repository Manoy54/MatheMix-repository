
import { useState, useRef, useEffect } from "react";

/**
 * Handles leave notifications for multiplayer rooms.
 * @param {Array} players - Array of player objects.
 * @returns {Array} - Array of notifications (each: { id, name }).
 */
export function useLeaveNotifications(players = []) {
    const [leaveNotifications, setLeaveNotifications] = useState([]);
    const prevPlayersRef = useRef(players);

    useEffect(() => {
        const prevPlayers = prevPlayersRef.current;
        if (players.length < prevPlayers.length) {
            const leftPlayer = prevPlayers.find(p => !players.some(curr => curr.uid === p.uid));
            if (leftPlayer) {
                const id = Date.now();
                setLeaveNotifications(prev => [...prev, { id, name: leftPlayer.nickname }]);
                setTimeout(() => {
                    setLeaveNotifications(prev => prev.filter(n => n.id !== id));
                }, 4000);
            }
        }
        prevPlayersRef.current = players;
    }, [players]);

    return leaveNotifications;
}
