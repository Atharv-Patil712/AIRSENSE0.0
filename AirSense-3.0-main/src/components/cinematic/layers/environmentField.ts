import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   The environmental particle field.

   Thousands of low-opacity points that read as an atmosphere being
   observed rather than a starfield: every point belongs to one of three
   depth bands, and each band carries its own size, opacity and drift
   rate, so the field has real parallax depth without a single sphere.

   Advection, wrapping, turbulence and collimation all happen in the
   vertex shader, so a stage transition costs a handful of uniform
   writes instead of a CPU pass over the buffer.
   ───────────────────────────────────────────────────────────── */

export interface EnvironmentFieldParams {
  /** Near-band opacity, 0..1. */
  opacity: number;
  /** Near-band point size, in world units. */
  size: number;
  /** World units per second along the flow axis. */
  speed: number;
  /** 0 = open haze, 1 = tightly collimated plume. */
  collimation: number;
  /** Lateral wobble amplitude, 0..1. */
  turbulence: number;
  /** Elapsed seconds. */
  time: number;
  /** Semantic accent (violet methane, amber risk) applied to marked points. */
  accent: THREE.Color;
}

const VERTEX = `
  attribute vec3 aColor;
  attribute float aRate;
  attribute float aBand;    // 0 far · 1 near
  attribute float aScale;
  attribute float aSeed;
  attribute float aAccent;  // 1 on the sparse points that carry a semantic hue

  uniform float uTime;
  uniform float uSpeed;
  uniform float uSize;
  uniform float uOpacity;
  uniform float uCollimation;
  uniform float uTurbulence;
  uniform float uSpan;
  uniform float uSizeScale;
  uniform vec3 uAccent;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    // Wrap-advect along the flow axis: the field can never empty and never pops.
    float travel = uTime * uSpeed * aRate;
    float x = mod(position.x + travel + uSpan * 0.5, uSpan) - uSpan * 0.5;
    float downwind = (x + uSpan * 0.5) / uSpan;

    // Cross-wind spread. Collimation pulls the lanes onto the transport axis and
    // lets the corridor widen downwind — the shape that reads as a plume.
    float spread = mix(1.0, 0.16 + downwind * 0.92, uCollimation);

    float wobble =
      sin(uTime * 0.21 + aSeed * 6.2832 + position.x * 0.19) * 0.62 +
      sin(uTime * 0.47 + aSeed * 12.566 + position.y * 0.31) * 0.38;

    vec3 transformed = vec3(
      x,
      position.y * spread + wobble * uTurbulence * (0.6 + aBand * 0.7),
      position.z + sin(uTime * 0.16 + aSeed * 9.425) * 0.3 * (1.0 - uCollimation)
    );

    vec4 view = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * view;

    // Depth is carried by size and opacity — never by a fog colour.
    float near = mix(0.34, 1.0, aBand);
    gl_PointSize = min(
      uSize * aScale * (0.55 + near * 0.65) * (uSizeScale / max(0.001, -view.z)),
      18.0
    );

    vColor = mix(aColor, uAccent, aAccent);
    vOpacity = uOpacity * near;
  }
`;

const FRAGMENT = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec2 offset = gl_PointCoord - 0.5;
    float radius = dot(offset, offset);
    if (radius > 0.25) discard;
    float falloff = smoothstep(0.25, 0.0, radius);
    gl_FragColor = vec4(vColor, falloff * falloff * vOpacity);
  }
`;

/** Stable pseudo-random in 0..1 — identical on every mount, unlike Math.random(). */
function hash(index: number, salt: number): number {
  return ((index * 2654435761 + salt * 40503) % 1048573) / 1048573;
}

export class EnvironmentField {
  readonly object: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;

  constructor(count: number, span = 54, halfHeight = 10) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rate = new Float32Array(count);
    const band = new Float32Array(count);
    const scale = new Float32Array(count);
    const seed = new Float32Array(count);
    const accent = new Float32Array(count);

    const deep = new THREE.Color('#1D4ED8');
    const sky = new THREE.Color('#38BDF8');
    const ice = new THREE.Color('#A5F3FC');
    const mixed = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const offset = i * 3;
      const a = hash(i, 1);
      const b = hash(i, 2);
      const c = hash(i, 3);
      const d = hash(i, 4);

      // Three depth bands in z; the band index drives size, opacity and rate.
      const depth = -6 + c * 9;
      const bandValue = Math.min(2, Math.floor(depth / 3 + 2)) / 2;

      positions[offset] = a * span - span / 2;
      // Strata rather than a uniform box: the soft vertical density profile keeps
      // the field atmospheric instead of reading as scattered stars.
      positions[offset + 1] =
        (b * 2 - 1) * halfHeight * (0.62 + 0.38 * Math.sin(b * Math.PI));
      positions[offset + 2] = depth;

      band[i] = bandValue;
      scale[i] = 0.55 + bandValue * 0.85 + d * 0.25;
      rate[i] = 0.5 + d * 1.1;
      seed[i] = a * 0.5 + c * 0.5;
      // ~3% of points carry the stage's semantic hue — the environmental pulses.
      accent[i] = d > 0.97 ? 1 : 0;

      mixed.copy(deep).lerp(sky, Math.min(1, bandValue + 0.15));
      if (bandValue > 0.85) mixed.lerp(ice, (bandValue - 0.85) * 3.2);
      colors[offset] = mixed.r;
      colors[offset + 1] = mixed.g;
      colors[offset + 2] = mixed.b;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aRate', new THREE.BufferAttribute(rate, 1));
    this.geometry.setAttribute('aBand', new THREE.BufferAttribute(band, 1));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.geometry.setAttribute('aAccent', new THREE.BufferAttribute(accent, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.35 },
        uSize: { value: 0.05 },
        uOpacity: { value: 0.3 },
        uCollimation: { value: 0 },
        uTurbulence: { value: 0.6 },
        uSpan: { value: span },
        uSizeScale: { value: 700 },
        uAccent: { value: new THREE.Color('#C084FC') },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.Points(this.geometry, this.material);
    this.object.frustumCulled = false;
  }

  /** Rotate the transport axis onto the wind bearing (compass degrees, 0 = north). */
  setBearing(bearing: number): void {
    this.object.rotation.z = ((90 - bearing) * Math.PI) / 180;
  }

  /** Pixels per world unit at one unit of depth — keeps point size device-correct. */
  setSizeScale(sizeScale: number): void {
    this.material.uniforms.uSizeScale.value = sizeScale;
  }

  update(params: EnvironmentFieldParams): void {
    const uniforms = this.material.uniforms;
    uniforms.uTime.value = params.time;
    uniforms.uOpacity.value = params.opacity;
    uniforms.uSize.value = params.size;
    uniforms.uSpeed.value = params.speed;
    uniforms.uCollimation.value = params.collimation;
    uniforms.uTurbulence.value = params.turbulence;
    (uniforms.uAccent.value as THREE.Color).copy(params.accent);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
