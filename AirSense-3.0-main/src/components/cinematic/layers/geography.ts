import * as THREE from 'three';
import { INDIA_OUTLINE, projectToUnit } from '../geo/indiaOutline';

/* ─────────────────────────────────────────────────────────────
   Geography, revealed by the data.

   A flat, sub-pixel boundary on the observation plane — no fill, no disc,
   no rim. It is emitted as independent ring segments, so a single
   `uReveal` sweep draws it progressively: the outline assembles out of
   the particle field as the story reaches air quality, and dissolves
   again for the brief. Every third segment is drawn at full weight and
   the rest faintly, which reads as a technical survey line rather than
   a glowing national border.
   ───────────────────────────────────────────────────────────── */

/** Width and height of the observation plane the boundary is projected onto. */
export const GEO_WIDTH = 8.6;
export const GEO_HEIGHT = 8.6;

/** lat/lng → world space on the flat observation plane (north is up). */
export function geoPoint(lat: number, lng: number): [number, number] {
  const { x, y } = projectToUnit(lat, lng);
  return [(x - 0.5) * GEO_WIDTH, (0.5 - y) * GEO_HEIGHT];
}

const VERTEX = `
  attribute float aProgress;  // 0 at the first ring vertex → 1 at the last
  attribute float aWeight;    // per-segment drawing weight

  uniform float uReveal;      // 0 hidden → 1 fully drawn
  uniform float uEdge;        // width of the forming edge

  varying float vAmount;

  void main() {
    vAmount = smoothstep(aProgress - uEdge, aProgress, uReveal) * aWeight;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAmount;

  void main() {
    gl_FragColor = vec4(uColor, vAmount * uOpacity);
  }
`;

export class Geography {
  readonly object: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;

  constructor() {
    const ring = INDIA_OUTLINE;
    const points = ring.map(({ lat, lng }) => geoPoint(lat, lng));

    const segments = ring.length;
    const positions = new Float32Array(segments * 2 * 3);
    const progress = new Float32Array(segments * 2);
    const weight = new Float32Array(segments * 2);

    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      const from = points[i];
      const to = points[next];
      // Full weight on every third segment: partially formed, not a solid border.
      const weightValue = i % 3 === 0 ? 1 : 0.34;

      for (let edge = 0; edge < 2; edge += 1) {
        const cursor = (i * 2 + edge) * 3;
        const source = edge === 0 ? from : to;
        positions[cursor] = source[0];
        positions[cursor + 1] = source[1];
        positions[cursor + 2] = 0;

        const index = i * 2 + edge;
        progress[index] = (i + edge) / segments;
        weight[index] = weightValue;
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));
    this.geometry.setAttribute('aWeight', new THREE.BufferAttribute(weight, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uReveal: { value: 0 },
        uEdge: { value: 0.22 },
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Color('#7DD3FC') },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.LineSegments(this.geometry, this.material);
    this.object.frustumCulled = false;
  }

  update(reveal: number, opacity: number, color: THREE.Color): void {
    const uniforms = this.material.uniforms;
    uniforms.uReveal.value = reveal;
    uniforms.uOpacity.value = opacity;
    (uniforms.uColor.value as THREE.Color).copy(color);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
