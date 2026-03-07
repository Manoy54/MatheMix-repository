import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useMobile } from '../hooks/useMobile';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

// Module level variable to persist across remounts within the same session
let hasFinishedAlready = false;

export const LoadingProvider = ({ children }) => {
    const [isModeDataReady, setModeDataReady] = useState(false);
    const [isBg3DReady, setBg3DReady] = useState(false);
    const [isLoading, setIsLoading] = useState(!hasFinishedAlready);
    const timerRef = useRef(null);
    const isMobile = useMobile();

    // On mobile: skip loading entirely after first load, and use a very short fallback
    useEffect(() => {
        if (isMobile && isLoading) {
            const fallbackTimeout = setTimeout(() => {
                if (isLoading) {
                    stopLoading();
                }
            }, 800); // Reduced from 2000ms — mobile should never wait this long

            return () => clearTimeout(fallbackTimeout);
        }
    }, [isMobile, isLoading]);

    const stopLoading = useCallback(() => {
        hasFinishedAlready = true;
        setIsLoading(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Safety fallback: force finish if stuck
    useEffect(() => {
        if (isLoading && !isModeDataReady && !timerRef.current) {
            const safetyTimer = setTimeout(() => {
                setModeDataReady(true);
                setBg3DReady(true);
            }, isMobile ? 600 : 2500); // Much shorter on mobile
            return () => clearTimeout(safetyTimer);
        }
    }, [isLoading, isModeDataReady, isMobile]);

    const startLoading = useCallback((options = {}) => {
        // On mobile, use a much shorter loading duration
        const { durationMs = isMobile ? 400 : 1500 } = options;

        setModeDataReady(false);
        setBg3DReady(false);
        setIsLoading(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            setModeDataReady(true);
            setBg3DReady(true);
        }, durationMs);
    }, [isMobile]);

    // Maintain backward compatibility aliases
    const markAsFinished = stopLoading;
    const resetLoading = startLoading;

    return (
        <LoadingContext.Provider value={{
            isModeDataReady,
            setModeDataReady,
            isBg3DReady,
            setBg3DReady,
            isLoading,
            hasFinishedLoading: !isLoading,
            startLoading,
            stopLoading,
            markAsFinished,
            resetLoading
        }}>
            {children}
        </LoadingContext.Provider>
    );
};
