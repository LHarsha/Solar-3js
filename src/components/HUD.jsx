import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useProjectStore from '../store/projectStore';
import { generatePlanetColor, hslToHex, statusGlow } from '../utils/colorTheme';

export default function HUD() {
    const projects = useProjectStore((s) => s.projects);
    const selectedId = useProjectStore((s) => s.selectedId);
    const selectPlanet = useProjectStore((s) => s.selectPlanet);
    const addProject = useProjectStore((s) => s.addProject);
    const [newProjectName, setNewProjectName] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const minimapRef = useRef(null);

    const activeCount = projects.filter((p) => p.status === 'active').length;
    const completedCount = projects.filter((p) => p.status === 'complete').length;

    // Draw minimap
    useEffect(() => {
        const canvas = minimapRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = 8;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = 'rgba(5, 5, 16, 0.8)';
        ctx.fillRect(0, 0, w, h);

        // Draw orbits
        projects.forEach((p) => {
            const palette = generatePlanetColor(p.color);
            const hexColor = hslToHex(palette.hsl[0], 30, 40);
            ctx.beginPath();
            ctx.ellipse(cx, cy, p.orbitRadius * scale, p.orbitRadius * scale * 0.85, 0, 0, Math.PI * 2);
            ctx.strokeStyle = hexColor + '40';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });

        // Draw sun
        const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
        sunGrad.addColorStop(0, '#ffcc44');
        sunGrad.addColorStop(1, '#ff880000');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw planets
        projects.forEach((p) => {
            const angle = (Date.now() / 1000) * p.orbitSpeed;
            const px = cx + Math.cos(angle) * p.orbitRadius * scale;
            const py = cy + Math.sin(angle) * p.orbitRadius * scale * 0.85;
            const glow = statusGlow(p.status);

            ctx.beginPath();
            ctx.arc(px, py, p.id === selectedId ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = glow.hex;
            ctx.fill();

            if (p.id === selectedId) {
                ctx.strokeStyle = glow.hex + '80';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    });

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            addProject(newProjectName.trim());
            setNewProjectName('');
            setShowNewForm(false);
        }
    };

    return (
        <div className="fixed inset-0 z-30 pointer-events-none">
            {/* Minimap — top-left */}
            <div className="absolute top-4 left-4 pointer-events-auto glass-panel p-2 glow-border">
                <canvas ref={minimapRef} width={160} height={140} style={{ borderRadius: '10px' }} />
            </div>

            {/* System stats — bottom-left */}
            <div className="absolute bottom-4 left-4 pointer-events-auto glass-panel px-4 py-3 glow-border">
                <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between gap-8">
                        <span>Planets</span>
                        <span className="text-slate-200 font-medium">{projects.length}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span>Active</span>
                        <span style={{ color: '#22d3ee' }}>{activeCount}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span>Complete</span>
                        <span style={{ color: '#4ade80' }}>{completedCount}</span>
                    </div>
                </div>
            </div>

            {/* New Planet button — bottom-center */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                {!showNewForm ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowNewForm(true)}
                        className="btn-cosmic flex items-center gap-2"
                        style={{ padding: '10px 24px' }}
                    >
                        <span style={{ fontSize: '18px' }}>✦</span>
                        New Planet
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-4 glow-border flex gap-2"
                    >
                        <input
                            autoFocus
                            className="input-cosmic"
                            placeholder="Project name..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                        <button onClick={handleCreateProject} className="btn-cosmic whitespace-nowrap">
                            Launch 🚀
                        </button>
                        <button
                            onClick={() => {
                                setShowNewForm(false);
                                setNewProjectName('');
                            }}
                            className="text-slate-400 hover:text-white px-2 transition-colors"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Title — top-center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <h1
                    className="text-lg font-semibold tracking-wide glow-text"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    ✦ Universe Manager
                </h1>
            </div>
        </div>
    );
}
