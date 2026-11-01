import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GALACTIC_TO_SCENE, SCENE_TO_GALACTIC } from '../utils/skyFrame';

const SKY_RADIUS = 900;
const STAR_COUNT = 9000;
const CLOUD_COUNT = 80000;

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
}

// Stellar colours from hot blue-white to cool orange, weighted toward the common white/yellow types.
const STAR_COLORS = [
    [new THREE.Color('#aabfff'), 0.08],
    [new THREE.Color('#cad7ff'), 0.17],
    [new THREE.Color('#f8f7ff'), 0.3],
    [new THREE.Color('#fff4ea'), 0.22],
    [new THREE.Color('#ffe9c4'), 0.14],
    [new THREE.Color('#ffcf9a'), 0.09],
];

function pickColor(random) {
    let roll = random();
    for (const [color, weight] of STAR_COLORS) {
        roll -= weight;
        if (roll <= 0) return color;
    }
    return STAR_COLORS[2][0];
}

/**
 * Faint stars crowd toward the galactic plane and centre; bright ones are spread evenly, as in the real sky.
 * Positions are generated in galactic coordinates and rotated into the scene so they line up with the Milky Way map.
 */
function makeStars(count, radius, seed) {
    const random = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const direction = new THREE.Vector3();

    for (let index = 0; index < count; index += 1) {
        // Apparent brightness follows a steep power law: many faint stars, few bright ones.
        const brightness = random() ** 9;
        const inBand = brightness < 0.03 && random() < 0.55;
        let latitude;
        let longitude;
        if (inBand) {
            longitude = (random() - 0.5) * Math.PI * 2;
            const spread = 0.12 + 0.18 * Math.exp(-(longitude ** 2) / 0.6);
            latitude = Math.max(-1.5, Math.min(1.5, (random() + random() + random() - 1.5) * spread * 1.4));
        } else {
            longitude = random() * Math.PI * 2;
            latitude = Math.asin(random() * 2 - 1);
        }
        direction.set(Math.cos(latitude) * Math.cos(longitude), Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude))
            .applyMatrix3(GALACTIC_TO_SCENE)
            .multiplyScalar(radius);
        positions.set([direction.x, direction.y, direction.z], index * 3);

        const color = pickColor(random);
        const intensity = 0.1 + brightness * 1.3;
        colors.set([color.r * intensity, color.g * intensity, color.b * intensity], index * 3);
        // Sprites are a few pixels wide so the round profile resolves; brightness lives in the colour.
        sizes[index] = 3 + brightness * 4;
    }

    return { positions, colors, sizes };
}

const starVertex = /* glsl */ `
    uniform float uPixelRatio;
    attribute float aSize;
    varying vec3 vColor;
    void main() {
        vColor = color;
        gl_PointSize = aSize * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const starFragment = /* glsl */ `
    varying vec3 vColor;
    void main() {
        // Distance from the sprite centre, 0 at the middle and 1 at the edge.
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float core = exp(-r * r * 9.0);
        float halo = exp(-r * r * 3.0) * 0.12;
        gl_FragColor = vec4(vColor * (core + halo) * (1.0 - smoothstep(0.85, 1.0, r)), 1.0);
    }
`;

const skyVertex = /* glsl */ `
    varying vec3 vDirection;
    void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// The map is an all-sky image in galactic coordinates (centre of the galaxy in the middle).
const skyFragment = /* glsl */ `
    uniform sampler2D uMap;
    uniform mat3 uToGalactic;
    uniform float uExposure;
    uniform float uFloor;
    varying vec3 vDirection;
    const float PI = 3.141592653589793;
    void main() {
        vec3 g = normalize(uToGalactic * vDirection);
        float l = atan(g.y, g.x);
        float b = asin(clamp(g.z, -1.0, 1.0));
        // The map's first and last rows carry edge artefacts; stay clear of them near the galactic poles.
        vec2 uv = vec2(fract(0.5 - l / (2.0 * PI)), clamp(0.5 - b / PI, 0.015, 0.985));
        // Brightness only: the source mosaic has colour-only artefacts (trails, seams) that would otherwise show.
        float glow = max(dot(texture2D(uMap, uv).rgb, vec3(0.2126, 0.7152, 0.0722)) - uFloor, 0.0);
        // Old stars make the central bulge faintly warm; the disc is close to neutral white.
        float bulge = exp(-l * l / 0.4 - b * b / 0.06);
        vec3 tint = mix(vec3(0.9, 0.95, 1.05), vec3(1.08, 0.98, 0.86), bulge);
        gl_FragColor = vec4(glow * uExposure * tint, 1.0);
        #include <colorspace_fragment>
        // Dither by under one 8-bit step so the faint gradients don't band.
        float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor.rgb += (noise - 0.5) / 255.0;
    }
`;

