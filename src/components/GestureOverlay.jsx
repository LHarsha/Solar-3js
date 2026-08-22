import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGestures from '../hooks/useGestures';

const GESTURE_ICONS = {
    OPEN_PALM: '🖐️',
    PINCH: '🤏',
    FIST: '✊',
    POINT: '👆',
    SWIPE_LEFT: '👈',
    SWIPE_RIGHT: '👉',
    NONE: '✋',
};

export default function GestureOverlay() {
    const { activeGesture, handLandmarks, isTracking, enableWebcam, disableWebcam } =
        useGestures();
    const canvasRef = useRef(null);

    // Draw hand skeleton on canvas
    useEffect(() => {
        if (!canvasRef.current || !handLandmarks) return;
        const ctx = canvasRef.current.getContext('2d');
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        ctx.clearRect(0, 0, w, h);

        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17],
        ];

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.7)';
        ctx.lineWidth = 2;
        connections.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(handLandmarks[a].x * w, handLandmarks[a].y * h);
            ctx.lineTo(handLandmarks[b].x * w, handLandmarks[b].y * h);
            ctx.stroke();
        });

        // Draw landmarks
        handLandmarks.forEach((lm) => {
            ctx.beginPath();
            ctx.arc(lm.x * w, lm.y * h, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
            ctx.fill();
        });
    }, [handLandmarks]);

    return (
        <>
            {/* Webcam toggle */}
            <button
                onClick={isTracking ? disableWebcam : enableWebcam}
                className="fixed top-4 right-4 z-50 btn-cosmic flex items-center gap-2"
                style={{ fontSize: '13px' }}
            >
                <span style={{ fontSize: '16px' }}>{isTracking ? '🎥' : '📷'}</span>
                {isTracking ? 'Disable Gestures' : 'Enable Gestures'}
            </button>

            {/* Hand skeleton PiP */}
            {isTracking && (
                <div className="fixed bottom-4 left-4 z-50 glass-panel p-1 glow-border">
                    <canvas
                        ref={canvasRef}
                        width={160}
                        height={120}
                        style={{
                            borderRadius: '12px',
                            background: 'rgba(5, 5, 16, 0.8)',
                        }}
                    />
                </div>
            )}

            {/* Gesture badge */}
            <AnimatePresence>
                {isTracking && activeGesture !== 'NONE' && (
                    <motion.div
                        key={activeGesture}
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="fixed top-16 right-4 z-50 glass-panel px-4 py-2 glow-border"
                        style={{ fontSize: '13px' }}
                    >
                        <span style={{ fontSize: '18px', marginRight: '8px' }}>
                            {GESTURE_ICONS[activeGesture] || '❓'}
                        </span>
                        {activeGesture.replace(/_/g, ' ')}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
