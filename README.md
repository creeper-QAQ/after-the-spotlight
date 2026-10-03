# 被看见之后 · 未完的长卷

当前版本为V1.3静态回访版。围绕安徽鱼灯与徽墨，把关注、现场体验与实名实践放回各自的来源、时间和范围；同一批体验者的持续学习比例仍未知。完整交付说明、验收记录与材料边界见 [交付记录](docs/v1-submission-delivery.md)。

## 打开成品

成品包在项目根目录的“交付文件/网站交付/V1.3-静态回访版”。将成品压缩包完整解压后，Windows电脑双击“打开作品.cmd”；系统自带PowerShell会启动仅供本机访问的预览，浏览器自动打开实际预览地址，默认从4180端口起选择空闲端口。保持启动窗口打开。无需安装Node或npm。

包内site目录可用于静态托管，完整保留文件结构并通过HTTP访问。正文、头像、印谱、地图、三维工坊与原创灯影素材均随包交付；原文和第三方参考影像通过外链查阅。减少动态时使用同源静帧。回访问题卡可在本地编辑和下载；回访助手支持自由输入、多主题建议、上下文追问和逐字回复；在浏览器本地运行，不调用AI接口。

## 阅读与交互

纸灯序幕 → 三条主要发现 → 热度记录 → 头像与298条原创声音示意 → 99枚百工印谱 → 地图点云聚成鱼灯 → 证据尺度、调查板与94条记录的单位分组 → 三条实名人物路径 → 鱼灯与徽墨各四阶段制作 → 结论与回访。当前头像库含507张，按桌面每批132张、手机每批66张呈现，不一次铺满。

开篇可以直接进入制作或查阅资料。切换鱼灯、徽墨会同步调查板、人物标记与制作台，分别保留两门制作的进度。卷末提供原文来源、证据登记、安徽名录与资料台账。阅读设置支持减少动态、素白与夜读；WebGL失败时保留文字和操作入口。

## 事实与编码

- src/content/public-evidence.json：10份公开来源、17条带口径事实、3条人物路径、10组来源片段，以及判定规则和解释边界。
- src/content/evidence.ts：事实查询、四项编码定义与从记录实时计算的计数。
- src/content/report-view.ts：已核对事实与报告精选、指标的关联展示。更改核对值时，重复展示同步变化。
- src/content/corpus-audit.ts：全量复算94条台账记录的单位、时间字段及30条笔记对应的14个URL；是元数据统计，不对待复核原文作事实推断。
- src/content/reports.json：原始清洗交付台账，保留94条去重后的指标和复核状态，不替代正文核对记录。
- src/content/heritage.json：安徽交付名录；逐条原文待复核和人物待匹配状态在界面中保留。

编码单位是一份来源对应的一组相关片段，各项可以同时出现。它不是全网检索全集，不估计行业总体比例，不证明传播导致传承，也尚未做独立双人编码一致性检验。头像与评论为叙事示意，地图点位为原创视觉意象，四阶段工坊不代表完成培训。

## 维护源码

需要Node.js 22.12+或24系列。在website目录运行：

```powershell
npm ci
npm run dev
```

开发预览：http://127.0.0.1:5173/ 。已有依赖无需重复安装。生产构建：npm run build；成品预览：npm run preview。本版无需服务器接口或密钥。回访助手说明见 [维护说明](docs/local-reply.md)。

主线与导航改src/App.tsx，文字和工艺说明改src/content/story.ts，主色和字体改src/styles/tokens.css，制作模型位于src/scene。保留已有混合未提交修改；每轮先运行npm run backup -- before-edit，验证后再保存有意义的版本，不覆盖.versions。

## 验证

```powershell
npm run test:evidence
npm run test:coverage
npm run test:corpus
npm run test:media
npm run test:reply
npm run test:browser
npm run test:games
npm run test:effects
npm run test:scroll
npm run build
```

浏览器检查默认使用本机Edge与开发预览。交付服务启动后运行npm run test:delivery验证静态版及外网不可用时的阅读；完整文件哈希检查使用CHECK_DELIVERY_FILES=1。V1.2新增检查为node tests/final-delivery.mjs，截图和结果位于artifacts/final-delivery；既有检查结果位于artifacts/ninety-polish，交付核对使用TEST_EDITION与DELIVERY_ROOT指定版本。

npm run delivery -- 交付版生成新的成品包、维护源码包与文件哈希清单。它保留已有交付目录；需要再生成时使用新的版本目录。包内不含node_modules、密钥、版本备份、原始交付表和完整报告。
