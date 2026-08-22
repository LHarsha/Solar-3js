import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useProjectStore from '../store/projectStore';
import { getOrbitPosition, getAntiGravityDrift } from '../utils/orbitMath';

const SYSTEM_VIEW_POS = new THREE.Vector3(0, 12, 20);
const SYSTEM_VIEW_TARGET = new THREE.Vector3(0, 0, 0);
const LERP_SPEED = 2.0;

const _targetPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();
let _isReset = true;

export default function CameraController() {
    const { camera } = useThree();
    const selectedId = useProjectStore((s) => s.selectedId);
    const projects = useProjectStore((s) => s.projects);

    useFrame((state, delta) => {
        const project = projects.find((p) => p.id === selectedId);

        if (project) {
            // Calculate current planet position
            const t = state.clock.elapsedTime;
            const pos = getOrbitPosition(project.orbitRadius, project.orbitSpeed, t, project.tilt);
            const drift = getAntiGravityDrift(t, 0.3 + project.orbitSpeed, 0.12);
            const planetPos = new THREE.Vector3(pos.x, pos.y + drift.dy, pos.z + drift.dz);

            const dir = planetPos.clone().normalize();
            const offset = dir.multiplyScalar(3).add(new THREE.Vector3(0, 2, 0));
            _targetPos.copy(planetPos).add(offset);
            _targetLookAt.copy(planetPos);
            _isReset = false;
        } else {
            _targetPos.copy(SYSTEM_VIEW_POS);
            _targetLookAt.copy(SYSTEM_VIEW_TARGET);
        }

        camera.position.lerp(_targetPos, delta * LERP_SPEED);
        camera.getWorldDirection(_currentLookAt);
        _currentLookAt.multiplyScalar(10).add(camera.position);
        _currentLookAt.lerp(_targetLookAt, delta * LERP_SPEED);
        camera.lookAt(_currentLookAt);
    });

    return null;
}
