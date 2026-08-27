import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useProjectStore from '../store/projectStore';
import { statusGlow } from '../utils/colorTheme';
import { PLANETS } from '../utils/solarSystem';

const STATUS_OPTIONS = ['active', 'paused', 'complete'];

export default function ProjectPanel() {
    const selectedId = useProjectStore((s) => s.selectedId);
    const projects = useProjectStore((s) => s.projects);
    const updateProject = useProjectStore((s) => s.updateProject);
    const deleteProject = useProjectStore((s) => s.deleteProject);
    const selectPlanet = useProjectStore((s) => s.selectPlanet);

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const project = projects.find((p) => p.id === selectedId);

    const handleClose = useCallback(() => {
        selectPlanet(null);
        setShowConfirmDelete(false);
    }, [selectPlanet]);

    const handleDelete = useCallback(() => {
        if (project) {
            deleteProject(project.id);
        }
        setShowConfirmDelete(false);
    }, [project, deleteProject]);

    const glowColor = project ? statusGlow(project.status) : statusGlow('active');

    return (
        <AnimatePresence>
            {project && (
                <motion.aside
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 h-full z-40 glass-panel"
                    style={{
                        width: '360px',
                        borderLeft: `1px solid ${glowColor.hex}30`,
                        boxShadow: `0 0 30px ${glowColor.hex}15`,
                    }}
                >
                    <div className="p-6 h-full flex flex-col overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div
                                className="w-3 h-3 rounded-full animate-pulse-glow"
                                style={{ background: glowColor.hex }}
                            />
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Status glow ring */}
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-4"
                            style={{
                                background: `radial-gradient(circle, ${glowColor.hex}30, transparent 70%)`,
                                border: `2px solid ${glowColor.hex}60`,
                                boxShadow: `0 0 20px ${glowColor.hex}30`,
                            }}
                        />

                        {/* Editable title */}
                        <input
                            className="input-cosmic text-center text-lg font-semibold mb-2"
                            value={project.name}
                            onChange={(e) => updateProject(project.id, { name: e.target.value })}
                        />

                        {/* Description */}
                        <textarea
                            className="input-cosmic resize-none mb-4"
                            rows={3}
                            placeholder="Project description..."
                            value={project.description}
                            onChange={(e) =>
                                updateProject(project.id, { description: e.target.value })
                            }
                        />

                        <div className="mb-4">
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Planet</label>
                            <select
                                className="input-cosmic"
                                value={project.planetKey || PLANETS[0].key}
                                onChange={(event) => updateProject(project.id, { planetKey: event.target.value })}
                            >
                                {PLANETS.map((planet) => <option key={planet.key} value={planet.key}>{planet.name}</option>)}
                            </select>
                        </div>

                        {/* Status toggle */}
                        <div className="mb-4">
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Status
                            </label>
                            <div className="flex gap-2">
                                {STATUS_OPTIONS.map((status) => {
                                    const sg = statusGlow(status);
                                    const isActive = project.status === status;
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => updateProject(project.id, { status })}
                                            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                                            style={{
                                                background: isActive ? `${sg.hex}20` : 'rgba(30, 30, 60, 0.4)',
                                                border: `1px solid ${isActive ? sg.hex + '60' : 'rgba(148,163,184,0.1)'}`,
                                                color: isActive ? sg.hex : '#94a3b8',
                                                boxShadow: isActive ? `0 0 10px ${sg.hex}20` : 'none',
                                            }}
                                        >
                                            {status}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mb-4">
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Tags
                            </label>
                            <input
                                className="input-cosmic"
                                placeholder="react, ui, design (comma separated)"
                                value={(project.tags || []).join(', ')}
                                onChange={(e) =>
                                    updateProject(project.id, {
                                        tags: e.target.value
                                            .split(',')
                                            .map((t) => t.trim())
                                            .filter(Boolean),
                                    })
                                }
                            />
                        </div>

                        {/* Dates */}
                        <div className="text-xs text-slate-500 mb-6 space-y-1">
                            <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                            <div>Modified: {new Date(project.modifiedAt).toLocaleDateString()}</div>
                        </div>

                        {/* Tags display */}
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {project.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2.5 py-1 rounded-full"
                                        style={{
                                            background: 'rgba(96, 165, 250, 0.1)',
                                            border: '1px solid rgba(96, 165, 250, 0.2)',
                                            color: '#93c5fd',
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Actions */}
                        <div className="space-y-3">
                            <button className="btn-cosmic w-full text-center" style={{ padding: '12px' }}>
                                🚀 Open Project
                            </button>
                            {!showConfirmDelete ? (
                                <button
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="w-full text-center py-3 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all border border-transparent hover:border-red-800/30"
                                >
                                    Delete Planet
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-3 rounded-xl border border-red-800/30 bg-red-900/10"
                                >
                                    <p className="text-xs text-red-300 mb-3 text-center">
                                        This planet will be destroyed. Are you sure?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowConfirmDelete(false)}
                                            className="flex-1 py-2 rounded-lg text-xs text-slate-400 border border-slate-700 hover:border-slate-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 py-2 rounded-lg text-xs text-red-300 bg-red-900/30 border border-red-800/30 hover:bg-red-900/50 transition-colors"
                                        >
                                            Destroy
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
