import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GALACTIC_TO_SCENE, SCENE_TO_GALACTIC } from '../utils/skyFrame';

const SKY_RADIUS = 900;
const STAR_COUNT = 9000;

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
    varying vec3 vDirection;
    const float PI = 3.141592653589793;
    void main() {
        vec3 g = normalize(uToGalactic * vDirection);
        float l = atan(g.y, g.x);
        float b = asin(clamp(g.z, -1.0, 1.0));
        // The map's first and last rows carry edge artefacts; stay clear of them near the galactic poles.
        vec2 uv = vec2(fract(0.5 - l / (2.0 * PI)), clamp(0.5 - b / PI, 0.015, 0.985));
        vec3 sky = texture2D(uMap, uv).rgb;
        // Mostly desaturated: the source mosaic has colour-only artefacts (trails, seams) that would otherwise show.
        float glow = dot(sky, vec3(0.299, 0.587, 0.114));
        sky = mix(vec3(glow) * vec3(0.94, 0.97, 1.06), sky, 0.25);
        sky = max(sky * uExposure - 0.003, 0.0);
        gl_FragColor = vec4(sky, 1.0);
        #include <colorspace_fragment>
    }
`;

/**
 * Keeps only the diffuse glow of the Milky Way map. Each 4×4 block becomes its dimmer pixels (a low
 * percentile), which removes the map's own stars; magnified on screen they would look like soft blocks.
 * The crisp stars are drawn as points instead.
 */
function createGlowTexture(image) {
    const source = document.createElement('canvas');
    source.width = image.width;
    source.height = image.height;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;

    const block = 4;
    const width = Math.floor(image.width / block);
    const height = Math.floor(image.height / block);
    const reduced = document.createElement('canvas');
    reduced.width = width;
    reduced.height = height;
    const reducedContext = reduced.getContext('2d');
    const output = reducedContext.createImageData(width, height);
    const samples = new Array(block * block);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let count = 0;
            for (let dy = 0; dy < block; dy += 1) {
                for (let dx = 0; dx < block; dx += 1) {
                    const index = ((y * block + dy) * image.width + x * block + dx) * 4;
                    samples[count] = index;
                    count += 1;
                }
            }
            samples.sort((a, b) => (pixels[a] + pixels[a + 1] + pixels[a + 2]) - (pixels[b] + pixels[b + 1] + pixels[b + 2]));
            const pick = samples[4];
            const target = (y * width + x) * 4;
            output.data[target] = pixels[pick];
            output.data[target + 1] = pixels[pick + 1];
            output.data[target + 2] = pixels[pick + 2];
            output.data[target + 3] = 255;
        }
    }
    reducedContext.putImageData(output, 0, 0);

    // A light blur, wrapping horizontally so the seam at the map's edge stays invisible.
    const glow = document.createElement('canvas');
    glow.width = width;
    glow.height = height;
    const glowContext = glow.getContext('2d');
    glowContext.filter = 'blur(1.5px)';
    for (const offset of [-width, 0, width]) glowContext.drawImage(reduced, offset, 0);

    const texture = new THREE.CanvasTexture(glow);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

// The sky is infinitely far away: it follows the camera so it never shows parallax.
export default function StarField() {
    const groupRef = useRef();
    const pixelRatio = useThree((state) => state.viewport.dpr);
    const milkyWay = useTexture('/textures/stars_milky_way.jpg');
    const stars = useMemo(() => makeStars(STAR_COUNT, SKY_RADIUS * 0.95, 1729), []);

    const skyMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
            uMap: { value: createGlowTexture(milkyWay.image) },
            uToGalactic: { value: SCENE_TO_GALACTIC },
            uExposure: { value: 8 },
        },
        side: THREE.BackSide,
        depthWrite: false,
    }), [milkyWay]);

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
                    <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={stars.positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={STAR_COUNT} array={stars.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-aSize" count={STAR_COUNT} array={stars.sizes} itemSize={1} />
                </bufferGeometry>
            </points>
        </group>
    );
}
