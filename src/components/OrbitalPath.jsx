import { useMemo } from 'react';
import * as THREE from 'three';
import { getOrbitPoints } from '../utils/orbitMath';

export default function OrbitalPath({ planet }) {
    const points = useMemo(
        () => getOrbitPoints(
            planet.orbitRadius,
            planet.inclination * (Math.PI / 180),
            planet.eccentricity,
            planet.periapsis,
            160
        ),
        [planet]
    );

    // Create geometry from the orbit points using THREE.BufferGeometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return geo;
    }, [points]);

    const material = useMemo(() => {
        return new THREE.LineBasicMaterial({
            color: planet.orbitColor,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, [planet.orbitColor]);

    return (
        <line geometry={geometry} material={material} />
    );
}
