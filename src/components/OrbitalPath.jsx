import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { getOrbitPoints } from '../utils/orbitMath';
import useViewStore from '../store/viewStore';

const OPENED_AT = Date.now();

// The orbit drawn for the date the page opened. Elements drift by tiny amounts per century, so it stays accurate.
export default function OrbitalPath({ planet }) {
    const showOrbits = useViewStore((s) => s.showOrbits);
    const focused = useViewStore((s) => s.focusKey === planet.key);
    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(getOrbitPoints(planet, OPENED_AT)), [planet]);
    useEffect(() => () => geometry.dispose(), [geometry]);

    if (!showOrbits) return null;
    return (
        <line geometry={geometry} raycast={() => null}>
            <lineBasicMaterial color="#8fa3bf" transparent opacity={focused ? 0.3 : 0.09} depthWrite={false} />
        </line>
    );
}
