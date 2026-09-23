# 被看见之后 · 网站初版

用于校对视觉、交互与版面结构的数据新闻原型。当前没有正式统计结果；三维模型是原创视觉示意。真实数据仍由组员采集与核验。

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
- 鱼灯的旋转与结构展开；徽墨切换和旋转。模型是程序生成的示意，不是地方实物的精确复原。
- 开场、名录数据、工艺、人物、关注与延续四个正文章节及来源说明。
- 数据展示区域目前用空状态与明确标注的布局示意占位。没有虚构的项目数、传承人或采访。

## 怎么修改

| 要修改的内容 | 文件 |
| --- | --- |
| 全站主色、底色、字体、留白参数 | `src/styles/tokens.css` |
| 标题、开场文案、工艺卡片、来源说明 | `src/content/story.ts` |
| 正式名录、人物、指标及来源记录 | `src/content/data.ts` |
| 章节构成与导航 | `src/App.tsx` |
| 正文章节版面 | `src/components/Sections.tsx` |
| 名录图表与布局示意 | `src/components/CatalogueViz.tsx` |
| 鱼灯与徽墨几何、材质 | `src/scene/fish.ts`、`src/scene/ink.ts` |
| 相机、灯光、模型运行与资源释放 | `src/scene/viewer.ts` |
| 手机适配 | `src/styles/responsive.css` |

页面数据与模型相互独立。后续替换模型不需要重写正文；接入数据也不需要重画首屏。

代码已按统一规则展开排版。修改后可运行 `npm run format` 自动整理，`npm run format:check` 检查格式。

## 数据接入说明

`dataset.catalogue`：每条记录包含 `id / name / category / region / batch / sourceId`。接入非空记录后，名录区域自动切换为按当前维度汇总的条形图；这只是初版通用呈现，最终图形应根据研究结论再设计。

`dataset.people`：包含 `id / name / project / region / description / sourceId`，非空时替换人物占位。

`dataset.indicators`：包含 `id / label / valueText / unit / period / scope / sourceId`，保留原文中的“约”“余”等限定词，不把不同口径强行比较。

`dataset.sources`：保留 `id / title / url / accessedAt / note`。正式接入时还需把每条来源ID连接到对应记录的来源入口，并同步修改“待核验”标签、来源弹窗和方法说明。本版仅提供数据接口与空状态，不代表正式数据发布流程已完成。

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

- 模型与点阵是视觉示意，尚无正式新闻统计。
- 三维模块约146KB gzip，按需载入；初始化失败时有静态图，正文不依赖WebGL。已做离屏暂停和减少动态支持，未宣称在所有手机型号上达到相同帧率。
- 暂未制作真实行政地图、扫描工坊、采访音频或后台系统。
- 字体使用本机可用字体，不从外部服务加载；不同系统的宋体字形可能略有区别。
- 当前无需API密钥、收费接口或外部图像资源。
