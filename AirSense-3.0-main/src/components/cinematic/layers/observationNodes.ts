import * as THREE from 'three';
import { SEVERITY_COLORS, FALLBACK_SEVERITY_COLOR } from '../palette';
import type { CinematicSite } from '../types';
import { geoPoint } from './geography';

/* ─────────────────────────────────────────────────────────────
   Environmental observation points.

   Sparse instruments, not a starfield: each mark breathes, drifts in and
   out of the record on its own slow cycle, and neighbours inside a
   threshold radius are joined by faint traces that only appear once the
   story starts connecting observations. Colour is semantic — cyan for a
   plain observation, the severity ramp for a polluted one, violet while
   the methane field owns the stage.
   ───────────────────────────────────────────────────────────── */

const MAX_NODES = 48;
const MAX_LINKS = 64;
/** World-space radius inside which two observations are treated as adjacent. */
const LINK_RADIUS = 2.1;

export interface ObservationNodeParams {
  opacity: number;
  size: number;
  time: number;
  /** 0 = severity hues, 1 = methane violet. */
  methaneMix: number;
  /** Opacity of the neighbour traces, 0..1. */
  links: number;
}

const NODE_VERTEX = `
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uSize;
  uniform float uSizeScale;
  uniform float uMethaneMix;
  uniform vec3 uMethaneColor;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;

    // A soft breath — present and alive, never frantic.
    float pulse = 0.72 + 0.28 * sin(uTime * 1.15 + aPhase * 6.2832);

    // Slow appear/disappear cycle: observations drift in and out of the record.
    float cycle = fract(aPhase * 1.7 + uTime * 0.021);
    float presence = smoothstep(0.0, 0.16, cycle) * (1.0 - smoothstep(0.84, 1.0, cycle));

    gl_PointSize = min(uSize * aSize * pulse * (uSizeScale / max(0.001, -view.z)), 26.0);
    vColor = mix(aColor, uMethaneColor, uMethaneMix);
    vOpacity = uOpacity * pulse * (0.4 + presence * 0.6);
  }
`;

const NODE_FRAGMENT = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec2 offset = gl_PointCoord - 0.5;
    float radius = length(offset) * 2.0;
    if (radius > 1.0) discard;

    // A tight core inside a soft halo reads as an instrument mark.
    float core = smoothstep(0.34, 0.0, radius);
    float halo = smoothstep(1.0, 0.0, radius);
    gl_FragColor = vec4(vColor, (core * 0.85 + halo * halo * 0.35) * vOpacity);
  }
