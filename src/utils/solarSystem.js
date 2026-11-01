// Orbital elements are the JPL "Approximate Positions of the Planets" set (valid 1800–2050):
// value at J2000 and rate per Julian century for a (AU), e, I, L, ϖ (long. of perihelion), Ω (deg).
// Sizes and distances on screen are compressed (orbitRadius / displayRadius) so the whole
// system fits; directions, eccentricities and timing are real.
export const PLANETS = [
    {
        key: 'mercury', name: 'Mercury', texture: '/textures/mercury.jpg',
        elements: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.2503235, 149472.67411175], w: [77.45779628, 0.16047689], O: [48.33076593, -0.12534081] },
        displayRadius: 0.19, orbitRadius: 6.3, rotationHours: 1407.6, axialTilt: 0.03,
        facts: { diameter: '4,879 km', mass: '0.055 Earths', gravity: '3.7 m/s²', day: '176 Earth days (solar)', year: '88 days', temperature: '167 °C mean (−180 to 430)', moons: '0', atmosphere: 'Trace exosphere: O, Na, H, He' },
        description: 'The smallest planet and the closest to the Sun. Its heavily cratered surface swings between extremes because it has almost no atmosphere to hold heat.',
        landmarks: [
            { id: 'caloris', name: 'Caloris Basin', lat: 30.5, lon: 170.2, note: 'Impact basin about 1,550 km across, one of the largest in the Solar System.' },
        ],
    },
    {
        key: 'venus', name: 'Venus', texture: '/textures/venus_atmosphere.jpg', surfaceTexture: '/textures/venus_surface.jpg',
        elements: { a: [0.72333566, 0.0000039], e: [0.00677672, -0.00004107], I: [3.39467605, -0.0007889], L: [181.9790995, 58517.81538729], w: [131.60246718, 0.00268329], O: [76.67984255, -0.27769418] },
        // Venus spins backwards; modelled as a small tilt with retrograde rotation so the map stays north-up.
        displayRadius: 0.47, orbitRadius: 9.2, rotationHours: -5832.5, axialTilt: 2.64, displayTilt: '177.4°',
        atmosphere: { color: '#f2dcab', strength: 0.9, wrap: 0.1 }, limb: 0.3,
        facts: { diameter: '12,104 km', mass: '0.815 Earths', gravity: '8.9 m/s²', day: '117 Earth days (solar)', year: '225 days', temperature: '464 °C', moons: '0', atmosphere: '96.5% CO₂, 3.5% N₂; 92× Earth pressure' },
        description: 'A runaway greenhouse world wrapped in sulphuric-acid clouds. The surface beneath is the hottest of any planet and has only been seen by radar and a handful of Soviet landers.',
        landmarks: [
            { id: 'maxwell', name: 'Maxwell Montes', lat: 65.2, lon: 3.3, note: 'Highest mountains on Venus, about 11 km above the mean surface.' },
            { id: 'venera13', name: 'Venera 13', lat: -7.55, lon: -56.5, note: 'Soviet lander, 1 March 1982. Sent the first colour pictures from the surface and lasted 127 minutes.' },
        ],
    },
    {
        key: 'earth', name: 'Earth', texture: '/textures/earth_daymap.jpg', nightTexture: '/textures/earth_nightmap.jpg', cloudTexture: '/textures/earth_clouds.jpg',
        elements: { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], O: [0, 0] },
        displayRadius: 0.5, orbitRadius: 12.2, rotationHours: 23.9345, axialTilt: 23.44,
        atmosphere: { color: '#5d9cff', strength: 1, wrap: 0.06 },
        facts: { diameter: '12,756 km', mass: '5.97 × 10²⁴ kg', gravity: '9.8 m/s²', day: '24 hours', year: '365.25 days', temperature: '15 °C mean', moons: '1', atmosphere: '78% N₂, 21% O₂, 1% Ar' },
        description: 'The only world known to host life. Its rotation here follows real UTC time, so the day–night line and city lights match the clock.',
        landmarks: [
            { id: 'everest', name: 'Mount Everest', lat: 27.99, lon: 86.93, note: 'Highest point above sea level, 8,849 m.' },
            { id: 'sahara', name: 'Sahara', lat: 23.4, lon: 13, note: 'Largest hot desert, about 9.2 million km².' },
            { id: 'amazon', name: 'Amazon rainforest', lat: -3.4, lon: -62.2, note: 'Largest tropical rainforest, spanning nine countries.' },
            { id: 'mariana', name: 'Mariana Trench', lat: 11.35, lon: 142.2, note: 'Deepest known point in the ocean, about 10,935 m at Challenger Deep.' },
        ],
    },
    {
        key: 'mars', name: 'Mars', texture: '/textures/mars.jpg',
        elements: { a: [1.52371034, 0.00001847], e: [0.0933941, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343] },
        displayRadius: 0.27, orbitRadius: 15.9, rotationHours: 24.6229, axialTilt: 25.19,
        atmosphere: { color: '#d99a74', strength: 0.35, wrap: 0.02 },
        facts: { diameter: '6,792 km', mass: '0.107 Earths', gravity: '3.7 m/s²', day: '24 h 37 min', year: '687 days', temperature: '−65 °C mean', moons: '2', atmosphere: '95% CO₂, 2.8% N₂, 2% Ar; 0.6% of Earth pressure' },
        description: 'A cold desert world with the largest volcano and canyon system known. Several rovers are working on its surface.',
        landmarks: [
            { id: 'olympus', name: 'Olympus Mons', lat: 18.65, lon: -133.8, note: 'Shield volcano about 22 km high and 600 km across.' },
            { id: 'valles', name: 'Valles Marineris', lat: -13.9, lon: -59.2, note: 'Canyon system over 4,000 km long and up to 7 km deep.' },
            { id: 'gale', name: 'Gale Crater', lat: -5.4, lon: 137.8, note: 'Curiosity rover landing site, 6 August 2012.' },
            { id: 'jezero', name: 'Jezero Crater', lat: 18.38, lon: 77.58, note: 'Perseverance rover landing site, 18 February 2021. An ancient river delta.' },
            { id: 'hellas', name: 'Hellas Planitia', lat: -42.4, lon: 70.5, note: 'Impact basin about 2,300 km wide, holding the lowest point on Mars.' },
        ],
    },
    {
        key: 'jupiter', name: 'Jupiter', texture: '/textures/jupiter.jpg',
        elements: { a: [5.202887, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], w: [14.72847983, 0.21252668], O: [100.47390909, 0.20469106] },
        displayRadius: 2.7, orbitRadius: 22, rotationHours: 9.925, axialTilt: 3.13,
        atmosphere: { color: '#e8d2b0', strength: 0.45, wrap: 0.04 }, limb: 0.55,
        facts: { diameter: '142,984 km', mass: '317.8 Earths', gravity: '24.8 m/s²', day: '9 h 56 min', year: '11.86 years', temperature: '−110 °C (1 bar level)', moons: '95', atmosphere: '90% H₂, 10% He' },
        description: 'The largest planet, a gas giant more than twice as massive as all the other planets combined.',
        landmarks: [
            // Longitude matches the storm's position on this texture map; the real storm drifts.
            { id: 'grs', name: 'Great Red Spot', lat: -20, lon: -49.5, note: 'Anticyclonic storm wider than Earth, observed continuously since at least 1831.' },
        ],
    },
    {
        key: 'saturn', name: 'Saturn', texture: '/textures/saturn.jpg', ringTexture: '/textures/saturn_ring_alpha.png',
        elements: { a: [9.53667594, -0.0012506], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], w: [92.59887831, -0.41897216], O: [113.66242448, -0.28867794] },
        displayRadius: 2.28, orbitRadius: 33, rotationHours: 10.656, axialTilt: 26.73,
        atmosphere: { color: '#eedfb8', strength: 0.4, wrap: 0.04 }, limb: 0.55,
        facts: { diameter: '120,536 km', mass: '95.2 Earths', gravity: '10.4 m/s²', day: '10 h 39 min', year: '29.4 years', temperature: '−140 °C (1 bar level)', moons: '274', atmosphere: '96% H₂, 3% He' },
        description: 'A gas giant with the most extensive ring system known, made mostly of water ice. It is less dense than water.',
        landmarks: [
            { id: 'hexagon', name: 'North polar hexagon', lat: 78, lon: 0, note: 'Six-sided jet stream around the north pole, about 29,000 km across, imaged by Voyager and Cassini.' },
        ],
    },
    {
        key: 'uranus', name: 'Uranus', texture: '/textures/uranus.jpg',
        elements: { a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], w: [170.9542763, 0.40805281], O: [74.01692503, 0.04240589] },
        displayRadius: 1, orbitRadius: 43, rotationHours: 17.24, axialTilt: 97.77,
        atmosphere: { color: '#a8e4ec', strength: 0.55, wrap: 0.04 }, limb: 0.5,
        facts: { diameter: '51,118 km', mass: '14.5 Earths', gravity: '8.7 m/s²', day: '17 h 14 min (retrograde)', year: '84 years', temperature: '−195 °C', moons: '29', atmosphere: '83% H₂, 15% He, 2% CH₄' },
        description: 'An ice giant tipped on its side, so each pole spends about 42 years in continuous sunlight and then 42 in darkness.',
        landmarks: [],
    },
    {
        key: 'neptune', name: 'Neptune', texture: '/textures/neptune.jpg',
        elements: { a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], w: [44.96476227, -0.32241464], O: [131.78422574, -0.00508664] },
        displayRadius: 0.97, orbitRadius: 53, rotationHours: 16.11, axialTilt: 28.32,
        atmosphere: { color: '#6f9bf0', strength: 0.55, wrap: 0.04 }, limb: 0.5,
        facts: { diameter: '49,528 km', mass: '17.1 Earths', gravity: '11.0 m/s²', day: '16 h 7 min', year: '164.8 years', temperature: '−200 °C', moons: '16', atmosphere: '80% H₂, 19% He, 1.5% CH₄' },
        description: 'The most distant planet, with the fastest winds measured in the Solar System, up to about 2,100 km/h.',
        landmarks: [],
    },
];

export function getPlanet(key) {
    return PLANETS.find((planet) => planet.key === key);
}

export function getDisplayOrbitRadius(planet) {
    return planet.orbitRadius;
}

export function getDisplayPlanetRadius(planet) {
    return planet.displayRadius;
}
