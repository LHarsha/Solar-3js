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

const CORONA_COUNT = 300;

function coronaRandom(index, salt) {
    const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

export default function Sun() {
    const meshRef = useRef();
    const materialRef = useRef();
    const coronaRef = useRef();
    const coronaSphereRef = useRef();
    const timeAccum = useRef(0);

    // Corona particles
    const coronaPositions = useMemo(() => {
        const pos = new Float32Array(CORONA_COUNT * 3);
        for (let i = 0; i < CORONA_COUNT; i++) {
            const theta = coronaRandom(i, 1) * Math.PI * 2;
            const phi = Math.acos(2 * coronaRandom(i, 2) - 1);
            const r = 2.4 + coronaRandom(i, 3) * 1.2;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        return pos;
    }, []);

    useFrame((_, delta) => {
        timeAccum.current += delta;
        const t = timeAccum.current;

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = t;
        }
        if (coronaRef.current) {
            coronaRef.current.rotation.y += delta * 0.1;
            coronaRef.current.rotation.z += delta * 0.05;
        }
        if (coronaSphereRef.current) {
            const scale = 3.2 + Math.sin(t * 1.5) * 0.2;
            coronaSphereRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Core sun sphere — radius 2, high-res */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <sunMaterial ref={materialRef} />
            </mesh>

            {/* Corona glow sphere — larger transparent sphere with additive blending */}
            <mesh ref={coronaSphereRef}>
                <sphereGeometry args={[1, 48, 48]} />
                <meshBasicMaterial
                    color="#ff8800"
                    transparent
                    opacity={0.08}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Second outer corona glow */}
            <mesh>
                <sphereGeometry args={[4.5, 32, 32]} />
                <meshBasicMaterial
                    color="#ff6600"
                    transparent
                    opacity={0.04}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </mesh>

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
                    size={0.06}
                    color="#ffaa44"
                    transparent
                    opacity={0.6}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Central point light — illuminates planets from the sun */}
            <pointLight color="#fff1d6" intensity={2200} distance={90} decay={2} />
        </group>
    );
}
