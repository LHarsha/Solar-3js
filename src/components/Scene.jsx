import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './StarField';
import Sun from './Sun';
import OrbitalPath from './OrbitalPath';
import Planet from './Planet';
import CameraController from './CameraController';
import useProjectStore from '../store/projectStore';
import { getDisplayOrbitRadius, PLANETS } from '../utils/solarSystem';

export default function Scene() {
    const projects = useProjectStore((s) => s.projects);
    const selectPlanet = useProjectStore((s) => s.selectPlanet);
    const setHoveredPlanet = useProjectStore((s) => s.setHoveredPlanet);

    const handlePlanetClick = useCallback(
        (id) => {
            selectPlanet(id);
        },
        [selectPlanet]
    );

    const handleBackgroundClick = useCallback(() => {
        selectPlanet(null);
        setHoveredPlanet(null);
    }, [selectPlanet, setHoveredPlanet]);

    return (
        <Canvas
            camera={{ position: [0, 62, 0.01], fov: 50, near: 0.1, far: 500 }}
            gl={{
                antialias: false,
                powerPreference: 'high-performance',
                alpha: false,
            }}
            dpr={[1, 1.5]}
            performance={{ min: 0.65 }}
            style={{ position: 'absolute', top: 0, left: 0 }}
            onPointerMissed={handleBackgroundClick}
            onPointerLeave={() => setHoveredPlanet(null)}
        >
            <color attach="background" args={['#070a10']} />
            <ambientLight intensity={0.018} />

            <CameraController />
            <StarField />
            <Sun />

            {PLANETS.map((planet, index) => {
                const project = projects.find((item) => item.planetKey === planet.key);
                return (
                <group key={planet.key}>
                    <OrbitalPath planet={planet} />
                    <Planet planet={planet} project={project} onClick={handlePlanetClick} index={index} />
                </group>
                );
            })}

            <EffectComposer>
                <Bloom
                    intensity={0.75}
                    luminanceThreshold={0.72}
                    luminanceSmoothing={0.9}
                    mipmapBlur
                />
            </EffectComposer>
        </Canvas>
    );
}
