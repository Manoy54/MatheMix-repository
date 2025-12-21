// src/utils/inappBrowser.js

export function detectSource() {
    const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();

    const isMetaIAB = ua.includes("fb_iab") || ua.includes("fban") || ua.includes("fbav");
    const isMessenger = ua.includes("fb_iab/messenger");
    const isInstagram = ua.includes("instagram");

    const isTelegramUA = ua.includes("telegram");
    const isTelegramWebApp =
        typeof window !== "undefined" &&
        // @ts-ignore
        typeof window.Telegram !== "undefined" &&
        // @ts-ignore
        typeof window.Telegram?.WebApp !== "undefined";

    const isTelegram = isTelegramUA || isTelegramWebApp;

    // Optional hints (do not gate using these alone)
    const isAndroidWebViewHint = ua.includes("wv") || ua.includes("webview");

    const shouldGate = isMetaIAB || isInstagram || isTelegram;

    return {
        shouldGate,
        isMetaIAB,
        isMessenger,
        isInstagram,
        isTelegram,
        isTelegramWebApp,
        isAndroidWebViewHint,
    };
}

export function openInChromeAndroid(url) {
    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);

    if (!isAndroid) {
        window.location.href = url;
        return;
    }

    const fallback = encodeURIComponent(url);
    const noScheme = url.replace(/^https?:\/\//, "");
    const intentUrl =
        `intent://${noScheme}` +
        `#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;

    window.location.href = intentUrl;
}
