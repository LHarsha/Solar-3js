import Scene from './components/Scene';
import HUD from './components/HUD';
import GestureOverlay from './components/GestureOverlay';
import ProjectPanel from './components/ProjectPanel';
import './index.css';

export default function App() {
  return (
    <div className="relative w-full h-full overflow-hidden dark bg-cosmos-900">
      <Scene />
      <HUD />
      <GestureOverlay />
      <ProjectPanel />
    </div>
  );
}
