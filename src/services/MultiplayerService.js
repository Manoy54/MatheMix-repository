import { db } from '../firebaseConfig';
import {
    doc,
    updateDoc,
    arrayUnion,
    getDoc,
    serverTimestamp,
    increment,
    setDoc,
    collection,
    addDoc,
    deleteDoc,
    runTransaction
} from 'firebase/firestore';
import { CATEGORY_MAP } from '../components/MultiplayerComponents';

export const MultiplayerService = {
    /**
     * Submit an answer for a player.
     * Uses arrayUnion for atomic addition.
     */
    submitAnswer: async (roomCode, user, nickname, guess, isCorrect, score) => {
        if (!roomCode || !user) return;
        const roomRef = doc(db, "rooms", roomCode);

        const answerData = {
            uid: user.uid,
            nickname: nickname || user.username || "Player",
            guess: guess,
            isCorrect,
            score,
            timestamp: Date.now(),
        };

        await updateDoc(roomRef, {
            answers: arrayUnion(answerData)
        });
    },

    /**
     * Marks a player as having left or gave up locally.
     */
    giveUp: async (roomCode, user, nickname) => {
        await MultiplayerService.submitAnswer(roomCode, user, nickname, "GAVE UP", false, 0);
    },

    /**
     * Transitions the room to the 'intermission' state.
     */
    startIntermission: async (roomCode, durationMs = 10000) => {
        const roomRef = doc(db, "rooms", roomCode);
        const intermissionEndsAt = Date.now() + durationMs;

        // Simple update is fine here, assuming host is authoritative
        await updateDoc(roomRef, {
            status: "intermission",
            intermissionEndsAt: intermissionEndsAt
        });
    },

    /**
     * Finishes the game and updates player stats using a Transaction.
     * This ensures scores are calculated based on the latest server state of answers.
     */
    finishGame: async (roomCode) => {
        const roomRef = doc(db, "rooms", roomCode);

        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) throw new Error("Room does not exist!");

                const roomData = roomDoc.data();
                const players = roomData.players || [];
                const answers = roomData.answers || [];

                // 1. Calculate Scores based on current round ANSWERS before finishing
                // Note: If startNextRound was used previously, players already have accumulated scores.
                // We just need to ensure the LAST round's answers are accounted for if not already.
                // However, usually finishGame is called AFTER the last round logic.
                // Unlike startNextRound, finishGame might just signal "Stop".
                // But let's recalculate the final scores one last time to be safe? 
                // Actually, typically startNextRound calculates scores for Round N -> starts Round N+1.
                // If we are at Round Final, we handle score calc for Round Final -> Then Finish.

                // Let's assume this function handles the FINAL round scoring too.
                const roundScores = {};
                const correctAnswers = answers
                    .filter(a => a.isCorrect)
                    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                correctAnswers.forEach((answerData, index) => {
                    const rank = index + 1;
                    const baseScore = 100;
                    const rankBonus = Math.max(0, 30 - ((rank - 1) * 10));
                    roundScores[answerData.uid] = baseScore + rankBonus;
                });

                const finalPlayers = players.map(p => {
                    const verifiedRoundScore = roundScores[p.uid] || 0;
                    return { ...p, score: (p.score || 0) + verifiedRoundScore };
                });

                // 2. Update Room Status
                transaction.update(roomRef, {
                    status: "finished",
                    players: finalPlayers,
                    answers: [],
                    currentQuestion: null
                });

                // 3. Update User Stats (Side effect, can be outside transaction or parallel, 
                // but for safety we do it here or after. Transaction limits write count. 
                // Updating N user docs might exceed limits.
                // Let's return the final players to update stats AFTER transaction.)
                return finalPlayers;
            });

            // Post-transaction: update individual user stats (best effort)
            // We re-fetch the room to get the finalized players from the transaction result if needed,
            // but we can trust the logic.
            // Actually, we can just read the result provided we return it.
            // Wait, runTransaction returns the return value of the callback.
        } catch (e) {
            console.error("Transaction failed: ", e);
        }
    },

    /**
     * Advances the game to the next round with a new question using a Transaction.
     * Ensures atomic score updates and state transition.
     */
    startNextRound: async (roomCode, nextRoundNumber, category) => {
        const roomRef = doc(db, "rooms", roomCode);

        try {
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) throw new Error("Room does not exist!");

                const roomData = roomDoc.data();
                const players = roomData.players || [];
                const answers = roomData.answers || [];
                const playedQuestions = roomData.playedQuestions || [];

                // 1. Calculate Scores for the round that just ended
                const roundScores = {};
                const correctAnswers = answers
                    .filter(a => a.isCorrect)
                    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                correctAnswers.forEach((answerData, index) => {
                    const rank = index + 1;
                    const baseScore = 100;
                    const rankBonus = Math.max(0, 30 - ((rank - 1) * 10));
                    roundScores[answerData.uid] = baseScore + rankBonus;
                });

                const updatedPlayers = players.map(p => {
                    const verifiedRoundScore = roundScores[p.uid] || 0;
                    return { ...p, score: (p.score || 0) + verifiedRoundScore };
                });

                // 2. Fetch New Question
                // NOTE: We cannot easily fetch a random doc inside a transaction if we don't know the ID.
                // We'll have to pick a question ID first or fetch the question bank separately.
                // Since this is client-side, we can fetch the Question Bank OUTSIDE the transaction?
                // But we need to ensure we don't pick a played question.
                // Let's Fetch the Question Data FIRST (outside transaction - or inside if simple get)
                // Using a known ID path pattern is best. 
                // The current code fetches a huge doc 'question-data/slug'.

                const slug = CATEGORY_MAP[category] || "number-algebra";
                const qDocRef = doc(db, 'question-data', slug);
                const qDocSnap = await transaction.get(qDocRef); // Read inside tx for consistency

                let question = null;
                if (qDocSnap.exists()) {
                    const data = qDocSnap.data();
                    const questions = data.questions || [];

                    // Filter out played questions
                    const availableQuestions = questions.filter(q => !playedQuestions.includes(q.id));

                    if (availableQuestions.length > 0) {
                        question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
                    } else if (questions.length > 0) {
                        // All played? Recycle.
                        question = questions[Math.floor(Math.random() * questions.length)];
                    } else if (data.definition) {
                        // Fallback for single-question docs
                        question = { definition: data.definition, answer: data.answer, id: "single" };
                    }
                }

                if (!question) {
                    question = { definition: "No questions found!", answer: "ERROR", id: "error" };
                }

                // 3. Update Room
                transaction.update(roomRef, {
                    status: "playing",
                    currentQuestion: question,
                    roundStartTime: serverTimestamp(),
                    answers: [],
                    players: updatedPlayers,
                    category: category,
                    roundNumber: nextRoundNumber,
                    playedQuestions: arrayUnion(question.id || "unknown")
                });
            });
        } catch (e) {
            console.error("startNextRound Transaction failed:", e);
        }
    },

    /**
     * Checks if a room exists.
     */
    checkRoomExists: async (roomCode) => {
        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);
        return roomSnap.exists();
    },

    /**
     * Generates a unique room code.
     */
    generateRoomCode: () => {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    },

    /**
     * Creates a new room.
     */
    createRoom: async (user, nickname) => {
        let newRoomCode = MultiplayerService.generateRoomCode();
        // Simple check before create (collision rare)
        let roomExists = await MultiplayerService.checkRoomExists(newRoomCode);
        while (roomExists) {
            newRoomCode = MultiplayerService.generateRoomCode();
            roomExists = await MultiplayerService.checkRoomExists(newRoomCode);
        }

        const roomRef = doc(db, "rooms", newRoomCode);
        const newPlayer = { uid: user.uid, nickname: nickname, score: 0 };

        await setDoc(roomRef, {
            hostId: user.uid,
            hostName: nickname,
            roomCode: newRoomCode,
            players: [newPlayer],
            hostParticipates: true,
            category: "Number & Algebra",
            status: "waiting",
            rounds: 5,
            currentQuestion: null,
            answers: [],
            roundNumber: 1,
            playedQuestions: [] // Track played questions
        });

        return newRoomCode;
    },

    /**
     * Joins an existing room.
     * Uses arrayUnion to safely add player.
     */
    joinRoom: async (user, nickname, roomCode) => {
        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error("Room not found.");
        }

        const data = roomSnap.data();
        if (data.status === "playing") {
            const playerExists = data.players.find(p => p.uid === user.uid);
            if (!playerExists) {
                throw new Error("Game is already in progress.");
            }
            return; // Already in, just navigating
        }

        // Check if player already in (client side check largely, but arrayUnion handles dupes if object identical)
        // However, player object might have changed (score reset?). 
        // We really want to check ID.
        const playerExists = data.players.find(p => p.uid === user.uid);
        if (!playerExists) {
            const newPlayer = { uid: user.uid, nickname: nickname, score: 0 };
            await updateDoc(roomRef, {
                players: arrayUnion(newPlayer)
            });
        }
    },

    /**
     * Toggles host participation.
     */
    toggleHostParticipation: async (roomCode, roomData, user, nickname, participates) => {
        const roomRef = doc(db, "rooms", roomCode);

        // This requires read-modify-write not easily doable with arrayUnion/Remove due to object complexity
        // Transaction is safer
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) return;

            const data = roomDoc.data();
            let currentPlayers = data.players || [];

            if (participates) {
                if (!currentPlayers.some(p => p.uid === user.uid)) {
                    const newHostPlayer = {
                        uid: user.uid,
                        nickname: data.hostName || nickname,
                        score: 0
                    };
                    currentPlayers = [newHostPlayer, ...currentPlayers];
                }
            } else {
                currentPlayers = currentPlayers.filter(p => p.uid !== user.uid);
            }

            transaction.update(roomRef, {
                hostParticipates: participates,
                players: currentPlayers
            });
        });
    },

    updateCategory: async (roomCode, newCategory) => {
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, { category: newCategory });
    },

    updateRounds: async (roomCode, rounds) => {
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, { rounds: rounds });
    },

    /**
     * Starts the game.
     */
    startGame: async (roomCode, roomData, questions) => {
        if (!questions || questions.length === 0) throw new Error("No questions available.");

        // We use the passed questions bank (likely fetched in UI) to pick the first question.
        // Then we initialize the room.
        const question = questions[Math.floor(Math.random() * questions.length)];

        const roomRef = doc(db, "rooms", roomCode);

        await updateDoc(roomRef, {
            status: "playing",
            currentQuestion: question,
            roundStartTime: Date.now(), // First round uses client time for quicker start, subsequent use serverTimestamp
            answers: [],
            roundNumber: 1,
            playedQuestions: [question.id || "start"]
        });
    },

    playAgain: async (roomCode, roomData) => {
        const roomRef = doc(db, "rooms", roomCode);

        // Simpler reset using updateDoc
        // Ideally should archive first.

        const resetPlayers = roomData.players.map(p => ({ ...p, score: 0 }));

        await updateDoc(roomRef, {
            status: "waiting",
            players: resetPlayers,
            currentQuestion: null,
            answers: [],
            roundNumber: 1,
            playAgainVotes: [],
            nextRoomCode: null,
            playedQuestions: []
        });
    },

    leaveRoom: async (roomCode, roomData, user, isHost) => {
        if (!roomCode) return;
        const roomRef = doc(db, "rooms", roomCode);

        if (isHost) {
            await deleteDoc(roomRef);
        } else {
            // Filter player out
            // Use Transaction to safely remove complex object by ID
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) return;

                const data = roomDoc.data();
                const updatedPlayers = (data.players || []).filter(p => p.uid !== user.uid);

                transaction.update(roomRef, { players: updatedPlayers });
            });
        }
    },

    votePlayAgain: async (roomCode, userId) => {
        const roomRef = doc(db, "rooms", roomCode);
        await updateDoc(roomRef, {
            playAgainVotes: arrayUnion(userId)
        });
    }
};
