import { useFrame } from '@react-three/fiber';
import { simClock } from '../utils/simClock';
import useViewStore from '../store/viewStore';

// Advances simulated time; mounted before the bodies so they all read this frame's time.
export default function SimClock() {
    useFrame((_, delta) => {
        // Clamp the step so a backgrounded tab does not jump weeks ahead when it returns.
        simClock.time += Math.min(delta, 0.1) * 1000 * useViewStore.getState().rate;
    });
    return null;
}
