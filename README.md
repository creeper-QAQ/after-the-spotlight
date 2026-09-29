# 被看见之后 · 未完的长卷

用于校对视觉、交互与报道结构的数据新闻原型。已接入公开报道、安徽项目与传承人交付表的清洗结果，以及鱼灯和徽墨资料线索。安徽交付表仍需补逐条原文复核；可比传播序列、去重参与人数和同一批人的后续追踪尚未交付。三维模型是原创视觉示意。

## 预览

在本目录双击 `打开网站.cmd`。或者在终端进入本目录：

```powershell
npm ci
npm run dev
```

浏览器打开 http://127.0.0.1:5173 。如果依赖已经安装，不必再次运行 npm ci。需要 Node.js 22.12+ 或24系列。此地址仅供本机预览，未发布到互联网。

已有预览运行时直接打开地址。若提示5173被占用，使用已有预览，或在另一个终端运行 `npm run dev -- --port 5174`。

## 这版可以校对什么

- 暖纸底色、宋体标题、朱红重点、墨黑收尾；页脚“阅读设置”可以切换暖纸、素白、夜读及减少动态。
- 首屏以可播放、暂停和拖动的纸灯序幕展开“纸骨—灯火—流转”；原创图形由 Remotion 驱动。“灯火扩散”章节以滚动粒子场呈现鱼灯被看见的声势，旁边呈现分清口径的新华社报道数字。粒子数量是视觉意象，不是实际传播数据。
- V0.7「百工印谱」把99条真实子项化作可点选的印记，可在散落、类别和认定年份之间重排；记录身份与来源不变。结尾「续线台」通过三次牵线与追问，引导观众思考从相遇到持续学习的距离。操作结果不作为调查数据。
- 长统计表与资料线索折叠为资料附页，保留查阅入口。新交互验证：`npm run test:scroll`。
- 鱼灯四道、徽墨六道工序在作品画面上直接操作；骨架、纸面、鳞纹、烟料与墨锭会随进度变化。它是工艺关系的体验，不是完整技艺教程。
- 四段调查路径：界定热度、观察参与、追踪案例、核对结论。案例段落接入有日期和来源的公开报道；交互证据图呈现报道之间尚未建立的同一批人关联。
- 安徽名录和人物模块使用真实交付表：99条地区或单位子项、143位名录人物，可按类别、地区、批次、出生年代和项目关联查阅。资料线索可按主题与类型筛选。图表旁保留口径与待复核提示；地图红点仍只承担转场动效。

- V0.5：保留实时点墨、地图点云与证据墙，新增来源支撑的灯火扩散镜头与直接操作的二维虚拟工坊。减少动态时保留阅读与按钮操作。
- 效果验证：`npm run test:effects`；制作体验验证：`npm run test:games`；本轮设计与口径见 `docs/v05-viral-burst-craft-studio.md`。

## 怎么修改

| 要修改的内容 | 文件 |
| --- | --- |
| 全站主色、底色、字体、留白参数 | `src/styles/tokens.css` |
| 标题、开场文案、工艺卡片、来源说明 | `src/content/story.ts` |
| 安徽交付数据 | 根目录 `data_pipeline/clean_delivery.py` 生成 `src/content/heritage.json` |
| 已核对报道、指标与来源记录 | `src/content/data.ts` |
| 章节构成与导航 | `src/App.tsx` |
| 调查正文与数据位置 | `src/components/Narrative.tsx` |
| 滚动证据墙 | `src/components/EvidenceWall.tsx` |
| 灯火扩散可视化 | `src/effects/ViralBurst.tsx` |
| 鱼灯与徽墨虚拟工坊 | `src/components/CraftStudio.tsx` |
| 名录图表与缺口说明 | `src/components/CatalogueViz.tsx` |
| 人物与资料线索探索 | `src/components/DeliveryExplorers.tsx` |
| 鱼灯与徽墨几何、材质 | `src/scene/fish.ts`、`src/scene/ink.ts` |
| 相机、灯光、模型运行与资源释放 | `src/scene/viewer.ts` |
| 手机适配 | `src/styles/responsive.css` |

