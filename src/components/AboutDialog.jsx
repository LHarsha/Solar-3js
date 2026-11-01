import { AnimatePresence, motion } from 'framer-motion';
import useViewStore from '../store/viewStore';

export default function AboutDialog() {
    const open = useViewStore((s) => s.aboutOpen);
    const setAboutOpen = useViewStore((s) => s.setAboutOpen);

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAboutOpen(false)}>
                    <motion.section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="about-title"
                        className="dialog"
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 8, opacity: 0 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="body-panel__head">
                            <h2 id="about-title">About this view</h2>
                            <button type="button" className="body-panel__close" onClick={() => setAboutOpen(false)} aria-label="Close">×</button>
                        </div>
                        <p>Planet positions are calculated for the date shown, from JPL&apos;s Keplerian elements (accurate to well under a degree for 1800–2050). Earth turns with real sidereal time, so its night side matches the clock, and the Moon&apos;s phase follows the real lunar cycle.</p>
                        <p>Sizes and distances are not to scale. At true scale the planets would be invisible specks, so both are compressed while keeping their order, directions and orbital shapes.</p>
                        <p>Positions of moons other than our own are illustrative; their orbital periods are real.</p>
                        <h3>Controls</h3>
                        <ul className="dialog__keys">
                            <li><kbd>Drag</kbd> orbit, all the way over the poles · <kbd>Scroll</kbd> zoom</li>
                            <li><kbd>Right-drag</kbd> or <kbd>Shift</kbd>+drag look around the whole sky · <kbd>Double-click</kbd> or <kbd>R</kbd> face the target again</li>
                            <li><kbd>Arrows</kbd> orbit · <kbd>Shift</kbd>+<kbd>Arrows</kbd> look · <kbd>+</kbd> <kbd>−</kbd> zoom</li>
                            <li>Touch: one finger orbits, two fingers pinch to zoom and drag to look around</li>
                            <li><kbd>1</kbd>–<kbd>8</kbd> planets · <kbd>0</kbd> Sun · <kbd>Esc</kbd> overview · <kbd>Space</kbd> pause</li>
                        </ul>
                        <h3>Sources</h3>
                        <p>
                            Physical data: <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noreferrer">NASA Planetary Fact Sheets</a>.
                            Orbits: <a href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noreferrer">JPL Approximate Positions of the Planets</a>.
                            Textures: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a>, CC BY 4.0.
                        </p>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
