# Readable Heritage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 将作品改为鱼灯为主、徽墨作对照的清楚叙事，补充已核实的新数据，移除地图，把研究材料收进卷末并前置阅读设置。

**Architecture:** 沿用React、现有事实查询层和制作台。正文改为历史、传播、学习、日常实践四章；历史与各章文字独立维护，图表从核对事实读取。证据中心按人物、记录和方法折叠加载，保持事实与原始台账分离。

**Tech Stack:** React 19、TypeScript、Vite 8、现有Three.js制作台与Playwright／本机Edge。不新增产品依赖。

**Spec:** ../specs/2026-10-12-readable-heritage-design.md

## Global Constraints

- 地图在正文、展开后的证据中心和来源说明中均无入口；运行时不加载地图资源。
- 正文最多使用一次17.1亿次；每个主要数据有明确用途、单位和时间。
- 新增事实带公开来源、出版及复核日期、对象和解释范围；未能核实的候选不进入正文。
- 三条完整人物时间线与94条采集指标审计移入默认折叠的证据中心。
- 顶栏提供阅读设置，手机点击区域不小于44像素；减少动态后正文、来源、制作操作与下载可用。
- 主线按历史、传播、学习、日常实践顺序呈现，结尾有具体积极事实；无虚构采访与未经证明的因果、转化率。
- 保留评论翻阅、印谱、两门制作和本地回访助手；评论创作说明放入来源说明。
- 在当前工作区保留既有资产与旧交付；修改前备份，生产构建与实际静态包验收后才交付新版本。

## Review Focus

1. 存储不可用、系统减少动态与用户手动切换：仍可使用顶栏设置，当前选择立即生效。
2. 动效运行中关闭：视频与物理运动停止，不因已有加载状态继续运行。
3. 证据中心反复开合：人物、来源和方法可查，无重复章节ID、无错误的来源数量。
4. 统计对象不同：院校、期数、人次、工厂合作与营收不相加，不把培训传承人写成游客转学徒。
5. 手机、外网不可用或WebGL失败：正文顺序、来源、工艺按钮、本地助手与问题卡继续工作。

## 文件与接口

- `src/content/public-evidence.json`：新增事实与来源；保留原10组片段编码及原始未知留存字段。
- `src/content/readable-story.ts`（新增）：四章标题、导语、历史节点、主线引用的事实ID与来源ID；不另存重复数字。
- `src/components/ReadableStory.tsx`（新增）：`History()`、`AttentionStory()`、`LearningStory()`、`DailyLifeStory()`四个正文组件，以事实查询生成图表与简洁结论。
- `src/components/ReadingArchive.tsx`：`ReadingArchive({onSource, kind, onKindChange})`，在折叠项内加载现有`PeopleStories`和`EvidenceReader`。
- `src/App.tsx`：四章排列、共享制作案例、顶栏设置、实际设置入口的焦点恢复。
- `src/components/SealAtlas.tsx`：新增`motion?: boolean`属性，默认true；减少动态时使用静态布局并停止物理引擎。
- `src/content/story.ts`、`Overture.tsx`、`Narrative.tsx`、`ViralBurst.tsx`、`reactions.ts`：导航、入口、来源说明、制作引导与冗余文字调整。
- `src/styles/readable-story.css`（新增）及现有样式：正文排版、图表、顶栏按钮、手机布局；沿用现有色彩与字体。
- `tests/readable-story.mjs`（新增）：四章、数据去重、无地图、折叠材料、设置与动效行为的实际浏览器检查。
- 现有事实、浏览器、制作、助手、媒体、包验收脚本：修改因新结构失效的选择器与静态数量，保持原有正确性检查。

### Task 1: 补充事实，建立可追溯的新数据

**Files:** public-evidence.json；readable-story.ts；docs/research/2026-10-12-readable-story-sources.md；tests/public-evidence.mjs；tests/submission-facts.mjs。

**Interfaces:** 新事实沿用`{id, stage, label, valueText, unit, period, scope, sourceId, interpretation, limitation}`，查询仍为`publicMeasure(id)`与`publicSource(id)`；后续正文只保存事实ID。

