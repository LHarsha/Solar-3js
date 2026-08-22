import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getOrbitPoints } from '../utils/orbitMath';
import { generatePlanetColor, hslToHex } from '../utils/colorTheme';

export default function OrbitalPath({ orbitRadius, tilt, color }) {
    const points = useMemo(
        () => getOrbitPoints(orbitRadius, tilt, 128),
        [orbitRadius, tilt]
    );

    const lineColor = useMemo(() => {
        const palette = generatePlanetColor(color);
        return hslToHex(palette.hsl[0], 40, 50);
    }, [color]);

    return (
        <Line
            points={points}
            color={lineColor}
            lineWidth={0.5}
            transparent
            opacity={0.2}
            depthWrite={false}
        />
    );
}
