import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import vertexShader from '../shaders/body.vert';
import fragmentShader from '../shaders/sun.frag';
import { bodyObjects } from '../utils/planetRegistry';
import { simClock } from '../utils/simClock';
import { rotationAngle } from '../utils/orbitMath';
import { prepareTexture } from '../utils/materials';
import { SUN } from '../utils/bodies';
import useViewStore from '../store/viewStore';
import BodyLabel from './BodyLabel';

// Radial glow that falls off roughly with the inverse square of distance from the limb.
function createGlowTexture(stops) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Stops are fractions of the sprite's half-width. The part covering the disc is hidden by depth,
// so the glow effectively starts at the limb (0.645 for the inner sprite, 0.143 for the outer).
const INNER_GLOW = [
    [0.6, 'rgba(255, 214, 150, 1)'],
    [0.66, 'rgba(255, 196, 120, .5)'],
    [0.78, 'rgba(255, 176, 96, .12)'],
    [1, 'rgba(255, 160, 80, 0)'],
];

const OUTER_GLOW = [
    [0.13, 'rgba(255, 206, 140, .45)'],
    [0.22, 'rgba(255, 190, 120, .14)'],
    [0.45, 'rgba(255, 176, 104, .035)'],
    [1, 'rgba(255, 166, 96, 0)'],
];

export default function Sun() {
    const anchorRef = useRef();
    const spinRef = useRef();
    const glowRef = useRef();
    const focus = useViewStore((s) => s.focus);
    const map = useTexture(SUN.texture);
    const radius = SUN.displayRadius;

    const material = useMemo(() => new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uMap: { value: prepareTexture(map) } }, toneMapped: false }), [map]);
    const innerGlow = useMemo(() => createGlowTexture(INNER_GLOW), []);
    const outerGlow = useMemo(() => createGlowTexture(OUTER_GLOW), []);
    useEffect(() => () => { material.dispose(); innerGlow.dispose(); outerGlow.dispose(); }, [material, innerGlow, outerGlow]);

    useEffect(() => {
        bodyObjects.set('sun', { anchor: anchorRef.current, spin: spinRef.current, radius });
        return () => bodyObjects.delete('sun');
    }, [radius]);

    useFrame(({ camera }) => {
        if (spinRef.current) spinRef.current.rotation.y = rotationAngle(SUN.rotationHours, simClock.time);
        glowRef.current?.lookAt(camera.position);
    });

    return (
        <group ref={anchorRef}>
            <mesh
                ref={spinRef}
                material={material}
                onClick={(event) => { event.stopPropagation(); focus('sun'); }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
                <sphereGeometry args={[radius, 96, 64]} />
            </mesh>
            {/* Glow quads turned toward the camera's position (not its view direction, as sprites are), so the
                halo stays centred on the disc anywhere on screen. No post-processing pass needed. */}
            <group ref={glowRef}>
                <mesh renderOrder={2} raycast={() => null}>
                    <planeGeometry args={[radius * 3.1, radius * 3.1]} />
                    <meshBasicMaterial map={innerGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.75} toneMapped={false} />
                </mesh>
                <mesh renderOrder={2} raycast={() => null}>
                    <planeGeometry args={[radius * 14, radius * 14]} />
                    <meshBasicMaterial map={outerGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.6} toneMapped={false} />
                </mesh>
            </group>
            <BodyLabel bodyKey="sun" name="Sun" radius={radius} />
        </group>
    );
}