const srgbToLinear = (value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

// Separable Gaussian blur of an RGB float image, wrapping horizontally (the map is a full circle of longitude).
function blur(data, width, height, sigma) {
    const radius = Math.ceil(sigma * 2.5);
    const kernel = [];
    let total = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
        const weight = Math.exp(-(offset * offset) / (2 * sigma * sigma));
        kernel.push(weight);
        total += weight;
    }
    for (let index = 0; index < kernel.length; index += 1) kernel[index] /= total;

    const pass = (source, horizontal) => {
        const target = new Float32Array(source.length);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let r = 0;
                let g = 0;
                let b = 0;
                for (let k = 0; k < kernel.length; k += 1) {
                    const offset = k - radius;
                    const sx = horizontal ? (x + offset + width) % width : x;
                    const sy = horizontal ? y : Math.min(height - 1, Math.max(0, y + offset));
                    const index = (sy * width + sx) * 3;
                    r += source[index] * kernel[k];
                    g += source[index + 1] * kernel[k];
                    b += source[index + 2] * kernel[k];
                }
                const index = (y * width + x) * 3;
                target[index] = r;
                target[index + 1] = g;
                target[index + 2] = b;
            }
        }
        return target;
    };
    return pass(pass(data, true), false);
}

/**
 * Keeps only the diffuse glow of the Milky Way map. Each 4×4 block becomes one of its dimmer pixels (a low
 * percentile), which removes the map's own stars; the crisp stars are drawn as points instead.
 * The band is only a few 8-bit steps above black, so the result is kept in linear floating point:
 * brightened as an 8-bit texture, those steps would show as blotches.
 */
function buildGlow(image) {
    const source = document.createElement('canvas');
    source.width = image.width;
    source.height = image.height;
    const context = source.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;

    const block = 4;
    const width = Math.floor(image.width / block);
    const height = Math.floor(image.height / block);
    const linear = new Float32Array(width * height * 3);
    const samples = new Array(block * block);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let count = 0;
            for (let dy = 0; dy < block; dy += 1) {
                for (let dx = 0; dx < block; dx += 1) {
                    samples[count] = ((y * block + dy) * image.width + x * block + dx) * 4;
                    count += 1;
                }
            }
            samples.sort((a, b) => (pixels[a] + pixels[a + 1] + pixels[a + 2]) - (pixels[b] + pixels[b + 1] + pixels[b + 2]));
            const pick = samples[4];
            const index = (y * width + x) * 3;
            linear[index] = srgbToLinear(pixels[pick] / 255);
            linear[index + 1] = srgbToLinear(pixels[pick + 1] / 255);
            linear[index + 2] = srgbToLinear(pixels[pick + 2] / 255);
        }
    }

    return { data: blur(linear, width, height, 1.6), width, height };
}

