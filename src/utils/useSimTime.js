import { useEffect, useState } from 'react';
import { simClock } from './simClock';

const sample = () => ({ time: simClock.time, now: Date.now() });

// Reads the simulation clock (and the real one) a few times a second rather than every frame.
export function useSimTime(interval = 250) {
    const [clock, setClock] = useState(sample);
    useEffect(() => {
        const id = window.setInterval(() => setClock(sample()), interval);
        return () => window.clearInterval(id);
    }, [interval]);
    return clock;
}
