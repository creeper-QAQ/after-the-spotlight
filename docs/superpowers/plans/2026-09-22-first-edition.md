# First Edition Implementation Plan

> **For agentic workers:** Execute natively in this session in the user's authorized scope. Follow verification-before-completion before reporting success.

**Goal:** 可预览、可校对、为真实数据留位、易维护且能备份回档的数据新闻初版。

**Architecture:** React章节组件与内容文件分离；Three.js独立按需加载。静态站点不依赖外部运行接口。快照以清单和SHA-256校验，安全恢复至独立目录。

**Tech Stack:** React, TypeScript, Vite, Three.js, Node.js, Playwright。

**Spec:** ../../design.md

## Global Constraints

- 无真实数据不绘制暗示统计结论的图表；布局示意明确注明。
- 本轮不发布外网；本地预览。
- 模型是原创示意，不宣称精确实物复原。
- 修改用户已有研究材料以外的新website目录。

## Review Focus

- 窄屏无横向溢出，导航可打开关闭。
- WebGL初始化失败时静态图与正文可用。
- 关闭来源弹窗后焦点返回触发按钮。
- 系统减少动态设置与手动设置均影响场景和页面动画。
- 损坏快照、目录越界、已有恢复目标应拒绝；不覆盖当前工作。

## Tasks

- [x] 1. 页面骨架与内容接口：src/content/{story,data}.ts，src/components/*，src/styles/*；空数据组件显示采集状态、字段和来源入口。
- [x] 2. 程序模型：src/scene/{fish,ink,viewer}.ts及ModelView.tsx；几何材质分离，离屏暂停，释放GPU资源。
- [x] 3. 交互：目录、点阵布局、工艺切换、拆解、来源弹窗、阅读设置；以真实浏览器验证按钮输出和焦点。
- [x] 4. 备份与恢复：scripts/versions.mjs；save/list/restore三个命令；自动备份当前状态后恢复至新目录；tests/versions.test.mjs测试实际文件恢复及拒绝越界。
- [x] 5. 构建、桌面/手机截图、无WebGL测试；README与本地启动入口；建立初版快照与Git里程碑。

执行记录和验收结果写入docs/verification.md。