// Half-float texture of the glow. Rows are flipped so the image's top row sits at v = 1, as with an image texture.
function createGlowTexture({ data, width, height }) {
    const half = new Uint16Array(width * height * 4);
    const one = THREE.DataUtils.toHalfFloat(1);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const from = (y * width + x) * 3;
            const to = ((height - 1 - y) * width + x) * 4;
            half[to] = THREE.DataUtils.toHalfFloat(data[from]);
            half[to + 1] = THREE.DataUtils.toHalfFloat(data[from + 1]);
            half[to + 2] = THREE.DataUtils.toHalfFloat(data[from + 2]);
            half[to + 3] = one;
        }
    }
    const texture = new THREE.DataTexture(half, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
    texture.wrapS = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

// Linear brightness of the map's empty sky, measured off the galactic plane; anything below it is JPEG noise.
const GLOW_FLOOR = 0.00045;

/**
 * The faint, unresolved stars that make up the Milky Way's band, placed with the density of the map's own glow,
 * so its star clouds and dark dust lanes come from real data rather than a pattern.
 */
function makeStarClouds(glow, count, radius, seed) {
    const random = seededRandom(seed);
    const { data, width, height } = glow;
    const weights = new Float64Array(width * height);
    let total = 0;
    for (let y = 0; y < height; y += 1) {
        // Image rows run from galactic south (top) to north, matching the sky shader.
        const latitude = ((y + 0.5) / height - 0.5) * Math.PI;
        const area = Math.cos(latitude);
        for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 3;
            const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
            total += Math.max(luminance - GLOW_FLOOR, 0) ** 1.2 * area;
            weights[y * width + x] = total;
        }
    }

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const direction = new THREE.Vector3();
    const color = new THREE.Color();
    for (let index = 0; index < count; index += 1) {
        // Binary search of the cumulative weights picks a map cell in proportion to its glow.
        const goal = random() * total;
        let low = 0;
        let high = weights.length - 1;
        while (low < high) {
            const middle = (low + high) >> 1;
            if (weights[middle] < goal) low = middle + 1;
            else high = middle;
        }
        const x = (low % width) + random();
        const y = Math.floor(low / width) + random();
        const longitude = (0.5 - x / width) * Math.PI * 2;
        const latitude = (y / height - 0.5) * Math.PI;
        direction.set(Math.cos(latitude) * Math.cos(longitude), Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude))
            .applyMatrix3(GALACTIC_TO_SCENE)
            .multiplyScalar(radius);
        positions.set([direction.x, direction.y, direction.z], index * 3);

        // The bulge around the galactic centre is older and redder; the disc further out is whiter.
        const bulge = Math.exp(-(longitude ** 2) / 0.35 - (latitude ** 2) / 0.05);
        color.copy(pickColor(random)).lerp(STAR_COLORS[4][0], bulge * 0.6);
        const intensity = 0.09 + random() ** 4 * 0.3;
        colors.set([color.r * intensity, color.g * intensity, color.b * intensity], index * 3);
        sizes[index] = 2 + random() * 0.8;
    }
    return { positions, colors, sizes };
}

// The sky is infinitely far away: it follows the camera so it never shows parallax.
export default function StarField() {
    const groupRef = useRef();
    const pixelRatio = useThree((state) => state.viewport.dpr);
    const milkyWay = useTexture('/textures/stars_milky_way.jpg');
    const stars = useMemo(() => makeStars(STAR_COUNT, SKY_RADIUS * 0.95, 1729), []);
    const glow = useMemo(() => buildGlow(milkyWay.image), [milkyWay]);
    const clouds = useMemo(() => makeStarClouds(glow, CLOUD_COUNT, SKY_RADIUS * 0.96, 4271), [glow]);

    const skyMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
            uMap: { value: createGlowTexture(glow) },
            uToGalactic: { value: SCENE_TO_GALACTIC },
            uExposure: { value: 4 },
            uFloor: { value: GLOW_FLOOR },
        },
        side: THREE.BackSide,
        depthWrite: false,
    }), [glow]);

    const starMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        uniforms: { uPixelRatio: { value: pixelRatio } },
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
    }), [pixelRatio]);

    useEffect(() => () => { skyMaterial.uniforms.uMap.value.dispose(); skyMaterial.dispose(); starMaterial.dispose(); }, [skyMaterial, starMaterial]);

    useFrame(({ camera }) => {
        groupRef.current?.position.copy(camera.position);
    });

    return (
        <group ref={groupRef}>
            <mesh material={skyMaterial} renderOrder={-2} raycast={() => null}>
                <sphereGeometry args={[SKY_RADIUS, 48, 24]} />
            </mesh>
            <points frustumCulled={false} material={starMaterial} renderOrder={-1} raycast={() => null}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={CLOUD_COUNT} array={clouds.positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={CLOUD_COUNT} array={clouds.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-aSize" count={CLOUD_COUNT} array={clouds.sizes} itemSize={1} />
                </bufferGeometry>
            </points>
            <points frustumCulled={false} material={starMaterial} renderOrder={-1} raycast={() => null}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={stars.positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={STAR_COUNT} array={stars.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-aSize" count={STAR_COUNT} array={stars.sizes} itemSize={1} />
                </bufferGeometry>
            </points>
        </group>
    );
}
