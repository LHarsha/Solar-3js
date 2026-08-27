import * as THREE from 'three';

/**
 * Calculate position on an elliptical orbit in the XZ plane
 * @param {number} orbitRadius - Semi-major axis radius
 * @param {number} orbitPeriod - Seconds for a complete revolution
 * @param {number} time - Current elapsed time
 * @param {number} eccentricity - Orbital eccentricity
 * @param {number} periapsis - Direction of periapsis in the display plane
 * @returns {THREE.Vector3}
 */
export function getOrbitPosition(orbitRadius, orbitPeriod, time, tilt = 0, eccentricity = 0, periapsis = 0, initialMeanAnomaly = 0) {
    const meanAnomaly = initialMeanAnomaly + (time / orbitPeriod) * Math.PI * 2;
    const eccentricAnomaly = solveKeplerEquation(meanAnomaly, eccentricity);
    return getOrbitPoint(orbitRadius, eccentricity, eccentricAnomaly, tilt, periapsis);
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
export function getOrbitPoints(orbitRadius, tilt = 0, eccentricity = 0, periapsis = 0, segments = 128) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        points.push(getOrbitPoint(orbitRadius, eccentricity, (i / segments) * Math.PI * 2, tilt, periapsis));
    }
    return points;
}

function solveKeplerEquation(meanAnomaly, eccentricity) {
    let eccentricAnomaly = meanAnomaly;
    for (let iteration = 0; iteration < 4; iteration += 1) {
        eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly)
            / (1 - eccentricity * Math.cos(eccentricAnomaly));
    }
    return eccentricAnomaly;
}

function getOrbitPoint(semiMajorAxis, eccentricity, eccentricAnomaly, tilt, periapsis) {
    const x = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
    const flatZ = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentricAnomaly);
    const inclinedZ = flatZ * Math.cos(tilt);
    const y = flatZ * Math.sin(tilt);
    const cosine = Math.cos(periapsis);
    const sine = Math.sin(periapsis);

    return new THREE.Vector3(x * cosine - inclinedZ * sine, y, x * sine + inclinedZ * cosine);
}
