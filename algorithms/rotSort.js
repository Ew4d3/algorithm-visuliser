export const ROT_TOTAL_SECONDS = 365 * 24 * 60 * 60;   // one year

const QUIPS = [
    "Rotsort is working. Please do not disturb.",
    "Currently sorting...",
    "Progress: 0%. Confidence: 100%.",
    "Time complexity: O(eternity).",
    "Have you considered using bubble sort?",
    "Still sorting."
];

export function formatCountdown(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = n => String(n).padStart(2, "0");
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export function rotMessage(remaining) {
    const elapsed = ROT_TOTAL_SECONDS - remaining;
    const quip = QUIPS[Math.floor(elapsed / 6) % QUIPS.length];
    return `Time until next sort check: ${formatCountdown(remaining)}. ${quip}`;
}