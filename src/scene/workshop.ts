import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildFish } from './fish';
export type CraftState = { step: number; count: number; color: string; busy: boolean };
export interface WorkshopViewer {
  update(state: CraftState, motion: boolean): void;
  recenter(): void;
  dispose(): void;
}
type Craft = {
  group: THREE.Group;
  apply(state: CraftState, dt: number, elapsed: number, pulse: number): THREE.Vector3;
};
const wood = new THREE.MeshStandardMaterial({ color: '#98714d', roughness: 0.82 });
function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.045, h / 4)), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function tube(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, radius, 8, false),
    material,
  );
}
function paperMap(color: string, painted: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = painted ? color : '#ead8b6';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 83;
  for (let i = 0; i < 5500; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 512;
    seed = (seed * 16807) % 2147483647;
    ctx.fillStyle = i % 2 ? '#ffffff16' : '#61432c12';
    ctx.fillRect(x, seed % 512, 1, 3);
  }
  if (painted) {
    ctx.strokeStyle = '#f6d48b';
    ctx.lineWidth = 2.5;
    for (let y = -30; y < 550; y += 50)
      for (let x = -30; x < 560; x += 64) {
        ctx.beginPath();
        ctx.arc(x + (Math.floor(y / 50) % 2) * 32, y, 32, 0, Math.PI);
        ctx.stroke();
      }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  if (painted) {
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.y = 3;
  }
  return map;
}
function fishCraft(): Craft {
  const original = buildFish();
  const group = original.group;
  const frame = group.children[0] as THREE.Group,
    skin = group.children[1] as THREE.Group,
    fins = group.children[2] as THREE.Group;
  skin.children[0].visible = false;
  const core = frame.children.find(
    (o) => o instanceof THREE.Mesh && o.geometry instanceof THREE.SphereGeometry,
  )!;
  const light = frame.children.find((o) => o instanceof THREE.PointLight) as THREE.PointLight;
  core.visible = false;
  const ribs = frame.children.filter((o) => o instanceof THREE.Mesh && o !== core);
  ribs.forEach((rib) => {
    const mesh = rib as THREE.Mesh;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.transparent = true;
    mat.opacity = 0.15;
    mesh.material = mat;
  });
  const neutral = paperMap('#ead8b6', false);
  let paintColor = '',
    painted: THREE.CanvasTexture | null = null;
  const patches: THREE.Mesh[] = [];
  for (let n = 0; n < 4; n++) {
    const vertices: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    const start = (n * Math.PI) / 4,
      end = ((n + 1) * Math.PI) / 4;
    for (let i = 0; i <= 24; i++)
      for (let j = 0; j <= 64; j++) {
        const t = start + ((end - start) * i) / 24,
          a = (j / 64) * Math.PI * 2;
        vertices.push(
          -Math.cos(t) * 1.807,
          Math.sin(t) * Math.sin(a) * 1.009,
          Math.sin(t) * Math.cos(a) * 0.674,
        );
        uvs.push(i / 24, j / 64);
        if (i < 24 && j < 64) {
          const k = i * 65 + j;
          indices.push(k, k + 1, k + 65, k + 1, k + 66, k + 65);
        }
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      map: neutral,
      side: THREE.DoubleSide,
      roughness: 0.9,
      transparent: true,
      opacity: 0.96,
      emissive: '#ffb75e',
      emissiveIntensity: 0,
    });
    const patch = new THREE.Mesh(geometry, material);
    patch.castShadow = true;
    patch.receiveShadow = true;
    group.add(patch);
    patches.push(patch);
  }
  group.position.y = 0.15;
  group.rotation.z = -0.08;
  let glow = 0;
  return {
    group,
    apply(state, dt, elapsed, _pulse) {
      if (paintColor !== state.color) {
        const old = painted;
        painted = paperMap(state.color, true);
        paintColor = state.color;
        for (const p of patches) {
          const mat = p.material as THREE.MeshStandardMaterial;
          if (mat.map === old) mat.map = neutral;
        }
        old?.dispose();
      }
      ribs.forEach((rib, i) => {
        const selected = state.step > 0 || Math.floor(i / Math.ceil(ribs.length / 4)) < state.count;
        rib.visible = true;
        const mat = (rib as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, selected ? 1 : 0.13, 9, dt);
        rib.scale.setScalar(THREE.MathUtils.damp(rib.scale.x, selected ? 1 : 0.985, 10, dt));
      });
      patches.forEach((patch, i) => {
        const show = state.step > 1 || (state.step === 1 && i < state.count);
        patch.visible = show;
        patch.position.z = THREE.MathUtils.damp(patch.position.z, show ? 0 : 1.3, 8, dt);
        const mat = patch.material as THREE.MeshStandardMaterial;
        mat.map =
          state.step > 2 || (state.step === 2 && i < Math.ceil((state.count * 4) / 3))
            ? painted
            : neutral;

        mat.emissiveIntensity = glow * 0.22;
      });
      skin.visible = state.step >= 2;
      fins.visible = true;
      fins.traverse((o) => {
        if (o instanceof THREE.Mesh && !(o.geometry instanceof THREE.TubeGeometry))
          o.visible = state.step > 1 || (state.step === 1 && state.count === 4);
      });
      glow = THREE.MathUtils.damp(
        glow,
        state.step > 3 || (state.step === 3 && state.count > 0) ? 1 : 0,
        5,
        dt,
      );
      light.intensity = glow * 1.6;
      original.animate(state.step >= 4 ? elapsed : 0);
      group.position.y = 0.15 + (state.step >= 4 ? Math.sin(elapsed * 0.9) * 0.06 : 0);
      const x =
        state.step <= 1
          ? -1.35 + Math.min(state.count, 3) * 0.85
          : state.step === 2
            ? -0.8 + Math.min(state.count, 2) * 0.8
            : 0;
      return new THREE.Vector3(x - 0.32, 0.2, state.step === 0 ? 0.65 : 0.79);
    },
  };
}
function goldLetter(char: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#d8b462';
  ctx.font = 'bold 150px SimSun, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 96, 102);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.72),
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      metalness: 0.65,
      roughness: 0.4,
      depthWrite: false,
    }),
  );
}
function inkCraft(): Craft {
  const group = new THREE.Group(),
    mixing = new THREE.Group(),
    pounding = new THREE.Group(),
    molding = new THREE.Group(),
    final = new THREE.Group();
  group.add(mixing, pounding, molding, final);
  const charcoal = new THREE.MeshStandardMaterial({ color: '#252827', roughness: 0.9 });
  const ceramic = new THREE.MeshStandardMaterial({
    color: '#b3a086',
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: '#dab86e',
    roughness: 0.36,
    metalness: 0.7,
  });
  const bowlProfile = [
    new THREE.Vector2(0.06, -0.62),
    new THREE.Vector2(0.45, -0.58),
    new THREE.Vector2(0.83, -0.38),
    new THREE.Vector2(1.12, 0.12),
    new THREE.Vector2(1.16, 0.3),
    new THREE.Vector2(1.1, 0.34),
    new THREE.Vector2(1.03, 0.12),
    new THREE.Vector2(0.75, -0.3),
    new THREE.Vector2(0.38, -0.47),
    new THREE.Vector2(0.06, -0.48),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 64), ceramic);
  mixing.add(bowl);
  const paste = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), charcoal);
  paste.scale.set(0.97, 0.12, 0.97);
  paste.position.y = 0.05;
  mixing.add(paste);
  const stir = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.65, 16), wood);
  stick.rotation.z = -0.36;
  stick.position.set(0.48, 0.64, 0);
  stir.add(stick);
  mixing.add(stir);
  for (let n = 0; n < 3; n++) {
    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.3 + n * 0.2, 0.015, 6, 64),
      new THREE.MeshStandardMaterial({ color: '#57584f', roughness: 1 }),
    );
    swirl.rotation.x = -Math.PI / 2;
    swirl.position.y = 0.16;
    mixing.add(swirl);
  }
  pounding.add(box(3.1, 0.18, 2.05, wood, 0, -0.66));
  const lump = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), charcoal);
  lump.position.y = -0.28;
  pounding.add(lump);
  const hammer = new THREE.Group();
  hammer.add(box(0.87, 0.38, 0.52, wood));
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 1.4, 16), wood);
  handle.position.y = 0.8;
  hammer.add(handle);
  hammer.position.set(0.08, 0.95, 0);
  hammer.rotation.z = -0.12;
  pounding.add(hammer);
  molding.add(box(2.25, 0.18, 3.55, wood, 0, -0.68));
  for (const x of [-0.96, 0.96]) molding.add(box(0.22, 0.38, 3.3, wood, x, -0.41));
  for (const z of [-1.56, 1.56]) molding.add(box(1.85, 0.38, 0.22, wood, 0, -0.41, z));
  const raw = box(1.55, 0.3, 2.85, charcoal, 0, -0.44);
  molding.add(raw);
  const lid = box(1.79, 0.2, 3.07, wood, 0, 0.95);
  lid.add(box(0.85, 0.32, 0.32, wood, 0, 0.18));
  molding.add(lid);
  const rack = new THREE.Group();
  for (let i = 0; i < 5; i++) rack.add(box(2.3, 0.075, 0.09, wood, 0, -0.7, -1.3 + i * 0.65));
  final.add(rack);
  const ink = box(1.5, 0.38, 2.9, charcoal);
  ink.position.y = -0.44;
  final.add(ink);
  const ornaments: THREE.Object3D[] = [];
  const border = new THREE.Group();
  for (const x of [-0.63, 0.63]) border.add(box(0.025, 0.018, 2.58, gold, x, 0.205));
  for (const z of [-1.28, 1.28]) border.add(box(1.28, 0.018, 0.025, gold, 0, 0.205, z));
  ink.add(border);
  ornaments.push(border);
  for (const [i, char] of ['徽', '墨'].entries()) {
    const glyph = goldLetter(char);
    glyph.rotation.x = -Math.PI / 2;
    glyph.position.set(0, 0.205, -0.46 + i * 0.88);
    ink.add(glyph);
    ornaments.push(glyph);
  }
  // Raised cloud ornaments are geometry rather than a flat substitute for the ink body.
  for (const z of [-1.03, 1.03])
    for (let i = 0; i < 3; i++) {
      const arc = tube(
        Array.from({ length: 20 }, (_, n) => {
          const a = (n / 19) * Math.PI;
          return new THREE.Vector3(Math.cos(a) * (0.14 + i * 0.06), 0.21, z + Math.sin(a) * 0.09);
        }),
        0.011,
        gold,
      );
      border.add(arc);
    }
  let stirAngle = 0;
  return {
    group,
    apply(state, dt, _elapsed, pulse) {
      mixing.visible = state.step === 0;
      pounding.visible = state.step === 1;
      molding.visible = state.step === 2 && (state.count === 0 || pulse < 0.86);
      final.visible = state.step >= 3 || (state.step === 2 && state.count > 0 && pulse >= 0.86);
      const targetAngle = state.count * Math.PI * 2;
      stirAngle = THREE.MathUtils.damp(stirAngle, targetAngle, 7, dt);
      stir.rotation.y = stirAngle;
      paste.scale.y = 0.12 + state.count * 0.018;
      lump.scale.set(
        1.08 - state.count * 0.095,
        0.24 + state.count * 0.045,
        0.77 - state.count * 0.045,
      );
      const strike =
        state.busy && state.step === 1 ? Math.sin(Math.min(pulse / 0.8, 1) * Math.PI) : 0;
      hammer.position.y = 0.95 - strike * 0.95;
      hammer.rotation.z = -0.12 + strike * 0.12;
      lump.position.y = -0.28 - strike * 0.04;
      lid.position.y =
        state.count > 0 ? 0.95 - Math.sin((Math.min(pulse / 0.8, 1) * Math.PI) / 2) * 1.14 : 0.95;
      if (state.step !== 2) lid.position.y = 0.95;
      const amount = state.step > 3 ? 3 : state.step === 3 ? state.count : 0;
      ornaments.forEach((o, i) => {
        o.visible = i < amount;
        const target = i < amount ? 1 : 0.1;
        o.scale.setScalar(THREE.MathUtils.damp(o.scale.x, target, 10, dt));
      });
      if (state.step >= 4) {
        rack.visible = false;
        ink.rotation.x = THREE.MathUtils.damp(ink.rotation.x, Math.PI / 2 - 0.15, 6, dt);
        ink.position.y = THREE.MathUtils.damp(ink.position.y, 0.25, 6, dt);
      } else {
        rack.visible = true;
        ink.rotation.x = 0;
        ink.position.y = -0.44;
      }
      return state.step === 0
        ? new THREE.Vector3(0.45, 0.85, 0.05)
        : state.step === 1
          ? new THREE.Vector3(0.08, 1.12, 0.3)
          : state.step === 2
            ? new THREE.Vector3(0, 1.2, 0.4)
            : state.step === 3
              ? new THREE.Vector3(
                  state.count === 0 ? -0.63 : 0,
                  -0.19,
                  state.count === 2 ? 0.42 : -0.46,
                )
              : new THREE.Vector3(0, 0.2, 0.5);
    },
  };
}
export function createWorkshop(
  host: HTMLDivElement,
  kind: 'fish' | 'ink',
  act: () => void,
  project: (x: number, y: number, visible: boolean) => void,
  lost: () => void,
): WorkshopViewer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.72;
  const craft = kind === 'fish' ? fishCraft() : inkCraft();
  scene.add(craft.group);
  scene.add(new THREE.HemisphereLight('#fff0d2', '#686451', 2.2));
  const main = new THREE.DirectionalLight('#ffebd0', 3.5);
  main.position.set(-3, 6, 5);
  main.castShadow = true;
  main.shadow.mapSize.set(1024, 1024);
  main.shadow.camera.left = -4;
  main.shadow.camera.right = 4;
  main.shadow.camera.top = 4;
  main.shadow.camera.bottom = -4;
  main.shadow.bias = -0.002;
  scene.add(main);
  const rim = new THREE.DirectionalLight('#ffe8c2', 2);
  rim.position.set(4, 2, -3);
  scene.add(rim);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.15 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.4;
  floor.receiveShadow = true;
  scene.add(floor);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.9, 2.9, 0.08, 80),
    new THREE.MeshStandardMaterial({ color: '#d6c3a2', roughness: 1 }),
  );
  disc.position.y = -1.45;
  disc.receiveShadow = true;
  scene.add(disc);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.023, 8, 32),
    new THREE.MeshBasicMaterial({ color: '#b34228', depthTest: false }),
  );
  halo.renderOrder = 10;
  scene.add(halo);
  let state: CraftState = { step: 0, count: 0, color: '#b5442b', busy: false },
    motion = true,
    time = 0,
    actionStart = 0,
    last = performance.now(),
    raf = 0,
    visible = true,
    disposed = false,
    width = 1,
    height = 1;
  const recenter = () => {
    camera.position.set(
      kind === 'fish' ? -0.4 : 3.4,
      kind === 'fish' ? 1.8 : 4.5,
      camera.aspect < 1 ? 9.6 : 7.8,
    );
    controls.target.set(0, 0, 0);
    controls.update();
  };
  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    recenter();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
    },
    { rootMargin: '100px' },
  );
  intersection.observe(host);
  const onLost = (e: Event) => {
    e.preventDefault();
    lost();
  };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  const raycaster = new THREE.Raycaster();
  let down = { x: 0, y: 0 };
  const pointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const pointerUp = (e: PointerEvent) => {
    if (state.busy || state.step >= 4 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8)
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    if (halo.visible && raycaster.intersectObject(halo).length) act();
  };
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  function tick(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || document.hidden) return;
    time += motion ? dt : 0;
    const pulse = motion ? Math.min((now - actionStart) / 900, 1) : 1;
    const point = craft.apply(state, motion ? dt : 1, time, pulse);
    craft.group.updateMatrixWorld(true);
    halo.position.copy(point);
    halo.quaternion.copy(camera.quaternion);
    halo.scale.setScalar(motion ? 1 + Math.sin(time * 3) * 0.08 : 1);
    const goals = kind === 'fish' ? [4, 4, 3, 1] : [3, 3, 1, 3];
    halo.visible = state.step < 4 && state.count < goals[state.step] && !state.busy;
    controls.update();
    scene.updateMatrixWorld();
    const screen = point.clone().project(camera);
    project(
      ((screen.x + 1) * width) / 2,
      ((1 - screen.y) * height) / 2,
      halo.visible && screen.z < 1 && Math.abs(screen.x) < 0.9 && Math.abs(screen.y) < 0.85,
    );
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);
  return {
    update(next, enabled) {
      if (next.count !== state.count || next.step !== state.step) {
        actionStart = performance.now();
        if (next.step !== state.step) recenter();
      }
      state = next;
      motion = enabled;
    },
    recenter,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            materials.add(m);
            for (const value of Object.values(m))
              if (value instanceof THREE.Texture) textures.add(value);
          }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
