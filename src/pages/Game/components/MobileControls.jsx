import React from 'react';

export const MobileControls = React.memo(({ onSkip, onSubmit }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full p-4 z-50 pb-8 pt-6">
            <div className="flex gap-3 w-full max-w-md mx-auto">
                <button
                    onClick={onSkip}
                    className="flex-1 bg-gradient-to-b from-orange-500 to-orange-600 active:from-orange-600 active:to-orange-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform"
                >
                    Give Up
                </button>
                <button
                    onClick={onSubmit}
                    className="flex-1 bg-gradient-to-b from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white py-3.5 rounded-xl font-black tracking-wider text-sm uppercase active:scale-[0.98] transition-transform"
                >
                    Submit
                </button>
            </div>
        </div>
    );
});
