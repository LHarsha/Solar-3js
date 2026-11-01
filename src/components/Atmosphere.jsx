import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import vertexShader from '../shaders/body.vert';
import fragmentShader from '../shaders/atmosphere.frag';

// A thin scattering shell, only visible on the sunlit limb. Colour and strength come from the body data.
export default function Atmosphere({ radius, color, strength = 1 }) {
    const material = useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uColor: { value: new THREE.Color(color) },
            uStrength: { value: strength },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    }), [color, strength]);
    useEffect(() => () => material.dispose(), [material]);

    return (
        <mesh scale={1.06} material={material} raycast={() => null}>
            <sphereGeometry args={[radius, 48, 32]} />
        </mesh>
    );
}
