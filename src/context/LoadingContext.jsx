import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useMobile } from '../hooks/useMobile'; // Import useMobile

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

// Module level variable to persist across remounts within the same session
let hasFinishedAlready = false;

export const LoadingProvider = ({ children }) => {
    const [isModeDataReady, setModeDataReady] = useState(false);
    const [isBg3DReady, setBg3DReady] = useState(false);
    const [isLoading, setIsLoading] = useState(!hasFinishedAlready);
    const timerRef = useRef(null);
    const isMobile = useMobile(); // Use the hook

    // Fallback for mobile to prevent getting stuck
    useEffect(() => {
        if (isMobile && isLoading) {
            const fallbackTimeout = setTimeout(() => {
                if (isLoading) { // Re-check if still loading
                    stopLoading();
                }
            }, 2000); // 2-second fallback

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

    // Safety effect: If we are loading but no timer works (e.g. initial refresh), force finish after delay
    useEffect(() => {
        if (isLoading && !isModeDataReady && !timerRef.current) {
            const safetyTimer = setTimeout(() => {
                setModeDataReady(true);
                setBg3DReady(true);
            }, 2500); // 2.5s safety net for initial load
            return () => clearTimeout(safetyTimer);
        }
    }, [isLoading, isModeDataReady]);

    const startLoading = useCallback((options = {}) => {
        // Default to 1500ms if no duration specified to prevent infinite hanging
        const { durationMs = 1500 } = options;

        // Reset readiness flags
        setModeDataReady(false);
        setBg3DReady(false);
        setIsLoading(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Always set a timer since we have a default duration now
        timerRef.current = setTimeout(() => {
            setModeDataReady(true);
            setBg3DReady(true);
            // Note: LoadingScreen component will call markAsFinished/stopLoading 
            // when its internal progress animation reaches 100%.
        }, durationMs);
    }, []);

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
            hasFinishedLoading: !isLoading, // Backward compatibility
            startLoading,
            stopLoading,
            markAsFinished,
            resetLoading
        }}>
            {children}
        </LoadingContext.Provider>
    );
};
