import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export function useMultiplayerRoom(roomCode, user) {
    const [roomData, setRoomData] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [error, setError] = useState(null);

    // Refs to track state for cleanup/edge cases without triggering re-renders
    const hostIdRef = useRef(null);
    const gameStartedRef = useRef(false);

    useEffect(() => {
        if (!roomCode || !user) {
            setRoomData(null);
            setGameStarted(false);
            return;
        }

        const roomRef = doc(db, "rooms", roomCode);
        console.log(`[Multiplayer] Subscribing to room: ${roomCode}`);

        const unsubscribe = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // Update refs
                hostIdRef.current = data.hostId;
                const isGameActive = data.status === "playing" ||
                    data.status === "finished" ||
                    data.status === "intermission";
                gameStartedRef.current = isGameActive;

                // Optimization: Deep compare or just set state
                // React setState bails out if value is same reference, but data is new object
                // We could implement a custom equality check here if performance is truly critical,
                // but for now, just setting it is standard.
                setRoomData(data);
                setGameStarted(isGameActive);
                setError(null);
            } else {
                console.log("[Multiplayer] Room document deleted or unavailable.");
                setRoomData(null);
                setGameStarted(false);
                setError("Room ended or does not exist.");
            }
        }, (err) => {
            console.error("[Multiplayer] Snapshot error:", err);
            setError(err.message);
        });

        return () => {
            console.log(`[Multiplayer] Unsubscribing from room: ${roomCode}`);
            unsubscribe();
        };
    }, [roomCode, user]);

    return { roomData, gameStarted, error, hostIdRef };
}
