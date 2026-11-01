import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { simClock } from '../utils/simClock';
import useViewStore from '../store/viewStore';

// Advances simulated time; mounted before the bodies so they all read this frame's time.
export default function SimClock() {
    const lastWall = useRef(0);
    useFrame((_, delta) => {
        const wall = Date.now();
        const elapsed = lastWall.current ? wall - lastWall.current : 0;
        lastWall.current = wall;
        const { rate } = useViewStore.getState();
        // In real time, follow the wall clock exactly so the view stays live after a slow frame or a hidden tab.
        // Faster rates clamp the step instead, so a backgrounded tab does not jump weeks ahead when it returns.
        simClock.time += rate === 1 ? elapsed : Math.min(delta, 0.1) * 1000 * rate;
    });
    return null;
}
