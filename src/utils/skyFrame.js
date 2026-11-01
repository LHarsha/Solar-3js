import * as THREE from 'three';

const OBLIQUITY = 23.4393 * (Math.PI / 180);

// Rotation from scene axes to galactic coordinates (x toward the galactic centre, z toward the
// north galactic pole). Scene axes are ecliptic with y up (see eclipticToScene in orbitMath.js).
function buildSceneToGalactic() {
    const sceneToEcliptic = new THREE.Matrix3().set(
        1, 0, 0,
        0, 0, -1,
        0, 1, 0,
    );
    const c = Math.cos(OBLIQUITY);
    const s = Math.sin(OBLIQUITY);
    const eclipticToEquatorial = new THREE.Matrix3().set(
        1, 0, 0,
        0, c, -s,
        0, s, c,
    );
    // IAU J2000 equatorial → galactic.
    const equatorialToGalactic = new THREE.Matrix3().set(
        -0.0548755604, -0.8734370902, -0.4838350155,
        0.4941094279, -0.44482963, 0.7469822445,
        -0.867666149, -0.1980763734, 0.4559837762,
    );
    return equatorialToGalactic.multiply(eclipticToEquatorial).multiply(sceneToEcliptic);
}

export const SCENE_TO_GALACTIC = buildSceneToGalactic();
export const GALACTIC_TO_SCENE = SCENE_TO_GALACTIC.clone().transpose();