`;

const LINK_VERTEX = `
  attribute vec3 aColor;
  attribute float aParam;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAmount;
  void main() {
    // A slow current runs along each trace, so the connections read as transport.
    float wave = 0.45 + 0.55 * pow(max(0.0, sin(aParam * 3.1416)), 1.5);
    float shimmer = 0.7 + 0.3 * sin(uTime * 0.7 + aParam * 9.0);
    vAmount = wave * shimmer;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINK_FRAGMENT = `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAmount;
  void main() {
    gl_FragColor = vec4(vColor, vAmount * uOpacity);
  }
`;

/** Cyan observation mark — the default register for a healthy instrument. */
const OBSERVATION_COLOR = '#67E8F9';

function hash(index: number, salt: number): number {
  return ((index * 2654435761 + salt * 40503) % 1048573) / 1048573;
}

export class ObservationNodes {
  /** Nodes plus the neighbour traces, moved together with the observation plane. */
  readonly object: THREE.Group;

  private readonly nodeGeometry: THREE.BufferGeometry;
  private readonly nodeMaterial: THREE.ShaderMaterial;
  private readonly nodePositions: Float32Array;
  private readonly linkGeometry: THREE.BufferGeometry;
  private readonly linkMaterial: THREE.ShaderMaterial;
  private readonly linkPositions: Float32Array;
  private readonly linkColors: Float32Array;
  private readonly linkParams: Float32Array;

  constructor() {
    this.nodePositions = new Float32Array(MAX_NODES * 3);
    const nodeColors = new Float32Array(MAX_NODES * 3);
    const nodePhase = new Float32Array(MAX_NODES);
    const nodeSize = new Float32Array(MAX_NODES);

    this.nodeGeometry = new THREE.BufferGeometry();
    this.nodeGeometry.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    this.nodeGeometry.setAttribute('aColor', new THREE.BufferAttribute(nodeColors, 3));
    this.nodeGeometry.setAttribute('aPhase', new THREE.BufferAttribute(nodePhase, 1));
    this.nodeGeometry.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1));
    this.nodeGeometry.setDrawRange(0, 0);

    this.nodeMaterial = new THREE.ShaderMaterial({
      vertexShader: NODE_VERTEX,
      fragmentShader: NODE_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uSize: { value: 0.19 },
        uSizeScale: { value: 700 },
        uMethaneMix: { value: 0 },
        uMethaneColor: { value: new THREE.Color('#C4B5FD') },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const nodes = new THREE.Points(this.nodeGeometry, this.nodeMaterial);
    nodes.frustumCulled = false;

    this.linkPositions = new Float32Array(MAX_LINKS * 2 * 3);
    this.linkColors = new Float32Array(MAX_LINKS * 2 * 3);
    this.linkParams = new Float32Array(MAX_LINKS * 2);

    this.linkGeometry = new THREE.BufferGeometry();
    this.linkGeometry.setAttribute('position', new THREE.BufferAttribute(this.linkPositions, 3));
    this.linkGeometry.setAttribute('aColor', new THREE.BufferAttribute(this.linkColors, 3));
    this.linkGeometry.setAttribute('aParam', new THREE.BufferAttribute(this.linkParams, 1));
    this.linkGeometry.setDrawRange(0, 0);

    this.linkMaterial = new THREE.ShaderMaterial({
      vertexShader: LINK_VERTEX,
      fragmentShader: LINK_FRAGMENT,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const links = new THREE.LineSegments(this.linkGeometry, this.linkMaterial);
    links.frustumCulled = false;

    this.object = new THREE.Group();
    this.object.add(links);
    this.object.add(nodes);
  }

  /** Place the observations and derive their adjacency from the shared plane. */
  setSites(sites: CinematicSite[]): void {
    const count = Math.min(sites.length, MAX_NODES);
    const color = new THREE.Color();
    const plotted: Array<[number, number]> = [];

    const colorAttribute = this.nodeGeometry.getAttribute('aColor') as THREE.BufferAttribute;
    const phaseAttribute = this.nodeGeometry.getAttribute('aPhase') as THREE.BufferAttribute;
    const sizeAttribute = this.nodeGeometry.getAttribute('aSize') as THREE.BufferAttribute;
    const colors = colorAttribute.array as Float32Array;
    const phases = phaseAttribute.array as Float32Array;
    const sizes = sizeAttribute.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const site = sites[i];
      const [x, y] = geoPoint(site.latitude, site.longitude);
      const offset = i * 3;

      this.nodePositions[offset] = x;
      this.nodePositions[offset + 1] = y;
      this.nodePositions[offset + 2] = 0.35;

      // Severity drives brightness and mark size; a clean site keeps the plain
      // instrument cyan so the warm ramp only appears where it means something.
      const severity = Math.min(1, Math.max(0, (site.value - 1800) / 700));
      color.set(
        site.level === 'low'
          ? OBSERVATION_COLOR
          : SEVERITY_COLORS[site.level] ?? FALLBACK_SEVERITY_COLOR,
      );
      const boost = 0.7 + severity * 0.6;

      colors[offset] = color.r * boost;
      colors[offset + 1] = color.g * boost;
      colors[offset + 2] = color.b * boost;

      phases[i] = hash(i, 7);
      sizes[i] = 0.75 + severity * 0.7 + hash(i, 11) * 0.25;
      plotted.push([x, y]);
    }

    this.nodeGeometry.setDrawRange(0, count);
    colorAttribute.needsUpdate = true;
    phaseAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
    (this.nodeGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

    // Adjacency: only pairs already close on the plane, capped so the traces
    // stay an accent rather than turning into a mesh.
    let link = 0;
    for (let i = 0; i < count && link < MAX_LINKS; i += 1) {
      for (let j = i + 1; j < count && link < MAX_LINKS; j += 1) {
        const dx = plotted[i][0] - plotted[j][0];
        const dy = plotted[i][1] - plotted[j][1];
        if (Math.sqrt(dx * dx + dy * dy) > LINK_RADIUS) continue;

        const base = link * 6;
        this.linkPositions[base] = plotted[i][0];
        this.linkPositions[base + 1] = plotted[i][1];
        this.linkPositions[base + 2] = 0.3;
        this.linkPositions[base + 3] = plotted[j][0];
        this.linkPositions[base + 4] = plotted[j][1];
        this.linkPositions[base + 5] = 0.3;

        this.linkColors[base] = colors[i * 3];
        this.linkColors[base + 1] = colors[i * 3 + 1];
        this.linkColors[base + 2] = colors[i * 3 + 2];
        this.linkColors[base + 3] = colors[j * 3];
        this.linkColors[base + 4] = colors[j * 3 + 1];
        this.linkColors[base + 5] = colors[j * 3 + 2];

        this.linkParams[link * 2] = 0;
        this.linkParams[link * 2 + 1] = 1;
        link += 1;
      }
    }

    this.linkGeometry.setDrawRange(0, link * 2);
    (this.linkGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.linkGeometry.getAttribute('aColor') as THREE.BufferAttribute).needsUpdate = true;
    (this.linkGeometry.getAttribute('aParam') as THREE.BufferAttribute).needsUpdate = true;
  }

  setSizeScale(sizeScale: number): void {
    this.nodeMaterial.uniforms.uSizeScale.value = sizeScale;
  }

  update(params: ObservationNodeParams): void {
    const node = this.nodeMaterial.uniforms;
    node.uTime.value = params.time;
    node.uOpacity.value = params.opacity;
    node.uSize.value = params.size;
    node.uMethaneMix.value = params.methaneMix;

    const link = this.linkMaterial.uniforms;
    link.uTime.value = params.time;
    link.uOpacity.value = params.links;
  }

  dispose(): void {
    this.nodeGeometry.dispose();
    this.nodeMaterial.dispose();
    this.linkGeometry.dispose();
    this.linkMaterial.dispose();
  }
}
