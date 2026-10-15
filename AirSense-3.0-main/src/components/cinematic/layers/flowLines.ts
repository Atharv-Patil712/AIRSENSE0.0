import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   Wind streamlines.

   Long, faint, gently curved tracks through the field. They never move:
   a brightness band travels along each one in the vertex shader, which
   is what makes the air look like it is flowing. No neon trails, no
   per-frame CPU work, and no visible pop when a band loops — the
   track simply carries the next pulse.
   ───────────────────────────────────────────────────────────── */

export interface FlowLineParams {
  opacity: number;
  /** Band travel speed, cycles per second. */
  speed: number;
  /** 0 = open field, 1 = collimated corridor. */
  collimation: number;
  /** Lateral wobble amplitude, 0..1. */
  turbulence: number;
  time: number;
}

const VERTEX = `
  attribute vec3 aColor;
  attribute float aParam;     // 0 → 1 along the streamline
  attribute float aLine;      // stable per-line index
  attribute float aRate;      // per-line travel rate

  uniform float uTime;
  uniform float uSpeed;
  uniform float uCollimation;
  uniform float uTurbulence;
  uniform float uSpan;

  varying vec3 vColor;
  varying float vAmount;

  void main() {
    // Collimation closes the lanes onto the transport axis and lets the
    // corridor open downwind, exactly as the particle field does.
    float downwind = (position.x + uSpan * 0.5) / uSpan;
    float width = mix(1.0, 0.18 + downwind * 0.85, uCollimation);

    float sway = sin(uTime * 0.19 + aLine * 2.1 + position.x * 0.24) * uTurbulence * 0.4;

    vec3 transformed = vec3(position.x, position.y * width + sway, position.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);

    // A pulse travels along the line; the circular distance keeps it seamless.
    float travel = uTime * uSpeed * aRate + aLine * 0.37;
    float gap = abs(fract(aParam - travel) - 0.5);
    float band = pow(max(0.0, 1.0 - gap * 3.4), 2.6);

    vAmount = 0.09 + band * 0.91;
    vColor = aColor;
  }
`;

const FRAGMENT = `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAmount;

  void main() {
    gl_FragColor = vec4(vColor, vAmount * uOpacity);
  }
`;

export class FlowLines {
  readonly object: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;

  constructor(lines = 54, segments = 26, span = 54, halfHeight = 10) {

    const vertexCount = lines * segments * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const params = new Float32Array(vertexCount);
    const lineIds = new Float32Array(vertexCount);
    const rates = new Float32Array(vertexCount);

    const cool = new THREE.Color('#0EA5E9');
    const pale = new THREE.Color('#7DD3FC');
    const mixed = new THREE.Color();

    let cursor = 0;
    for (let line = 0; line < lines; line += 1) {
      const a = ((line * 2654435761) % 1021) / 1021;
      const b = ((line * 40503) % 997) / 997;
      const c = ((line * 7919) % 991) / 991;

      const lane = (b * 2 - 1) * halfHeight;
      const amplitude = 0.25 + c * 0.85;
      const frequency = 0.16 + a * 0.24;
      const phase = a * 6.2832;
      const depth = -4.2 + c * 5.2;
      const rate = 0.45 + c * 0.8;

      mixed.copy(cool).lerp(pale, b * 0.85 + 0.1);

      for (let segment = 0; segment < segments; segment += 1) {
        for (let edge = 0; edge < 2; edge += 1) {
          const t = (segment + edge) / segments;
          const x = t * span - span / 2;
          const y = lane + Math.sin(x * frequency + phase) * amplitude * 1.6;

          const offset = cursor * 3;
          positions[offset] = x;
          positions[offset + 1] = y;
          positions[offset + 2] = depth;
          colors[offset] = mixed.r;
          colors[offset + 1] = mixed.g;
          colors[offset + 2] = mixed.b;
          params[cursor] = t;
          lineIds[cursor] = a;
          rates[cursor] = rate;
          cursor += 1;
        }
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aParam', new THREE.BufferAttribute(params, 1));
    this.geometry.setAttribute('aLine', new THREE.BufferAttribute(lineIds, 1));
    this.geometry.setAttribute('aRate', new THREE.BufferAttribute(rates, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.06 },
        uOpacity: { value: 0.16 },
        uCollimation: { value: 0 },
        uTurbulence: { value: 0.5 },
        uSpan: { value: span },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.LineSegments(this.geometry, this.material);
    this.object.frustumCulled = false;
  }

  setBearing(bearing: number): void {
    this.object.rotation.z = ((90 - bearing) * Math.PI) / 180;
  }

  update(params: FlowLineParams): void {
    const u = this.material.uniforms;
    u.uTime.value = params.time;
    u.uOpacity.value = params.opacity;
    u.uSpeed.value = params.speed;
    u.uCollimation.value = params.collimation;
    u.uTurbulence.value = params.turbulence;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
