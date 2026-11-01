import * as THREE from 'three';

const DEG = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);
const DAY_MS = 86400000;
export const AU_KM = 149597870.7;

export function daysSinceJ2000(time) {
    return (time - J2000) / DAY_MS;
}

function solveKeplerEquation(meanAnomaly, eccentricity) {
    let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
    for (let iteration = 0; iteration < 6; iteration += 1) {
        eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly)
            / (1 - eccentricity * Math.cos(eccentricAnomaly));
    }
    return eccentricAnomaly;
}

function elementsAt(planet, time) {
    const centuries = daysSinceJ2000(time) / 36525;
    const value = ([base, rate]) => base + rate * centuries;
    const { a, e, I, L, w, O } = planet.elements;
    return { a: value(a), e: value(e), I: value(I) * DEG, L: value(L) * DEG, w: value(w) * DEG, O: value(O) * DEG };
}

// Ecliptic (x, y, z) → scene (x, z, -y): ecliptic north is scene up, and the rotation stays right-handed.
function eclipticToScene(target, x, y, z, scale) {
    return target.set(x * scale, z * scale, -y * scale);
}

function orbitalToEcliptic(target, el, eccentricAnomaly, scale) {
    const xOrbit = el.a * (Math.cos(eccentricAnomaly) - el.e);
    const yOrbit = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(eccentricAnomaly);
    const argument = el.w - el.O;
    const cw = Math.cos(argument), sw = Math.sin(argument);
    const cO = Math.cos(el.O), sO = Math.sin(el.O);
    const cI = Math.cos(el.I), sI = Math.sin(el.I);
    const x = (cw * cO - sw * sO * cI) * xOrbit + (-sw * cO - cw * sO * cI) * yOrbit;
    const y = (cw * sO + sw * cO * cI) * xOrbit + (-sw * sO + cw * cO * cI) * yOrbit;
    const z = sw * sI * xOrbit + cw * sI * yOrbit;
    return eclipticToScene(target, x, y, z, scale);
}

/** Heliocentric position at a UTC timestamp, in AU (scene axes). */
export function heliocentricPosition(planet, time, target = new THREE.Vector3()) {
    const el = elementsAt(planet, time);
    const eccentricAnomaly = solveKeplerEquation(el.L - el.w, el.e);
    return orbitalToEcliptic(target, el, eccentricAnomaly, 1);
}

/** Same position mapped onto the compressed display scale. */
export function displayPosition(planet, time, target = new THREE.Vector3()) {
    const el = elementsAt(planet, time);
    const eccentricAnomaly = solveKeplerEquation(el.L - el.w, el.e);
    return orbitalToEcliptic(target, el, eccentricAnomaly, planet.orbitRadius / el.a);
}

/** The full display-scale ellipse for the orbit as it is at `time`. */
export function getOrbitPoints(planet, time, segments = 256) {
    const el = elementsAt(planet, time);
    const scale = planet.orbitRadius / el.a;
    return Array.from({ length: segments + 1 }, (_, index) =>
        orbitalToEcliptic(new THREE.Vector3(), el, (index / segments) * Math.PI * 2, scale));
}

/** Greenwich mean sidereal time in radians: Earth's rotation angle relative to the vernal equinox. */
export function greenwichSiderealAngle(time) {
    const degrees = 280.46061837 + 360.98564736629 * daysSinceJ2000(time);
    return THREE.MathUtils.euclideanModulo(degrees, 360) * DEG;
}

/** Rotation angle of a body around its own axis (prograde positive). */
export function rotationAngle(rotationHours, time) {
    return ((daysSinceJ2000(time) * 24) / rotationHours) * Math.PI * 2;
}

// A known new moon (6 Jan 2000, 18:14 UTC) and the mean synodic month give the Moon's phase.
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_DAYS = 29.530588853;

export function lunarElongation(time) {
    const days = (time - NEW_MOON) / DAY_MS;
    return THREE.MathUtils.euclideanModulo(days / SYNODIC_DAYS, 1) * Math.PI * 2;
}

/** Unit vector for a latitude/longitude on a sphere mesh using the standard equirectangular UV layout. */
export function surfaceDirection(lat, lon, target = new THREE.Vector3()) {
    const phi = lat * DEG;
    const lambda = lon * DEG;
    return target.set(Math.cos(phi) * Math.cos(lambda), Math.sin(phi), -Math.cos(phi) * Math.sin(lambda));
}
