import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the user is on a mobile device.
 * Detection rules:
 * - Screen width is ≤ 768px
 * - Device supports touch input (pointer: coarse)
 * 
 * @returns {boolean} True if the device is considered mobile, false otherwise.
 */
export function useMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768 || window.matchMedia("(pointer: coarse)").matches;
        }
        return false;
    });

    useEffect(() => {
        const checkMobile = () => {
            const widthMatch = window.innerWidth <= 768;
            const touchMatch = window.matchMedia("(pointer: coarse)").matches;
            setIsMobile(widthMatch || touchMatch);
        };

        // Initial check
        checkMobile();

        // Listen for resize and orientation changes
        window.addEventListener("resize", checkMobile);
        window.addEventListener("orientationchange", checkMobile);

        return () => {
            window.removeEventListener("resize", checkMobile);
            window.removeEventListener("orientationchange", checkMobile);
        };
    }, []);

    return isMobile;
}
