import * as THREE from 'three';
import { buildFish } from '../../src/scene/fish';

const WIDTH = 960;
const HEIGHT = 540;
const DURATION = 10;
const canvas = document.querySelector<HTMLCanvasElement>('#film')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(1);
renderer.setClearColor('#000000', 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, WIDTH / HEIGHT, 0.1, 60);
camera.position.set(0.05, 0.45, 11.8);
camera.lookAt(0.05, 0.3, 0);
scene.add(new THREE.HemisphereLight('#9dab97', '#16322c', 0.75));
const key = new THREE.DirectionalLight('#ffdaa5', 1.5);
key.position.set(-4, 4.5, 6);
scene.add(key);
const edge = new THREE.DirectionalLight('#f09c5b', 1.35);
edge.position.set(4, 2, -3);
scene.add(edge);
const fill = new THREE.DirectionalLight('#a4c8b5', 0.35);
fill.position.set(-3, -2, 2);
scene.add(fill);

const fish = [
  { x: 1.65, y: 0.04, z: 1.0, scale: 0.95, angle: -0.17, yaw: -0.28, phase: 0, glow: 0.46 },
  { x: -4.1, y: 1.03, z: -3.2, scale: 0.67, angle: 0.12, yaw: 0.24, phase: 2.25, glow: 0.34 },
  { x: 0.1, y: 2.4, z: -7.6, scale: 0.46, angle: -0.06, yaw: -0.2, phase: 4.0, glow: 0.3 },
].map((config) => {
  const model = buildFish();
  // The film uses the finished lantern. Its internal bamboo frame is retained
  // by the source model for the interactive exploded view, but hidden here to
  // avoid coplanar construction ribs crossing the thin paper surface.
  for (const object of model.group.children[0].children) {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry?.type === 'TubeGeometry') mesh.visible = false;
  }
  for (const object of model.group.children[1].children) {
    const mesh = object as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    // Sub-pixel outer hoops shimmer in encoded footage. Keep the eye rims,
    // gills, fin edging and paper-scale texture; omit only these seven wires.
    if (mesh.geometry?.type === 'TubeGeometry' && material?.color?.getHex() === 0xe7b477)
      mesh.visible = false;
  }
  const pivot = new THREE.Group();
  pivot.add(model.group);
  pivot.scale.setScalar(config.scale);
  model.group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const mat = material as THREE.MeshStandardMaterial;
      if (mat.isMeshStandardMaterial && mat.emissive.getHex() !== 0) {
        mat.emissiveIntensity = config.glow;
      }
      if (mat.isMeshStandardMaterial && mat.map) {
        // Opaque paper prevents the hidden construction frame from showing as
        // a dark raster through the skin. The exterior gold hoops stay visible.
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.emissive.set('#f8a955');
        mat.emissiveIntensity = config.glow + 0.07;
      }
    }
  });
  // A thin suspension line keeps this a lantern rather than a biological fish.
  const cord = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.2, 1.18, 0),
      new THREE.Vector3(-0.2, 6.5, 0),
    ]),
    new THREE.LineBasicMaterial({ color: '#978467', transparent: true, opacity: 0.25 }),
  );
  pivot.add(cord);
  scene.add(pivot);
  return { config, model, pivot };
});

// Hand drawn, local canvas scenery: no photographs, stock footage or remote resources.
const backdrop = document.createElement('canvas');
backdrop.width = WIDTH;
backdrop.height = HEIGHT;
const bg = backdrop.getContext('2d')!;
const sky = bg.createLinearGradient(0, 0, 0, HEIGHT);
sky.addColorStop(0, '#162c29');
sky.addColorStop(0.53, '#112522');
sky.addColorStop(1, '#0b1514');
bg.fillStyle = sky;
bg.fillRect(0, 0, WIDTH, HEIGHT);
const distantLight = bg.createRadialGradient(610, 260, 30, 610, 260, 420);
distantLight.addColorStop(0, '#6557353d');
distantLight.addColorStop(0.46, '#3c4a3430');
distantLight.addColorStop(1, '#14251f00');
bg.fillStyle = distantLight;
bg.fillRect(0, 0, WIDTH, HEIGHT);

