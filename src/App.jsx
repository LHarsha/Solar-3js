import { Suspense, lazy, useEffect } from 'react';
import { Loader } from '@react-three/drei';
import SceneBoundary from './components/SceneBoundary';
import Hud from './components/Hud';
import TimeBar from './components/TimeBar';
import BodyPanel from './components/BodyPanel';
import AboutDialog from './components/AboutDialog';
import useViewStore from './store/viewStore';
import { PLANETS } from './utils/solarSystem';
import './index.css';

// The 3D bundle is the heavy part; lazy-loading lets the HUD paint first.
const Scene = lazy(() => import('./components/Scene'));

const isTypingTarget = (target) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export default function App() {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { focus, togglePause, aboutOpen, setAboutOpen } = useViewStore.getState();
      if (event.key === 'Escape') {
        if (aboutOpen) setAboutOpen(false);
        else focus(null);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (event.key === ' ') {
        // Space on a focused button should press that button, not pause.
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        togglePause();
        return;
      }
      if (event.key === '0') { focus('sun'); return; }
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= PLANETS.length) return;
      focus(PLANETS[index].key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <SceneBoundary>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </SceneBoundary>
      <Hud />
      <TimeBar />
      <BodyPanel />
      <AboutDialog />
      <Loader
        containerStyles={{ background: '#000' }}
        barStyles={{ background: '#c9d4e3', height: 2 }}
        dataStyles={{ color: '#8b97a8', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}
        dataInterpolation={(p) => `Loading textures… ${p.toFixed(0)}%`}
      />
    </div>
  );
}