- [x] 写入来源完整性检查：`training-colleges=149所`、`training-classes=1400余期`、`training-person-times=5.1万人次`对应文化和旅游部2025-06-13原文；`ink-partners=50余家`、`ink-online-revenue=2000多万元`对应人民日报2026-08-05原文。检查完整对象、窗口、来源及唯一ID。
- [x] 运行`npm run test:evidence`，确认新增事实检查先因字段不存在失败。
- [x] 核读并登记上述已找到原文；继续核对鱼灯地方教学的新资料，只接入取得可靠原文的记录。现有暑期700人、青少年八成、19万人次不计作新增。保留原94条台账、10组编码及未知留存；培训人数与营收的解释范围分别说明。
- [x] 再运行`npm run test:evidence`和`node tests/corpus-audit.mjs`，检查来源可解析、事实更新联动、原始台账不变；人工对照每条新数值与原文。
- [x] 保存此任务的代码与研究记录提交；不夹带其他任务或原始报道全文。

### Task 2: 建立四章正文，移除重复的大数字开场

**Files:** readable-story.ts；ReadableStory.tsx；readable-story.css；App.tsx；story.ts；Overture.tsx；Narrative.tsx；ViralBurst.tsx；reactions.ts；tests/readable-story.mjs。

**Interfaces:** 四章锚点依次为`history`、`phenomenon`、`participation`、`after`；制作台保留`craft`，卷末保留`research`。`History`引用历史来源；其他章通过`publicMeasure`读取Task 1的事实。

- [x] 新建浏览器检查：`main`内四章DOM顺序正确，普通正文的`17.1`出现次数不超过1，正文没有长段“可支持／需止步”或连续未知结论；首个入口指向`#history`。
- [x] 在当前页面运行`node tests/readable-story.mjs`，记录旧正文对顺序、次数和入口的失败。
- [x] 实现四章：历史背景与印谱 → 传播现象与头像 → 学习数据与制作台 → 持续制作、教学和支持条件。删去三张重复发现卡及空泛转场；每幅图有明确结论、对象和时间。人物在正文最多保留简短动作描述，具体时间线由Task 3收纳。
- [x] 更新头像段的标题与操作提示，移除主界面创作说明及重复播放数；创作属性移入来源说明。编辑评论库中的17.1亿次重复句，保留语气与翻阅交互。
- [x] 运行新检查，人工读完四章；确认鱼灯仍为主线、徽墨是在同一问题下作对照、结尾以实际学习和制作收束。
- [x] 保存此任务提交。

### Task 3: 整理证据中心，彻底移除地图转场

**Files:** ReadingArchive.tsx；App.tsx；story.ts；SourceDialog.tsx；PeopleStories.tsx；EvidenceReader.tsx；必要的地图文件与静态资源；tests/readable-story.mjs；coverage-reader.mjs；corpus-reader.mjs。

**Interfaces:** `ReadingArchive({onSource, kind, onKindChange})`沿用App的`'fish'|'ink'`状态。人物与研究组件通过lazy/Suspense在读者展开后加载；每个来源保留编号、原文与解释范围。

- [x] 写检查：默认正文中`.people-story`数量为0、地图节点为0；展开人物后数量为3，展开方法后原编码与全部94条台账仍可查。检查两次开合、唯一ID与来源数量。
- [x] 确认旧页面在这些检查中失败。
- [x] 把完整人物、EvidenceReader与CorpusAudit移入默认折叠的证据中心。来源登记根据当前来源数显示，原内容编码分母仍为10；正文来源入口能打开或定位材料。
- [x] 移除SplatGallery入口及地图相关文字和加载链；清理不再使用的地图资产，保留纯鱼灯模型和背景影片。构建检查不再产出用于地图转场的splatViewer块，运行时无地图请求；不只隐藏地图画面。
- [x] 运行新检查、来源覆盖及台账读者检查，更新旧测试的章节选择器；不得删掉来源或台账正确性断言来获得通过。
- [x] 保存此任务提交。

### Task 4: 顶栏阅读设置与真正的减少动态

