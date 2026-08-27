// These are presentation timings, rather than a literal conversion of a sidereal year.
// They preserve the familiar order (Mercury is fastest, Neptune is slowest) without
// making the inner planets unreadably frantic.
export const SOLAR_SYSTEM_CYCLE_SECONDS = 560;

export const PLANETS = [
    { key: 'mercury', name: 'Mercury', distanceAU: 0.387, periodDays: 87.97, inclination: 7.0, eccentricity: 0.2056, periapsis: 0.51, meanAnomaly: 2.3, atlasIndex: 0, displayRadius: 0.48, orbitRadius: 6.3, displayPeriod: 76, orbitColor: '#d9ad8a' },
    { key: 'venus', name: 'Venus', distanceAU: 0.723, periodDays: 224.70, inclination: 3.4, eccentricity: 0.0068, periapsis: 1.34, meanAnomaly: 4.4, atlasIndex: 1, displayRadius: 0.70, orbitRadius: 9.2, displayPeriod: 112, orbitColor: '#e2c895' },
    { key: 'earth', name: 'Earth', distanceAU: 1, periodDays: 365.26, inclination: 0, eccentricity: 0.0167, periapsis: 1.80, meanAnomaly: 0.7, atlasIndex: 2, displayRadius: 0.78, orbitRadius: 12.2, displayPeriod: 148, orbitColor: '#a7c9ef' },
    { key: 'mars', name: 'Mars', distanceAU: 1.524, periodDays: 686.98, inclination: 1.9, eccentricity: 0.0934, periapsis: 4.37, meanAnomaly: 3.8, atlasIndex: 3, displayRadius: 0.61, orbitRadius: 15.9, displayPeriod: 190, orbitColor: '#d99b83' },
    { key: 'jupiter', name: 'Jupiter', distanceAU: 5.203, periodDays: 4332.59, inclination: 1.3, eccentricity: 0.0489, periapsis: 0.26, meanAnomaly: 5.2, atlasIndex: 4, displayRadius: 1.42, orbitRadius: 20.1, displayPeriod: 265, orbitColor: '#d8bd9a' },
    { key: 'saturn', name: 'Saturn', distanceAU: 9.537, periodDays: 10759.22, inclination: 2.5, eccentricity: 0.0565, periapsis: 1.62, meanAnomaly: 1.6, atlasIndex: 5, displayRadius: 1.24, hasRings: true, orbitRadius: 24.2, displayPeriod: 330, orbitColor: '#d9d1a8' },
    { key: 'uranus', name: 'Uranus', distanceAU: 19.191, periodDays: 30688.5, inclination: 0.8, eccentricity: 0.0457, periapsis: 2.07, meanAnomaly: 3.2, atlasIndex: 6, displayRadius: 0.98, orbitRadius: 28.6, displayPeriod: 430, orbitColor: '#9eced4' },
    { key: 'neptune', name: 'Neptune', distanceAU: 30.07, periodDays: 60190, inclination: 1.8, eccentricity: 0.0113, periapsis: 5.30, meanAnomaly: 5.7, atlasIndex: 7, displayRadius: 0.94, orbitRadius: 33.2, displayPeriod: 560, orbitColor: '#9eb8ee' },
];

const NEPTUNE_DAYS = PLANETS[7].periodDays;

export function getPlanet(key, fallbackIndex = 0) {
    return PLANETS.find((planet) => planet.key === key) ?? PLANETS[fallbackIndex % PLANETS.length];
}

export function getOrbitalPeriodSeconds(planet) {
    return planet.displayPeriod ?? SOLAR_SYSTEM_CYCLE_SECONDS * (planet.periodDays / NEPTUNE_DAYS);
}

// These compressed semi-major axes retain the real orbital order while fitting the scene.
export function getDisplayOrbitRadius(planet) {
    return planet.orbitRadius;
}

export function getDisplayPlanetRadius(planet) {
    return planet.displayRadius;
}
