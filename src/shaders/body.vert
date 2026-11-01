varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPositionW;

void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPositionW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
