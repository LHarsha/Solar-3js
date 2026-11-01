// The simulated UTC time in ms. Advanced every frame by <SimClock>; read imperatively everywhere
// else so the clock never causes React re-renders.
export const simClock = { time: Date.now() };
