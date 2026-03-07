import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

const MusicContext = createContext();

// ── Note frequencies ────────────────────────────────────────────────
const NF = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

// ── LOBBY MUSIC ─────────────────────────────────────────────────────
// Bouncy, playful melody that moves up AND down with rhythmic variety.
// Pattern: 32 notes per full loop (8 bars × 4 sub-beats)
// Chord progression: C → Am → F → G → Em → Am → Dm → G
const LOBBY_MELODY = [
    // bar 1: Cmaj – bouncy skip
    'E4', 'G4', 'C5', 'G4',
    // bar 2: Am – descend playfully
    'A4', 'E4', 'C4', 'E4',
    // bar 3: Fmaj – rise up
    'F4', 'A4', 'C5', 'A4',
    // bar 4: Gmaj – peak & drop
    'G4', 'B4', 'D5', 'B4',
    // bar 5: Em – answer phrase
    'E4', 'G4', 'B4', 'G4',
    // bar 6: Am – pull back
    'A4', 'C5', 'A4', 'E4',
    // bar 7: Dm – tension
    'D4', 'F4', 'A4', 'D5',
    // bar 8: G – resolve bounce
    'B4', 'G4', 'D4', 'G4',
];

// Bass line: one note per bar, plays on beat 1 and beat 3 (syncopated pulse)
const LOBBY_BASS = ['C2', 'A2', 'F2', 'G2', 'E2', 'A2', 'D3', 'G2'];

// Pad chords (sustained, one per bar)
const LOBBY_PADS = [
    ['C3', 'E3', 'G3'],
    ['A3', 'C4', 'E4'],
    ['F3', 'A3', 'C4'],
    ['G3', 'B3', 'D4'],
    ['E3', 'G3', 'B3'],
    ['A3', 'C4', 'E4'],
    ['D3', 'F3', 'A3'],
    ['G3', 'B3', 'D4'],
];

const LOBBY_BPM = 105; // little faster = more energy

// ── GAME MUSIC ──────────────────────────────────────────────────────
const GAME_MELODY = [
    'D4', 'F4', 'A4', 'D5',
    'F4', 'A4', 'C5', 'F5',
    'A3', 'C4', 'E4', 'A4',
    'G3', 'B3', 'D4', 'G4',
];
const GAME_BASS = ['D2', 'F2', 'A2', 'G2'];
const GAME_PADS = [
    ['D3', 'F3', 'A3'],
    ['F3', 'A3', 'C4'],
    ['A3', 'C4', 'E4'],
    ['G3', 'B3', 'D4'],
];
const GAME_BPM = 115;

// Route classification
const GAME_ROUTES = ['/game'];
const LOBBY_ROUTES = ['/mode-select', '/category-select', '/lobby', '/stats', '/leaderboard'];

