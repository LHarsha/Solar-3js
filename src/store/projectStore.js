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
        orbitRadius: 4,
        orbitSpeed: 0.3,
        tilt: 0.1,
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
        orbitRadius: 7,
        orbitSpeed: 0.2,
        tilt: -0.15,
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
        orbitRadius: 10,
        orbitSpeed: 0.15,
        tilt: 0.2,
        createdAt: Date.now() - 86400000 * 90,
        modifiedAt: Date.now() - 86400000 * 1,
    },
];

const useProjectStore = create(
    persist(
        (set, get) => ({
            projects: DEFAULT_PROJECTS,
            selectedId: null,
            gestureState: {
                activeGesture: 'NONE',
                isTracking: false,
                handLandmarks: null,
            },
            orbitsPaused: false,

            addProject: (name) => {
                const projects = get().projects;
                const orbitRadius = 3.5 + projects.length * 2.5 + Math.random() * 1.5;
                const newProject = {
                    id: uuidv4(),
                    name,
                    description: '',
                    tags: [],
                    status: 'active',
                    color: Math.floor(Math.random() * 360),
                    orbitRadius,
                    orbitSpeed: 0.1 + Math.random() * 0.3,
                    tilt: (Math.random() - 0.5) * 0.3,
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

            setGestureState: (gestureState) =>
                set((state) => ({
                    gestureState: { ...state.gestureState, ...gestureState },
                })),

            pauseOrbits: (paused) => set({ orbitsPaused: paused }),
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
