import { useLayoutEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useViewStore from '../store/viewStore';
import { bodyObjects } from '../utils/planetRegistry';
import { getBody } from '../utils/bodies';
import { surfaceDirection } from '../utils/orbitMath';

const OVERVIEW_OFFSET = new THREE.Vector3(0, 46, 70);
const OVERVIEW_MIN = 8;
const MAX_DISTANCE = 600;
const PANEL_WIDTH_PX = 380; // keep in sync with the .body-panel width
const UP = new THREE.Vector3(0, 1, 0);

const bodyPosition = new THREE.Vector3();
const previousPosition = new THREE.Vector3();
const goalOffset = new THREE.Vector3();
const offset = new THREE.Vector3();
const startDirection = new THREE.Vector3();
const goalDirection = new THREE.Vector3();
const side = new THREE.Vector3();
const spinNow = new THREE.Quaternion();
const spinDelta = new THREE.Quaternion();

const smoothstep = (value) => value * value * (3 - 2 * value);

// Camera distance from the centre of a body when you arrive; pulled back on portrait screens.
function arrivalDistance(key, radius, aspect) {
    const portrait = Math.max(1, 1.1 / aspect);
    if (key === 'sun') return radius * 5 * portrait;
    return radius * (getBody(key)?.parent ? 7 : 6) * portrait;
}

// Where to look from: three-quarters lit, slightly above the orbital plane.
function viewpointOffset(target, key, radius, landmark, spin, aspect) {
    if (landmark && spin) {
        surfaceDirection(landmark.lat, landmark.lon, target).applyQuaternion(spin.getWorldQuaternion(spinNow));
        // Avoid looking straight along the pole axis, where the orbit controls lose their up direction.
        if (Math.abs(target.y) > 0.995) target.x += 0.1;
        return target.normalize().multiplyScalar(radius * 2.5);
    }
    if (key === 'sun') return target.set(0.35, 0.3, 1).normalize().multiplyScalar(arrivalDistance(key, radius, aspect));
    const toSun = goalDirection.copy(bodyPosition).negate().normalize();
    side.crossVectors(UP, toSun).normalize();
    return target.copy(toSun).multiplyScalar(0.4).addScaledVector(side, 0.9).addScaledVector(UP, 0.25)
        .normalize().multiplyScalar(arrivalDistance(key, radius, aspect));
}

// Fly to the selected body (or surface location) and keep following it. Free orbit, zoom and pan otherwise.
export default function CameraController() {
    const controlsRef = useRef();
    const flight = useRef({ active: false, elapsed: 0, duration: 1, startTarget: new THREE.Vector3(), startOffset: new THREE.Vector3() });
    const lastVisit = useRef(-1);
    const followKey = useRef(null);
    const previousSpin = useRef(new THREE.Quaternion());
    const viewShift = useRef(0);
    const camera = useThree((state) => state.camera);
    const size = useThree((state) => state.size);

    // Zoom limits are set here rather than as props: a re-render would otherwise reset the
    // close-up limit and push the camera back out while you are visiting a body.
    useLayoutEffect(() => {
        camera.position.copy(OVERVIEW_OFFSET);
        camera.lookAt(0, 0, 0);
        const controls = controlsRef.current;
        if (!controls) return;
        controls.minDistance = OVERVIEW_MIN;
        controls.maxDistance = MAX_DISTANCE;
        controls.target.set(0, 0, 0);
        controls.update();
    }, [camera]);

    useFrame((_, rawDelta) => {
        const controls = controlsRef.current;
        if (!controls) return;
        const delta = Math.min(rawDelta, 0.1);
        const { focusKey, landmarkId, visitId } = useViewStore.getState();
        const body = focusKey && bodyObjects.get(focusKey);
        const landmark = landmarkId ? getBody(focusKey)?.landmarks?.find((item) => item.id === landmarkId) : null;

        if (body) body.anchor.getWorldPosition(bodyPosition);
        else bodyPosition.set(0, 0, 0);

        // A visit chosen while textures are still loading waits until the body is in the scene.
        if (visitId !== lastVisit.current && (body || !focusKey)) {
            lastVisit.current = visitId;
            const trip = flight.current;
            trip.active = true;
            trip.elapsed = 0;
            trip.startTarget.copy(controls.target);
            trip.startOffset.copy(camera.position).sub(controls.target);
            const travel = trip.startTarget.distanceTo(bodyPosition);
            trip.duration = THREE.MathUtils.clamp(1.4 + travel / 45, 1.4, 3.2);
            controls.enabled = false;
            controls.minDistance = body ? body.radius * 1.12 : OVERVIEW_MIN;
        }

        const trip = flight.current;
        if (trip.active) {
            trip.elapsed += delta;
            const progress = smoothstep(Math.min(1, trip.elapsed / trip.duration));
            if (body) viewpointOffset(goalOffset, focusKey, body.radius, landmark, body.spin, size.width / size.height);
            else goalOffset.copy(OVERVIEW_OFFSET);

            // Interpolate direction and distance separately so the camera swings around rather than cutting through.
            startDirection.copy(trip.startOffset).normalize();
            goalDirection.copy(goalOffset).normalize();
            const distance = THREE.MathUtils.lerp(trip.startOffset.length(), goalOffset.length(), progress);
            offset.copy(startDirection).lerp(goalDirection, progress).normalize().multiplyScalar(distance);

            controls.target.lerpVectors(trip.startTarget, bodyPosition, progress);
            camera.position.copy(controls.target).add(offset);
            camera.lookAt(controls.target);

            if (progress >= 1) {
                trip.active = false;
                controls.enabled = true;
            }
        } else if (body && followKey.current === focusKey) {
            // Follow the body along its orbit.
            offset.copy(bodyPosition).sub(previousPosition);
            controls.target.add(offset);
            camera.position.add(offset);

            // At a surface location, turn with the ground so the place stays beneath you.
            if (landmark && body.spin) {
                body.spin.getWorldQuaternion(spinNow);
                spinDelta.copy(spinNow).multiply(previousSpin.current.invert());
                offset.copy(camera.position).sub(controls.target).applyQuaternion(spinDelta);
                camera.position.copy(controls.target).add(offset);
                camera.lookAt(controls.target);
            }
        }

        followKey.current = focusKey;
        previousPosition.copy(bodyPosition);
        if (body?.spin) body.spin.getWorldQuaternion(previousSpin.current);

        // Keep the focused body clear of the fact panel: right side on wide screens, bottom sheet on phones.
        const isNarrow = size.width < 720;
        const goalShift = focusKey ? 1 : 0;
        viewShift.current += (goalShift - viewShift.current) * (1 - Math.exp(-delta * 5));
        if (viewShift.current < 0.001) {
            if (camera.view?.enabled) camera.clearViewOffset();
        } else {
            const x = isNarrow ? 0 : (PANEL_WIDTH_PX / 2) * viewShift.current;
            const y = isNarrow ? size.height * 0.22 * viewShift.current : 0;
            camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.8}
            rotateSpeed={0.6}
            panSpeed={0.6}
            screenSpacePanning
        />
    );
}
