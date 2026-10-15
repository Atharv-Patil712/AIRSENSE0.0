import * as THREE from 'three';
import type { AtmosphereState, CinematicData } from '../types';
import { ContourGrid } from './contourGrid';
import { DensityField } from './densityField';
import { EnvironmentField } from './environmentField';
import { FlowLines } from './flowLines';
import { Geography } from './geography';
import { ObservationNodes } from './observationNodes';

/* ─────────────────────────────────────────────────────────────
   The single WebGL layer behind the whole experience.

   There is no planet here. The atmosphere is assembled from four things
   that only exist as data: an advected particle field, wind streamlines, a
   density field of haze strata, and one flat observation plane on which
   geography appears as the observations accumulate.

   Each storyboard stage declares a "look"; the scene damps toward the look
   of the current stage (blended with the next by scroll progress), so the
   whole sequence is one continuous atmospheric move rather than a hard cut
   between per-section animations.
   ───────────────────────────────────────────────────────────── */

const DEG = Math.PI / 180;

interface Look {
  /* Camera: a slow traverse, never an orbit. */
  camX: number;
  camY: number;
  camZ: number;
  focusX: number;
  focusY: number;
  /* Flow field. */
  fieldX: number;
  fieldY: number;
  fieldScale: number;
  fieldOpacity: number;
  fieldSize: number;
  flowSpeed: number;
  collimation: number;
  turbulence: number;
  accentR: number;
  accentG: number;
  accentB: number;
  /* Streamlines and structure. */
  lines: number;
  lattice: number;
  contours: number;
  /* Observation plane. */
  geoX: number;
  geoY: number;
  geoScale: number;
  reveal: number;
  boundary: number;
  nodes: number;
  nodeSize: number;
  links: number;
  methaneMix: number;
  /* Atmosphere. */
  haze: number;
  scan: number;
  horizon: number;
  lowR: number;
  lowG: number;
  lowB: number;
  highR: number;
  highG: number;
  highB: number;
}

type TintChannels = Pick<Look, 'lowR' | 'lowG' | 'lowB' | 'highR' | 'highG' | 'highB'>;
type AccentChannels = Pick<Look, 'accentR' | 'accentG' | 'accentB'>;

const channels = (hex: string): [number, number, number] => {
  const color = new THREE.Color(hex);
  return [color.r, color.g, color.b];
};

/** Atmosphere tint pair: the lower and upper ends of the density gradient. */
function tint(low: string, high: string): TintChannels {
  const [lowR, lowG, lowB] = channels(low);
  const [highR, highG, highB] = channels(high);
  return { lowR, lowG, lowB, highR, highG, highB };
}

/** Hue carried by the sparse marked points — the stage's semantic signal. */
function accent(hex: string): AccentChannels {
  const [accentR, accentG, accentB] = channels(hex);
  return { accentR, accentG, accentB };
}

