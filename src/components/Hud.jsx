import useViewStore from '../store/viewStore';
import { PLANETS } from '../utils/solarSystem';
import { getBody, getMoonsOf } from '../utils/bodies';

export default function Hud() {
    const focusKey = useViewStore((s) => s.focusKey);
    const focus = useViewStore((s) => s.focus);
    const showLabels = useViewStore((s) => s.showLabels);
    const showOrbits = useViewStore((s) => s.showOrbits);
    const setShowLabels = useViewStore((s) => s.setShowLabels);
    const setShowOrbits = useViewStore((s) => s.setShowOrbits);
    const setAboutOpen = useViewStore((s) => s.setAboutOpen);
    // The planet whose system is open: the focused planet, or the parent of a focused moon.
    const systemKey = getBody(focusKey)?.parent ?? focusKey;
    const moons = getMoonsOf(systemKey);

    return (
        <header className="hud">
            <div className="hud__title">
                <h1>Solar System</h1>
                <p>Positions for the current date · <button type="button" onClick={() => setAboutOpen(true)}>About</button></p>
            </div>

            <nav className="body-nav" aria-label="Bodies">
                <button type="button" onClick={() => focus(null)} className={!focusKey ? 'is-selected' : ''}>Overview</button>
                <button type="button" onClick={() => focus('sun')} className={focusKey === 'sun' ? 'is-selected' : ''}>Sun</button>
                {PLANETS.map((planet, index) => (
                    <button key={planet.key} type="button" onClick={() => focus(planet.key)} className={systemKey === planet.key ? 'is-selected' : ''} aria-keyshortcuts={String(index + 1)}>
                        {planet.name}
                    </button>
                ))}
            </nav>

            {moons.length > 0 && (
                <nav className="body-nav body-nav--moons" aria-label="Moons">
                    {moons.map((moon) => (
                        <button key={moon.key} type="button" onClick={() => focus(moon.key)} className={focusKey === moon.key ? 'is-selected' : ''}>{moon.name}</button>
                    ))}
                </nav>
            )}

            <div className="hud__toggles">
                <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Labels</label>
                <label><input type="checkbox" checked={showOrbits} onChange={(event) => setShowOrbits(event.target.checked)} /> Orbits</label>
            </div>
        </header>
    );
}
