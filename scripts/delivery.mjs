import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const project = process.cwd();
const projectVersion = JSON.parse(
  await readFile(path.join(project, 'package.json'), 'utf8'),
).version;
const baseEdition = `V${projectVersion.split('.').slice(0, 2).join('.')}`;
const label = process.argv[2] || '';
if (label && !/^[\p{L}\p{N}_-]+$/u.test(label))
  throw new Error('Delivery label must contain only letters, numbers, underscores or hyphens.');
const edition = label ? `${baseEdition}-${label}` : baseEdition;
const bundleRoot = path.resolve(project, '../交付文件/网站交付', edition);
const version = `被看见之后_${edition}`;
const web = path.join(bundleRoot, `${version}_成品`);
const source = path.join(bundleRoot, `${version}_源码`);
const exists = await readdir(bundleRoot).catch(() => []);
if (exists.length)
  throw new Error(
    'Delivery directory already contains a package. Use a new version directory to preserve the previous delivery.',
  );
await mkdir(web, { recursive: true });
await mkdir(source, { recursive: true });
await cp(path.join(project, 'dist'), path.join(web, 'site'), { recursive: true });
await cp(path.join(project, 'scripts/delivery-server.ps1'), path.join(web, 'preview.ps1'));
await writeFile(
  path.join(web, '打开作品.cmd'),
  '@echo off\r\ncd /d "%~dp0"\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview.ps1" -OpenBrowser\r\nif errorlevel 1 pause\r\n',
);
const evidence = JSON.parse(
  await readFile(path.join(project, 'src/content/public-evidence.json'), 'utf8'),
);
const releaseDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const instructions = `被看见之后 · 未完的长卷
${edition} 本地交付版 / ${releaseDate}

1. 将整个压缩包解压后，再双击“打开作品.cmd”。
2. Windows自带PowerShell会启动本地预览，无需Node或npm。
3. 保持启动窗口打开；浏览器会打开实际空闲端口，请以窗口显示的地址为准。

阅读顺序：手艺来历与印谱 → 灯火出圈 → 课堂与工坊 → 三维制作 → 日常接续 → 证据中心。
顶栏可随时打开阅读设置、减少动态。开篇另有制作和资料的直达入口。
地图已移除；人物时间线、方法和采集台账默认收在卷末折叠项。

正文、数据、头像、印谱、制作台、原创静音灯影、本地回访助手和问题卡均在包内。
背景灯影由原生video呈现，无第三方播放器界面；减少动态和播放失败时显示静帧。
回访助手只在浏览器内整理问题与公开资料，不请求模型接口；下载问题卡不上传输入。
原文与参考影像的外链需要网络。

事实登记：${evidence.measures.length}项事实、${evidence.sources.length}项来源；原10组片段编码、94条采集指标另列。
统计单位、对象与时间按记录保留；研培人次、年制作能力与营收不换算成游客成为学徒的比例。
评论与影像的创作说明见来源说明，不当作采访记录。

site目录可静态托管，请通过HTTP访问；直接双击index.html不能完整运行模块。`;
await writeFile(path.join(web, '先读我.txt'), '\uFEFF' + instructions);

const csvCell = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const csv = (rows) =>
  '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