/** Look per storyboard stage, in scroll order (see STAGES in ../types). */
const LOOKS: Look[] = [
  // 0 — hero: an abstract atmosphere, wide and unmeasured. No geography yet.
  { camX: 0, camY: 0.1, camZ: 9.2, focusX: 0.6, focusY: 0, fieldX: 2.2, fieldY: 0, fieldScale: 1, fieldOpacity: 0.34, fieldSize: 0.03, flowSpeed: 0.32, collimation: 0.04, turbulence: 0.85, lines: 0.1, lattice: 0.05, contours: 0.02, geoX: 3.4, geoY: -0.2, geoScale: 1, reveal: 0, boundary: 0, nodes: 0.05, nodeSize: 0.05, links: 0, methaneMix: 0, haze: 0.5, scan: 0.05, horizon: 0.12, ...tint('#7DD3FC', '#1E3A8A'), ...accent('#93C5FD') },
  // 1 — live environment: structure appears — lattice, contours, first marks.
  { camX: 0, camY: 0.16, camZ: 8.4, focusX: 0.2, focusY: 0, fieldX: -1.2, fieldY: -0.1, fieldScale: 1.02, fieldOpacity: 0.4, fieldSize: 0.033, flowSpeed: 0.45, collimation: 0.12, turbulence: 0.75, lines: 0.16, lattice: 0.14, contours: 0.08, geoX: -3, geoY: -0.1, geoScale: 1, reveal: 0.06, boundary: 0.05, nodes: 0.22, nodeSize: 0.055, links: 0, methaneMix: 0, haze: 0.42, scan: 0.08, horizon: 0.1, ...tint('#7DD3FC', '#1D4ED8'), ...accent('#5EEAD4') },
  // 2 — air quality: observations cluster and the boundary forms out of them.
  { camX: 0, camY: 0.08, camZ: 7, focusX: 0.3, focusY: 0, fieldX: 1.4, fieldY: 0, fieldScale: 1.06, fieldOpacity: 0.36, fieldSize: 0.035, flowSpeed: 0.5, collimation: 0.16, turbulence: 0.6, lines: 0.14, lattice: 0.18, contours: 0.16, geoX: 1.3, geoY: 0, geoScale: 1.06, reveal: 0.62, boundary: 0.3, nodes: 0.85, nodeSize: 0.06, links: 0.12, methaneMix: 0, haze: 0.34, scan: 0.06, horizon: 0.06, ...tint('#93C5FD', '#1E3A8A'), ...accent('#67E8F9') },
  // 3 — pollution movement: the field collimates onto the transport bearing.
  { camX: 0, camY: -0.04, camZ: 7.4, focusX: 0.2, focusY: 0, fieldX: 0.8, fieldY: 0, fieldScale: 1.08, fieldOpacity: 0.85, fieldSize: 0.045, flowSpeed: 2.6, collimation: 0.92, turbulence: 0.35, lines: 0.5, lattice: 0.1, contours: 0.14, geoX: 0.8, geoY: 0, geoScale: 1, reveal: 0.72, boundary: 0.22, nodes: 0.5, nodeSize: 0.062, links: 0.2, methaneMix: 0, haze: 0.26, scan: 0.1, horizon: 0.05, ...tint('#67E8F9', '#2563EB'), ...accent('#FACC15') },
  // 4 — methane: the atmosphere shifts violet — a different gas, a different language.
  { camX: 0, camY: 0.12, camZ: 7.2, focusX: 0.3, focusY: 0.05, fieldX: 1.2, fieldY: 0.05, fieldScale: 1.04, fieldOpacity: 0.4, fieldSize: 0.035, flowSpeed: 0.6, collimation: 0.3, turbulence: 0.55, lines: 0.16, lattice: 0.12, contours: 0.14, geoX: 1.2, geoY: 0.05, geoScale: 1.04, reveal: 0.8, boundary: 0.28, nodes: 0.8, nodeSize: 0.058, links: 0.22, methaneMix: 0.85, haze: 0.3, scan: 0.07, horizon: 0.05, ...tint('#C084FC', '#4C1D95'), ...accent('#C4B5FD') },
  // 5 — environmental risk: density and intensity peak, amber over deep red.
  { camX: 0, camY: 0.06, camZ: 8.6, focusX: 0.2, focusY: 0, fieldX: 1, fieldY: 0, fieldScale: 0.98, fieldOpacity: 0.5, fieldSize: 0.038, flowSpeed: 0.5, collimation: 0.22, turbulence: 0.5, lines: 0.18, lattice: 0.1, contours: 0.12, geoX: 1, geoY: 0, geoScale: 0.98, reveal: 0.9, boundary: 0.26, nodes: 1, nodeSize: 0.07, links: 0.3, methaneMix: 0.2, haze: 0.4, scan: 0.12, horizon: 0.08, ...tint('#FBBF24', '#9F1239'), ...accent('#FB923C') },
  // 6 — AI brief: the chaos resolves. Turbulence collapses, the lattice comes forward.
  { camX: 0, camY: 0.02, camZ: 10.2, focusX: 0.2, focusY: 0, fieldX: 0.5, fieldY: 0, fieldScale: 0.94, fieldOpacity: 0.3, fieldSize: 0.033, flowSpeed: 0.34, collimation: 0.1, turbulence: 0.12, lines: 0.2, lattice: 0.3, contours: 0.2, geoX: 0.4, geoY: -0.05, geoScale: 0.94, reveal: 1, boundary: 0.18, nodes: 0.4, nodeSize: 0.055, links: 0.14, methaneMix: 0.05, haze: 0.32, scan: 0.16, horizon: 0.14, ...tint('#A5B4FC', '#3730A3'), ...accent('#818CF8') },
  // 7 — enter AirSense: the field recedes into an ice horizon.
  { camX: 0, camY: 0, camZ: 13.4, focusX: 0, focusY: -0.2, fieldX: 0, fieldY: -0.4, fieldScale: 0.9, fieldOpacity: 0.24, fieldSize: 0.031, flowSpeed: 0.22, collimation: 0.02, turbulence: 0.5, lines: 0.14, lattice: 0.06, contours: 0.04, geoX: 0, geoY: -1.4, geoScale: 0.72, reveal: 0.5, boundary: 0.1, nodes: 0.12, nodeSize: 0.048, links: 0, methaneMix: 0.05, haze: 0.36, scan: 0.04, horizon: 1, ...tint('#A5F3FC', '#155E75'), ...accent('#67E8F9') },
];