export function MusicProvider({ children }) {
    const location = useLocation();
    const ctxRef = useRef(null);
    const masterRef = useRef(null);
    const timersRef = useRef([]);
    const oscNodesRef = useRef([]);
    const moodRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const mutedRef = useRef(false);
    const interactedRef = useRef(false);
    const isMobile = useMobile();

    useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
        return ctxRef.current;
    }, []);

    // ── Kill everything ─────────────────────────────────────────────
    const killAll = useCallback(() => {
        timersRef.current.forEach(id => clearInterval(id));
        timersRef.current = [];
        oscNodesRef.current.forEach(({ osc, gain }) => {
            try {
                if (ctxRef.current) {
                    gain.gain.cancelScheduledValues(ctxRef.current.currentTime);
                    gain.gain.setValueAtTime(gain.gain.value, ctxRef.current.currentTime);
                    gain.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.3);
                }
                setTimeout(() => { try { osc.stop(); } catch (_) { } }, 400);
            } catch (_) { }
        });
        oscNodesRef.current = [];
        moodRef.current = null;
    }, []);

    // ── Play a melody note (short, bouncy) ──────────────────────────
    const playMelody = useCallback((ctx, master, noteName, waveType, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = waveType;
        osc.frequency.setValueAtTime(NF[noteName], now);

        // Punchy attack, sustain, then fade
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
        gain.gain.setValueAtTime(0.18, now + dur * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + dur);
    }, []);

    // ── Play a bass note (deep, thumpy) ─────────────────────────────
    const playBass = useCallback((ctx, master, noteName, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'sine'; // clean bass
        osc.frequency.setValueAtTime(NF[noteName], now);

        // Thumpy attack
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + dur);
    }, []);

    // ── Play a soft percussion tick ─────────────────────────────────
    const playTick = useCallback((ctx, master, isAccent) => {
        // Short burst of filtered noise as a hi-hat-like tick
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(isAccent ? 6000 : 8000, ctx.currentTime);

        const gain = ctx.createGain();
        const now = ctx.currentTime;
        const vol = isAccent ? 0.10 : 0.04;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(now);
    }, []);

    // ── Play a pad chord ────────────────────────────────────────────
    const playPadChord = useCallback((ctx, master, chord, duration) => {
        chord.forEach(noteName => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(NF[noteName], now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
            gain.gain.setValueAtTime(0.08, now + duration - 0.4);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            osc.connect(gain);
            gain.connect(master);
            osc.start(now);
            osc.stop(now + duration + 0.1);

            oscNodesRef.current.push({ osc, gain });
        });
    }, []);

    // ── Start music ─────────────────────────────────────────────────
    const startMusic = useCallback((mood) => {
        if (moodRef.current === mood) return;
        killAll();

        let ctx;
        try { ctx = getCtx(); } catch (_) { return; }

        moodRef.current = mood;

        const master = ctx.createGain();
        master.gain.setValueAtTime(mutedRef.current ? 0 : 0.85, ctx.currentTime);
        master.connect(ctx.destination);
        masterRef.current = master;

        const isLobby = mood === 'lobby';
        const melody = isLobby ? LOBBY_MELODY : GAME_MELODY;
        const bass = isLobby ? LOBBY_BASS : GAME_BASS;
        const pads = isLobby ? LOBBY_PADS : GAME_PADS;
        const bpm = isLobby ? LOBBY_BPM : GAME_BPM;
        const waveType = isLobby ? 'triangle' : 'triangle';

        const beatSec = 60 / bpm;
        const subBeatSec = beatSec * 0.5;         // 8th-note grid
        const noteDur = subBeatSec * 0.8;          // slightly staccato
        const barDuration = 4 * subBeatSec;        // 4 sub-beats = 1 bar (2 actual beats)
        // But our bars have 4 melody notes each, so each melody note = 1 sub-beat

        const totalBars = melody.length / 4;       // how many bars in the melody

        // ── Melody + Percussion loop (fires every sub-beat) ─────────
        let subBeatIdx = 0;
        const tickMelody = () => {
            if (!ctxRef.current || !masterRef.current) return;
            const c = ctxRef.current;
            const m = masterRef.current;

            const melIdx = subBeatIdx % melody.length;
            playMelody(c, m, melody[melIdx], waveType, noteDur);

            // Percussion: tick on every sub-beat, accent on beat 1 and 3
            // Skip on mobile — noise buffer creation is CPU expensive
            if (isLobby && !isMobile) {
                const posInBar = subBeatIdx % 4;
                playTick(c, m, posInBar === 0 || posInBar === 2);
            }

            subBeatIdx++;
        };
        tickMelody();
        const melTimer = setInterval(tickMelody, subBeatSec * 1000);
        timersRef.current.push(melTimer);

        // ── Bass loop (fires every bar — on beat 1, and a ghost on beat 3) ──
        let barIdx = 0;
        const tickBass = () => {
            if (!ctxRef.current || !masterRef.current) return;
            const bassNote = bass[barIdx % bass.length];
            playBass(ctxRef.current, masterRef.current, bassNote, barDuration * 0.6);
            barIdx++;
        };
        tickBass();
        const bassTimer = setInterval(tickBass, barDuration * 1000);
        timersRef.current.push(bassTimer);

        // ── Pad chord loop (one chord per bar) — skip on mobile for perf ──
        if (!isMobile) {
            let padIdx = 0;
            const tickPad = () => {
                if (!ctxRef.current || !masterRef.current) return;
                playPadChord(ctxRef.current, masterRef.current, pads[padIdx % pads.length], barDuration);
                padIdx++;
            };
            tickPad();
            const padTimer = setInterval(tickPad, barDuration * 1000);
            timersRef.current.push(padTimer);
        }

    }, [killAll, getCtx, playMelody, playBass, playTick, playPadChord, isMobile]);

    // ── Mute toggle ─────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (masterRef.current && ctxRef.current) {
                masterRef.current.gain.linearRampToValueAtTime(
                    next ? 0 : 0.85,
                    ctxRef.current.currentTime + 0.2
                );
            }
            return next;
        });
    }, []);

    // ── Route-based auto-switching ──────────────────────────────────
    useEffect(() => {
        if (!interactedRef.current) return;
        const path = location.pathname;
        if (GAME_ROUTES.some(r => path.startsWith(r))) {
            startMusic('game');
        } else if (LOBBY_ROUTES.some(r => path.startsWith(r))) {
            startMusic('lobby');
        } else {
            killAll();
        }
    }, [location.pathname, startMusic, killAll]);

    // ── Start after first interaction ───────────────────────────────
    useEffect(() => {
        const onInteract = () => {
            if (interactedRef.current) return;
            interactedRef.current = true;
            try { getCtx(); } catch (_) { return; }
            const path = location.pathname;
            if (GAME_ROUTES.some(r => path.startsWith(r))) {
                startMusic('game');
            } else if (LOBBY_ROUTES.some(r => path.startsWith(r))) {
                startMusic('lobby');
            }
        };
        window.addEventListener('click', onInteract);
        window.addEventListener('keydown', onInteract);
        window.addEventListener('touchstart', onInteract);
        return () => {
            window.removeEventListener('click', onInteract);
            window.removeEventListener('keydown', onInteract);
            window.removeEventListener('touchstart', onInteract);
        };
    }, [getCtx, location.pathname, startMusic]);

    // ── Cleanup ─────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            killAll();
            if (ctxRef.current) {
                ctxRef.current.close().catch(() => { });
                ctxRef.current = null;
            }
        };
    }, [killAll]);

    return (
        <MusicContext.Provider value={{ isMuted, toggleMute }}>
            {children}
        </MusicContext.Provider>
    );
}

export const useMusic = () => useContext(MusicContext);
