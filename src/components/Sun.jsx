import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { bodyObjects } from '../utils/planetRegistry';
import { simClock } from '../utils/simClock';
import { rotationAngle } from '../utils/orbitMath';
import { prepareTexture } from '../utils/materials';
import { SUN } from '../utils/bodies';
import useViewStore from '../store/viewStore';
import BodyLabel from './BodyLabel';

function createCoronaTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 246, 228, 1)');
    gradient.addColorStop(0.22, 'rgba(255, 226, 180, .55)');
    gradient.addColorStop(0.45, 'rgba(255, 196, 130, .14)');
    gradient.addColorStop(1, 'rgba(255, 180, 110, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}

export default function Sun() {
    const anchorRef = useRef();
    const spinRef = useRef();
    const focus = useViewStore((s) => s.focus);
    const map = useTexture(SUN.texture);
    const surface = useMemo(() => prepareTexture(map), [map]);
    const corona = useMemo(() => createCoronaTexture(), []);
    useEffect(() => () => corona.dispose(), [corona]);

    useEffect(() => {
        bodyObjects.set('sun', { anchor: anchorRef.current, spin: spinRef.current, radius: SUN.displayRadius });
        return () => bodyObjects.delete('sun');
    }, []);

    useFrame(() => {
        if (spinRef.current) spinRef.current.rotation.y = rotationAngle(SUN.rotationHours, simClock.time);
    });

    return (
        <group ref={anchorRef}>
            <mesh
                ref={spinRef}
                onClick={(event) => { event.stopPropagation(); focus('sun'); }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
                <sphereGeometry args={[SUN.displayRadius, 96, 64]} />
                {/* Over-bright and un-tonemapped so the bloom pass picks it up. */}
                <meshBasicMaterial map={surface} color={[2.2, 1.9, 1.5]} toneMapped={false} />
            </mesh>
            <sprite scale={SUN.displayRadius * 4.2} raycast={() => null}>
                <spriteMaterial map={corona} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} opacity={0.4} />
            </sprite>
            <BodyLabel bodyKey="sun" name="Sun" radius={SUN.displayRadius} />
        </group>
    );
}
