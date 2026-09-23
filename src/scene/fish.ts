import * as THREE from 'three';

export interface CraftModel {
  group: THREE.Group;
  setExpansion: (amount: number) => void;
  animate: (time: number) => void;
}

function paperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#bb472d';
  ctx.fillRect(0, 0, 1024, 512);
  const glow = ctx.createRadialGradient(490, 255, 15, 490, 255, 540);
  glow.addColorStop(0, '#f3aa69');
  glow.addColorStop(0.55, '#d97442');
  glow.addColorStop(1, '#9c271f');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1024, 512);
  for (let y = -20; y < 570; y += 49) {
    for (let x = -50; x < 1090; x += 65) {
      const shift = (Math.floor(y / 49) % 2) * 32;
      ctx.beginPath();
      ctx.arc(x + shift, y, 33, 0.08, Math.PI - 0.08);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f9cd8bb0';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + shift, y + 3, 27, 0.15, Math.PI - 0.15);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#91261a66';
      ctx.stroke();
    }
  }
  let seed = 43;
  for (let i = 0; i < 17000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 1024;
    seed = (seed * 16807) % 2147483647;
    const y = seed % 512;
    ctx.fillStyle = i % 2 ? '#fceac518' : '#4d170b16';
    ctx.fillRect(x, y, 1, 1.8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildFish(): CraftModel {
  const group = new THREE.Group();
  const frame = new THREE.Group();
  const skin = new THREE.Group();
  const fins = new THREE.Group();
  group.add(frame, skin, fins);
  const bamboo = new THREE.MeshStandardMaterial({ color: '#c29761', roughness: 0.92 });
  const gold = new THREE.MeshStandardMaterial({
    color: '#e7b477',
    roughness: 0.65,
    metalness: 0.12,
  });
  const darkRed = new THREE.MeshStandardMaterial({ color: '#7e271e', roughness: 0.8 });
  const paper = new THREE.MeshStandardMaterial({
    map: paperTexture(),
    color: '#ffffff',
    roughness: 0.8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.97,
    emissive: '#c74818',
    emissiveIntensity: 0.17,
  });
  const finPaper = new THREE.MeshStandardMaterial({
    color: '#ad3927',
    roughness: 0.9,
    side: THREE.DoubleSide,
    emissive: '#842116',
    emissiveIntensity: 0.15,
  });
  const tube = (
    points: THREE.Vector3[],
    radius: number,
    material: THREE.Material,
    parent: THREE.Group,
    closed = false,
  ) => {
    const curve = new THREE.CatmullRomCurve3(points, closed);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.max(24, points.length * 2), radius, 5, closed),
      material,
    );
    parent.add(mesh);
    return mesh;
  };
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 36), paper);
  body.scale.set(1.8, 0.99, 0.66);
  skin.add(body);
  // Elliptical ribs and longitudinal strips remain visible in the exploded view.
  for (let i = 0; i < 12; i++) {
    const x = -1.64 + i * 0.298;
    const r = Math.sqrt(1 - (x / 1.81) ** 2);
    const points = Array.from({ length: 48 }, (_, n) => {
      const a = (n / 48) * Math.PI * 2;
      return new THREE.Vector3(x, Math.sin(a) * r, Math.cos(a) * r * 0.666);
    });
    tube(points, 0.016, bamboo, frame, true);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const points = Array.from({ length: 40 }, (_, n) => {
      const t = (n / 39) * Math.PI;
      return new THREE.Vector3(
        -Math.cos(t) * 1.8,
        Math.sin(t) * Math.sin(a),
        Math.sin(t) * Math.cos(a) * 0.669,
      );
    });
    tube(points, 0.011, bamboo, frame);
  }
  // Gold hoops on the outside give the paper lantern a crafted structure.
  for (let i = 0; i < 7; i++) {
    const x = -1.38 + i * 0.43;
    const r = Math.sqrt(1 - (x / 1.8) ** 2);
    tube(
      Array.from({ length: 48 }, (_, n) => {
        const a = (n / 48) * Math.PI * 2;
        return new THREE.Vector3(x, Math.sin(a) * r * 1.005, Math.cos(a) * r * 0.672);
      }),
      0.006,
      gold,
      skin,
      true,
    );
  }
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(-1.16, 0.29, side * 0.485);
    eye.rotation.y = side > 0 ? -0.35 : Math.PI + 0.35;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.043, 10, 40), gold);
    eye.add(rim);
    const white = new THREE.Mesh(
      new THREE.CircleGeometry(0.203, 40),
      new THREE.MeshStandardMaterial({ color: '#e9dbaf', roughness: 0.8 }),
    );
    eye.add(white);
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.124, 32),
      new THREE.MeshStandardMaterial({ color: '#241b17', roughness: 0.4 }),
    );
    pupil.position.z = 0.013;
    pupil.position.x = -0.04;
    eye.add(pupil);
    const shine = new THREE.Mesh(
      new THREE.CircleGeometry(0.026, 16),
      new THREE.MeshBasicMaterial({ color: '#ffefd2' }),
    );
    shine.position.set(-0.07, 0.05, 0.016);
    eye.add(shine);
    skin.add(eye);
    tube(
      Array.from({ length: 20 }, (_, n) => {
        const a = -0.95 + (n / 19) * 1.9;
        return new THREE.Vector3(
          -0.91 + Math.cos(a) * 0.24,
          Math.sin(a) * 0.62,
          side * (0.56 + Math.cos(a) * 0.08),
        );
      }),
      0.018,
      darkRed,
      skin,
    );
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 40), darkRed);
  mouth.position.set(-1.75, -0.05, 0);
  mouth.rotation.y = Math.PI / 2;
  mouth.scale.set(1, 0.8, 1);
  skin.add(mouth);
  const makeFin = (coords: number[][], parent: THREE.Group) => {
    const shape = new THREE.Shape();
    coords.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), finPaper);
    parent.add(mesh);
    tube(
      coords.map(([x, y]) => new THREE.Vector3(x, y, 0.01)),
      0.017,
      gold,
      parent,
      true,
    );
    return mesh;
  };
  const tail = new THREE.Group();
  fins.add(tail);
  makeFin(
    [
      [1.5, 0.15],
      [2.15, 0.58],
      [2.95, 1.04],
      [2.7, 0.35],
      [2.5, 0],
      [2.85, -0.88],
      [2.1, -0.51],
      [1.5, -0.14],
    ],
    tail,
  );
  for (let i = 0; i < 13; i++) {
    const a = -1 + (i / 12) * 2;
    tube(
      [
        new THREE.Vector3(1.55, a * 0.13, 0.02),
        new THREE.Vector3(2.13, a * 0.44, 0.04),
        new THREE.Vector3(2.55 + Math.abs(a) * 0.28, a * 0.87, 0.015),
      ],
      0.009,
      gold,
      tail,
    );
  }
  const top = new THREE.Group();
  fins.add(top);
  makeFin(
    [
      [-0.55, 0.85],
      [-0.3, 1.37],
      [0.0, 1.18],
      [0.25, 1.49],
      [0.49, 1.17],
      [0.77, 1.3],
      [1.14, 0.71],
      [0.45, 0.94],
    ],
    top,
  );
  for (let i = 0; i < 6; i++)
    tube(
      [
        new THREE.Vector3(-0.3 + i * 0.23, 0.83, 0.02),
        new THREE.Vector3(-0.2 + i * 0.22, 1.28 - i * 0.045, 0.02),
      ],
      0.01,
      gold,
      top,
    );
  for (const side of [-1, 1]) {
    const fin = new THREE.Group();
    fin.position.set(-0.15, -0.42, side * 0.53);
    fin.rotation.x = side * -0.65;
    makeFin(
      [
        [0, 0],
        [0.5, -0.67],
        [1, -0.78],
        [0.76, -0.12],
        [0.4, 0.04],
      ],
      fin,
    );
    fins.add(fin);
    for (let i = 0; i < 5; i++)
      tube(
        [
          new THREE.Vector3(0.12, 0, 0.012),
          new THREE.Vector3(0.48 + i * 0.12, -0.62 - i * 0.025, 0.012),
        ],
        0.008,
        gold,
        fin,
      );
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 16),
    new THREE.MeshBasicMaterial({ color: '#ffe7ae' }),
  );
  core.scale.set(1.9, 0.9, 0.75);
  frame.add(core);
  const internal = new THREE.PointLight('#ffa35a', 2, 4);
  frame.add(internal);
  group.position.x = -0.32;
  return {
    group,
    setExpansion(amount) {
      skin.position.y = amount * 1.22;
      skin.position.z = amount * 0.22;
      paper.opacity = 0.97 - amount * 0.2;
      fins.position.x = amount * 0.45;
      fins.position.y = -amount * 0.22;
    },
    animate(time) {
      tail.rotation.y = Math.sin(time * 0.9) * 0.075;
    },
  };
}
