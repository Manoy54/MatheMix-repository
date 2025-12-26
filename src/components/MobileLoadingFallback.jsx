import React from 'react';
import { useLoading } from '../context/LoadingContext';

const MobileLoadingFallback = () => {
    const { isModeDataReady, isBg3DReady, markAsFinished } = useLoading();

    React.useEffect(() => {
        // Auto-dismiss when data is ready
        if (isModeDataReady && isBg3DReady) {
            markAsFinished();
        }
    }, [isModeDataReady, isBg3DReady, markAsFinished]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#023e8a] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
    );
};

export default MobileLoadingFallback;
