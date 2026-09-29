import { useEffect, useRef, useState } from 'react';
import type { ForceGraph3DInstance } from '3d-force-graph';
import { Icon } from '../components/Icon';

const dimensions = [
  { id: 'craft', label: '手艺', text: '工艺如何被学习、实践和记录？' },
  { id: 'people', label: '传承人', text: '具体的人怎样延续一门手艺？' },
  { id: 'learner', label: '学习者', text: '从一次体验，到持续练习。' },
  { id: 'place', label: '地方', text: '手艺与地方生活如何相连？' },
  { id: 'community', label: '社区', text: '节庆、协作与日常参与。' },
  { id: 'workshop', label: '工坊', text: '材料、工具与制作的空间。' },
  { id: 'record', label: '记录', text: '影像、名录与公开资料。' },
  { id: 'audience', label: '观看者', text: '关注怎样走近具体实践？' },
];
export function RelationshipGraph({ motion }: { motion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraph3DInstance | null>(null);
  const [selected, setSelected] = useState(dimensions[0]);
  const [status, setStatus] = useState('waiting');
  const choose = useRef<(id: string) => void>(() => {});
  useEffect(() => {
    const target = host.current!;
    let disposed = false;
    let cleanup = () => {};
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0].isIntersecting;
        if (graph.current) {
          visible ? graph.current.resumeAnimation() : graph.current.pauseAnimation();
        }
        if (!visible || started) return;
        started = true;
        Promise.all([import('3d-force-graph'), import('three')])
          .then(([{ default: ForceGraph }, THREE]) => {
            if (disposed) return;
            try {
              const nodes = dimensions.map((item, i) => ({
                ...item,
                x: Math.cos(i * 2.399) * 65,
                y: Math.sin(i * 2.399) * 55,
                z: ((i % 3) - 1) * 40,
              }));
              const links = [
                ['craft', 'people'],
                ['craft', 'learner'],
                ['craft', 'place'],
                ['craft', 'workshop'],
                ['people', 'learner'],
                ['place', 'community'],
                ['community', 'people'],
                ['record', 'craft'],
                ['audience', 'record'],
                ['audience', 'community'],
              ].map(([source, target]) => ({ source, target }));
              const resources: { dispose: () => void }[] = [];
              const instance = new ForceGraph(target, {
                controlType: 'orbit',
                rendererConfig: { alpha: true, antialias: true },
              });
              graph.current = instance;
              instance
                .width(target.clientWidth)
                .height(345)
                .backgroundColor('#00000000')
                .showNavInfo(false)
                .nodeLabel('label')
                .nodeThreeObject((node) => {
                  const group = new THREE.Group();
                  const geometry = new THREE.SphereGeometry(
                    node.id === 'craft' ? 5.4 : 3.6,
                    20,
                    14,
                  );
                  const material = new THREE.MeshBasicMaterial({
                    color: node.id === 'craft' ? '#b3412a' : '#9b8060',
                  });
                  group.add(new THREE.Mesh(geometry, material));
                  resources.push(geometry, material);
                  const canvas = document.createElement('canvas');
                  canvas.width = 384;
                  canvas.height = 128;
                  const ctx = canvas.getContext('2d')!;
                  ctx.font = '500 56px "Microsoft YaHei",sans-serif';
                  ctx.fillStyle = '#ac7d51';
                  ctx.textAlign = 'center';
                  ctx.fillText(
                    String(dimensions.find((d) => d.id === node.id)?.label ?? ''),
                    192,
                    78,
                  );
                  const texture = new THREE.CanvasTexture(canvas);
                  const labelMaterial = new THREE.SpriteMaterial({
                    map: texture,
                    depthWrite: false,
                  });
                  const sprite = new THREE.Sprite(labelMaterial);
                  sprite.scale.set(50, 17, 1);
                  sprite.position.y = 12.5;
                  group.add(sprite);
                  resources.push(texture, labelMaterial);
                  return group;
                })
                .linkColor(() => '#a28360')
                .linkOpacity(0.48)
                .linkWidth(0.6)
                .linkDirectionalParticles(motion ? 2 : 0)
                .linkDirectionalParticleWidth(1.1)
                .linkDirectionalParticleSpeed(0.005)
                .cooldownTicks(80)
                .graphData({ nodes, links })
                .cameraPosition({ z: 245 });
              instance.d3Force('charge')?.strength(-90);
              instance.d3Force('link')?.distance(55);
              const controls = instance.controls() as {
                enableZoom: boolean;
                enablePan: boolean;
                autoRotate: boolean;
                autoRotateSpeed: number;
              };
              controls.enableZoom = false;
              controls.enablePan = false;
              controls.autoRotate = motion;
              controls.autoRotateSpeed = 0.3;
              instance.renderer().setPixelRatio(Math.min(devicePixelRatio, 1.5));
              choose.current = (id) => {
                const item = dimensions.find((d) => d.id === id)!;
                setSelected(item);
                const node = nodes.find((n) => n.id === id)!;
                instance.cameraPosition(
                  { x: node.x * 1.3, y: node.y * 1.3, z: 220 },
                  { x: node.x, y: node.y, z: node.z },
                  motion ? 800 : 0,
                );
              };
              instance.onNodeClick((node) => choose.current(String(node.id)));
              const resize = new ResizeObserver(() => instance.width(target.clientWidth));
              resize.observe(target);
              setStatus('ready');
              cleanup = () => {
                resize.disconnect();
                instance.pauseAnimation();
                instance._destructor();
                resources.forEach((r) => r.dispose());
                instance.renderer().dispose();
                target.replaceChildren();
                graph.current = null;
              };
            } catch {
              setStatus('unavailable');
              target.replaceChildren();
            }
          })
          .catch(() => {
            if (!disposed) setStatus('unavailable');
          });
      },
      { rootMargin: '180px' },
    );
    observer.observe(target);
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup();
    };
  }, [motion]);
  return (
    <div className="relationship-map" data-status={status}>
      <div className="relationship-top">
        <span className="eyebrow">A LIVING NETWORK</span>
        <span>拖动旋转 · 点击节点</span>
      </div>
      <div ref={host} className="relationship-canvas" aria-label="传承观察维度三维关系示意" />
      {status !== 'ready' && (
        <div className="graph-placeholder">
          人 · 艺 · 地<br />
          <small>
            {status === 'unavailable' ? '三维暂不可用，仍可浏览下方观察维度' : '关系正在浮现'}
          </small>
        </div>
      )}
      <div className="graph-dimensions">
        {dimensions.slice(0, 4).map((d) => (
          <button
            key={d.id}
            aria-pressed={selected.id === d.id}
            onClick={() => {
              setSelected(d);
              choose.current(d.id);
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="graph-caption" aria-live="polite">
        <Icon name="plus" size={14} />
        <p>
          {selected.text}
          <small>观察维度示意 · 非真实人物关系数据</small>
        </p>
      </div>
    </div>
  );
}
