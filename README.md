# 被看见之后 · 未完的长卷

V1.3 静态回访版。围绕安徽鱼灯与徽墨，区分传播热度、现场体验、实名实践与仍待开展的同批追踪。

本站完全静态，无需服务器、模型账户、密钥或付费域名。回访助手支持自由输入、逐字回复、停止与继续、上下文追问、来源链接和问题卡下载；建议由本作品资料与预设提纲组合，不是通用大模型或实际采访回信。

## 发布到 GitHub Pages

创建一个独立的公开仓库，将本目录内容上传到 main 分支。进入仓库 Settings → Pages，Source 选择 Deploy from a branch，Branch 选择 main，目录选择 /docs，点击 Save。发布完成后使用 GitHub 给出的正式链接。旧比赛仓库无须修改。

必须把 docs、src、public 等目录及全部文件一起提交，不要只上传 index.html。公开目录 docs 已包含编译后的作品；.nojekyll 防止额外的站点转换。源码与成品不含个人密钥、缓存、历史备份和原始交付调查文件。

## 维护

使用 Node.js 24。npm ci 安装依赖；npm run dev 本地编辑；npm run build 构建。

源码修改后，将 dist 的内容同步到 docs，再提交到 GitHub，Pages 即会更新。更新前保存备份，事实数字仍从 src/content/public-evidence.json 读取。详细说明见 documentation/local-reply.md。

回复验证：npm run test:reply（先启动 npm run preview）；GitHub 项目路径验证：node tests/github-pages.mjs。

静态功能可以在不连接模型服务时完整运行，原文链接需联网。GitHub Pages 在中国大陆的速度与可达性需要正式上线后通过不同运营商实测，不能仅凭本地通过就保证所有人都能访问。
