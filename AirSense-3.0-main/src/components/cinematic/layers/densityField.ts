import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   The density field: atmosphere as light, not as a body.

   Three asymmetric haze strata sit behind the particle field and carry
   the stage's tint (cyan while observing, violet for methane, amber→red
   for risk, indigo for the brief). A horizon band gives the final
   frames depth, and one slow scan ribbon crosses the field at a
   deliberately low intensity — the instrument is sweeping, not
   announcing itself.

   Everything here is a soft gradient plane. Nothing is a sphere, a disc
   or a ring, so the composition stays open and environmental.
   ───────────────────────────────────────────────────────────── */

export interface DensityFieldParams {
  /** Haze strata opacity, 0..1. */
  haze: number;
  /** Horizon band opacity, 0..1. */
  horizon: number;
  /** Scan ribbon opacity, 0..1. */
  scan: number;
  /** Lower tint of the atmosphere. */
  low: THREE.Color;
  /** Upper tint of the atmosphere. */
  high: THREE.Color;
  time: number;
}

const PLANE_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HAZE_FRAGMENT = `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform float uIntensity;
  uniform float uStretch;
  uniform float uStrata;
  varying vec2 vUv;

  void main() {
    vec2 centred = (vUv - 0.5) * vec2(1.0, uStretch);
    float body = smoothstep(1.0, 0.0, length(centred));
    float bands = 0.74 + 0.26 * sin(vUv.y * uStrata);
    vec3 tint = mix(uHigh, uLow, clamp(vUv.y, 0.0, 1.0));
    gl_FragColor = vec4(tint, body * body * bands * uIntensity);
  }
`;

const HORIZON_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uSharpness;
  varying vec2 vUv;

  void main() {
    float rise = pow(clamp(vUv.y, 0.0, 1.0), uSharpness);
    gl_FragColor = vec4(uColor, rise * uIntensity);
  }
`;

const SCAN_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    float across = smoothstep(0.0, 0.42, vUv.x) * smoothstep(1.0, 0.58, vUv.x);
    float along = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    gl_FragColor = vec4(uColor, across * along * uIntensity);
  }
`;

interface HazeStratum {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  stretch: number;
  bands: number;
}

/** Three overlapping, asymmetric strata — deliberately not a centred halo. */
const STRATA: HazeStratum[] = [
  { x: 3.1, y: 1.6, z: -7.2, width: 30, height: 15, stretch: 1.7, bands: 7.5 },
  { x: -3.6, y: -1.1, z: -6.4, width: 22, height: 11, stretch: 1.5, bands: 11 },
  { x: 6.4, y: -2.6, z: -7.8, width: 34, height: 12, stretch: 1.9, bands: 5 },
];

function planeMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PLANE_VERTEX,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

export class DensityField {
  readonly object: THREE.Group;

  private readonly plane: THREE.PlaneGeometry;
  private readonly hazeMeshes: Array<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>> = [];
  private readonly hazeMaterials: THREE.ShaderMaterial[] = [];
  private readonly drift: Array<{ x: number; y: number; rate: number; phase: number }> = [];
  private readonly horizonMaterial: THREE.ShaderMaterial;
  private readonly horizon: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly scanMaterial: THREE.ShaderMaterial;
  private readonly scan: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

  constructor() {
    this.plane = new THREE.PlaneGeometry(1, 1);
    this.object = new THREE.Group();

    STRATA.forEach((stratum, index) => {
      const material = planeMaterial(HAZE_FRAGMENT, {
        uLow: { value: new THREE.Color('#38BDF8') },
        uHigh: { value: new THREE.Color('#1E3A8A') },
        uIntensity: { value: 0 },
        uStretch: { value: stratum.stretch },
        uStrata: { value: stratum.bands },
      });
      const mesh = new THREE.Mesh(this.plane, material);
      mesh.position.set(stratum.x, stratum.y, stratum.z);
      mesh.scale.set(stratum.width, stratum.height, 1);
      mesh.frustumCulled = false;

      this.hazeMaterials.push(material);
      this.hazeMeshes.push(mesh);
      this.drift.push({ x: stratum.x, y: stratum.y, rate: 0.05 + index * 0.02, phase: index * 2.1 });
      this.object.add(mesh);
    });

    // A horizon rather than a horizon line: bright at the top edge, gone by the
    // bottom, so the closing frames gain depth without gaining an object.
    this.horizonMaterial = planeMaterial(HORIZON_FRAGMENT, {
      uColor: { value: new THREE.Color('#7DD3FC') },
      uIntensity: { value: 0 },
      uSharpness: { value: 2.4 },
    });
    this.horizon = new THREE.Mesh(this.plane, this.horizonMaterial);
    this.horizon.position.set(0, -12, -8);
    this.horizon.scale.set(70, 20, 1);
    this.horizon.frustumCulled = false;
    this.object.add(this.horizon);

    this.scanMaterial = planeMaterial(SCAN_FRAGMENT, {
      uColor: { value: new THREE.Color('#67E8F9') },
      uIntensity: { value: 0 },
    });
    this.scan = new THREE.Mesh(this.plane, this.scanMaterial);
    this.scan.position.set(0, 0, -3.5);
    this.scan.scale.set(3.2, 26, 1);
    this.scan.frustumCulled = false;
    this.object.add(this.scan);
  }

  update(params: DensityFieldParams): void {
    this.hazeMaterials.forEach((material, index) => {
      material.uniforms.uIntensity.value = params.haze * (index === 1 ? 0.82 : 1);
      (material.uniforms.uLow.value as THREE.Color).copy(params.low);
      (material.uniforms.uHigh.value as THREE.Color).copy(params.high);
    });

    // Very slow drift: the atmosphere moves, but never enough to pull focus.
    this.hazeMeshes.forEach((mesh, index) => {
      const drift = this.drift[index];
      mesh.position.x = drift.x + Math.sin(params.time * drift.rate + drift.phase) * 1.6;
      mesh.position.y = drift.y + Math.sin(params.time * drift.rate * 0.7 + drift.phase) * 0.55;
    });

    this.horizonMaterial.uniforms.uIntensity.value = params.horizon;
    (this.horizonMaterial.uniforms.uColor.value as THREE.Color).copy(params.high);

    this.scanMaterial.uniforms.uIntensity.value = params.scan;
    this.scan.position.x = ((params.time * 0.85) % 40) - 20;
  }

  dispose(): void {
    this.plane.dispose();
    this.hazeMaterials.forEach((material) => material.dispose());
    this.horizonMaterial.dispose();
    this.scanMaterial.dispose();
  }
}
