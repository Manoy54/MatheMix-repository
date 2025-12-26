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

    const startLoading = useCallback((options = {}) => {
        const { durationMs = 0 } = options;

        // Reset readiness flags
        setModeDataReady(false);
        setBg3DReady(false);
        setIsLoading(true);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (durationMs > 0) {
            timerRef.current = setTimeout(() => {
                setModeDataReady(true);
                setBg3DReady(true);
                // Note: LoadingScreen component will call markAsFinished/stopLoading 
                // when its internal progress animation reaches 100%.
            }, durationMs);
        }
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
