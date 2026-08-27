import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getOrbitPosition } from '../utils/orbitMath';
import { getDisplayOrbitRadius, getDisplayPlanetRadius, getOrbitalPeriodSeconds } from '../utils/solarSystem';
import useProjectStore from '../store/projectStore';
import Moon from './Moon';

const ATLAS_COLUMNS = 2;
const ATLAS_ROWS = 4;

export default function Planet({ planet, project, onClick, index = 0 }) {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    const timeAccum = useRef(0);
    const atlas = useTexture('/textures/planets-atlas.png');
    const selectedId = useProjectStore((s) => s.selectedId);
    const hoveredPlanetKey = useProjectStore((s) => s.hoveredPlanetKey);
    const setHoveredPlanet = useProjectStore((s) => s.setHoveredPlanet);
    const clearHoveredPlanet = useProjectStore((s) => s.clearHoveredPlanet);
    const isSelected = project && selectedId === project.id;
    const radius = getDisplayPlanetRadius(planet);
    const orbitRadius = getDisplayOrbitRadius(planet);
    const orbitPeriod = getOrbitalPeriodSeconds(planet);
    const tilt = planet.inclination * (Math.PI / 180);

    const surfaceTexture = useMemo(() => {
        const texture = atlas.clone();
        const column = planet.atlasIndex % ATLAS_COLUMNS;
        const row = Math.floor(planet.atlasIndex / ATLAS_COLUMNS);
        texture.repeat.set(1 / ATLAS_COLUMNS, 1 / ATLAS_ROWS);
        texture.offset.set(column / ATLAS_COLUMNS, 1 - (row + 1) / ATLAS_ROWS);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, [atlas, planet]);

    useEffect(() => () => surfaceTexture.dispose(), [surfaceTexture]);

    useFrame((_, delta) => {
        if (!hoveredPlanetKey) timeAccum.current += delta;
        const position = getOrbitPosition(
            orbitRadius,
            orbitPeriod,
            timeAccum.current,
            tilt,
            planet.eccentricity,
            planet.periapsis,
            planet.meanAnomaly + index * 0.18
        );
        groupRef.current?.position.set(position.x, position.y, position.z);
    });

    return (
        <group ref={groupRef}>
            <mesh
                onClick={(event) => {
                    event.stopPropagation();
                    if (project) onClick(project.id, groupRef.current.position.clone());
                }}
                onPointerOver={() => {
                    setHovered(true);
                    setHoveredPlanet(planet.key);
                    document.body.style.cursor = project ? 'pointer' : 'default';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    clearHoveredPlanet(planet.key);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[radius, 40, 40]} />
                <meshStandardMaterial map={surfaceTexture} roughness={0.9} metalness={0} emissive="#000000" />
            </mesh>

            {isSelected && (
                <mesh rotation-x={Math.PI / 2}>
                    <ringGeometry args={[radius * 1.5, radius * 1.58, 64]} />
                    <meshBasicMaterial color="#dce8fb" transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
            )}

            {planet.hasRings && (
                <mesh rotation={[Math.PI / 2.35, 0, -0.18]}>
                    <ringGeometry args={[radius * 1.42, radius * 2.25, 96]} />
                    <meshBasicMaterial color="#d6c699" transparent opacity={0.62} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
            )}

            {planet.key === 'earth' && <Moon paused={Boolean(hoveredPlanetKey)} />}

            <Html position={[0, radius + 0.38, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
                <div className={`planet-label ${hovered || isSelected ? 'is-visible' : ''}`}>{project ? `${planet.name} · ${project.name}` : planet.name}</div>
            </Html>
        </group>
    );
}