const LOOK_KEYS = Object.keys(LOOKS[0]) as (keyof Look)[];

/** Interpolate `a` → `b` into `target` by ratio, across every look field. */
function blend(target: Look, a: Look, b: Look, ratio: number): void {
  for (const key of LOOK_KEYS) target[key] = a[key] + (b[key] - a[key]) * ratio;
}

/** Frame-rate-independent damping of the working look toward the target look. */
function damp(current: Look, target: Look, factor: number): void {
  for (const key of LOOK_KEYS) current[key] = current[key] + (target[key] - current[key]) * factor;
}

export interface AtmosphereSceneOptions {
  /** Desktop layouts bias the field and the observation plane apart so copy has room. */
  split: boolean;
  particleCount: number;
}

export class AtmosphereScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  /** Carries the particle field, streamlines and the open lattice. */
  private readonly fieldGroup: THREE.Group;
  /** Carries geography, its contours and the observation marks. */
  private readonly observationPlane: THREE.Group;
  private readonly field: EnvironmentField;
  private readonly lines: FlowLines;
  private readonly contours: ContourGrid;
  private readonly geography: Geography;
  private readonly nodes: ObservationNodes;
  private readonly density: DensityField;
  private readonly working: Look = { ...LOOKS[0] };
  private readonly target: Look = { ...LOOKS[0] };
  private readonly accentColor = new THREE.Color();
  private readonly tintLow = new THREE.Color();
  private readonly tintHigh = new THREE.Color();
  private readonly boundaryColor = new THREE.Color();

  private split: boolean;
  private elapsed = 0;
  private windTo = 0;

  constructor(canvas: HTMLCanvasElement, data: CinematicData, options: AtmosphereSceneOptions) {
    this.split = options.split;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 160);
    this.camera.position.set(LOOKS[0].camX, LOOKS[0].camY, LOOKS[0].camZ);

    // Atmosphere first: haze strata, horizon and scan ribbon sit behind everything.
    this.density = new DensityField();
    this.scene.add(this.density.object);

    // The flow field owns the whole frame; on desktop it leans away from the copy.
    this.fieldGroup = new THREE.Group();
    this.lines = new FlowLines();
    this.field = new EnvironmentField(options.particleCount);
    this.fieldGroup.add(this.field.object);
    this.fieldGroup.add(this.lines.object);
    this.scene.add(this.fieldGroup);

    // Structure: the open lattice belongs to the field, the contours to the map.
    this.contours = new ContourGrid();
    this.fieldGroup.add(this.contours.lattice);

    // The observation plane: geography emerges here, not on a sphere.
    this.observationPlane = new THREE.Group();
    this.geography = new Geography();
    this.nodes = new ObservationNodes();
    this.observationPlane.add(this.geography.object);
    this.observationPlane.add(this.contours.object);
    this.observationPlane.add(this.nodes.object);
    this.scene.add(this.observationPlane);

    this.windTo = data.plume.windTo;
    this.nodes.setSites(data.methane.sites);
  }

  /** Desktop bias: on narrow viewports the field stays centred instead of leaning. */
  setSplit(split: boolean): void {
    this.split = split;
  }

  /** Observations and transport bearing change without rebuilding the scene. */
  setData(data: CinematicData): void {
    this.windTo = data.plume.windTo;
    this.nodes.setSites(data.methane.sites);
  }

  resize(width: number, height: number, dpr: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(dpr, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    // Point sizes are authored in world units, so the shaders need the
    // device-pixel scale of one world unit at one unit of depth.
    const pixelRatio = Math.min(dpr, 2);
    const sizeScale = (h * pixelRatio) / (2 * Math.tan((this.camera.fov / 2) * DEG));
    this.field.setSizeScale(sizeScale);
    this.nodes.setSizeScale(sizeScale);
  }

  render(state: AtmosphereState, dt: number): void {
    const step = Math.min(dt, 1 / 20);
    this.elapsed += step;

    const stage = Math.max(0, Math.min(LOOKS.length - 1, Math.floor(state.stage)));
    const next = Math.min(LOOKS.length - 1, stage + 1);
    blend(this.target, LOOKS[stage], LOOKS[next], Math.min(1, Math.max(0, state.stageMix)));
    damp(this.working, this.target, 1 - Math.exp(-step * 3.2));

    const look = this.working;

    // Camera: one slow traverse with a breath of drift — never an orbit.
    const sway = Math.sin(this.elapsed * 0.052) * 0.42;
    const lift = Math.sin(this.elapsed * 0.037) * 0.18;
    this.camera.position.set(look.camX + sway * 0.5, look.camY + lift, look.camZ);
    this.camera.lookAt(look.focusX * 0.3, look.focusY * 0.3, 0);

    const breath = 1 + Math.sin(this.elapsed * 0.045) * 0.012;

    // Flow field: biased off-axis on desktop so the copy owns one visual zone,
    // while the particles themselves still cross into it.
    const fieldOffset = this.split ? look.fieldX : look.fieldX * 0.14;
    this.fieldGroup.position.set(fieldOffset, look.fieldY, 0);
    this.fieldGroup.scale.setScalar(look.fieldScale * breath);

    this.accentColor.setRGB(look.accentR, look.accentG, look.accentB);
    this.field.setBearing(this.windTo);
    this.field.update({
      opacity: look.fieldOpacity,
      size: look.fieldSize,
      speed: look.flowSpeed,
      collimation: look.collimation,
      turbulence: look.turbulence,
      time: this.elapsed,
      accent: this.accentColor,
    });

    this.lines.setBearing(this.windTo);
    this.lines.update({
      opacity: look.lines,
      speed: 0.05 + look.flowSpeed * 0.035,
      collimation: look.collimation,
      turbulence: look.turbulence,
      time: this.elapsed,
    });

    this.contours.update(look.contours, look.lattice);

    // The observation plane leans the other way, so geography reads as a second
    // instrument rather than as a backplate behind the copy.
    const planeOffset = this.split ? look.geoX : look.geoX * 0.16;
    this.observationPlane.position.set(planeOffset, look.geoY, 0);
    this.observationPlane.scale.setScalar(look.geoScale * breath);

    this.boundaryColor.setRGB(look.highR, look.highG, look.highB);
    this.geography.update(look.reveal, look.boundary, this.boundaryColor);

    this.nodes.update({
      opacity: look.nodes,
      size: look.nodeSize,
      time: this.elapsed,
      methaneMix: look.methaneMix,
      links: look.links,
    });

    this.tintLow.setRGB(look.lowR, look.lowG, look.lowB);
    this.tintHigh.setRGB(look.highR, look.highG, look.highB);
    this.density.update({
      haze: look.haze,
      horizon: look.horizon,
      scan: look.scan,
      low: this.tintLow,
      high: this.tintHigh,
      time: this.elapsed,
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.field.dispose();
    this.lines.dispose();
    this.contours.dispose();
    this.geography.dispose();
    this.nodes.dispose();
    this.density.dispose();
    this.renderer.dispose();
  }

}

