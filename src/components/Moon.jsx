import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { daysSinceJ2000, lunarElongation } from '../utils/orbitMath';
import { bodyObjects } from '../utils/planetRegistry';
import { simClock } from '../utils/simClock';
import { createBodyMaterial, createProceduralSurface, hashKey, prepareTexture } from '../utils/materials';
import { getBody, getMoonDisplayRadius } from '../utils/bodies';
import useViewStore from '../store/viewStore';
import Atmosphere from './Atmosphere';
import BodyLabel from './BodyLabel';
import LandmarkMarker from './LandmarkMarker';

const DEG = Math.PI / 180;
const worldPosition = new THREE.Vector3();

function MoonSurface({ moon, radius, spinRef }) {
    const focus = useViewStore((s) => s.focus);
    const texture = moon.texture ? <TexturedMaterial path={moon.texture} /> : <ProceduralMaterial moon={moon} />;
    return (
        <mesh
            ref={spinRef}
            onClick={(event) => { event.stopPropagation(); focus(moon.key); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
            <sphereGeometry args={[radius, 48, 32]} />
            {texture}
            <LandmarkMarker bodyKey={moon.key} radius={radius} />
        </mesh>
    );
}

function TexturedMaterial({ path }) {
    const map = useTexture(path);
    const material = useMemo(() => createBodyMaterial({ map: prepareTexture(map) }), [map]);
    useEffect(() => () => material.dispose(), [material]);
    return <primitive object={material} attach="material" />;
}

function ProceduralMaterial({ moon }) {
    const material = useMemo(() => createBodyMaterial({
        map: createProceduralSurface(hashKey(moon.key), moon.craters),
        tint: moon.color,
        wrap: moon.atmosphere?.wrap ?? 0,
        limb: moon.limb ?? 0,
    }), [moon]);
    useEffect(() => () => { material.uniforms.uMap.value.dispose(); material.dispose(); }, [material]);
    return <primitive object={material} attach="material" />;
}

export default function Moon({ moon, parent }) {
    const anchorRef = useRef();
    const spinRef = useRef();
    const radius = getMoonDisplayRadius(moon, parent);
    const orbitRadius = parent.displayRadius * moon.orbit;
    const phase = (hashKey(moon.key) % 1000) / 1000 * Math.PI * 2;
    const focusKey = useViewStore((s) => s.focusKey);
    const showOrbits = useViewStore((s) => s.showOrbits);
    // Moons, their orbits and labels only appear once you are visiting that planet's system.
    const nearby = focusKey === parent.key || getBody(focusKey)?.parent === parent.key;

    const orbitLine = useMemo(() => {
        const points = Array.from({ length: 129 }, (_, index) => {
            const angle = (index / 128) * Math.PI * 2;
            return new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, -Math.sin(angle) * orbitRadius);
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: '#8fa3bf', transparent: true, opacity: 0.18, depthWrite: false });
        return new THREE.Line(geometry, material);
    }, [orbitRadius]);
    useEffect(() => () => { orbitLine.geometry.dispose(); orbitLine.material.dispose(); }, [orbitLine]);

    useEffect(() => {
        bodyObjects.set(moon.key, { anchor: anchorRef.current, spin: spinRef.current, radius, parent: parent.key });
        return () => bodyObjects.delete(moon.key);
    }, [moon.key, parent.key, radius]);

    useFrame(() => {
        if (!anchorRef.current) return;
        const time = simClock.time;
        let angle;
        if (moon.key === 'moon') {
            // Angle toward the Sun as seen from Earth, plus the real elongation for this date: the phase is correct.
            const parentObject = bodyObjects.get(parent.key);
            parentObject?.anchor.getWorldPosition(worldPosition);
            angle = Math.atan2(worldPosition.z, -worldPosition.x) + lunarElongation(time);
        } else {
            angle = (daysSinceJ2000(time) / moon.periodDays) * Math.PI * 2 + phase;
        }
        anchorRef.current.position.set(Math.cos(angle) * orbitRadius, 0, -Math.sin(angle) * orbitRadius);
        // Tidally locked: the same face (longitude 0) always points at the parent.
        spinRef.current.rotation.y = angle + Math.PI;
    });

    return (
        <group rotation-x={-(moon.inclination ?? 0) * DEG}>
            {showOrbits && nearby && <primitive object={orbitLine} />}
            <group ref={anchorRef}>
                <MoonSurface moon={moon} radius={radius} spinRef={spinRef} />
                {moon.atmosphere && <Atmosphere radius={radius} {...moon.atmosphere} />}
                <BodyLabel bodyKey={moon.key} name={moon.name} radius={radius} visible={nearby} />
            </group>
        </group>
    );
}
