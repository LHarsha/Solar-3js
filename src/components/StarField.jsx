import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 3000;
const LAYERS = [
    { count: 1500, radius: 80, size: 0.08 },
    { count: 1000, radius: 120, size: 0.12 },
    { count: 500, radius: 160, size: 0.18 },
];

export default function StarField() {
    const groupRef = useRef();

    const layerData = useMemo(() => {
        return LAYERS.map(({ count, radius, size }) => {
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                // Random spherical distribution
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = radius * (0.5 + Math.random() * 0.5);

                positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = r * Math.cos(phi);

                // Slight color variation: blue-white to warm white
                const warmth = Math.random();
                colors[i * 3] = 0.8 + warmth * 0.2;
                colors[i * 3 + 1] = 0.85 + warmth * 0.15;
                colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
            }
            return { positions, colors, size };
        });
    }, []);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.003;
        }
    });

    return (
        <group ref={groupRef}>
            {layerData.map((layer, i) => (
                <points key={i}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={layer.positions.length / 3}
                            array={layer.positions}
                            itemSize={3}
                        />
                        <bufferAttribute
                            attach="attributes-color"
                            count={layer.colors.length / 3}
                            array={layer.colors}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={layer.size}
                        vertexColors
                        transparent
                        opacity={0.9}
                        sizeAttenuation
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            ))}
        </group>
    );
}
