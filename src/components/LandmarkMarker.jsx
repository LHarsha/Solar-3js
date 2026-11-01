import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useViewStore from '../store/viewStore';
import { getBody } from '../utils/bodies';
import { surfaceDirection } from '../utils/orbitMath';

const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Rendered as a child of the spinning surface mesh, so it turns with the ground beneath it.
export default function LandmarkMarker({ bodyKey, radius }) {
    const focusKey = useViewStore((s) => s.focusKey);
    const landmarkId = useViewStore((s) => s.landmarkId);
    const landmark = focusKey === bodyKey && landmarkId ? getBody(bodyKey)?.landmarks?.find((item) => item.id === landmarkId) : null;

    const placement = useMemo(() => {
        if (!landmark) return null;
        const normal = surfaceDirection(landmark.lat, landmark.lon);
        return {
            position: normal.clone().multiplyScalar(radius * 1.002),
            quaternion: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, normal),
        };
    }, [landmark, radius]);

    if (!landmark) return null;

    return (
        <group position={placement.position} quaternion={placement.quaternion}>
            <mesh raycast={() => null}>
                <ringGeometry args={[radius * 0.024, radius * 0.029, 48]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <Html center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }} position={[0, 0, radius * 0.02]}>
                <div className="landmark-label">{landmark.name}</div>
            </Html>
        </group>
    );
}
