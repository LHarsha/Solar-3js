import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import planetVertexShader from '../shaders/planet.vert';
import sunFragmentShader from '../shaders/sun.frag';

class SunMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: planetVertexShader,
            fragmentShader: sunFragmentShader,
            uniforms: {
                uTime: { value: 0 },
            },
        });
    }
}

extend({ SunMaterial });

const CORONA_COUNT = 200;

export default function Sun() {
    const meshRef = useRef();
    const materialRef = useRef();
    const coronaRef = useRef();
    const glowRef = useRef();

    // Corona particles
    const coronaPositions = useMemo(() => {
        const pos = new Float32Array(CORONA_COUNT * 3);
        for (let i = 0; i < CORONA_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 1.2 + Math.random() * 0.6;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        return pos;
    }, []);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = t;
        }
        if (coronaRef.current) {
            coronaRef.current.rotation.y = t * 0.1;
            coronaRef.current.rotation.z = t * 0.05;
        }
        if (glowRef.current) {
            const scale = 2.0 + Math.sin(t * 1.5) * 0.15;
            glowRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Core sun sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <sunMaterial ref={materialRef} />
            </mesh>

            {/* Sprite-based corona glow */}
            <sprite ref={glowRef} scale={[4, 4, 1]}>
                <spriteMaterial
                    color="#ff8800"
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </sprite>

            {/* Corona particles */}
            <points ref={coronaRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={CORONA_COUNT}
                        array={coronaPositions}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    color="#ffaa44"
                    transparent
                    opacity={0.7}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Point light */}
            <pointLight color="#ffeedd" intensity={3} distance={50} decay={2} />
        </group>
    );
}
