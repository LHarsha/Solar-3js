import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyGesture, isConfident } from '../utils/gestureClassifier';
import useProjectStore from '../store/projectStore';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js';
const CAMERA_UTILS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js';

const COOLDOWN_MS = 300;

/**
 * Hook for MediaPipe Hands gesture tracking
 */
export default function useGestures() {
    const [isTracking, setIsTracking] = useState(false);
    const [activeGesture, setActiveGesture] = useState('NONE');
    const [handLandmarks, setHandLandmarks] = useState(null);
    const videoRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);
    const lastActionRef = useRef(0);
    const setGestureState = useProjectStore((s) => s.setGestureState);

    const loadScript = (src) =>
        new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

    const enableWebcam = useCallback(async () => {
        try {
            await loadScript(MEDIAPIPE_CDN);
            await loadScript(CAMERA_UTILS_CDN);

            const video = document.createElement('video');
            video.setAttribute('playsinline', '');
            video.style.display = 'none';
            document.body.appendChild(video);
            videoRef.current = video;

            const Hands = window.Hands;
            const hands = new Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5,
            });

            hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
                    setHandLandmarks(landmarks);

                    const classification = classifyGesture(landmarks);
                    if (isConfident(classification)) {
                        const now = Date.now();
                        if (now - lastActionRef.current > COOLDOWN_MS) {
                            lastActionRef.current = now;
                            setActiveGesture(classification.gesture);
                            setGestureState({
                                activeGesture: classification.gesture,
                                isTracking: true,
                                handLandmarks: landmarks,
                            });
                        }
                    }
                }
            });

            handsRef.current = hands;

            const Camera = window.Camera;
            const camera = new Camera(video, {
                onFrame: async () => {
                    await hands.send({ image: video });
                },
                width: 640,
                height: 480,
            });
            camera.start();
            cameraRef.current = camera;
            setIsTracking(true);
            setGestureState({ isTracking: true });
        } catch (err) {
            console.warn('Gesture Control unavailable:', err);
            setIsTracking(false);
            setGestureState({ isTracking: false });
        }
    }, [setGestureState]);

    const disableWebcam = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject?.getTracks().forEach((t) => t.stop());
            videoRef.current.remove();
            videoRef.current = null;
        }
        setIsTracking(false);
        setActiveGesture('NONE');
        setHandLandmarks(null);
        setGestureState({ isTracking: false, activeGesture: 'NONE', handLandmarks: null });
    }, [setGestureState]);

    useEffect(() => {
        return () => disableWebcam();
    }, [disableWebcam]);

    return { activeGesture, handLandmarks, isTracking, enableWebcam, disableWebcam };
}
