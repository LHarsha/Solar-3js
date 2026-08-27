import { useMemo } from 'react';
import * as THREE from 'three';

const DISTANT_STAR_COUNT = 1350;
const BRIGHT_STAR_COUNT = 100;

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
    const palette = [
        new THREE.Color('#b9c9ff'),
        new THREE.Color('#f5f2df'),
        new THREE.Color('#ffe0ba'),
        new THREE.Color('#dbe8ff'),
    ];

    for (let index = 0; index < count; index += 1) {
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(1 - random() * 2);
        const distance = radius + (random() - 0.5) * 16;
        const sinPhi = Math.sin(phi);
        positions[index * 3] = distance * sinPhi * Math.cos(theta);
        positions[index * 3 + 1] = distance * Math.cos(phi);
        positions[index * 3 + 2] = distance * sinPhi * Math.sin(theta);

        const color = palette[Math.floor(random() * palette.length)];
        const intensity = 0.5 + random() * 0.5;
        colors[index * 3] = color.r * intensity;
        colors[index * 3 + 1] = color.g * intensity;
        colors[index * 3 + 2] = color.b * intensity;
    }

    return { positions, colors };
}

function StarLayer({ count, radius, size, opacity, seed }) {
    const stars = useMemo(() => makeStars(count, radius, seed), [count, radius, seed]);

    return (
        <points frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={stars.positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={stars.colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial vertexColors size={size} transparent opacity={opacity} sizeAttenuation depthWrite={false} />
        </points>
    );
}

export default function StarField() {
    return (
        <group>
            <StarLayer count={DISTANT_STAR_COUNT} radius={126} size={0.12} opacity={0.68} seed={1729} />
            <StarLayer count={BRIGHT_STAR_COUNT} radius={118} size={0.28} opacity={0.95} seed={941} />
        </group>
    );
}
