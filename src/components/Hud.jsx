import { Fragment } from 'react';
import useViewStore from '../store/viewStore';
import { PLANETS } from '../utils/solarSystem';
import { getBody, getMoonsOf } from '../utils/bodies';

function NavItem({ index, selected, open = false, onClick, children, moon = false }) {
    return (
        <li>
            <button type="button" onClick={onClick} className={`body-nav__item${moon ? ' body-nav__item--moon' : ''}${selected ? ' is-selected' : ''}${open ? ' is-open' : ''}`} aria-current={selected ? 'true' : undefined} aria-keyshortcuts={index}>
                <span className="body-nav__key" aria-hidden="true">{index}</span>
                {children}
            </button>
        </li>
    );
}

function Toggle({ on, onChange, children }) {
    return (
        <button type="button" className="toggle" aria-pressed={on} onClick={() => onChange(!on)}>
            <span className="toggle__box" aria-hidden="true" />
            {children}
        </button>
    );
}

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
                <button type="button" onClick={() => setAboutOpen(true)}>About</button>
            </div>

            <nav aria-label="Bodies">
                <ul className="body-nav">
                    <NavItem index="Esc" selected={!focusKey} onClick={() => focus(null)}>Overview</NavItem>
                    <NavItem index="0" selected={focusKey === 'sun'} onClick={() => focus('sun')}>Sun</NavItem>
                    {PLANETS.map((planet, index) => (
                        <Fragment key={planet.key}>
                            <NavItem index={String(index + 1)} selected={focusKey === planet.key} open={systemKey === planet.key} onClick={() => focus(planet.key)}>{planet.name}</NavItem>
                            {systemKey === planet.key && moons.map((moon) => (
                                <NavItem key={moon.key} moon selected={focusKey === moon.key} onClick={() => focus(moon.key)}>{moon.name}</NavItem>
                            ))}
                        </Fragment>
                    ))}
                </ul>
            </nav>

            <div className="hud__toggles">
                <Toggle on={showLabels} onChange={setShowLabels}>Labels</Toggle>
                <Toggle on={showOrbits} onChange={setShowOrbits}>Orbits</Toggle>
            </div>

        </header>
    );
}
