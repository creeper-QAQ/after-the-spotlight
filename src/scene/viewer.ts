import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFish } from './fish';
import { buildInk } from './ink';

type State = { exploded: boolean; motion: boolean; rotation: number };
export interface Viewer {
  update: (state: State) => void;
  dispose: () => void;
}

export function createViewer(
  host: HTMLDivElement,
  kind: 'fish' | 'ink',
  onLost: () => void,
): Viewer {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.35, 8.8);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.8;
  const model = kind === 'fish' ? buildFish() : buildInk();
  const pivot = new THREE.Group();
  pivot.add(model.group);
  scene.add(pivot);
  pivot.rotation.z = kind === 'fish' ? -0.17 : 0;
  pivot.rotation.y = kind === 'fish' ? -0.23 : 0;
  scene.add(new THREE.HemisphereLight('#fff4dc', '#847766', 2.6));
  const main = new THREE.DirectionalLight('#ffe3b9', 3.7);
  main.position.set(-3, 4, 5);
  scene.add(main);
  const rim = new THREE.DirectionalLight('#ed9a5c', 2);
  rim.position.set(2, 2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffffff', 1);
  fill.position.set(4, -2, 4);
  scene.add(fill);
  let state: State = { exploded: false, motion: true, rotation: 0 };
  let expansion = 0;
  let visible = true;
  let disposed = false;
  let dirty = true;
  let time = 0;
  let last = performance.now();
  let frame = 0;
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 10.6 : 8.3;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  const visibility = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      dirty = true;
    },
    { rootMargin: '80px' },
  );
  visibility.observe(host);
  const onChange = () => {
    dirty = true;
  };
  controls.addEventListener('change', onChange);
  const onContextLost = (event: Event) => {
    event.preventDefault();
    onLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  function tick(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || document.hidden) return;
    const target = state.exploded ? 1 : 0;
    const transitioning = Math.abs(expansion - target) > 0.001;
    if (transitioning) {
      expansion = state.motion
        ? THREE.MathUtils.lerp(expansion, target, 1 - Math.exp(-dt * 5))
        : target;
      dirty = true;
    }
    controls.update();
    if (state.motion) {
      time += dt;
      pivot.position.y = Math.sin(time * 0.65) * 0.065;
      model.animate(time);
    } else {
      pivot.position.y = 0;
      model.animate(0);
    }
    pivot.rotation.y = (kind === 'fish' ? -0.23 : 0) + state.rotation;
    model.setExpansion(expansion);
    if (dirty || state.motion) {
      renderer.render(scene, camera);
      dirty = false;
    }
  }
  frame = requestAnimationFrame(tick);
  return {
    update(next) {
      state = next;
      dirty = true;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
            materials.add(mat);
      });
      materials.forEach((mat) => {
        for (const value of Object.values(mat))
          if (value instanceof THREE.Texture) textures.add(value);
        mat.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
