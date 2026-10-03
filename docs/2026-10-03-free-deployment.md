# 2026-10-03 免费发布路线更新

用户确认改为纯静态回访助手，并要求新建独立 GitHub 仓库，保留旧比赛仓库 digital-siege-data-news。因此，先前准备的 Vercel/Netlify 服务适配已移除，密钥文件没有复制或公开。

当前版本：V1.3。全部网页功能和本地回访助手均可放在 GitHub Pages。自由输入经主题、意图、上下文识别组合回复；逐字显示、停止、继续、来源、历史与问题卡均在浏览器运行。不是通用大模型，复杂问法与未收录事实仍有能力边界。

本地静态上线包和源码包采用独立交付目录；正式仓库建议名 after-the-spotlight。网站成品发布目录为 docs，选择 main 分支 /docs 作为 GitHub Pages 来源。源码可维护并重新构建，无需 Vercel、模型账户或付费域名。

检查：npm run build、npm run test:reply、npm run test:browser、node tests/final-delivery.mjs、node tests/production-reading.mjs，以及 GitHub 项目子路径静态预览。更新前备份 20261003T113423Z-before-edit-cb14db。

GitHub 账号已由连接核实为 creeper-QAQ，但当前连接没有创建仓库的工具，电脑没有可用的非交互 Git 凭据。只有实际完成仓库创建、上传、Pages 配置并验收公开地址，才算上线完成。现有比赛仓库没有修改。

大陆网络：GitHub Pages 默认域名可能受网络条件影响。本地问答改造解决服务和费用问题，不保证全部大陆运营商都能访问。上线后仍需关闭 VPN，使用宽带和手机流量测试公开地址；学校现有网站子域或部署目录是可进一步确认的免费国内资源。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
