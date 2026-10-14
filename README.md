# 被看见之后 · 未完的长卷

当前版本：V1.4 清晰主线版。

[访问网站](https://creeper-qaq.github.io/after-the-spotlight/) · [浏览旧版归档](archives/2026-10-13-before-v1.4/README.md)

网站由 GitHub Pages 从 main 分支的 /docs 发布。源码位于 src，资源位于 public，维护说明位于 documentation。

维护：Node.js 22.12+ 或 24，运行 npm ci、npm run dev；npm run build 后将 dist 内容同步到 docs。源码包没有原始调查文件、完整报告、密钥、缓存或依赖目录。

回访助手在浏览器本地整理资料，不调用模型接口。来源、统计口径与创作说明保留在页面中。


## 网站版本切换

顶部的“版本”入口可在新版 V1.4 与旧版 V1.3 间切换。默认地址打开新版；旧版地址为 https://creeper-qaq.github.io/after-the-spotlight/legacy/ 。两个版本均可返回对方。旧版网页来自原归档，仅补充切换入口，原归档压缩包与分支不变。

切换入口为 public/version-switch.js 与 public/version-switch.css；旧版公开页面位于 public/legacy，构建时一并复制到 dist。
