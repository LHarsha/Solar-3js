import { AnimatePresence, motion } from 'framer-motion';
import useViewStore from '../store/viewStore';
import { getBody } from '../utils/bodies';
import { PLANETS, getPlanet } from '../utils/solarSystem';
import { AU_KM, heliocentricPosition } from '../utils/orbitMath';
import { useSimTime } from '../utils/useSimTime';

const FACT_LABELS = [
    ['diameter', 'Diameter'],
    ['mass', 'Mass'],
    ['gravity', 'Surface gravity'],
    ['day', 'Length of day'],
    ['year', 'Length of year'],
    ['orbit', 'Orbital period'],
    ['distance', 'Distance'],
    ['temperature', 'Temperature'],
    ['moons', 'Known moons'],
    ['atmosphere', 'Atmosphere'],
];

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function formatDistance(km) {
    if (km >= 1e6) return `${numberFormat.format(Math.round(km / 1e6))}M km`;
    return `${numberFormat.format(km)} km`;
}

function formatLightTime(km) {
    const seconds = km / 299792.458;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    return `${Math.floor(minutes / 60)} h ${Math.round(minutes % 60)} min`;
}

// Live distances for the simulated date, from the same orbital elements that place the planets.
function LiveDistances({ body }) {
    const { time } = useSimTime(500);
    const planet = body.key === 'sun' ? null : getPlanet(body.parent ?? body.key);
    const earth = heliocentricPosition(getPlanet('earth'), time);
    const position = planet ? heliocentricPosition(planet, time) : null;
    const fromSunAu = position ? position.length() : null;
    const fromEarthKm = body.key === 'moon' ? 384400 : (position ? position.distanceTo(earth) : earth.length()) * AU_KM;
    const isEarth = body.key === 'earth';

    const stats = [
        fromSunAu !== null && !body.parent && { label: 'From the Sun', value: `${fromSunAu.toFixed(3)} AU` },
        !isEarth && { label: 'From Earth', value: `${body.key === 'moon' ? '~' : ''}${formatDistance(fromEarthKm)}` },
        !isEarth && { label: 'Light time', value: formatLightTime(fromEarthKm) },
    ].filter(Boolean);
    if (stats.length === 0) return null;

    return (
        <section className="panel-section">
            <h3>Now <span>{dateFormat.format(time)}</span></h3>
            <dl className="live-stats">
                {stats.map(({ label, value }) => (
                    <div key={label}><dd>{value}</dd><dt>{label}</dt></div>
                ))}
            </dl>
        </section>
    );
}

export default function BodyPanel() {
    const focusKey = useViewStore((s) => s.focusKey);
    const landmarkId = useViewStore((s) => s.landmarkId);
    const focus = useViewStore((s) => s.focus);
    const visitLandmark = useViewStore((s) => s.visitLandmark);
    const venusSurface = useViewStore((s) => s.venusSurface);
    const setVenusSurface = useViewStore((s) => s.setVenusSurface);
    const body = getBody(focusKey);
    const parent = body?.parent ? getBody(body.parent) : null;
    const order = PLANETS.findIndex((planet) => planet.key === body?.key) + 1;
    const kind = body?.key === 'sun' ? 'Star · Type G2V' : parent ? `Moon of ${parent.name}` : `Planet · ${ORDINALS[order]} from the Sun`;
    const facts = body?.facts ?? {};

    return (
        <AnimatePresence>
            {body && (
                <motion.aside
                    key="panel"
                    initial={{ x: 16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 16, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="body-panel"
                    aria-label={`${body.name} details`}
                >
                    <div className="body-panel__scroll">
                        <div className="body-panel__head">
                            <p className="body-panel__kind">{kind}</p>
                            <button type="button" className="body-panel__close" onClick={() => focus(null)} aria-label="Back to overview">
                                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.3" /></svg>
                            </button>
                        </div>
                        <h2>{body.name}</h2>
                        <p className="body-panel__description">{body.description}</p>

                        {body.surfaceTexture && (
                            <div className="segmented" role="group" aria-label="Venus view">
                                <button type="button" className={!venusSurface ? 'is-selected' : ''} onClick={() => setVenusSurface(false)}>Cloud tops</button>
                                <button type="button" className={venusSurface ? 'is-selected' : ''} onClick={() => setVenusSurface(true)}>Radar surface</button>
                            </div>
                        )}

                        <LiveDistances body={body} />

                        <section className="panel-section">
                            <h3>Physical data</h3>
                            <dl className="fact-list">
                                {FACT_LABELS.filter(([key]) => facts[key]).map(([key, label]) => (
                                    <div key={key}><dt>{label}</dt><dd>{facts[key]}</dd></div>
                                ))}
                                {body.axialTilt !== undefined && <div><dt>Axial tilt</dt><dd>{body.displayTilt ?? `${body.axialTilt}°`}</dd></div>}
                            </dl>
                        </section>

                        {body.landmarks?.length > 0 && (
                            <section className="panel-section places">
                                <h3>Places to visit</h3>
                                <ol>
                                    {body.landmarks.map((landmark, index) => (
                                        <li key={landmark.id}>
                                            <button type="button" className={landmarkId === landmark.id ? 'is-selected' : ''} aria-pressed={landmarkId === landmark.id} onClick={() => visitLandmark(body.key, landmark.id)}>
                                                <span className="places__index">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="places__name">{landmark.name}</span>
                                                <span className="places__coords">{formatCoordinate(landmark.lat, 'N', 'S')} {formatCoordinate(landmark.lon, 'E', 'W')}</span>
                                                <span className="places__note">{landmark.note}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}

                        {parent && (
                            <button type="button" className="body-panel__parent" onClick={() => focus(parent.key)}>← Back to {parent.name}</button>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

function formatCoordinate(value, positive, negative) {
    return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}
