import React, { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

// Module level variable to persist across remounts within the same session
let hasFinishedAlready = false;

export const LoadingProvider = ({ children }) => {
    const [isModeDataReady, setModeDataReady] = useState(false);
    const [isBg3DReady, setBg3DReady] = useState(false);
    const [hasFinishedLoading, setHasFinishedLoading] = useState(hasFinishedAlready);

    const markAsFinished = () => {
        hasFinishedAlready = true;
        setHasFinishedLoading(true);
    };

    const resetLoading = () => {
        setModeDataReady(false);
        setBg3DReady(false);
        setHasFinishedLoading(false);
    };

    return (
        <LoadingContext.Provider value={{
            isModeDataReady,
            setModeDataReady,
            isBg3DReady,
            setBg3DReady,
            hasFinishedLoading,
            markAsFinished,
            resetLoading
        }}>
            {children}
        </LoadingContext.Provider>
    );
};
