import { useCallback } from 'react';
import useProjectStore from '../store/projectStore';

/**
 * Thin CRUD wrapper over project store with auto-timestamp
 */
export default function useProjects() {
    const projects = useProjectStore((s) => s.projects);
    const selectedId = useProjectStore((s) => s.selectedId);
    const addProject = useProjectStore((s) => s.addProject);
    const updateProject = useProjectStore((s) => s.updateProject);
    const deleteProject = useProjectStore((s) => s.deleteProject);
    const selectPlanet = useProjectStore((s) => s.selectPlanet);

    const selected = projects.find((p) => p.id === selectedId) || null;

    const createProject = useCallback(
        (name) => {
            return addProject(name || `Project ${projects.length + 1}`);
        },
        [addProject, projects.length]
    );

    return {
        projects,
        selected,
        selectedId,
        createProject,
        updateProject,
        deleteProject,
        selectPlanet,
    };
}
