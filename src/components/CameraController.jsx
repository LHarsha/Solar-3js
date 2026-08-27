import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';

const OVERVIEW_POSITION = [0, 62, 0.01];

// Keep the whole system framed. Project selection uses the side panel instead of moving the view.
export default function CameraController() {
    const { camera } = useThree();

    useLayoutEffect(() => {
        camera.position.set(...OVERVIEW_POSITION);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [camera]);

    return null;
}
