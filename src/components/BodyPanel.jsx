import { AnimatePresence, motion } from 'framer-motion';
import useViewStore from '../store/viewStore';
import { getBody } from '../utils/bodies';
import { getPlanet } from '../utils/solarSystem';
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

const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

function formatDistance(km) {
    if (km >= 1e6) return `${(km / 1e6).toFixed(km >= 1e8 ? 0 : 1)} million km`;
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

    return (
        <dl className="fact-grid fact-grid--live">
            {fromSunAu !== null && !body.parent && (
                <div><dt>From the Sun</dt><dd>{fromSunAu.toFixed(3)} AU</dd></div>
            )}
            {!isEarth && (
                <>
                    <div><dt>From Earth</dt><dd>{body.key === 'moon' ? '~' : ''}{formatDistance(fromEarthKm)}</dd></div>
                    <div><dt>Light time</dt><dd>{formatLightTime(fromEarthKm)}</dd></div>
                </>
            )}
        </dl>
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
    const kind = body?.key === 'sun' ? 'Star' : parent ? `Moon of ${parent.name}` : 'Planet';
    const facts = body?.facts ?? {};

    return (
        <AnimatePresence>
            {body && (
                <motion.aside
                    key="panel"
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="body-panel"
                    aria-label={`${body.name} details`}
                >
                    <div className="body-panel__scroll">
                        <div className="body-panel__head">
                            <div>
                                <p className="body-panel__kind">{kind}</p>
                                <h2>{body.name}</h2>
                            </div>
                            <button type="button" className="body-panel__close" onClick={() => focus(null)} aria-label="Back to overview">×</button>
                        </div>

                        <p className="body-panel__description">{body.description}</p>

                        {body.surfaceTexture && (
                            <div className="segmented" role="group" aria-label="Venus view">
                                <button type="button" className={!venusSurface ? 'is-selected' : ''} onClick={() => setVenusSurface(false)}>Cloud tops</button>
                                <button type="button" className={venusSurface ? 'is-selected' : ''} onClick={() => setVenusSurface(true)}>Radar surface</button>
                            </div>
                        )}

                        <LiveDistances body={body} />

                        <dl className="fact-grid">
                            {FACT_LABELS.filter(([key]) => facts[key]).map(([key, label]) => (
                                <div key={key}><dt>{label}</dt><dd>{facts[key]}</dd></div>
                            ))}
                            {body.axialTilt !== undefined && <div><dt>Axial tilt</dt><dd>{body.displayTilt ?? `${body.axialTilt}°`}</dd></div>}
                        </dl>

                        {body.landmarks?.length > 0 && (
                            <section className="places">
                                <h3>Places to visit</h3>
                                <ul>
                                    {body.landmarks.map((landmark) => (
                                        <li key={landmark.id}>
                                            <button type="button" className={landmarkId === landmark.id ? 'is-selected' : ''} onClick={() => visitLandmark(body.key, landmark.id)}>
                                                <span className="places__name">{landmark.name}</span>
                                                <span className="places__coords">{formatCoordinate(landmark.lat, 'N', 'S')} {formatCoordinate(landmark.lon, 'E', 'W')}</span>
                                                <span className="places__note">{landmark.note}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {parent && (
                            <button type="button" className="body-panel__parent" onClick={() => focus(parent.key)}>Back to {parent.name}</button>
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
