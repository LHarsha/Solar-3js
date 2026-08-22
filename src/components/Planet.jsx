import { useRef, useMemo, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getOrbitPosition, getAntiGravityDrift } from '../utils/orbitMath';
import { generatePlanetColor, hslToHex, statusGlow } from '../utils/colorTheme';
import useProjectStore from '../store/projectStore';
import planetVertexShader from '../shaders/planet.vert';
import planetFragmentShader from '../shaders/planet.frag';
import atmosphereFragmentShader from '../shaders/atmosphere.frag';

class PlanetMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: planetVertexShader,
            fragmentShader: planetFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor1: { value: new THREE.Color('#4488ff') },
                uColor2: { value: new THREE.Color('#2244aa') },
                uSelected: { value: 0 },
            },
        });
    }
}

class AtmosphereMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: planetVertexShader,
            fragmentShader: atmosphereFragmentShader,
            uniforms: {
                uAtmosphereColor: { value: new THREE.Color('#6688ff') },
                uTime: { value: 0 },
            },
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
        });
    }
}

extend({ PlanetMaterial, AtmosphereMaterial });

export default function Planet({ project, onClick }) {
    const groupRef = useRef();
    const planetMatRef = useRef();
    const atmosMatRef = useRef();
    const [hovered, setHovered] = useState(false);

    const selectedId = useProjectStore((s) => s.selectedId);
    const orbitsPaused = useProjectStore((s) => s.orbitsPaused);
    const isSelected = selectedId === project.id;

    const palette = useMemo(() => generatePlanetColor(project.color), [project.color]);
    const glowColor = useMemo(() => statusGlow(project.status), [project.status]);

    // Set shader colors
    useMemo(() => {
        if (planetMatRef.current) {
            planetMatRef.current.uniforms.uColor1.value.set(palette.surface1);
            planetMatRef.current.uniforms.uColor2.value.set(palette.surface2);
        }
        if (atmosMatRef.current) {
            atmosMatRef.current.uniforms.uAtmosphereColor.value.set(palette.atmosphere);
        }
    }, [palette]);

    useFrame((state) => {
        const t = orbitsPaused ? 0 : state.clock.elapsedTime;

        // Orbit position
        const pos = getOrbitPosition(project.orbitRadius, project.orbitSpeed, t, project.tilt);
        const drift = getAntiGravityDrift(t, 0.3 + project.orbitSpeed, 0.12);

        if (groupRef.current) {
            groupRef.current.position.set(pos.x, pos.y + drift.dy, pos.z + drift.dz);
        }

        // Update shader uniforms
        if (planetMatRef.current) {
            planetMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            planetMatRef.current.uniforms.uSelected.value = THREE.MathUtils.lerp(
                planetMatRef.current.uniforms.uSelected.value,
                isSelected ? 1.0 : 0.0,
                0.05
            );
        }
        if (atmosMatRef.current) {
            atmosMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const planetSize = 0.4 + project.orbitRadius * 0.04;

    return (
        <group ref={groupRef}>
            {/* Planet sphere */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(project.id, groupRef.current.position.clone());
                }}
                onPointerOver={() => {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[planetSize, 48, 48]} />
                <planetMaterial ref={planetMatRef} />
            </mesh>

            {/* Atmospheric halo */}
            <mesh>
                <sphereGeometry args={[planetSize * 1.2, 32, 32]} />
                <atmosphereMaterial ref={atmosMatRef} />
            </mesh>

            {/* Selection ring */}
            {isSelected && (
                <mesh rotation-x={Math.PI / 2}>
                    <torusGeometry args={[planetSize * 1.8, 0.02, 8, 64]} />
                    <meshBasicMaterial
                        color={glowColor.hex}
                        transparent
                        opacity={0.7}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Status glow point */}
            <pointLight
                color={glowColor.hex}
                intensity={isSelected ? 2 : hovered ? 1.2 : 0.5}
                distance={5}
                decay={2}
            />

            {/* Floating label */}
            <Html
                position={[0, planetSize + 0.6, 0]}
                center
                distanceFactor={10}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        color: 'white',
                        fontSize: '11px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        background: 'rgba(10, 10, 32, 0.7)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${glowColor.hex}40`,
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(8px)',
                        opacity: hovered || isSelected ? 1 : 0.6,
                        transition: 'opacity 0.3s',
                    }}
                >
                    {project.name}
                </div>
            </Html>
        </group>
    );
}
