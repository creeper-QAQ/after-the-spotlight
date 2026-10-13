# 被看见之后 · 未完的长卷

当前为V1.4清晰主线版。作品以鱼灯为主、徽墨作对照，按手艺来历、灯火出圈、坐下学艺、日常接续四章阅读。地图已移除，完整人物记录与研究材料集中到卷末证据中心。

## 打开作品

交付目录：项目根目录“交付文件/网站交付/V1.4-清晰主线版”。完整解压成品ZIP后，Windows电脑双击“打开作品.cmd”。无需Node或npm；保持启动窗口打开，浏览器会打开实际空闲端口。

正文、头像、印谱、制作台、灯影和本地回访工具均随包提供。原文与参考影像通过外链查阅。阅读设置在顶栏，从开篇即可减少动态；图表、来源与制作操作仍可使用。

## 阅读与资料

历史背景 → 百工印谱 → 传播现象与头像 → 真实学习场景 → 三维制作 → 日常制作、经营与研培 → 证据中心。开篇也可直接进入制作或查阅资料。

正文播放量只使用一次，学习和日常实践采用不同的已核对事实。本轮新增7项，事实登记共24项、来源13项。人物时间线、原10组片段编码、全部94条台账的结构审计默认折叠，来源编号可直接定位对应原文。

事实维护：src/content/public-evidence.json与evidence.ts；正文文字：readable-story.ts与ReadableStory.tsx；原始清洗台账：reports.json；重叠展示的事实关联：report-view.ts。日期只知道年份的名录按年份记录，不补造月日。

评论、头像和灯影的创作说明收在来源说明。未采集的数据没有改成真实采访、转化率或留存率；原10组选片段编码与新补充的事实资料分别登记。

## 维护与验证

开发需要Node.js22.12+或24系列。在website目录运行npm ci、npm run dev；生产构建运行npm run build。发布成品通过HTTP访问，直接双击index.html不能完整运行模块。

主要检查：npm run test:evidence、node tests/readable-story.mjs、npm run test:browser、npm run test:games、npm run test:reply、npm run test:media、npm run test:effects、npm run test:coverage和npm run test:corpus。通过TEST_BASE_URL选择已启动的本地服务。

新主线截图与记录在artifacts/readable-story，原有功能检查保存在各脚本声明的artifacts目录。事实、全台账复算、WebGL回退、减少动态和静态交付分别验收；不把手机尺寸模拟称作实体设备认证。

运行npm run delivery -- 清晰主线版生成成品、源码与文件哈希清单。交付目录的“交付验收.json”记录实际ZIP解压和运行检查；完整说明见docs/v1-submission-delivery.md。

不打包密钥、node_modules、缓存、版本备份、原始采集表和完整报道。修改前备份，旧交付和回档点继续保留。
