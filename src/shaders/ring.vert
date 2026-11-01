varying vec2 vLocal;
varying vec3 vPositionW;

void main() {
  vLocal = position.xy;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPositionW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
