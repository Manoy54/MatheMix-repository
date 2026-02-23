import { useState, useCallback, useEffect, useRef } from 'react';
import { MultiplayerService } from '../services/MultiplayerService';

export function useHostGameLogic(roomCode, roomData, isHost) {
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [nextCategory, setNextCategory] = useState("Number & Algebra");

    // Derived from roomData
    const { players = [], answers = [], roundNumber = 1, rounds = 5, status } = roomData || {};

    // Refs to preventing double-firing actions due to latency
    const processingActionRef = useRef(false);
    const lastProcessedRoundRef = useRef(roundNumber);

    // Reset state on new question
    useEffect(() => {
        setIsTimeUp(false);
        processingActionRef.current = false;
        lastProcessedRoundRef.current = roundNumber;
    }, [roomData?.currentQuestion, roundNumber]);

    const handleTimeUp = useCallback(() => {
        setIsTimeUp(true);
    }, []);

    const handleNextRound = useCallback(async (manualCategory) => {
        if (!isHost || !roomCode || processingActionRef.current) return;

        processingActionRef.current = true;

        try {
            const totalRounds = typeof rounds === 'string' ? parseInt(rounds) : rounds;
            const currentRoundNumber = roundNumber;

            // If we've reached the limit, finish the game
            if (currentRoundNumber >= totalRounds) {
                await MultiplayerService.finishGame(roomCode);
                processingActionRef.current = false;
                return;
            }

            // Start Next Round (Service handles atomic scoring + fetching)
            const categoryToUse = manualCategory || nextCategory;
            await MultiplayerService.startNextRound(roomCode, currentRoundNumber + 1, categoryToUse);

            // Ref will be reset by the useEffect when roomData updates eventually,
            // but we should reset it here too in case of error or to allow subsequent clicks if UI doesn't unmount
            // However, strictly speaking, once round starts, we wait for roomData update.
            // The useEffect resets it on new question.

        } catch (error) {
            console.error("Error in handleNextRound:", error);
            processingActionRef.current = false;
        }

    }, [isHost, roomCode, rounds, roundNumber, nextCategory]);

    // Start Intermission (Server-side authoritative timer)
    const startIntermission = useCallback(async () => {
        if (!isHost || !roomCode || processingActionRef.current) return;

        // Check if already in intermission to be safe (redundant but good)
        if (status === 'intermission') return;

        processingActionRef.current = true;
        try {
            await MultiplayerService.startIntermission(roomCode, 10000);
            // We can reset here because status change 'intermission' will prevent re-entry
            // via the 'shouldEndRound' check in useEffect.
            processingActionRef.current = false;
        } catch (error) {
            console.error("Error starting intermission:", error);
            processingActionRef.current = false;
        }
    }, [isHost, roomCode, status]);

    // Auto Advance Effect (Triggers Intermission)
    useEffect(() => {
        if (!isHost) return;

        const allAnswered = players.length > 0 && answers.length >= players.length;

        // If round is effectively over (Time Up OR All Answered), and we are currently playing
        const shouldEndRound = status === "playing" && (isTimeUp || allAnswered);

        if (shouldEndRound && !processingActionRef.current) {
            startIntermission();
        }
    }, [isHost, isTimeUp, answers.length, players.length, status, startIntermission]);

    // Handle Intermission End (Transition to Next Round)
    useEffect(() => {
        if (!isHost) return;

        if (status === 'intermission' && roomData?.intermissionEndsAt) {
            const now = Date.now();
            const delay = Math.max(0, roomData.intermissionEndsAt - now);

            // We use a timeout to trigger the next round transition
            // But we must be careful not to trigger it multiple times or if component unmounts
            const timer = setTimeout(() => {
                if (status === 'intermission') { // Double check status
                    handleNextRound();
                }
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [isHost, status, roomData?.intermissionEndsAt, handleNextRound]);

    // Update next category when category changes in room
    useEffect(() => {
        if (roomData?.category) {
            setNextCategory(roomData.category);
        }
    }, [roomData?.category]);

    return {
        isTimeUp,
        setIsTimeUp,
        handleTimeUp,
        handleNextRound,
        nextCategory,
        setNextCategory
    };
}
