import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CraftModel } from './fish';

export function buildInk(): CraftModel {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#282827';
  ctx.fillRect(0, 0, 512, 1024);
  let seed = 17;
  for (let i = 0; i < 22000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 512;
    seed = (seed * 16807) % 2147483647;
    ctx.fillStyle = i % 2 ? '#ffffff09' : '#00000020';
    ctx.fillRect(x, seed % 1024, 2, 2);
  }
  ctx.strokeStyle = '#b39a61';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 45, 432, 934);
  ctx.lineWidth = 1;
  ctx.strokeRect(53, 58, 406, 908);
  ctx.fillStyle = '#c9ae75';
  ctx.font = '150px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('徽', 256, 400);
  ctx.fillText('墨', 256, 590);
  ctx.font = '25px serif';
  ctx.fillText('一 方 墨 · 一 寸 光 阴', 256, 835);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(256, 170, 70 + i * 14, 18 + i * 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({
    color: '#262727',
    roughness: 0.76,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.65, 3.3, 0.46, 4, 0.07), material);
  group.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.58, 3.22),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.76 }),
  );
  face.position.z = 0.237;
  group.add(face);
  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.72, 3.36, 0.5)),
    new THREE.LineBasicMaterial({ color: '#b59b64', transparent: true, opacity: 0.5 }),
  );
  group.add(border);
  group.rotation.set(-0.16, -0.38, -0.2);
  return {
    group,
    setExpansion() {},
    animate() {},
  };
}
