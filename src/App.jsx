import Scene from './components/Scene';
import ProjectPanel from './components/ProjectPanel';
import './index.css';

export default function App() {
  return (
    <div className="relative w-full h-full overflow-hidden dark bg-cosmos-900">
      <Scene />
      <ProjectPanel />
    </div>
  );
}
