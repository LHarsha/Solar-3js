import * as THREE from 'three';
import bodyVertex from '../shaders/body.vert';
import bodyFragment from '../shaders/body.frag';

const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
blank.needsUpdate = true;

export function prepareTexture(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
}

/**
 * Surface material lit by the Sun at the origin. Used for planets, moons and Earth's clouds.
 * A little ambient light keeps night sides readable; Earth stays darker so its city lights show.
 */
export function createBodyMaterial({ map, night = null, tint = '#ffffff', ambient = night ? 0.02 : 0.07, clouds = false }) {
    return new THREE.ShaderMaterial({
        vertexShader: bodyVertex,
        fragmentShader: bodyFragment,
        uniforms: {
            uMap: { value: map },
            uNight: { value: night ?? blank },
            uHasNight: { value: night ? 1 : 0 },
            uTint: { value: new THREE.Color(tint) },
            uAlphaFromLuma: { value: clouds ? 1 : 0 },
            uAmbient: { value: ambient },
        },
        transparent: clouds,
        depthWrite: !clouds,
    });
}

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Greyscale surface for moons without a public map: soft albedo variation plus craters.
 * It is tinted to the moon's real colour by the material.
 */
export function createProceduralSurface(seed, craters = 40) {
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const random = seededRandom(seed);

    context.fillStyle = '#a8a8a8';
    context.fillRect(0, 0, width, height);

    // Broad light and dark regions.
    for (let patch = 0; patch < 70; patch += 1) {
        const x = random() * width;
        const y = 20 + random() * (height - 40);
        const radius = 18 + random() * 70;
        const shade = random() > 0.5 ? 255 : 40;
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${shade}, ${shade}, ${shade}, ${0.08 + random() * 0.12})`);
        gradient.addColorStop(1, `rgba(${shade}, ${shade}, ${shade}, 0)`);
        context.fillStyle = gradient;
        for (const offset of [-width, 0, width]) {
            context.beginPath();
            context.arc(x + offset, y, radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    // Fine grain.
    const image = context.getImageData(0, 0, width, height);
    for (let pixel = 0; pixel < image.data.length; pixel += 4) {
        const grain = (random() - 0.5) * 18;
        image.data[pixel] += grain;
        image.data[pixel + 1] += grain;
        image.data[pixel + 2] += grain;
    }
    context.putImageData(image, 0, 0);

    for (let crater = 0; crater < craters; crater += 1) {
        const x = random() * width;
        const y = 12 + random() * (height - 24);
        const radius = 2 + random() ** 2 * 16;
        const gradient = context.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(60, 60, 60, .55)');
        gradient.addColorStop(0.75, 'rgba(110, 110, 110, .25)');
        gradient.addColorStop(1, 'rgba(235, 235, 235, .22)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return prepareTexture(texture);
}

export function hashKey(key) {
    let hash = 2166136261;
    for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return hash >>> 0;
}
