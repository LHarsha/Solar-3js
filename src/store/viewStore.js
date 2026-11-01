import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { simClock } from '../utils/simClock';

export const RATES = [
    { value: 0, label: 'Pause' },
    { value: 1, label: 'Real time' },
    { value: 3600, label: '1 hr/s' },
    { value: 86400, label: '1 day/s' },
    { value: 604800, label: '1 wk/s' },
    { value: 2629800, label: '1 mo/s' },
];

const useViewStore = create(
    persist(
        (set, get) => ({
            focusKey: null,
            landmarkId: null,
            // Bumped on every visit so re-selecting the same place flies there again.
            visitId: 0,
            rate: 3600,
            lastRate: 3600,
            showLabels: true,
            showOrbits: true,
            venusSurface: false,
            aboutOpen: false,
            // Once you have dragged or zoomed, the controls hint fades out for good.
            hintSeen: false,

            focus: (focusKey) => set((state) => ({ focusKey, landmarkId: null, visitId: state.visitId + 1 })),
            visitLandmark: (focusKey, landmarkId) => set((state) => ({
                focusKey,
                landmarkId,
                visitId: state.visitId + 1,
                // Landmarks on Venus are only meaningful on the radar map.
                venusSurface: focusKey === 'venus' ? true : state.venusSurface,
            })),
            releaseLandmark: () => set({ landmarkId: null }),
            setRate: (rate) => set((state) => ({ rate, lastRate: rate === 0 ? state.lastRate : rate })),
            togglePause: () => {
                const { rate, lastRate } = get();
                set({ rate: rate === 0 ? lastRate || 1 : 0 });
            },
            resetToNow: () => { simClock.time = Date.now(); },
            setShowLabels: (showLabels) => set({ showLabels }),
            setShowOrbits: (showOrbits) => set({ showOrbits }),
            setVenusSurface: (venusSurface) => set({ venusSurface }),
            setAboutOpen: (aboutOpen) => set({ aboutOpen }),
            dismissHint: () => { if (!get().hintSeen) set({ hintSeen: true }); },
        }),
        {
            name: 'solar-view-prefs',
            partialize: ({ showLabels, showOrbits, hintSeen }) => ({ showLabels, showOrbits, hintSeen }),
        }
    )
);

export default useViewStore;
