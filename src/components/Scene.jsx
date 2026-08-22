import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './StarField';
import Sun from './Sun';
import OrbitalPath from './OrbitalPath';
import Planet from './Planet';
import CameraController from './CameraController';
import useProjectStore from '../store/projectStore';

export default function Scene() {
    const projects = useProjectStore((s) => s.projects);
    const selectPlanet = useProjectStore((s) => s.selectPlanet);

    const handlePlanetClick = useCallback(
        (id, position) => {
            selectPlanet(id);
        },
        [selectPlanet]
    );

    const handleBackgroundClick = useCallback(() => {
        selectPlanet(null);
    }, [selectPlanet]);

    return (
        <Canvas
            camera={{ position: [0, 12, 20], fov: 50, near: 0.1, far: 500 }}
            gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: false,
            }}
            style={{ position: 'absolute', top: 0, left: 0 }}
            onPointerMissed={handleBackgroundClick}
        >
            <color attach="background" args={['#050510']} />
            <ambientLight intensity={0.15} />

            <CameraController />
            <StarField />
            <Sun />

            {projects.map((project) => (
                <group key={project.id}>
                    <OrbitalPath
                        orbitRadius={project.orbitRadius}
                        tilt={project.tilt}
                        color={project.color}
                    />
                    <Planet project={project} onClick={handlePlanetClick} />
                </group>
            ))}

            <EffectComposer>
                <Bloom
                    intensity={1.2}
                    luminanceThreshold={0.3}
                    luminanceSmoothing={0.9}
                    mipmapBlur
                />
            </EffectComposer>
        </Canvas>
    );
}
