import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createFishSplats } from './fishSplats';
import { createChinaMap } from './chinaMap';
import type { PackedSplats } from '@sparkjsdev/spark';

export async function createSplatViewer(
  host: HTMLDivElement,
  file: File | null,
  motion: boolean,
  onError: () => void,
) {
  const map = await createChinaMap();
  host.dataset.mapLayout = 'random-visual';
  host.dataset.mapSeed = String(map.seed);
  host.dataset.mapPoints = String(map.targets.length);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  } catch (error) {
    map.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 1000);
  camera.position.set(0, 0.4, 9);
  const spark = new SparkRenderer({ renderer });
  scene.add(spark);
  const mesh = file
    ? new SplatMesh({ fileBytes: await file.arrayBuffer(), fileName: file.name })
    : new SplatMesh({ packedSplats: createFishSplats() });
  try {
    await mesh.initialized;
  } catch (error) {
    map.dispose();
    mesh.dispose();
    spark.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  scene.add(mesh, map.group);
  if (file) {
    const box = mesh.getBoundingBox();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    mesh.position.copy(center).negate();
    if (size > 0 && Number.isFinite(size)) mesh.scale.setScalar(6 / size);
    mesh.position.multiplyScalar(mesh.scale.x);
  }
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.65;
  const packed = mesh.packedSplats;
  const originals: ReturnType<PackedSplats['getSplat']>[] = [];
  // CPU edits only for our modest procedural scene; imported scans keep their fidelity.
  if (packed && !file)
    for (let i = 0; i < packed.numSplats; i++) {
      const s = packed.getSplat(i);
      // Spark returns reusable scratch objects: retain independent baseline values.
      originals.push({
        center: s.center.clone(),
        scales: s.scales.clone(),
        quaternion: s.quaternion.clone(),
        opacity: s.opacity,
        color: s.color.clone(),
      });
    }
  let target = 0,
    amount = -1,
    visible = true,
    disposed = false,
    frame = 0,
    previous = performance.now();
  const observer = new IntersectionObserver(
    (e) => {
      visible = e[0].isIntersecting;
    },
    { rootMargin: '80px' },
  );
  observer.observe(host);
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = width < 600 ? 13 : 9;
    camera.updateProjectionMatrix();
    layoutDirty = true;
  });
  resize.observe(host);
  const position = new THREE.Vector3();
  const burst = new THREE.Vector3();
  const color = new THREE.Color();
  const red = new THREE.Color('#d94634');
  const scale = new THREE.Vector3();
  const smooth = (a: number, b: number, value: number) => THREE.MathUtils.smoothstep(value, a, b);
  let layoutDirty = true;
  const lost = (event: Event) => {
    event.preventDefault();
    onError();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  const tick = (now: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!visible || document.hidden) return;
    if (packed && (layoutDirty || amount < 0 || Math.abs(target - amount) > 0.0005)) {
      layoutDirty = false;
      amount =
        motion && amount >= 0
          ? THREE.MathUtils.lerp(amount, target, 1 - Math.exp(-dt * 7))
          : target;
      if (Math.abs(target - amount) < 0.0005) amount = target;
      // Hold the map, release into a broad cloud, then gather into the case model.
      const explode = smooth(0.15, 0.46, amount);
      const gather = smooth(0.53, 0.91, amount);
      const mapOpacity = 1 - smooth(0.17, 0.4, amount);
      const offset = host.clientWidth >= 1100 ? 2.45 : 0;
      const mapScale = host.clientWidth < 600 ? 0.59 : host.clientWidth < 1100 ? 0.8 : 0.82;
      const mapOffset = host.clientWidth >= 1100 ? 1.95 : 0;
      originals.forEach((s, i) => {
        const anchor = map.targets[i % map.targets.length];
        const delay = (Math.sin(i * 1.37) + 1) * 0.028;
        const arrival = smooth(0.53 + delay, 0.91, amount);
        burst.set(Math.sin(i * 73.2) * 9, Math.cos(i * 32.7) * 6, Math.sin(i * 18.8) * 3.5);
        position
          .set(anchor.x * mapScale + mapOffset, anchor.y * mapScale, anchor.z)
          .lerp(burst, explode);
        position.x = THREE.MathUtils.lerp(position.x, s.center.x + offset, arrival);
        position.y = THREE.MathUtils.lerp(position.y, s.center.y, arrival);
        position.z = THREE.MathUtils.lerp(position.z, s.center.z, arrival);
        color.copy(red).lerp(s.color, arrival);
        scale.setScalar(THREE.MathUtils.lerp(0.017 * mapScale, s.scales.x, gather));
        const opacity = i < map.targets.length ? 0.86 : smooth(0.21, 0.43, amount) * s.opacity;
        packed.setSplat(i, position, scale, s.quaternion, opacity, color);
      });
      map.group.position.x = mapOffset;
      map.group.scale.setScalar(mapScale);
      map.fade(mapOpacity);
      host.dataset.phase = amount < 0.25 ? 'map' : amount < 0.65 ? 'burst' : 'fish';
      host.dataset.morph = amount.toFixed(4);
      packed.needsUpdate = true;
      mesh.updateVersion();
    }
    controls.enabled = false;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.22;
    controls.update();
    try {
      renderer.render(scene, camera);
    } catch {
      onError();
      disposed = true;
      cancelAnimationFrame(frame);
    }
  };
  frame = requestAnimationFrame(tick);
  return {
    gather(progress: number) {
      target = THREE.MathUtils.clamp(progress, 0, 1);
    },
    reset() {
      controls.reset();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      map.dispose();
      mesh.dispose();
      spark.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
