import * as THREE from 'three';
import { GEO_HEIGHT, GEO_WIDTH } from './geography';

/* ─────────────────────────────────────────────────────────────
   Contour and lattice structure.

   Two families of faint lines that give the field geographic structure
   without drawing a map:

   • isobars   — gentle closed-ish contours across the observation plane,
                 the topographic register that makes the field read as a
                 measured surface rather than random motion;
   • lattice   — sparse ticks and a wide open grid, the instrument grid
                 the observations are registered against.

   Both are static geometry with a single opacity uniform, so a stage
   change is one write.
   ───────────────────────────────────────────────────────────── */

const LINE_VERTEX = `
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT = `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, uOpacity);
  }
`;

function makeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Gentle horizontal isobars across the map plane, plus short vertical ticks. */
function buildIsobars(levels = 13, steps = 40): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const dim = new THREE.Color('#1E3A5F');
  const bright = new THREE.Color('#38BDF8');

  const width = GEO_WIDTH * 1.55;
  const height = GEO_HEIGHT * 1.5;

  for (let level = 0; level < levels; level += 1) {
    const t = level / (levels - 1);
    const y = (t - 0.5) * height;
    const amplitude = 0.12 + 0.34 * Math.sin(t * Math.PI);
    const tone = level % 3 === 0 ? bright : dim;

    for (let step = 0; step < steps; step += 1) {
      const xA = (step / steps - 0.5) * width;
      const xB = ((step + 1) / steps - 0.5) * width;

      const yA = y + Math.sin(xA * 0.42 + level) * amplitude;
      const yB = y + Math.sin(xB * 0.42 + level) * amplitude;

      positions.push(xA, yA, 0, xB, yB, 0);
      for (let i = 0; i < 2; i += 1) colors.push(tone.r, tone.g, tone.b);

      // Ticks on every other level: the surveying mark, not a grid cell.
      if (level % 2 === 0 && step % 8 === 4) {
        positions.push(xA, yA, 0, xA, yA + 0.075, 0);
        for (let i = 0; i < 2; i += 1) colors.push(tone.r, tone.g, tone.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Wide, sparse lattice spanning the whole field — structure at atmosphere scale. */
function buildLattice(span = 54, halfHeight = 10): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const tone = new THREE.Color('#1E3A5F');

  for (let x = -span / 2; x <= span / 2; x += 4.5) {
    positions.push(x, -halfHeight, -4.5, x, halfHeight, -4.5);
    for (let i = 0; i < 2; i += 1) colors.push(tone.r, tone.g, tone.b);
  }
  for (let y = -halfHeight; y <= halfHeight; y += 3.2) {
    positions.push(-span / 2, y, -4.5, span / 2, y, -4.5);
    for (let i = 0; i < 2; i += 1) colors.push(tone.r, tone.g, tone.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export class ContourGrid {
  /** Isobars — positioned with the observation plane, not the field. */
  readonly object: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
  /** Atmosphere-scale lattice — positioned with the field. */
  readonly lattice: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;

  private readonly contourGeometry: THREE.BufferGeometry;
  private readonly latticeGeometry: THREE.BufferGeometry;
  private readonly contourMaterial: THREE.ShaderMaterial;
  private readonly latticeMaterial: THREE.ShaderMaterial;

  constructor() {
    this.contourGeometry = buildIsobars();
    this.latticeGeometry = buildLattice();
    this.contourMaterial = makeMaterial();
    this.latticeMaterial = makeMaterial();

    this.object = new THREE.LineSegments(this.contourGeometry, this.contourMaterial);
    this.object.frustumCulled = false;
    this.lattice = new THREE.LineSegments(this.latticeGeometry, this.latticeMaterial);
    this.lattice.frustumCulled = false;
  }

  update(contourOpacity: number, latticeOpacity: number): void {
    this.contourMaterial.uniforms.uOpacity.value = contourOpacity;
    this.latticeMaterial.uniforms.uOpacity.value = latticeOpacity;
  }

  dispose(): void {
    this.contourGeometry.dispose();
    this.latticeGeometry.dispose();
    this.contourMaterial.dispose();
    this.latticeMaterial.dispose();
  }
}
