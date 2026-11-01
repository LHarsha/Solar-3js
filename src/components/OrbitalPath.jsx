import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getOrbitPoints } from '../utils/orbitMath';
import { bodyObjects } from '../utils/planetRegistry';
import useViewStore from '../store/viewStore';

const OPENED_AT = Date.now();
const TAU = Math.PI * 2;

// Angle around the Sun in the direction of orbital motion, as a fraction of a turn.
const orbitFraction = (x, z) => THREE.MathUtils.euclideanModulo(Math.atan2(-z, x) / TAU, 1);

const vertexShader = /* glsl */ `
    attribute float aFraction;
    varying float vFraction;
    varying vec3 vPosition;
    void main() {
        vFraction = aFraction;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Brightest just behind the planet, fading around the orbit like a trail. It also fades out right at the
// planet so the line never cuts across the globe when you are close.
const fragmentShader = /* glsl */ `
    uniform float uHead;
    uniform float uOpacity;
    uniform vec3 uColor;
    uniform vec3 uHeadPosition;
    uniform float uClearance;
    varying float vFraction;
    varying vec3 vPosition;
    void main() {
        float behind = fract(uHead - vFraction);
        float trail = 0.18 + 0.82 * pow(1.0 - behind, 2.2);
        float clear = smoothstep(uClearance, uClearance * 3.0, distance(vPosition, uHeadPosition));
        gl_FragColor = vec4(uColor, trail * clear * uOpacity);
        #include <colorspace_fragment>
    }
`;

// The orbit drawn for the date the page opened. Elements drift by tiny amounts per century, so it stays accurate.
export default function OrbitalPath({ planet }) {
    const showOrbits = useViewStore((s) => s.showOrbits);
    const focused = useViewStore((s) => s.focusKey === planet.key);

    const geometry = useMemo(() => {
        const points = getOrbitPoints(planet, OPENED_AT, 360);
        // Unwrapped so neighbouring vertices never jump from 0.99 back to 0.01 (the shader takes fract()).
        const fractions = new Float32Array(points.length);
        fractions[0] = orbitFraction(points[0].x, points[0].z);
        for (let index = 1; index < points.length; index += 1) {
            const step = THREE.MathUtils.euclideanModulo(orbitFraction(points[index].x, points[index].z) - orbitFraction(points[index - 1].x, points[index - 1].z), 1);
            fractions[index] = fractions[index - 1] + step;
        }
        return new THREE.BufferGeometry().setFromPoints(points).setAttribute('aFraction', new THREE.BufferAttribute(fractions, 1));
    }, [planet]);

    const uniforms = useMemo(() => ({
        uHead: { value: 0 },
        uOpacity: { value: 0.3 },
        uColor: { value: new THREE.Color('#9fb3cf') },
        uHeadPosition: { value: new THREE.Vector3() },
        uClearance: { value: planet.displayRadius * 1.5 },
    }), [planet]);
    const materialRef = useRef();
    useEffect(() => () => geometry.dispose(), [geometry]);

    useFrame(() => {
        const material = materialRef.current;
        const anchor = bodyObjects.get(planet.key)?.anchor;
        if (!material || !anchor) return;
        material.uniforms.uHead.value = orbitFraction(anchor.position.x, anchor.position.z);
        material.uniforms.uHeadPosition.value.copy(anchor.position);
        material.uniforms.uOpacity.value = focused ? 0.55 : 0.3;
    });

    if (!showOrbits) return null;
    return (
        <line geometry={geometry} raycast={() => null}>
            <shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />
        </line>
    );
}
