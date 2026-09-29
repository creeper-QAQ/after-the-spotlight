import * as THREE from 'three';
import { PackedSplats } from '@sparkjsdev/spark';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { buildFish } from '../scene/fish';

// Sample our original illustrative model; these particles are not data records.
export function createFishSplats() {
  const packed = new PackedSplats();
  const { group } = buildFish();
  group.updateMatrixWorld(true);
  const point = new THREE.Vector3(),
    uv = new THREE.Vector2();
  const scale = new THREE.Vector3(0.027, 0.027, 0.027),
    q = new THREE.Quaternion();
  const textures = new Set<THREE.Texture>();
  let seed = 921;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.MeshStandardMaterial;
    const sampler = new MeshSurfaceSampler(object).build();
    (
      sampler as MeshSurfaceSampler & { setRandomGenerator: (fn: () => number) => void }
    ).setRandomGenerator(random);
    const image = material.map?.image;
    const pixels =
      image instanceof HTMLCanvasElement
        ? image.getContext('2d')?.getImageData(0, 0, image.width, image.height)
        : null;
    const count = pixels ? 10500 : object.geometry.type === 'TubeGeometry' ? 65 : 380;
    for (let i = 0; i < count; i++) {
      sampler.sample(point, undefined, undefined, uv);
      point.applyMatrix4(object.matrixWorld);
      const color = material.color?.clone() ?? new THREE.Color('#d5854c');
      if (pixels) {
        const x = Math.min(pixels.width - 1, Math.max(0, Math.floor(uv.x * pixels.width)));
        const y = Math.min(pixels.height - 1, Math.max(0, Math.floor((1 - uv.y) * pixels.height)));
        const offset = (y * pixels.width + x) * 4;
        color.setRGB(
          pixels.data[offset] / 255,
          pixels.data[offset + 1] / 255,
          pixels.data[offset + 2] / 255,
          THREE.SRGBColorSpace,
        );
      }
      packed.pushSplat(point, scale, q, 0.88, color);
    }
    object.geometry.dispose();
    if (material.map) textures.add(material.map);
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  return packed;
}
