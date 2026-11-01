import { Component } from 'react';

// Keeps the HUD and fact panels usable when WebGL is unavailable or the 3D scene throws.
export default class SceneBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error('3D scene failed:', error);
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div role="alert" className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-slate-400">
                <p>The 3D view couldn&apos;t start on this device (WebGL is required).<br />You can still browse each body's facts from the list above.</p>
            </div>
        );
    }
}
