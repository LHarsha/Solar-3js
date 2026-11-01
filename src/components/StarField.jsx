import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { prepareTexture } from '../utils/materials';

const STAR_COUNT = 5000;
const SKY_RADIUS = 900;
const OBLIQUITY = 23.44 * (Math.PI / 180);

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

function makeStars(count, radius, seed) {
    const random = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = [
        new THREE.Color('#b9c9ff'),
        new THREE.Color('#f5f2df'),
        new THREE.Color('#ffe0ba'),
        new THREE.Color('#dbe8ff'),
    ];

    for (let index = 0; index < count; index += 1) {
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(1 - random() * 2);
        const sinPhi = Math.sin(phi);
        positions[index * 3] = radius * sinPhi * Math.cos(theta);
        positions[index * 3 + 1] = radius * Math.cos(phi);
        positions[index * 3 + 2] = radius * sinPhi * Math.sin(theta);

        const color = palette[Math.floor(random() * palette.length)];
        // Most stars are faint; a few are bright.
        const intensity = 0.25 + random() ** 3 * 0.75;
        colors[index * 3] = color.r * intensity;
        colors[index * 3 + 1] = color.g * intensity;
        colors[index * 3 + 2] = color.b * intensity;
        sizes[index] = 0.6 + random() ** 4 * 2.2;
    }

    return { positions, colors, sizes };
}

const starVertex = /* glsl */ `
    attribute float aSize;
    varying vec3 vColor;
    void main() {
        vColor = color;
        gl_PointSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const starFragment = /* glsl */ `
    varying vec3 vColor;
    void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.25, 0.5, distanceToCenter);
        gl_FragColor = vec4(vColor, alpha);
    }
`;

// The sky is infinitely far away: it follows the camera so it never shows parallax.
export default function StarField() {
    const groupRef = useRef();
    const milkyWay = useTexture('/textures/stars_milky_way.jpg');
    const stars = useMemo(() => makeStars(STAR_COUNT, SKY_RADIUS * 0.95, 1729), []);
    const starMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
    }), []);
    const skyMap = useMemo(() => prepareTexture(milkyWay), [milkyWay]);

    useFrame(({ camera }) => {
        groupRef.current?.position.copy(camera.position);
    });

    return (
        <group ref={groupRef}>
            {/* The map is in equatorial coordinates; tilt it by the obliquity so it sits correctly around the ecliptic. */}
            <mesh rotation-x={-OBLIQUITY} scale={[-1, 1, 1]} renderOrder={-2} raycast={() => null}>
                <sphereGeometry args={[SKY_RADIUS, 64, 32]} />
                <meshBasicMaterial map={skyMap} color={[0.32, 0.32, 0.34]} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
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