**Files:** App.tsx；SealAtlas.tsx；useSealPhysics.ts（如需）；Overture.tsx；ViralBurst.tsx；相关样式；tests/readable-story.mjs；editorial-accessibility.mjs。

**Interfaces:** `SealAtlas({onSource, motion=true})`；设置打开函数记录实际触发按钮，关闭后回到该按钮。用户选择仍使用现有`spotlight-motion`、`spotlight-theme`键。

- [x] 写浏览器检查：页面滚动位置为0时可打开顶栏设置，手机目标区域≥44像素；关闭后焦点回到顶栏入口；存储抛错不影响操作。
- [x] 写动效运行中关闭的检查：背景视频暂停，序幕自动播放停止，印谱没有继续物理位移；减少动态后主动制作与来源仍可用。先验证旧页面失败。
- [x] 增加顶栏设置，手机简洁呈现，保留页脚快捷入口；正确处理系统设置与手动选择。把motion传入印谱，关闭时停物理引擎并以静态布局呈现，开启后正常恢复；现有背景流体与影片沿用卸载／暂停行为。
- [x] 在320、390、768、1440像素运行设置检查，并复查键盘、系统减少动态、夜读和异常存储。
- [x] 保存此任务提交。

### Task 5: 全文编辑与现有功能回归

**Files:** 正文组件与内容；local-reply.ts（知识关联如需）；tests/browser.mjs；integrated-story.mjs；effects.mjs；games.mjs；production-reading.mjs；local-reply-browser.mjs；提交说明。

**Interfaces:** 原制作、来源弹窗、本地助手和问题卡的公开行为继续沿用；章节和方法测试改为新结构。

- [x] 人工逐段检查标题、导语、图注、按钮和结尾：删空泛悬念与重复说明，保留真实的对象、年份和单位。地图、旧主线、旧版号的用户可见说明同步更新。
- [x] 适配原测试，保留两门完整制作、共享案例、进度、键盘、重置、来源、本地回访与问题卡内容检查；map-context的旧保留断言改为地图不存在及无请求检查。
- [x] 运行`npm run test:browser`、`npm run test:games`、`npm run test:reply`、`npm run test:media`和新正文检查。对应脚本指向当前开发服务，不重复启动已有服务。
- [x] 运行生产构建并启动预览；阻断外网、使WebGL不可用时复查正文、来源、工艺回退与本地工具。检查桌面／手机截图，修复实际发现的问题。
- [x] 保存此任务提交并记录实际通过项目，不把旧版本验收当作本轮通过。

### Task 6: 交付与逐项完成审计

**Files:** package.json／lock；README.md；docs/v1-submission-delivery.md；新版本验收说明；scripts/delivery.mjs；verify-delivery-archives.mjs；tests/submission-package.mjs；交付目录。

**Interfaces:** 版本统一为V1.4；新包目录`交付文件/网站交付/V1.4-清晰主线版`。打包仍提供成品、源码、核对CSV与SHA-256清单；动态事实数量从当前数据读取。

- [x] 同步版本、阅读顺序、设置入口、证据中心和新数据说明。验收脚本不再假定永远17条事实／10个来源；仍精确比对当前数据、包内CSV与文件清单。
- [x] 运行`npm run build`及相应事实／主线／功能检查；通过后保存`v14-readable-verified`备份。
- [x] 生成新成品与源码ZIP，不覆盖旧交付；真实解压，逐项校验哈希，启动解压包预览，检查390与1440像素、外网不可用、本地素材、下载和来源。
- [x] 对照Spec的7项验收与用户每项要求记录证据路径；任何缺项继续实现或核查，不按分数或测试数量宣布完成。
- [x] 完成后提供成品包、维护源码、验收记录和预览方式。只有全部要求证实完成后才将goal标为complete。

## 执行方式与当前状态

设计与计划均已获用户批准，执行方式为当前目录直接实现并最终独立复核。六项任务已完成；独立复核问题已修复，成品与源码ZIP真实解压、1172项哈希及静态成品运行均通过。最终证据见交付目录的交付验收.json及评审与验收.md。
