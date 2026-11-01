// Sunlit surface: the Sun sits at the scene origin, so the light direction is just -position.
uniform sampler2D uMap;
uniform sampler2D uNight;
uniform vec3 uTint;
uniform float uHasNight;
uniform float uAlphaFromLuma;
uniform float uAmbient;
// How far light wraps past the terminator (scattering in a thick atmosphere).
uniform float uWrap;
// Darkening toward the limb, strong for gas giants, none for airless bodies.
uniform float uLimb;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPositionW;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec3 normal = normalize(vNormalW);
  vec3 toSun = normalize(-vPositionW);
  vec3 toCamera = normalize(cameraPosition - vPositionW);
  float sunAngle = dot(normal, toSun);
  float light = clamp((sunAngle + uWrap) / (1.0 + uWrap), 0.0, 1.0);
  // A slight reddening along the terminator where sunlight crosses more atmosphere.
  vec3 sunColor = mix(vec3(1.0, 0.82, 0.66), vec3(1.0), smoothstep(0.0, 0.35, sunAngle + uWrap * 0.5));

  float limb = mix(1.0, pow(max(dot(normal, toCamera), 0.0), 0.35), uLimb);

  vec4 texel = texture2D(uMap, vUv);
  vec3 albedo = texel.rgb * uTint;
  vec3 color = albedo * (sunColor * light * 1.2 * limb + uAmbient);

  if (uHasNight > 0.5) {
    // The night map has a dim blue globe under the lights; keep only the lights themselves.
    vec3 lights = texture2D(uNight, vUv).rgb;
    lights *= smoothstep(0.02, 0.2, luma(lights));
    float night = 1.0 - smoothstep(-0.15, 0.05, sunAngle);
    color += lights * vec3(1.0, 0.83, 0.58) * night * 1.5;
  }

  float alpha = 1.0;
  if (uAlphaFromLuma > 0.5) {
    alpha = smoothstep(0.015, 0.55, luma(texel.rgb)) * 0.95;
    color = sunColor * (light * 1.15 * limb + uAmbient * 0.3);
  }

  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
