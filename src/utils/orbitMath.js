import * as THREE from 'three';

/**
 * Calculate position on an elliptical orbit in the XZ plane
 * @param {number} orbitRadius - Semi-major axis radius
 * @param {number} speed - Angular speed multiplier
 * @param {number} time - Current elapsed time
 * @param {number} tilt - Orbital tilt (radians, applied to Y)
 * @returns {THREE.Vector3}
 */
export function getOrbitPosition(orbitRadius, speed, time, tilt = 0) {
    const eccentricity = 0.15; // mild ellipse
    const angle = time * speed;
    const x = orbitRadius * Math.cos(angle);
    const z = orbitRadius * (1 - eccentricity) * Math.sin(angle);
    const y = Math.sin(angle) * tilt * orbitRadius * 0.15;
    return new THREE.Vector3(x, y, z);
}

/**
 * Anti-gravity drift — gentle floating per planet
 * @param {number} time
 * @param {number} freq - Wave frequency
 * @param {number} amplitude - Wave amplitude
 * @returns {{ dy: number, dz: number }}
 */
export function getAntiGravityDrift(time, freq = 0.5, amplitude = 0.15) {
    const dy = Math.sin(time * freq) * amplitude;
    const dz = Math.cos(time * freq * 0.7) * amplitude * 0.5;
    return { dy, dz };
}

/**
 * Smooth lerp between two Vector3s
 */
export function lerpVector3(a, b, t) {
    return new THREE.Vector3().lerpVectors(a, b, Math.min(1, Math.max(0, t)));
}

/**
 * Generate orbit points for rendering the elliptical path
 * @param {number} orbitRadius
 * @param {number} tilt
 * @param {number} segments
 * @returns {THREE.Vector3[]}
 */
export function getOrbitPoints(orbitRadius, tilt = 0, segments = 128) {
    const points = [];
    const eccentricity = 0.15;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = orbitRadius * Math.cos(angle);
        const z = orbitRadius * (1 - eccentricity) * Math.sin(angle);
        const y = Math.sin(angle) * tilt * orbitRadius * 0.15;
        points.push(new THREE.Vector3(x, y, z));
    }
    return points;
}
