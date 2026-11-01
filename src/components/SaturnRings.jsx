import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import vertexShader from '../shaders/ring.vert';
import fragmentShader from '../shaders/ring.frag';
import { prepareTexture } from '../utils/materials';

// Inner edge of the C ring and outer edge of the A ring, in Saturn radii.
const INNER = 1.24;
const OUTER = 2.27;

// Lies in the planet's equatorial plane (it is placed inside the tilted group), with the planet's shadow cast across it.
export default function SaturnRings({ radius, texturePath }) {
    const meshRef = useRef();
    const map = useTexture(texturePath);
    const material = useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uRing: { value: prepareTexture(map) },
            uInner: { value: radius * INNER },
            uOuter: { value: radius * OUTER },
            uPlanetCenter: { value: new THREE.Vector3() },
            uPlanetRadius: { value: radius },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    }), [map, radius]);
    useEffect(() => () => material.dispose(), [material]);

    useFrame(() => {
        meshRef.current?.parent.getWorldPosition(material.uniforms.uPlanetCenter.value);
    });

    return (
        <mesh ref={meshRef} rotation-x={-Math.PI / 2} material={material} renderOrder={1} raycast={() => null}>
            <ringGeometry args={[radius * INNER, radius * OUTER, 256, 1]} />
        </mesh>
    );
}
