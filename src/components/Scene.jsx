import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import StarField from './StarField';
import Sun from './Sun';
import OrbitalPath from './OrbitalPath';
import Planet from './Planet';
import SimClock from './SimClock';
import CameraController from './CameraController';
import { PLANETS } from '../utils/solarSystem';

export default function Scene() {
    return (
        <Canvas
            camera={{ position: [0, 46, 70], fov: 45, near: 0.01, far: 3000 }}
            gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: false,
                toneMapping: THREE.ACESFilmicToneMapping,
            }}
            dpr={[1, 2]}
            performance={{ min: 0.65 }}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <color attach="background" args={['#000000']} />

            <SimClock />
            <CameraController />

            {/* Textures suspend here, inside the canvas. If the suspension escaped to the DOM tree,
                React would tear down the WebGL root and the remounted renderer would get a lost context. */}
            <Suspense fallback={null}>
                <StarField />
                <Sun />
                {PLANETS.map((planet) => (
                    <group key={planet.key}>
                        <OrbitalPath planet={planet} />
                        <Planet planet={planet} />
                    </group>
                ))}
            </Suspense>
        </Canvas>
    );
}