页面数据与模型相互独立。后续替换模型不需要重写正文；接入数据也不需要重画首屏。

代码已按统一规则展开排版。修改后可运行 `npm run format` 自动整理，`npm run format:check` 检查格式。

## 数据接入说明

`dataset.catalogue` 由清洗结果生成；网站用 `src/content/heritage.json` 保存安徽项目、人物、确认的关联和资料线索。不要手工覆盖生成文件。清洗范围、问题清单和图表口径见 `docs/v06-delivery-data.md` 与项目根目录 `交付文件/清洗结果_20260928/清洗说明.md`。

`dataset.people`：保留有公开报道的案例人物；143位名录人物在 `heritage.json` 中单独维护，不能与案例报道直接合并为同一批人的追踪记录。

`dataset.indicators`：包含 `id / stage / label / valueText / unit / period / scope / sourceId`，保留原文中的“约”“余”等限定词，不把不同口径强行比较。

`dataset.caseEvents`：包含 `id / caseId / stage / date / actor / event / sourceId`，只有来源确认同一人或同一批人的跨期关联时才添加相同的 `subjectId`。证据墙的断线提醒当前仍缺少这类追踪。

`dataset.sources`：保留 `id / title / url / accessedAt / note`。新增事实必须同时添加来源记录，并检查正文结论、状态标签、来源弹窗和方法说明。当前已接入的具体出处见 `docs/v03-evidence-narrative.md`。

全国项目与地区子项分开；国家级与地方级分开；模型示意与实物影像分开。数据缺失不可填零。

## 备份与回档

每次启动开发预览和生产构建前，都会自动创建一份源码快照。后续助手还需遵守 `AGENTS.md`，在每轮修改前保存快照。

手动保存：双击 `备份当前版本.cmd`，或运行：

```powershell
npm run backup -- 调整首页前
npm run versions
```

快照保存在 `.versions/版本编号/`，包含源码、配置、说明和依赖锁文件，并对每个文件记录SHA-256及文件大小。依赖目录、构建缓存、测试截图和既有备份不重复保存。

恢复：双击 `查看与恢复版本.cmd`，先从列表复制完整版本编号；或运行：

```powershell
npm run restore -- 完整版本编号
```

恢复会先校验旧快照，然后备份当前工作，再把旧版复制到 `.recoveries/版本编号-restored-随机码/`。**当前文件不会被覆盖。** 在新目录运行 `npm ci`、`npm run dev -- --port 5174` 即可与当前版本并排比较。确认采用旧版时，直接以该恢复目录继续工作，或由助手在先备份的前提下执行版本迁移。

快照文件损坏时拒绝恢复；非法路径拒绝恢复；每次恢复都使用全新目录，不与旧恢复目录混写。还原依赖使用 `package-lock.json` 和 `npm ci`。

这是本机版本回档机制，不是异地容灾备份。需防硬盘损坏时，可以将整个 `.versions` 文件夹复制到其他磁盘。

## 验证与构建

```powershell
npm run build
npm run test:versions
npm run test:browser
```

浏览器检查默认访问5173，使用本机 Microsoft Edge。其他机器可通过环境变量 `BROWSER_PATH` 指定Chromium浏览器路径；用 `PREVIEW_URL` 指定测试地址。截图和测试输出位于 `artifacts`。

`dist` 为生产构建结果，需要HTTP静态服务预览，不建议双击其中的HTML。`npm run preview` 默认在4173启动生产预览。

## 已知边界

- 模型与地图点阵是视觉示意；公开报道的单点指标不能代替总体统计和因果判断。
- 三维模块约146KB gzip，按需载入；初始化失败时有静态图，正文不依赖WebGL。已做离屏暂停和减少动态支持，未宣称在所有手机型号上达到相同帧率。
- 中国行政底图已接入，红点仍为动效占位；尚无经核验的非遗项目地点数据、扫描工坊、采访音频或后台系统。
- 字体使用本机可用字体，不从外部服务加载；不同系统的宋体字形可能略有区别。
- 当前无需API密钥、收费接口或外部图像资源。