const sourceById = new Map(evidence.sources.map((item) => [item.id, item]));
await writeFile(
  path.join(web, '核对用_证据记录.csv'),
  csv([
    [
      '事实编号',
      '指标',
      '值',
      '单位',
      '时间窗',
      '对象范围',
      '可支持',
      '解释边界',
      '来源',
      '原文链接',
    ],
    ...evidence.measures.map((item) => [
      item.id,
      item.label,
      item.valueText,
      item.unit,
      item.period,
      item.scope,
      item.interpretation,
      item.limitation,
      sourceById.get(item.sourceId).title,
      sourceById.get(item.sourceId).url,
    ]),
  ]),
);
await writeFile(
  path.join(web, '核对用_来源片段编码.csv'),
  csv([
    [
      '组编号',
      '选取片段',
      '被关注',
      '到访体验',
      '实名实践',
      '同批追踪',
      '判断备注',
      '来源',
      '原文链接',
    ],
    ...evidence.coverage.map((item) => [
      item.id,
      item.label,
      item.attention ? 1 : 0,
      item.participation ? 1 : 0,
      item.namedPractice ? 1 : 0,
      item.sameVisitorFollowup ? 1 : 0,
      item.note,
      sourceById.get(item.sourceId).title,
      sourceById.get(item.sourceId).url,
    ]),
  ]),
);
const reports = JSON.parse(await readFile(path.join(project, 'src/content/reports.json'), 'utf8'));
const heritage = JSON.parse(
  await readFile(path.join(project, 'src/content/heritage.json'), 'utf8'),
);
const reportSourceById = new Map(reports.sources.map((item) => [item.id, item]));
await writeFile(
  path.join(web, '核对用_采集指标台账.csv'),
  csv([
    [
      '原行编号',
      '指标',
      '采集值',
      '单位',
      '时间窗',
      '对象',
      '地区',
      '主题',
      '原复核状态',
      '原文链接',
    ],
    ...reports.indicators.map((item) => [
      item.id,
      item.label,
      item.valueText,
      item.unit,
      item.period,
      item.object,
      item.region,
      item.topic,
      item.status,
      item.sourceIds.map((id) => reportSourceById.get(id)?.url ?? '').join(' | '),
    ]),
  ]),
);
await writeFile(
  path.join(web, '核对用_线索笔记.csv'),
  csv([
    ['笔记编号', '主题', '用途', '发布方', '待复核摘要', '原复核状态', '网页链接'],
    ...heritage.leads.map((item) => [
      item.id,
      item.topic,
      item.kind,
      item.publisher,
      item.summary_unverified,
      item.status,
      item.source_url,
    ]),
  ]),
);
await cp(path.join(project, 'docs/v1-submission-delivery.md'), path.join(web, '作品与交付说明.md'));
const allowed = [
  'src',
  'public',
  'scripts',
  'tests',
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  '.env.example',
  '.npmrc',
  'AGENTS.md',
  '.prettierrc.json',
  '.gitignore',
  '打开网站.cmd',
];
for (const entry of allowed) {
  await cp(path.join(project, entry), path.join(source, entry), { recursive: true }).catch(
    (error) => {
      if (error.code !== 'ENOENT') throw error;
    },
  );
}
await mkdir(path.join(source, 'docs'), { recursive: true });
for (const file of [
  'v1-submission-delivery.md',
  'local-reply.md',
  'v10-submission-plan.md',
  'v11-quality-review.md',
  'v12-final-delivery.md',
  'v14-readable-delivery.md',
]) {
  await cp(path.join(project, 'docs', file), path.join(source, 'docs', file));
}
await mkdir(path.join(source, 'docs/research'), { recursive: true });
for (const file of ['corpus-audit.md', 'lantern-film.md', '2026-10-12-readable-story-sources.md']) {
  await cp(path.join(project, 'docs/research', file), path.join(source, 'docs/research', file));
}
await writeFile(
  path.join(source, 'README.md'),
  `# 被看见之后 ${edition}\n\n成品包无需开发环境。源码维护需要Node.js 22.12+或24系列，在此目录运行\`npm ci\`、\`npm run dev\`；构建使用\`npm run build\`。\n\n公开事实：src/content/public-evidence.json。重复展示与指标关联：src/content/report-view.ts。交付采集台账：src/content/reports.json，保留原值，不直接作为正文事实替代品。\n\n不含密钥、node_modules、缓存、原始交付表和完整报告。回访助手和问题卡均无需接口、密钥与模型余额，维护说明见docs/local-reply.md。开发服务仅监听本机。\n`,
);
const manifest = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(file);
    else {
      const bytes = await readFile(file);
      manifest.push({
        path: path.relative(bundleRoot, file).replaceAll('\\', '/'),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
}
await collect(web);
await collect(source);
await writeFile(
  path.join(bundleRoot, '文件清单.json'),
  JSON.stringify({ edition, date: '2026-10-03', files: manifest }, null, 2),
);
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
for (const folder of [web, source]) {
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -LiteralPath ${quote(folder)} -DestinationPath ${quote(folder + '.zip')} -CompressionLevel Optimal`,
    ],
    { stdio: 'inherit' },
  );
}
console.log(JSON.stringify({ bundleRoot, web, source, files: manifest.length }, null, 2));
