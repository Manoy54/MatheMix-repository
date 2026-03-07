import { useRef, useCallback } from 'react';

/**
 * Custom hook for game sound effects using the Web Audio API.
 * No external audio files needed — all sounds are synthesized.
 */
export const useSoundEffects = () => {
    const audioCtxRef = useRef(null);

    // Lazily create the AudioContext (must be after user interaction)
    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // ── Key Press Sound ──────────────────────────────────────────────
    // A short, soft "pop/click" — satisfying but not annoying on repeat.
    const playKeyPress = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);          // A5
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.06); // quick pitch drop

            gain.gain.setValueAtTime(0.08, now);             // soft volume
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            // Silently ignore audio errors
        }
    }, [getAudioContext]);

    // ── Correct Answer Sound ─────────────────────────────────────────
    // Cheerful ascending three-note chime (C5 → E5 → G5). LOUD & clear.
    const playCorrect = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const spacing = 0.12;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * spacing);

                const noteStart = now + i * spacing;
                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.55, noteStart + 0.02);
                gain.gain.setValueAtTime(0.45, noteStart + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.35);
            });

            // Shimmer/sparkle overlay
            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            shimmer.type = 'triangle';
            shimmer.frequency.setValueAtTime(1567.98, now + 0.2); // G6
            shimmer.frequency.exponentialRampToValueAtTime(2093, now + 0.5); // C7

            shimmerGain.gain.setValueAtTime(0, now + 0.2);
            shimmerGain.gain.linearRampToValueAtTime(0.20, now + 0.25);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);

            shimmer.start(now + 0.2);
            shimmer.stop(now + 0.55);
        } catch (e) {
            // Silently ignore audio errors
        }
    }, [getAudioContext]);

    // ── Wrong Answer Sound ───────────────────────────────────────────
    // Descending two-note (E4 → C4). LOUD & unmistakable.
    const playWrong = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const notes = [329.63, 261.63]; // E4, C4
            const spacing = 0.18;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * spacing);

                const noteStart = now + i * spacing;
                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.50, noteStart + 0.02);
                gain.gain.setValueAtTime(0.40, noteStart + 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.4);
            });
        } catch (e) {
            // Silently ignore audio errors
        }
    }, [getAudioContext]);

    // ── Give Up Sound ─────────────────────────────────────────────────
    // Resigned descending three-note (G4 → E4 → C4). LOUD.
    const playGiveUp = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const notes = [392.00, 329.63, 261.63]; // G4, E4, C4
            const spacing = 0.2;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * spacing);

                const noteStart = now + i * spacing;
                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.45, noteStart + 0.03);
                gain.gain.setValueAtTime(0.35, noteStart + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(noteStart);
                osc.stop(noteStart + 0.4);
            });
        } catch (e) {
            // Silently ignore audio errors
        }
    }, [getAudioContext]);

    return { playKeyPress, playCorrect, playWrong, playGiveUp };
};
