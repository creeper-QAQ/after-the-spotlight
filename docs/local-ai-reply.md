> 历史配置说明：V1.3 已改为浏览器本地回访助手，不再提供或调用下列模型接口。现行维护说明见 local-reply.md。

# 本地 AI 回信配置

回访信表单由 Vite 本地开发服务代理到 DeepSeek Chat Completions。网页只请求本站 `/api/deepseek-reply`，密钥不打包进前端。

1. 复制项目根目录 `.env.example` 为 `.env.local`。
2. 在 `.env.local` 填入 `DEEPSEEK_API_KEY=你的密钥`。
3. 重启本地开发预览服务，在页面结尾展开“把问题带去下一次现场”，输入回访问题。服务可用时，问题卡下方会出现“请 AI 回信”。

`.env.local` 已列入 Git 忽略规则。不要把密钥写入源码、截图、交付表或公开仓库。AI 接口收到用户输入后会处理该文本；页面自身不保存信件。公开部署 GitHub Pages 时此本地代理不会运行，需另行配置受控的服务端接口或函数，不能把密钥放入静态网页。

接口调用依据 [DeepSeek官方Chat Completions文档](https://api-docs.deepseek.com/api/create-chat-completion/)。未配置服务时不显示AI按钮；问题卡的编辑和下载始终可用，下载不发送输入内容。收起面板保留本次页面内的草稿，刷新页面后清空。

最终静态包默认不查询AI服务，也不显示AI入口。若维护者已经部署同源的受控服务，可在构建时设置 `VITE_AI_REPLY_ENABLED=true`；这个开关不会创建服务，也不能填入密钥。它只允许前端检查 `/api/reply-status`，返回可用后才显示按钮。可用性检查最长等待5秒；只有读者点击“请 AI 回信”才发送输入。离开页面或组件卸载时取消当前请求。
