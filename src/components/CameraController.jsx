import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useViewStore from '../store/viewStore';
import { bodyObjects } from '../utils/planetRegistry';
import { getBody } from '../utils/bodies';
import { surfaceDirection } from '../utils/orbitMath';
import { drag } from '../utils/pointer';

const OVERVIEW_OFFSET = new THREE.Vector3(0, 46, 70);
const OVERVIEW_MIN = 8;
const MAX_DISTANCE = 600;
const PANEL_WIDTH_PX = 380; // keep in sync with the .body-panel width
const UP = new THREE.Vector3(0, 1, 0);
const ROTATE_PER_PX = 2.6; // radians per canvas height of drag
const KEY_PX_PER_SECOND = 420;
const MAX_LOOK_PITCH = 1.45;

const bodyPosition = new THREE.Vector3();
const previousPosition = new THREE.Vector3();
const goalOffset = new THREE.Vector3();
const startDirection = new THREE.Vector3();
const goalDirection = new THREE.Vector3();
const side = new THREE.Vector3();
const axis = new THREE.Vector3();
const turn = new THREE.Quaternion();
const spinNow = new THREE.Quaternion();
const spinDelta = new THREE.Quaternion();
const IDENTITY = new THREE.Quaternion();
const sample = new THREE.Vector2();
const orbitStep = new THREE.Vector2();
const lookStep = new THREE.Vector2();

const smoothstep = (value) => value * value * (3 - 2 * value);
const damp = (rate, delta) => 1 - Math.exp(-rate * delta);
const wrapAngle = (angle) => THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
const isTypingTarget = (target) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

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
        // Arrival levels the camera to the ecliptic, so avoid looking straight down the pole axis.
        if (Math.abs(target.y) > 0.995) target.x += 0.1;
        return target.normalize().multiplyScalar(radius * 2.5);
    }
    if (key === 'sun') return target.set(0.35, 0.3, 1).normalize().multiplyScalar(arrivalDistance(key, radius, aspect));
    const toSun = goalDirection.copy(bodyPosition).negate().normalize();
    side.crossVectors(UP, toSun).normalize();
    return target.copy(toSun).multiplyScalar(0.4).addScaledVector(side, 0.9).addScaledVector(UP, 0.25)
        .normalize().multiplyScalar(arrivalDistance(key, radius, aspect));
}

// Pointer input, collected between frames. Drag orbits the focused body with no stop at the poles;
// right-drag (or Shift-drag, or two fingers) turns the camera in place to look around the whole sky.
// useRef keeps the first one; later renders build a few small objects that are discarded.
const createInput = () => ({
    orbit: new THREE.Vector2(),
    look: new THREE.Vector2(),
    zoom: 0,
    dragging: false,
    lastMove: 0,
    recentre: false,
    keys: new Set(),
});

function usePointerInput(element, input) {
    useEffect(() => {
        const state = input.current;
        const pointers = new Map();
        let mode = 'orbit';
        let pinch = 0;

        const spread = () => {
            const [a, b] = [...pointers.values()];
            return Math.hypot(a.x - b.x, a.y - b.y);
        };
        const setDragging = (dragging) => {
            state.dragging = dragging;
            document.body.classList.toggle('is-dragging', dragging);
        };

        const onPointerDown = (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2) return;
            element.setPointerCapture(event.pointerId);
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.size === 1) drag.travelled = 0;
            mode = event.button === 2 || event.shiftKey || event.ctrlKey || event.altKey ? 'look' : 'orbit';
            if (pointers.size === 2) pinch = spread();
            if (mode === 'look' || pointers.size === 2) state.recentre = false;
            setDragging(true);
        };
        const onPointerMove = (event) => {
            const pointer = pointers.get(event.pointerId);
            if (!pointer) return;
            const dx = event.clientX - pointer.x;
            const dy = event.clientY - pointer.y;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            drag.travelled += Math.hypot(dx, dy);
            state.lastMove = performance.now();
            if (pointers.size === 1) {
                (mode === 'look' ? state.look : state.orbit).x += dx;
                (mode === 'look' ? state.look : state.orbit).y += dy;
            } else if (pointers.size === 2) {
                // Two fingers: pinch to zoom, move together to look around.
                const now = spread();
                if (pinch > 0 && now > 0) state.zoom += Math.log(pinch / now);
                pinch = now;
                state.look.x += dx / 2;
                state.look.y += dy / 2;
            }
        };
        const onPointerUp = (event) => {
            if (!pointers.delete(event.pointerId)) return;
            if (pointers.size === 1) mode = 'orbit';
            if (pointers.size === 0) setDragging(false);
            if (drag.travelled > 80) useViewStore.getState().dismissHint();
        };
        const onWheel = (event) => {
            event.preventDefault();
            const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
            state.zoom += THREE.MathUtils.clamp(event.deltaY * scale, -200, 200) * 0.0016;
            useViewStore.getState().dismissHint();
        };
        const onContextMenu = (event) => event.preventDefault();
        const onDoubleClick = () => { state.recentre = true; };

        const onKeyDown = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
            if (event.key === 'Shift') state.keys.add('Shift');
            if (event.key.startsWith('Arrow') || event.key === '+' || event.key === '=' || event.key === '-') {
                event.preventDefault();
                state.keys.add(event.key);
            }
            if (event.key === 'r' || event.key === 'R') state.recentre = true;
        };
        const onKeyUp = (event) => state.keys.delete(event.key);
        const onBlur = () => state.keys.clear();

        element.addEventListener('pointerdown', onPointerDown);
        element.addEventListener('pointermove', onPointerMove);
        element.addEventListener('pointerup', onPointerUp);
        element.addEventListener('pointercancel', onPointerUp);
        element.addEventListener('wheel', onWheel, { passive: false });
        element.addEventListener('contextmenu', onContextMenu);
        element.addEventListener('dblclick', onDoubleClick);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        return () => {
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
            element.removeEventListener('pointercancel', onPointerUp);
            element.removeEventListener('wheel', onWheel);
            element.removeEventListener('contextmenu', onContextMenu);
            element.removeEventListener('dblclick', onDoubleClick);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            document.body.classList.remove('is-dragging');
        };
    }, [element, input]);
}

