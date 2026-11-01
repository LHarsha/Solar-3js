// Back-face shell around the planet: brightest at the limb, fading outward, lit only on the day side.
uniform vec3 uColor;
uniform float uStrength;

varying vec3 vNormalW;
varying vec3 vPositionW;

void main() {
  vec3 normal = normalize(vNormalW);
  vec3 toCamera = normalize(cameraPosition - vPositionW);
  float limb = clamp(-dot(normal, toCamera) / 0.32, 0.0, 1.0);
  float glow = pow(limb, 2.2);
  float day = smoothstep(-0.35, 0.45, dot(normal, normalize(-vPositionW)));
  gl_FragColor = vec4(uColor, glow * day * uStrength);
  #include <colorspace_fragment>
}
