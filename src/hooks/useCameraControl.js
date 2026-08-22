import { useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const LERP_SPEED = 2.5;
const SYSTEM_VIEW_POS = new THREE.Vector3(0, 12, 20);
const SYSTEM_VIEW_TARGET = new THREE.Vector3(0, 0, 0);

/**
 * Smooth camera controller for planet focus/reset
 */
export default function useCameraControl() {
    const { camera } = useThree();
    const targetPos = useRef(SYSTEM_VIEW_POS.clone());
    const targetLookAt = useRef(SYSTEM_VIEW_TARGET.clone());
    const isAnimating = useRef(false);

    useFrame((_, delta) => {
        if (!isAnimating.current) return;

        camera.position.lerp(targetPos.current, delta * LERP_SPEED);
        const currentLookAt = new THREE.Vector3();
        camera.getWorldDirection(currentLookAt);
        currentLookAt.add(camera.position);
        currentLookAt.lerp(targetLookAt.current, delta * LERP_SPEED);
        camera.lookAt(currentLookAt);

        // Stop when close enough
        if (camera.position.distanceTo(targetPos.current) < 0.05) {
            camera.position.copy(targetPos.current);
            camera.lookAt(targetLookAt.current);
            isAnimating.current = false;
        }
    });

    const focusPlanet = useCallback(
        (planetPosition) => {
            const dir = new THREE.Vector3()
                .subVectors(planetPosition, SYSTEM_VIEW_TARGET)
                .normalize();
            const offset = dir.multiplyScalar(3).add(new THREE.Vector3(0, 2, 0));
            targetPos.current = planetPosition.clone().add(offset);
            targetLookAt.current = planetPosition.clone();
            isAnimating.current = true;
        },
        []
    );

    const resetView = useCallback(() => {
        targetPos.current = SYSTEM_VIEW_POS.clone();
        targetLookAt.current = SYSTEM_VIEW_TARGET.clone();
        isAnimating.current = true;
    }, []);

    return { focusPlanet, resetView };
}