// Turn a drag into motion: follow the pointer while held, then coast briefly after a flick.
function applyMotion(pending, velocity, dragging, recentlyMoved, delta, out) {
    if (pending.lengthSq() > 0) {
        velocity.lerp(sample.copy(pending).divideScalar(delta), 0.5);
        out.copy(pending);
        pending.set(0, 0);
        return out;
    }
    velocity.multiplyScalar(Math.exp(-delta * (dragging || !recentlyMoved ? 30 : 4.5)));
    if (velocity.lengthSq() < 1) velocity.set(0, 0);
    return out.copy(velocity).multiplyScalar(delta);
}

// Fly to the selected body (or surface location) and keep following it. Free orbit, look-around and zoom otherwise.
export default function CameraController() {
    const camera = useThree((state) => state.camera);
    const size = useThree((state) => state.size);
    const element = useThree((state) => state.gl.domElement);
    const input = useRef(createInput());
    usePointerInput(element, input);
    const view = useRef({
        target: new THREE.Vector3(),
        offset: OVERVIEW_OFFSET.clone(),
        up: UP.clone(),
        distanceGoal: OVERVIEW_OFFSET.length(),
        minDistance: OVERVIEW_MIN,
        lookYaw: 0,
        lookPitch: 0,
        orbitVelocity: new THREE.Vector2(),
        lookVelocity: new THREE.Vector2(),
    });
    const flight = useRef({ active: false, elapsed: 0, duration: 1, startTarget: new THREE.Vector3(), startOffset: new THREE.Vector3(), startUp: new THREE.Quaternion(), startYaw: 0, startPitch: 0 });
    const lastVisit = useRef(-1);
    const followKey = useRef(null);
    const previousSpin = useRef(new THREE.Quaternion());
    const viewShift = useRef(0);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.1);
        const state = view.current;
        const pointer = input.current;
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
            trip.startTarget.copy(state.target);
            trip.startOffset.copy(state.offset);
            trip.startUp.setFromUnitVectors(UP, state.up);
            trip.startYaw = wrapAngle(state.lookYaw);
            trip.startPitch = state.lookPitch;
            const travel = trip.startTarget.distanceTo(bodyPosition);
            trip.duration = THREE.MathUtils.clamp(1.4 + travel / 45, 1.4, 3.2);
            state.minDistance = body ? body.radius * 1.12 : OVERVIEW_MIN;
            state.orbitVelocity.set(0, 0);
            state.lookVelocity.set(0, 0);
        }

        // Held keys: arrows orbit (Shift + arrows look around), +/- zoom.
        for (const key of pointer.keys) {
            const step = KEY_PX_PER_SECOND * delta;
            const target = pointer.keys.has('Shift') ? pointer.look : pointer.orbit;
            if (key === 'ArrowLeft') target.x -= step;
            if (key === 'ArrowRight') target.x += step;
            if (key === 'ArrowUp') target.y -= step;
            if (key === 'ArrowDown') target.y += step;
            if (key === '+' || key === '=') pointer.zoom -= 1.2 * delta;
            if (key === '-') pointer.zoom += 1.2 * delta;
        }

        const trip = flight.current;
        if (trip.active) {
            // Input during a flight is dropped so the trip lands where it should.
            pointer.orbit.set(0, 0);
            pointer.look.set(0, 0);
            pointer.zoom = 0;
            pointer.recentre = false;

            trip.elapsed += delta;
            const progress = smoothstep(Math.min(1, trip.elapsed / trip.duration));
            if (body) viewpointOffset(goalOffset, focusKey, body.radius, landmark, body.spin, size.width / size.height);
            else goalOffset.copy(OVERVIEW_OFFSET);

            // Interpolate direction and distance separately so the camera swings around rather than cutting through.
            startDirection.copy(trip.startOffset).normalize();
            goalDirection.copy(goalOffset).normalize();
            const distance = THREE.MathUtils.lerp(trip.startOffset.length(), goalOffset.length(), progress);
            state.offset.copy(startDirection).lerp(goalDirection, progress).normalize().multiplyScalar(distance);
            state.target.lerpVectors(trip.startTarget, bodyPosition, progress);
            // Level the horizon and face the body again on the way.
            state.up.copy(UP).applyQuaternion(turn.copy(trip.startUp).slerp(IDENTITY, progress));
            state.lookYaw = THREE.MathUtils.lerp(trip.startYaw, 0, progress);
            state.lookPitch = THREE.MathUtils.lerp(trip.startPitch, 0, progress);

            if (progress >= 1) {
                trip.active = false;
                state.distanceGoal = state.offset.length();
            }
        } else {
            if (body && followKey.current === focusKey) {
                // Follow the body along its orbit.
                state.target.add(goalOffset.copy(bodyPosition).sub(previousPosition));

                // At a surface location, turn with the ground so the place stays beneath you.
                if (landmark && body.spin) {
                    body.spin.getWorldQuaternion(spinNow);
                    spinDelta.copy(spinNow).multiply(previousSpin.current.invert());
                    state.offset.applyQuaternion(spinDelta);
                    state.up.applyQuaternion(spinDelta);
                }
            }

            const now = performance.now();
            const recentlyMoved = now - pointer.lastMove < 90;
            const radiansPerPx = ROTATE_PER_PX / size.height;

            // Orbit: horizontal drags turn around the ecliptic pole, vertical drags tip over the top with no limit.
            const orbit = applyMotion(pointer.orbit, state.orbitVelocity, pointer.dragging, recentlyMoved, delta, orbitStep);
            if (orbit.x !== 0 || orbit.y !== 0) {
                axis.copy(UP).multiplyScalar(state.up.dot(UP) >= 0 ? 1 : -1);
                turn.setFromAxisAngle(axis, -orbit.x * radiansPerPx);
                state.offset.applyQuaternion(turn);
                state.up.applyQuaternion(turn);
                axis.crossVectors(state.up, state.offset).normalize();
                turn.setFromAxisAngle(axis, -orbit.y * radiansPerPx);
                state.offset.applyQuaternion(turn);
                state.up.applyQuaternion(turn);
                goalDirection.copy(state.offset).normalize();
                state.up.addScaledVector(goalDirection, -state.up.dot(goalDirection)).normalize();
            }

            // Look around: the sky moves with the pointer, one pixel for one pixel.
            const look = applyMotion(pointer.look, state.lookVelocity, pointer.dragging, recentlyMoved, delta, lookStep);
            const lookPerPx = THREE.MathUtils.degToRad(camera.fov) / size.height;
            state.lookYaw = wrapAngle(state.lookYaw + look.x * lookPerPx);
            state.lookPitch = THREE.MathUtils.clamp(state.lookPitch + look.y * lookPerPx, -MAX_LOOK_PITCH, MAX_LOOK_PITCH);
            if (pointer.recentre) {
                state.lookYaw += (0 - state.lookYaw) * damp(7, delta);
                state.lookPitch += (0 - state.lookPitch) * damp(7, delta);
                if (Math.abs(state.lookYaw) + Math.abs(state.lookPitch) < 0.001) pointer.recentre = false;
            }

            // Zoom eases toward its goal, scaled by distance so it feels the same close up and far out.
            state.distanceGoal = THREE.MathUtils.clamp(state.distanceGoal * Math.exp(pointer.zoom), state.minDistance, MAX_DISTANCE);
            pointer.zoom = 0;
            const distance = state.offset.length();
            state.offset.setLength(distance + (state.distanceGoal - distance) * damp(12, delta));
        }

        followKey.current = focusKey;
        previousPosition.copy(bodyPosition);
        if (body?.spin) body.spin.getWorldQuaternion(previousSpin.current);

        camera.position.copy(state.target).add(state.offset);
        camera.up.copy(state.up);
        camera.lookAt(state.target);
        camera.rotateY(state.lookYaw);
        camera.rotateX(state.lookPitch);

        // Keep the focused body clear of the fact panel: right side on wide screens, bottom sheet on phones.
        const isNarrow = size.width < 720;
        const goalShift = focusKey ? 1 : 0;
        viewShift.current += (goalShift - viewShift.current) * damp(5, delta);
        if (viewShift.current < 0.001) {
            if (camera.view?.enabled) camera.clearViewOffset();
        } else {
            const x = isNarrow ? 0 : (PANEL_WIDTH_PX / 2) * viewShift.current;
            const y = isNarrow ? size.height * 0.22 * viewShift.current : 0;
            camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
        }
    });

    return null;
}
