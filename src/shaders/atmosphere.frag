uniform vec3 uAtmosphereColor;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Fresnel-based rim glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = 1.0 - dot(viewDir, vNormal);
  fresnel = pow(fresnel, 3.0);

  // Subtle pulsing
  float pulse = 0.85 + 0.15 * sin(uTime * 1.5);
  fresnel *= pulse;

  vec3 color = uAtmosphereColor;
  float alpha = fresnel * 0.6;

  gl_FragColor = vec4(color, alpha);
}
