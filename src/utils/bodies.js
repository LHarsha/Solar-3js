import { PLANETS } from './solarSystem';

export const SUN = {
    key: 'sun', name: 'Sun', type: 'star', texture: '/textures/sun.jpg', displayRadius: 2, rotationHours: 609.12,
    facts: { diameter: '1,392,700 km', mass: '333,000 Earths', gravity: '274 m/s²', day: '25.4 days at the equator', temperature: '5,500 °C surface, ~15 million °C core', atmosphere: '73% H, 25% He by mass' },
    description: 'A G-type main-sequence star about 4.6 billion years old. It holds 99.86% of the mass of the Solar System.',
    landmarks: [],
};

// Moons orbit in their parent's equatorial plane (Earth's Moon in the ecliptic), with real
// sidereal periods (Triton's 157° inclination makes its orbit retrograde). Orbit sizes are in parent radii and compressed; body radius is the real
// ratio to the parent with a floor so the small ones stay visible. All are tidally locked.
export const MOONS = [
    {
        key: 'moon', name: 'Moon', parent: 'earth', texture: '/textures/moon.jpg', orbit: 3.1, periodDays: 27.3217, sizeRatio: 0.2727, inclination: 5.14, plane: 'ecliptic',
        facts: { diameter: '3,475 km', gravity: '1.62 m/s²', orbit: '27.3 days', distance: '384,400 km from Earth (mean)', temperature: '−173 to 127 °C' },
        description: 'Earth\'s only natural satellite. Its position and phase here are computed from the real date.',
        landmarks: [
            { id: 'apollo11', name: 'Apollo 11 – Tranquility Base', lat: 0.674, lon: 23.473, note: 'First crewed landing, 20 July 1969.' },
            { id: 'apollo17', name: 'Apollo 17 – Taurus–Littrow', lat: 20.19, lon: 30.77, note: 'Last crewed landing, December 1972.' },
            { id: 'tycho', name: 'Tycho', lat: -43.31, lon: -11.36, note: '85 km crater whose bright rays are visible from Earth with binoculars.' },
            { id: 'imbrium', name: 'Mare Imbrium', lat: 32.8, lon: -15.6, note: 'Basalt-filled impact basin about 1,145 km across.' },
            { id: 'shackleton', name: 'Shackleton crater', lat: -89.9, lon: 0, note: 'South-pole crater whose floor never sees sunlight; a candidate for water ice.' },
        ],
    },
    { key: 'phobos', name: 'Phobos', parent: 'mars', color: '#8d7f72', orbit: 1.8, periodDays: 0.3189, sizeRatio: 0.0033, craters: 30, facts: { diameter: '22.4 km (mean)', orbit: '7 h 39 min', distance: '9,376 km from Mars' }, description: 'The larger, inner moon of Mars. It orbits faster than Mars rotates and is slowly spiralling inward.', landmarks: [] },
    { key: 'deimos', name: 'Deimos', parent: 'mars', color: '#a8988a', orbit: 2.6, periodDays: 1.263, sizeRatio: 0.0018, craters: 20, facts: { diameter: '12.4 km (mean)', orbit: '30.3 hours', distance: '23,463 km from Mars' }, description: 'The smaller, outer moon of Mars, smoothed by a thick layer of regolith.', landmarks: [] },
    { key: 'io', name: 'Io', parent: 'jupiter', color: '#d9c463', orbit: 1.7, periodDays: 1.769, sizeRatio: 0.0255, craters: 0, facts: { diameter: '3,643 km', orbit: '1.77 days', distance: '421,700 km from Jupiter' }, description: 'The most volcanically active body known, heated by tidal flexing from Jupiter.', landmarks: [{ id: 'loki', name: 'Loki Patera', lat: 13, lon: 51, note: 'A lava lake about 200 km across, the most powerful persistent volcano on Io.' }] },
    { key: 'europa', name: 'Europa', parent: 'jupiter', color: '#cbbfa8', orbit: 2.1, periodDays: 3.551, sizeRatio: 0.0218, craters: 3, facts: { diameter: '3,122 km', orbit: '3.55 days', distance: '671,000 km from Jupiter' }, description: 'An ice-covered moon with a salty ocean beneath, one of the best places to look for life beyond Earth.', landmarks: [] },
    { key: 'ganymede', name: 'Ganymede', parent: 'jupiter', color: '#9a8f82', orbit: 2.6, periodDays: 7.155, sizeRatio: 0.0368, craters: 40, facts: { diameter: '5,268 km', orbit: '7.15 days', distance: '1,070,400 km from Jupiter' }, description: 'The largest moon in the Solar System, bigger than Mercury, and the only moon with its own magnetic field.', landmarks: [] },
    { key: 'callisto', name: 'Callisto', parent: 'jupiter', color: '#6b6158', orbit: 3.3, periodDays: 16.689, sizeRatio: 0.0337, craters: 90, facts: { diameter: '4,821 km', orbit: '16.7 days', distance: '1,882,700 km from Jupiter' }, description: 'One of the most heavily cratered surfaces in the Solar System, largely unchanged for four billion years.', landmarks: [] },
    { key: 'enceladus', name: 'Enceladus', parent: 'saturn', color: '#eceae4', orbit: 2.7, periodDays: 1.37, sizeRatio: 0.0042, craters: 10, facts: { diameter: '504 km', orbit: '1.37 days', distance: '238,000 km from Saturn' }, description: 'A small icy moon that vents plumes of water from an ocean under its south pole.', landmarks: [{ id: 'tiger', name: 'Tiger stripes', lat: -82, lon: 0, note: 'Parallel fractures near the south pole that feed the water-ice plumes.' }] },
    { key: 'rhea', name: 'Rhea', parent: 'saturn', color: '#b3aca2', orbit: 3.2, periodDays: 4.518, sizeRatio: 0.0127, craters: 60, facts: { diameter: '1,527 km', orbit: '4.52 days', distance: '527,000 km from Saturn' }, description: 'Saturn\'s second-largest moon, a cold, cratered mix of ice and rock.', landmarks: [] },
    { key: 'titan', name: 'Titan', parent: 'saturn', color: '#c99a55', orbit: 4.2, periodDays: 15.945, sizeRatio: 0.0427, craters: 0, atmosphere: { color: '#d9a35a', strength: 0.9 }, facts: { diameter: '5,150 km', orbit: '15.9 days', distance: '1,221,900 km from Saturn', atmosphere: '95% N₂, 5% CH₄; 1.5× Earth pressure' }, description: 'The only moon with a thick atmosphere, and the only other world known to have stable surface liquids: lakes of methane and ethane.', landmarks: [{ id: 'huygens', name: 'Huygens landing site', lat: -10.3, lon: 167.7, note: 'ESA probe, 14 January 2005. The most distant landing ever made.' }] },
    { key: 'titania', name: 'Titania', parent: 'uranus', color: '#a9a49b', orbit: 2.4, periodDays: 8.706, sizeRatio: 0.0309, craters: 45, facts: { diameter: '1,578 km', orbit: '8.71 days', distance: '436,300 km from Uranus' }, description: 'The largest moon of Uranus, cut by huge fault canyons.', landmarks: [] },
    { key: 'oberon', name: 'Oberon', parent: 'uranus', color: '#857f77', orbit: 3, periodDays: 13.463, sizeRatio: 0.0298, craters: 70, facts: { diameter: '1,523 km', orbit: '13.5 days', distance: '583,500 km from Uranus' }, description: 'The outermost large moon of Uranus, old and heavily cratered.', landmarks: [] },
    { key: 'triton', name: 'Triton', parent: 'neptune', color: '#c8bcb4', orbit: 2.4, periodDays: 5.877, sizeRatio: 0.0546, craters: 5, inclination: 157, facts: { diameter: '2,707 km', orbit: '5.88 days (retrograde)', distance: '354,800 km from Neptune' }, description: 'Neptune\'s largest moon orbits backwards, a sign it was captured from the Kuiper belt. Voyager 2 saw nitrogen geysers on its surface.', landmarks: [] },
];

export function getMoonDisplayRadius(moon, parent) {
    return Math.max(0.035, parent.displayRadius * moon.sizeRatio);
}

export function getMoonsOf(planetKey) {
    return MOONS.filter((moon) => moon.parent === planetKey);
}

export function getBody(key) {
    if (key === 'sun') return SUN;
    return PLANETS.find((planet) => planet.key === key) ?? MOONS.find((moon) => moon.key === key);
}

export function getBodyRadius(key) {
    const body = getBody(key);
    if (!body) return 1;
    if (body.parent) return getMoonDisplayRadius(body, getBody(body.parent));
    return body.displayRadius;
}
