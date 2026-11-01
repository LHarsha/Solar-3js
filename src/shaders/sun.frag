// The photosphere: white-yellow at disc centre, darker and redder toward the limb (limb darkening),
// with the texture used only as faint granulation.
uniform sampler2D uMap;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPositionW;

void main() {
  vec3 normal = normalize(vNormalW);
  float mu = clamp(dot(normal, normalize(cameraPosition - vPositionW)), 0.0, 1.0);
  float edge = 1.0 - mu;
  // Quadratic limb-darkening law with coefficients close to the Sun's in visible light.
  float limb = 1.0 - 0.47 * edge - 0.23 * edge * edge;

  float granulation = dot(texture2D(uMap, vUv).rgb, vec3(0.299, 0.587, 0.114));
  float detail = 0.86 + 0.28 * granulation;

  // Not tone-mapped, and kept below 1 so the disc keeps its shading. Linear values of
  // sRGB #fff4d6 at disc centre and #eb7a24 at the limb.
  vec3 core = vec3(1.0, 0.9, 0.67);
  vec3 rim = vec3(0.83, 0.19, 0.018);
  vec3 color = min(mix(rim, core, pow(mu, 0.8)) * limb * detail * 1.08, vec3(1.0));

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
