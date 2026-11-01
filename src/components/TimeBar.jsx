import useViewStore, { RATES } from '../store/viewStore';
import { useSimTime } from '../utils/useSimTime';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });

export default function TimeBar() {
    const rate = useViewStore((s) => s.rate);
    const setRate = useViewStore((s) => s.setRate);
    const resetToNow = useViewStore((s) => s.resetToNow);
    const { time, now } = useSimTime();
    const offNow = Math.abs(time - now) > 60000;

    return (
        <div className="time-bar" role="group" aria-label="Simulation time">
            <p className="time-bar__hint">
                <span><kbd>Drag</kbd> orbit</span>
                <span><kbd>Right-drag</kbd> look around</span>
                <span><kbd>Scroll</kbd> zoom</span>
                <span><kbd>Double-click</kbd> recentre</span>
            </p>
            <div className="time-bar__clock" aria-live="off">
                <span className="time-bar__date">{dateFormat.format(time)}</span>
                <span className="time-bar__utc">{timeFormat.format(time)} UTC</span>
                <button type="button" className="time-bar__now" onClick={resetToNow} disabled={!offNow}>{offNow ? 'Back to now' : 'Now'}</button>
            </div>
            <div className="time-bar__rates">
                {RATES.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => setRate(value)} className={rate === value ? 'is-selected' : ''} aria-pressed={rate === value}>{label}</button>
                ))}
            </div>
        </div>
    );
}
