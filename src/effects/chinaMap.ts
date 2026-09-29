import * as THREE from 'three';

type Coordinate = [number, number];
type Polygon = Coordinate[][];
type GeoFeature = {
  properties: { adcode: number | string; name: string };
  geometry:
    { type: 'Polygon'; coordinates: Polygon } | { type: 'MultiPolygon'; coordinates: Polygon[] };
};

// Geographic basemap only. The regular red grid is an explicitly labelled visual
// placeholder, NOT a sampled or estimated heritage distribution.
export async function createChinaMap() {
  const response = await fetch(`${import.meta.env.BASE_URL}maps/china-provinces.geojson`);
  if (!response.ok) throw new Error('China basemap unavailable');
  const data = (await response.json()) as { features: GeoFeature[] };
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: { material: THREE.Material & { opacity: number }; opacity: number }[] = [];
  const textures: THREE.Texture[] = [];
  const targets: THREE.Vector3[] = [];
  const project = ([lon, lat]: Coordinate, inset = false) =>
    inset
      ? new THREE.Vector3(2.48 + (lon - 106) * 0.045, -2.12 + (lat - 3) * 0.055, -0.06)
      : new THREE.Vector3((lon - 104.5) * 0.108, (lat - 35.7) * 0.132, -0.06);
  const outline = new THREE.LineBasicMaterial({
    color: '#d1c0a1',
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const emphasis = new THREE.LineBasicMaterial({
    color: '#edc788',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  materials.push({ material: outline, opacity: 0.45 }, { material: emphasis, opacity: 0.95 });
  const insideRing = (x: number, y: number, ring: Coordinate[]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  };
  const mainland: Polygon[] = [];
  for (const feature of data.features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    for (const polygon of polygons) {
      const inset = polygon[0].every((point) => point[1] < 18);
      for (const ring of polygon) {
        const geometry = new THREE.BufferGeometry().setFromPoints(
          ring.map((p) => project(p, inset)),
        );
        geometries.push(geometry);
        group.add(
          new THREE.Line(geometry, feature.properties.adcode === 340000 ? emphasis : outline),
        );
      }
      if (!inset && feature.properties.adcode !== '100000_JD') mainland.push(polygon);
    }
  }
  // Even cartographic grid: no fabricated regional densities or counts.
  for (let lat = 18.25; lat < 54; lat += 0.82)
    for (let lon = 73.25; lon < 135; lon += 0.95) {
      if (
        mainland.some(
          (p) => insideRing(lon, lat, p[0]) && !p.slice(1).some((h) => insideRing(lon, lat, h)),
        )
      )
        targets.push(project([lon, lat]));
    }
  if (!targets.length) throw new Error('China basemap contains no polygons');
  const box = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(2.37, -2.23, -0.06),
    new THREE.Vector3(3.28, -2.23, -0.06),
    new THREE.Vector3(3.28, -0.99, -0.06),
    new THREE.Vector3(2.37, -0.99, -0.06),
    new THREE.Vector3(2.37, -2.23, -0.06),
  ]);
  group.add(new THREE.Line(box, outline));
  geometries.push(box);
  const label = (text: string, x: number, y: number, width: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '32px serif';
    ctx.fillStyle = '#d5c1a0';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 58);
    const texture = new THREE.CanvasTexture(canvas);
    textures.push(texture);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    materials.push({ material, opacity: 1 });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, 0.02);
    sprite.scale.set(width, (width * 96) / 512, 1);
    group.add(sprite);
  };
  label('南海诸岛', 2.82, -2.39, 0.88);
  label('安徽 · 案例观察', 1.93, -0.45, 1.4);
  return {
    group,
    targets,
    fade(opacity: number) {
      materials.forEach((entry) => {
        entry.material.opacity = entry.opacity * opacity;
      });
      group.visible = opacity > 0.002;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((e) => e.material.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