function roof(points: number[][], color: string) {
  bg.fillStyle = color;
  bg.beginPath();
  points.forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y)));
  bg.closePath();
  bg.fill();
}
roof(
  [
    [0, 372],
    [0, 327],
    [45, 321],
    [62, 315],
    [77, 283],
    [103, 299],
    [119, 305],
    [291, 305],
    [310, 286],
    [325, 307],
    [362, 325],
    [371, 334],
    [355, 343],
    [0, 357],
  ],
  '#18322d',
);
roof(
  [
    [720, 355],
    [755, 333],
    [774, 293],
    [794, 315],
    [821, 330],
    [941, 334],
    [960, 324],
    [960, 460],
    [720, 460],
  ],
  '#132923',
);
bg.fillStyle = '#122822';
bg.fillRect(43, 336, 303, 156);
bg.fillStyle = '#142820';
bg.fillRect(762, 357, 198, 156);
for (const x of [75, 136, 195, 256, 320]) {
  bg.fillStyle = '#1c352e';
  bg.fillRect(x, 350, 4, 135);
}
// A few windows imply a quiet courtyard without advertising a real location.
for (const [x, y] of [
  [108, 376],
  [240, 373],
  [812, 378],
  [901, 382],
]) {
  const windowGlow = bg.createRadialGradient(x + 10, y + 15, 3, x + 10, y + 15, 62);
  windowGlow.addColorStop(0, '#db9b4e38');
  windowGlow.addColorStop(1, '#db9b4e00');
  bg.fillStyle = windowGlow;
  bg.fillRect(x - 55, y - 45, 135, 130);
  bg.fillStyle = '#a1753d';
  bg.globalAlpha = 0.42;
  bg.fillRect(x, y, 20, 31);
  bg.globalAlpha = 1;
  bg.fillStyle = '#263b2d';
  bg.fillRect(x + 9, y, 2, 31);
  bg.fillRect(x, y + 15, 20, 2);
}

function bamboo(stemX: number, stemY: number, lean: number, opacity: number) {
  bg.globalAlpha = opacity;
  bg.strokeStyle = '#061714';
  bg.lineWidth = 3;
  bg.beginPath();
  bg.moveTo(stemX, HEIGHT + 5);
  bg.quadraticCurveTo(stemX + lean * 0.35, 210, stemX + lean, stemY);
  bg.stroke();
  bg.fillStyle = '#071a16';
  for (let branch = 0; branch < 7; branch++) {
    const y = stemY + 65 + branch * 50;
    const x = stemX + lean * (1 - (y - stemY) / (HEIGHT - stemY));
    const side = branch % 2 ? 1 : -1;
    for (let leaf = 0; leaf < 5; leaf++) {
      const reach = 15 + leaf * 12;
      bg.beginPath();
      bg.moveTo(x, y);
      bg.quadraticCurveTo(
        x + side * reach,
        y - 26 - leaf * 4,
        x + side * (reach + 31),
        y - 31 + leaf * 2,
      );
      bg.quadraticCurveTo(x + side * reach, y - 10 + leaf * 2, x, y);
      bg.fill();
    }
  }
  bg.globalAlpha = 1;
}
bamboo(20, -35, 57, 0.62);
bamboo(52, -75, -6, 0.6);
bamboo(955, -20, -55, 0.74);
bamboo(932, 48, 24, 0.4);

const vignette = ctx.createRadialGradient(
  WIDTH * 0.53,
  HEIGHT * 0.48,
  110,
  WIDTH * 0.5,
  HEIGHT * 0.48,
  630,
);
vignette.addColorStop(0, '#07130d00');
vignette.addColorStop(0.7, '#07110c20');
vignette.addColorStop(1, '#040a09ba');

function render(seconds: number) {
  const phase = (seconds / DURATION) * Math.PI * 2;
  for (const { config: c, model, pivot } of fish) {
    const p = phase + c.phase;
    pivot.position.set(
      c.x + Math.sin(p) * 0.12,
      c.y + Math.sin(p) * 0.085,
      c.z + Math.cos(p) * 0.065,
    );
    pivot.rotation.set(
      Math.cos(p) * 0.018,
      c.yaw + Math.sin(p) * 0.045,
      c.angle + Math.sin(p) * 0.024,
    );
    model.animate(p / 0.9);
  }
  camera.position.x = 0.05 + Math.sin(phase) * 0.045;
  camera.position.y = 0.45 + Math.cos(phase) * 0.02;
  camera.lookAt(0.05, 0.3, 0);
  renderer.render(scene, camera);
  ctx.filter = 'blur(1.25px)';
  ctx.drawImage(backdrop, 0, 0);
  ctx.filter = 'none';
  // Warm, restrained halos behind the lanterns supply depth, not decorative data dots.
  const halo = ctx.createRadialGradient(591 + Math.sin(phase) * 4, 268, 34, 591, 268, 225);
  halo.addColorStop(0, '#e4944334');
  halo.addColorStop(0.65, '#d37e2015');
  halo.addColorStop(1, '#d37e2000');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.filter = 'saturate(0.83)';
  ctx.drawImage(renderer.domElement, 0, 0);
  ctx.filter = 'none';
  // Lower-edge mist keeps the silhouettes quiet and the warm foreground legible.
  const mist = ctx.createLinearGradient(0, 410, 0, HEIGHT);
  mist.addColorStop(0, '#13251f00');
  mist.addColorStop(1, '#142d2580');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 410, WIDTH, HEIGHT - 410);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

render(0);
(window as unknown as { lanternFilm: unknown }).lanternFilm = {
  width: WIDTH,
  height: HEIGHT,
  duration: DURATION,
  fps: 24,
  render,
  canvas,
  recorderType: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((mime) =>
    MediaRecorder.isTypeSupported(mime),
  ),
  rendererInfo: renderer.getContext().getParameter(renderer.getContext().RENDERER),
};
