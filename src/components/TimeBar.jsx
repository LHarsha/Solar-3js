import useViewStore, { RATES } from '../store/viewStore';
import { useSimTime } from '../utils/useSimTime';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });

const UNITS = [
    ['y', 365.25 * 86400000],
    ['d', 86400000],
    ['h', 3600000],
    ['min', 60000],
];

// "+3 d 4 h": the two largest whole units between the simulated time and now.
function formatOffset(milliseconds) {
    let rest = Math.abs(milliseconds);
    const parts = [];
    for (const [unit, size] of UNITS) {
        const count = Math.floor(rest / size);
        if (count > 0 || parts.length > 0) parts.push(`${count} ${unit}`);
        rest -= count * size;
        if (parts.length === 2) break;
    }
    return `${milliseconds >= 0 ? '+' : '−'}${parts.join(' ')}`;
}

function ControlsHint() {
    const hintSeen = useViewStore((s) => s.hintSeen);
    const dismissHint = useViewStore((s) => s.dismissHint);
    return (
        <div className={`controls-hint${hintSeen ? ' is-hidden' : ''}`} aria-hidden={hintSeen}>
            <span><kbd>Drag</kbd> orbit</span>
            <span><kbd>Right-drag</kbd> look around</span>
            <span><kbd>Scroll</kbd> zoom</span>
            <span><kbd>Double-click</kbd> recentre</span>
            <button type="button" onClick={dismissHint} aria-label="Hide controls hint" tabIndex={hintSeen ? -1 : 0}>
                <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.3" /></svg>
            </button>
        </div>
    );
}

export default function TimeBar() {
    const rate = useViewStore((s) => s.rate);
    const lastRate = useViewStore((s) => s.lastRate);
    const setRate = useViewStore((s) => s.setRate);
    const togglePause = useViewStore((s) => s.togglePause);
    const resetToNow = useViewStore((s) => s.resetToNow);
    const { time, now } = useSimTime();
    const offset = time - now;
    const offNow = Math.abs(offset) > 60000;
    const paused = rate === 0;

    return (
        <div className="time-bar">
            <ControlsHint />
            <section className="time-card" aria-label="Simulation time">
                <div className="time-card__top">
                    <p className="time-card__clock" aria-live="off">
                        <span className="time-card__date">{dateFormat.format(time)}</span>
                        <span className="time-card__utc">{timeFormat.format(time)} UTC</span>
                    </p>
                    <p className="time-card__status">
                        {offNow ? (
                            <>
                                <span>{formatOffset(offset)}</span>
                                <button type="button" onClick={resetToNow}>Return to now</button>
                            </>
                        ) : (
                            <span className={paused ? '' : 'is-live'}>{paused ? 'Paused' : rate === 1 ? 'Live' : 'Now'}</span>
                        )}
                    </p>
                </div>
                <div className="time-card__controls">
                    <button type="button" className="time-card__play" onClick={togglePause} aria-label={paused ? 'Play' : 'Pause'} aria-keyshortcuts="Space">
                        {paused ? (
                            <svg viewBox="0 0 10 12" width="9" height="11" aria-hidden="true"><path d="M1 1l8 5-8 5z" fill="currentColor" /></svg>
                        ) : (
                            <svg viewBox="0 0 10 12" width="9" height="11" aria-hidden="true"><path d="M1.5 1h2v10h-2zM6.5 1h2v10h-2z" fill="currentColor" /></svg>
                        )}
                    </button>
                    <div className="time-card__rates" role="group" aria-label="Speed">
                        {RATES.filter(({ value }) => value > 0).map(({ value, label }) => (
                            <button key={value} type="button" onClick={() => setRate(value)} className={rate === value ? 'is-selected' : paused && lastRate === value ? 'is-held' : ''} aria-pressed={rate === value}>{label}</button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
