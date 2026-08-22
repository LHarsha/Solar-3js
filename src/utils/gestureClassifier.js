/**
 * Gesture classifier for MediaPipe hand landmarks (21-point model)
 *
 * Gestures:
 *   OPEN_PALM | PINCH | FIST | POINT | SWIPE_LEFT | SWIPE_RIGHT |
 *   TWO_HANDS_OPEN | PINCH_DRAG | NONE
 */

const CONFIDENCE_THRESHOLD = 0.82;

// Finger tip and pip landmark indices
const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function fingerExtended(landmarks, tipIdx, pipIdx) {
    return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

function getExtendedFingers(landmarks) {
    const extended = [];
    // Thumb: compare x distance from wrist
    const thumbExtended = Math.abs(landmarks[4].x - landmarks[0].x) >
        Math.abs(landmarks[3].x - landmarks[0].x);
    if (thumbExtended) extended.push(0);

    for (let i = 1; i < 5; i++) {
        if (fingerExtended(landmarks, FINGER_TIPS[i], FINGER_PIPS[i])) {
            extended.push(i);
        }
    }
    return extended;
}

let prevWristX = null;
let swipeFrames = 0;

/**
 * Classify a single hand's gesture from 21 landmarks
 * @param {Array<{x: number, y: number, z?: number}>} landmarks
 * @returns {{ gesture: string, confidence: number }}
 */
export function classifyGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) {
        return { gesture: 'NONE', confidence: 0 };
    }

    const extended = getExtendedFingers(landmarks);
    const pinchDist = distance(landmarks[4], landmarks[8]);

    // Swipe detection
    const wristX = landmarks[0].x;
    if (prevWristX !== null) {
        const dx = wristX - prevWristX;
        if (Math.abs(dx) > 0.06) {
            swipeFrames++;
            if (swipeFrames >= 3) {
                prevWristX = wristX;
                swipeFrames = 0;
                return {
                    gesture: dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT',
                    confidence: 0.9,
                };
            }
        } else {
            swipeFrames = 0;
        }
    }
    prevWristX = wristX;

    // Pinch: thumb tip close to index tip
    if (pinchDist < 0.06) {
        return { gesture: 'PINCH', confidence: Math.min(1, 1 - pinchDist / 0.06 + 0.5) };
    }

    // Fist: no fingers extended
    if (extended.length === 0) {
        return { gesture: 'FIST', confidence: 0.92 };
    }

    // Point: only index extended
    if (extended.length === 1 && extended[0] === 1) {
        return { gesture: 'POINT', confidence: 0.95 };
    }

    // Open palm: all five fingers extended
    if (extended.length >= 4) {
        return { gesture: 'OPEN_PALM', confidence: 0.9 + extended.length * 0.02 };
    }

    return { gesture: 'NONE', confidence: 0 };
}

/**
 * Check if confidence meets minimum threshold
 */
export function isConfident(result) {
    return result.confidence >= CONFIDENCE_THRESHOLD;
}

export default classifyGesture;
