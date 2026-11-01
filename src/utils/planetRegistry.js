// Live scene objects for every body, registered by <Planet>/<Moon> and read by the camera and HUD.
// `anchor` carries the world position (it does not spin); `spin` is the textured, rotating mesh.
// Kept outside React state so following a body never triggers a re-render.
export const bodyObjects = new Map();
