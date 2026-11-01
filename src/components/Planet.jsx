import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { displayPosition, greenwichSiderealAngle, rotationAngle } from '../utils/orbitMath';
import { bodyObjects } from '../utils/planetRegistry';
import { simClock } from '../utils/simClock';
import { createBodyMaterial, prepareTexture } from '../utils/materials';
import { getMoonsOf } from '../utils/bodies';
import useViewStore from '../store/viewStore';
import Moon from './Moon';
import SaturnRings from './SaturnRings';
import Atmosphere from './Atmosphere';
import BodyLabel from './BodyLabel';
import LandmarkMarker from './LandmarkMarker';

const DEG = Math.PI / 180;

function textureList(planet) {
    return [planet.texture, planet.surfaceTexture, planet.nightTexture, planet.cloudTexture].filter(Boolean);
}

export default function Planet({ planet }) {
    const anchorRef = useRef();
    const spinRef = useRef();
    const cloudRef = useRef();
    const radius = planet.displayRadius;
    const venusSurface = useViewStore((s) => s.venusSurface);
    const focus = useViewStore((s) => s.focus);

    const paths = useMemo(() => textureList(planet), [planet]);
    const loaded = useTexture(paths);
    const textures = useMemo(() => Object.fromEntries(paths.map((path, index) => [path, prepareTexture(loaded[index])])), [paths, loaded]);

    const showSurface = planet.surfaceTexture && venusSurface;
    const material = useMemo(() => createBodyMaterial({
        map: textures[showSurface ? planet.surfaceTexture : planet.texture],
        night: planet.nightTexture ? textures[planet.nightTexture] : null,
    }), [textures, planet, showSurface]);
    const cloudMaterial = useMemo(() => planet.cloudTexture && createBodyMaterial({ map: textures[planet.cloudTexture], clouds: true }), [textures, planet]);

    useEffect(() => () => material.dispose(), [material]);
    useEffect(() => () => cloudMaterial?.dispose(), [cloudMaterial]);

    useEffect(() => {
        bodyObjects.set(planet.key, { anchor: anchorRef.current, spin: spinRef.current, radius });
        return () => bodyObjects.delete(planet.key);
    }, [planet.key, radius]);

    useFrame(() => {
        const time = simClock.time;
        if (!anchorRef.current) return;
        displayPosition(planet, time, anchorRef.current.position);
        // Earth turns with real sidereal time so its night side matches UTC; others use their rotation period.
        spinRef.current.rotation.y = planet.key === 'earth' ? greenwichSiderealAngle(time) : rotationAngle(planet.rotationHours, time);
        // Clouds drift slowly relative to the ground.
        if (cloudRef.current) cloudRef.current.rotation.y = spinRef.current.rotation.y + rotationAngle(24 * 40, time);
    });

    const moons = getMoonsOf(planet.key);

    return (
        <group ref={anchorRef}>
            {/* Tilt the pole toward the summer solstice direction: the same convention for every planet. */}
            <group rotation-x={-planet.axialTilt * DEG}>
                <mesh
                    ref={spinRef}
                    material={material}
                    onClick={(event) => { event.stopPropagation(); focus(planet.key); }}
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                >
                    <sphereGeometry args={[radius, 96, 64]} />
                    <LandmarkMarker bodyKey={planet.key} radius={radius} />
                </mesh>

                {cloudMaterial && (
                    <mesh ref={cloudRef} material={cloudMaterial} scale={1.008} raycast={() => null}>
                        <sphereGeometry args={[radius, 96, 64]} />
                    </mesh>
                )}

                {planet.ringTexture && <SaturnRings radius={radius} texturePath={planet.ringTexture} />}

                {moons.filter((moon) => moon.plane !== 'ecliptic').map((moon) => (
                    <Moon key={moon.key} moon={moon} parent={planet} />
                ))}
            </group>

            {moons.filter((moon) => moon.plane === 'ecliptic').map((moon) => (
                <Moon key={moon.key} moon={moon} parent={planet} />
            ))}

            {planet.atmosphere && !showSurface && <Atmosphere radius={radius} {...planet.atmosphere} />}
            <BodyLabel bodyKey={planet.key} name={planet.name} radius={radius} />
        </group>
    );
}
