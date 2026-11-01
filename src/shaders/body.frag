// Sunlit surface: the Sun sits at the scene origin, so the light direction is just -position.
uniform sampler2D uMap;
uniform sampler2D uNight;
uniform vec3 uTint;
uniform float uHasNight;
uniform float uAlphaFromLuma;
uniform float uAmbient;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPositionW;

void main() {
  vec3 normal = normalize(vNormalW);
  vec3 toSun = normalize(-vPositionW);
  float sunAngle = dot(normal, toSun);
  float light = max(sunAngle, 0.0);

  vec4 texel = texture2D(uMap, vUv);
  vec3 albedo = texel.rgb * uTint;
  vec3 color = albedo * (light * 1.15 + uAmbient);

  if (uHasNight > 0.5) {
    // City lights fade in just past the terminator.
    float night = 1.0 - smoothstep(-0.12, 0.08, sunAngle);
    color += texture2D(uNight, vUv).rgb * night * 1.4;
  }

  float alpha = 1.0;
  if (uAlphaFromLuma > 0.5) {
    alpha = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
    color = vec3(1.0) * (light * 1.1 + uAmbient * 0.3);
  }

  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
