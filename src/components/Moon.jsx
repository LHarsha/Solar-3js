import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MOON_ORBIT_RADIUS = 1.55;
const MOON_ORBIT_SECONDS = 18;

function createMoonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    const image = context.createImageData(256, 256);

    for (let pixel = 0; pixel < image.data.length; pixel += 4) {
        const shade = 128 + Math.floor(Math.random() * 34);
        image.data[pixel] = shade;
        image.data[pixel + 1] = shade;
        image.data[pixel + 2] = shade - 8;
        image.data[pixel + 3] = 255;
    }
    context.putImageData(image, 0, 0);

    for (let crater = 0; crater < 42; crater += 1) {
        const x = 8 + Math.random() * 240;
        const y = 8 + Math.random() * 240;
        const radius = 2 + Math.random() * 11;
        const gradient = context.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 1, x, y, radius);
        gradient.addColorStop(0, 'rgba(73, 78, 84, .72)');
        gradient.addColorStop(0.65, 'rgba(105, 109, 112, .35)');
        gradient.addColorStop(1, 'rgba(192, 195, 193, .16)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
}

export default function Moon({ paused }) {
    const moonRef = useRef();
    const texture = useMemo(() => createMoonTexture(), []);

    useFrame(({ clock }) => {
        if (!moonRef.current || paused) return;
        const angle = (clock.getElapsedTime() / MOON_ORBIT_SECONDS) * Math.PI * 2 + 1.1;
        moonRef.current.position.set(
            Math.cos(angle) * MOON_ORBIT_RADIUS,
            Math.sin(angle * 1.7) * 0.12,
            Math.sin(angle) * MOON_ORBIT_RADIUS
        );
        moonRef.current.rotation.y = -angle * 0.35;
    });

    return (
        <mesh ref={moonRef} position={[MOON_ORBIT_RADIUS, 0, 0]}>
            <sphereGeometry args={[0.22, 28, 28]} />
            <meshStandardMaterial map={texture} color="#d4d6d2" roughness={1} metalness={0} />
        </mesh>
    );
}
