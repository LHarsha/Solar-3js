/**
 * Generate a deterministic planet color palette from a hue seed
 * @param {number} seed - Hue value 0-360
 * @returns {{ surface1: string, surface2: string, atmosphere: string, ring: string, hsl: [number, number, number] }}
 */
export function generatePlanetColor(seed) {
    const hue = seed % 360;
    return {
        surface1: `hsl(${hue}, 70%, 45%)`,
        surface2: `hsl(${(hue + 30) % 360}, 60%, 35%)`,
        atmosphere: `hsl(${(hue + 15) % 360}, 80%, 60%)`,
        ring: `hsl(${(hue + 45) % 360}, 50%, 50%)`,
        hsl: [hue, 70, 45],
    };
}

/**
 * Convert HSL to a THREE-compatible hex color
 * @param {number} h - Hue 0-360
 * @param {number} s - Saturation 0-100
 * @param {number} l - Lightness 0-100
 * @returns {string} hex color
 */
export function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (v) => {
        const hex = Math.round((v + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get glow color based on project status
 * @param {'active'|'paused'|'complete'} status
 * @returns {{ color: string, hex: string }}
 */
export function statusGlow(status) {
    const map = {
        active: { color: 'rgb(34, 211, 238)', hex: '#22d3ee' },  // cyan
        paused: { color: 'rgb(251, 191, 36)', hex: '#fbbf24' },  // amber
        complete: { color: 'rgb(74, 222, 128)', hex: '#4ade80' },  // green
    };
    return map[status] || map.active;
}
