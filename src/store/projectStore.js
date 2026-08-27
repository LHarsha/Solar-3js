import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_PROJECTS = [
    {
        id: uuidv4(),
        name: 'Nebula Frontend',
        description: 'Next-gen UI framework with cosmic design tokens and glassmorphism components.',
        tags: ['react', 'design-system', 'ui'],
        status: 'active',
        color: 210,
        planetKey: 'earth',
        createdAt: Date.now() - 86400000 * 30,
        modifiedAt: Date.now() - 86400000 * 2,
    },
    {
        id: uuidv4(),
        name: 'Quantum API',
        description: 'High-performance GraphQL gateway with edge caching and real-time subscriptions.',
        tags: ['backend', 'graphql', 'api'],
        status: 'paused',
        color: 280,
        planetKey: 'mars',
        createdAt: Date.now() - 86400000 * 60,
        modifiedAt: Date.now() - 86400000 * 5,
    },
    {
        id: uuidv4(),
        name: 'Dark Matter ML',
        description: 'Machine learning pipeline for anomaly detection in production telemetry.',
        tags: ['ml', 'python', 'data'],
        status: 'complete',
        color: 150,
        planetKey: 'jupiter',
        createdAt: Date.now() - 86400000 * 90,
        modifiedAt: Date.now() - 86400000 * 1,
    },
];

const useProjectStore = create(
    persist(
        (set, get) => ({
            projects: DEFAULT_PROJECTS,
            selectedId: null,
            hoveredPlanetKey: null,

            addProject: (name) => {
                const projects = get().projects;
                const newProject = {
                    id: uuidv4(),
                    name,
                    description: '',
                    tags: [],
                    status: 'active',
                    color: Math.floor(Math.random() * 360),
                    planetKey: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'][projects.length % 8],
                    createdAt: Date.now(),
                    modifiedAt: Date.now(),
                };
                set({ projects: [...projects, newProject] });
                return newProject;
            },

            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id ? { ...p, ...updates, modifiedAt: Date.now() } : p
                    ),
                })),

            deleteProject: (id) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    selectedId: state.selectedId === id ? null : state.selectedId,
                })),

            selectPlanet: (id) => set({ selectedId: id }),
            setHoveredPlanet: (planetKey) => set({ hoveredPlanetKey: planetKey }),
            clearHoveredPlanet: (planetKey) =>
                set((state) =>
                    state.hoveredPlanetKey === planetKey ? { hoveredPlanetKey: null } : state
                ),
        }),
        {
            name: 'solar-project-manager',
            partialize: (state) => ({
                projects: state.projects,
            }),
        }
    )
);

export default useProjectStore;
