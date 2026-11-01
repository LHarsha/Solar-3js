import { Html } from '@react-three/drei';
import useViewStore from '../store/viewStore';

export default function BodyLabel({ bodyKey, name, radius, visible = true }) {
    const showLabels = useViewStore((s) => s.showLabels);
    const focusKey = useViewStore((s) => s.focusKey);
    const focus = useViewStore((s) => s.focus);
    if (!showLabels || !visible) return null;
    const isFocused = focusKey === bodyKey;

    return (
        <Html position={[0, -radius * 1.15, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <button
                type="button"
                className={`body-label ${isFocused ? 'is-focused' : ''}`}
                onClick={() => focus(bodyKey)}
                tabIndex={-1}
            >
                {name}
            </button>
        </Html>
    );
}
