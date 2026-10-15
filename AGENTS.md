# 本项目后续维护约定

- 每轮修改开始前运行 `npm run backup -- before-edit`，记录返回的版本号。改完并验证后再保存一个有意义标签的版本。
- 不覆盖或删除 `.versions`。恢复使用 `npm run restore -- 版本编号`，在新生成的 `.recoveries` 子目录检查旧版；不得未经用户要求对当前目录执行破坏性重置。
- 数据新闻事实、模型示意、布局占位严格区分。不可将演示点阵转作真实数据；未采集的数据保持空集合，不填随机数。
- 正文改 `src/content/story.ts`；数据改 `src/content/data.ts`；全站视觉改 `src/styles/tokens.css`；模型分别改 `src/scene/fish.ts` 和 `ink.ts`。
- 保留来源弹窗、来源编号以及口径说明。真实数据接入后同时更新其状态标签和逐条来源呈现，不只填入数字。
- 改动视觉后在桌面和手机检查；交互改动运行 `npm run test:browser`（先启动本地服务）；备份工具改动运行 `npm run test:versions`；交付前运行 `npm run build`。
