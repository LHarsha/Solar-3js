uniform sampler2D uRing;
uniform float uInner;
uniform float uOuter;
uniform vec3 uPlanetCenter;
uniform float uPlanetRadius;

varying vec2 vLocal;
varying vec3 vPositionW;

void main() {
  float radial = (length(vLocal) - uInner) / (uOuter - uInner);
  if (radial < 0.0 || radial > 1.0) discard;
  vec4 texel = texture2D(uRing, vec2(radial, 0.5));

  // The planet's shadow: is the Sun (at the origin) hidden behind the planet from this point?
  vec3 toSun = normalize(-vPositionW);
  vec3 toPlanet = uPlanetCenter - vPositionW;
  float along = dot(toPlanet, toSun);
  float miss = length(toPlanet - toSun * along);
  float shadow = along > 0.0 ? smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.02, miss) : 1.0;

  gl_FragColor = vec4(texel.rgb * (0.12 + 0.95 * shadow), texel.a * 0.95);
  #include <colorspace_fragment>
}
