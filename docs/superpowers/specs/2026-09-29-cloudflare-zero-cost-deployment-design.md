# Cloudflare 零成本短期上线设计

日期：2026-09-29

## 目标与边界

将《被看见之后》网站公开上线约 10～15 天，保留现有 React/Vite 页面、Three.js/WebGL 互动、B 站背景音轨代理和 DeepSeek 回访信。网站托管、后台接口和公开网址必须使用 Cloudflare 免费套餐，不购买域名，不启用 Workers Paid 或其他付费 Cloudflare 产品。

DeepSeek API 继续使用用户已有余额，其模型调用费用不计入“托管 0 元”约束。部署结束后应能直接停用或删除 Worker，避免网站继续公开访问。

## 选定方案

使用一个 Cloudflare Worker 同时提供静态网站与两个 API：

- 静态资源来自 Vite 的 `dist` 构建目录，由 Workers Static Assets 提供。
- `/api/bilibili-audio` 由 Worker 代理上游音频并转发 Range、内容类型及缓存相关响应头。
- `/api/deepseek-reply` 由 Worker 读取加密 Secret `DEEPSEEK_API_KEY`，校验请求后以流式响应转发 DeepSeek 内容。
- 其他导航请求回退到 `index.html`，保留单页应用行为。
- 正式地址使用 Cloudflare 免费分配的 `*.workers.dev` 子域名。

不采用“GitHub Pages + 独立 Worker API”，因为它需要处理跨域、两个发布入口和项目子路径，短期比赛使用没有收益。也不把 DeepSeek Key 放入浏览器端，因为公开前端无法保护密钥。

## 代码结构

新增一个独立 Worker 入口文件，只负责生产环境请求路由。现有 Vite 开发服务器中间件保留为本地开发适配层，二者共享可测试的请求处理逻辑，避免维护两套不同实现。

预计结构：

- `src/server/bilibiliAudio.ts`：音轨代理的环境无关处理逻辑。
- `src/server/deepseekReply.ts`：输入校验、上游请求和流式错误处理。
- `src/worker.ts`：Cloudflare Worker 路由与静态资源回退。
- `vite.config.ts`：继续提供本地开发路由，但调用共享处理逻辑。
- `wrangler.jsonc`：仅声明 Worker、静态目录、SPA 回退和 `/api/*` 优先路由，不保存密钥。
- `tests/server/*.test.mjs`：以可控的上游响应验证两个 API。

具体文件名可在实现时按 TypeScript/测试加载约束做小幅调整，但组件边界保持不变。

## 请求与数据流

普通访客请求页面时，Cloudflare 直接返回静态资源，不执行 API 逻辑。播放器请求音轨时，Worker 获取 B 站播放信息，选择音频地址并转发音频流。回访信提交时，Worker 校验 1～1200 字输入，从 Cloudflare Secret 读取 Key，向 DeepSeek `deepseek-flash` 发起最多 320 输出 token 的流式请求，并把结果原样流回页面。

DeepSeek Key 只存在于本地忽略文件和 Cloudflare Secret 中，不写入仓库、构建产物、Wrangler 配置或日志。

## 免费额度与防误付费

- Cloudflare 账号保持 Workers Free，不启用 Workers Paid。
- 使用 `workers.dev` 地址，不购买或绑定自定义域名。
- 静态资源按免费静态资源方式提供；只有 `/api/*` 执行 Worker。
- 复用现有的输入长度和最大输出限制，限制单次 DeepSeek 成本。
- 不增加数据库、KV、R2、队列、日志导出或其他非必要服务。
- 免费动态请求额度耗尽时允许 API 返回限额错误；不得自动切换付费计划。

DeepSeek 自身按用户已有余额结算。若需要进一步控制模型费用，优先在 DeepSeek 账户侧保留有限余额，而不是在本项目增加持久化计数服务。

## 错误处理

- 缺少 `DEEPSEEK_API_KEY`：回访信接口返回 503 和明确中文提示。
- 输入为空、过长或 JSON 无效：返回 400，不调用上游模型。
- DeepSeek 超时、鉴权失败、余额不足或繁忙：保留现有中文错误映射。
- B 站接口或音轨不可用：返回 502，前端继续显示无背景音的页面，不阻断主要叙事。
- WebGL 不可用：继续使用现有降级界面。
- Cloudflare 免费额度耗尽：页面静态内容仍应可访问，动态功能显示可理解的失败提示。

## 测试与验收

实现遵循测试先行：

1. 先为 Worker 路由、DeepSeek 输入校验/流式转发、B 站 Range 转发和错误响应编写失败测试。
2. 实现最小生产代码并使新增测试通过。
3. 修复当前浏览器回归中已观察到的音轨导致 `networkidle` 超时和 AI 句末标点断言问题，使相关测试结果可解释且稳定。
4. 运行格式检查、版本工具测试、完整生产构建和浏览器测试。
5. 本地以 Worker 运行时预览，验证首页、静态资源、两个 API 及无密钥场景。
6. 部署后从公开 `workers.dev` 地址复测桌面、手机、WebGL 降级、音轨和 DeepSeek 回信。
7. 扫描构建产物，确认 DeepSeek Key 不存在于 `dist`。

只有公开地址验证通过后才视为上线完成。

## 授权与发布

通过 Cloudflare 官方 Wrangler OAuth 发起浏览器授权。用户自行在 Cloudflare 页面登录并点击允许；不向代理提供账号密码。授权后创建或更新一个 Workers Free 项目，并通过 Secret 命令上传 DeepSeek Key。

网站源代码继续进入 GitHub 仓库，但首轮短期上线采用本机 Wrangler 直接部署，避免额外配置 Cloudflare 对 GitHub 的账号权限。若 10～15 天内需要更新，重新构建并直接部署即可。

## 下线与恢复

比赛展示结束后，优先在 Cloudflare 后台禁用 `workers.dev` 路由或删除该 Worker；这不会删除本地项目或 GitHub 仓库。上线前和上线后的代码状态都保存在项目版本快照中，任何迁移问题均可从命名备份恢复检查。
