# V1.4 独立复核记录

日期：2026-10-13。审阅范围：28e6894..be9a6af。审阅者：独立代理 readable_final_review；只读审阅源码与实际生产页面，未参与实现。

## 审阅结果及修复

Critical 0、Important 1、Minor 1；Declined-to-judge为空。

1. Important：系统减少动态会盖过读者手动开启，印章物理效果无法运行。tests/effects.mjs在原实现实际失败；优先读取页面已解析偏好后通过。同步使用SealAtlas的motion参数决定手机定位滚动行为。生产模式复测也通过，视频关闭及印章停动继续通过。
2. 清单日期：原脚本固定写2026-10-03，生成说明却使用当前日期。重新评级为Important，因为交付清单是版本追溯凭据，旧日期早于本版的新来源复核。统一使用releaseDate；实际生成包将核对日期、文件哈希及解压内容。这是元数据修正，没有添加镜像实现的单元测试。

独立生产检查：390/1440像素，同时禁用存储、阻断外网、使WebGL返回null，正文、来源、两门工艺操作和本地问题卡可用。五类附录开合三轮仍有3位人物、13项来源、24项事实，无重复ID。纸灯、背景影片、印章在关闭动态时停止；跟随系统响应实时变化。未出现页面异常、错误HTTP、地图或模型接口请求。

新7项事实及历史信息由审阅者直接读取文旅部、人民日报、新华社及中国非遗网原文复核；数值与对象吻合。全国研培不等同新增学徒，制作能力不等同销售量，墨厂营收不等同全行业收入。

## 执行裁定

- 按用户选择在当前master目录实现，不另建工作树或外部发布。若需回退，使用具名备份生成恢复目录。
- 第二、三项任务合为一次页面组装变更，因章节位置与共享案例状态互相依赖；可作为同一提交回退。
- 无法取得原文的地方政府候选数据未接入，采用已经直接核读的其他原文；后续恢复来源可能补充地方培训规模。
- 交付日期问题按实际版本追溯影响升级为Important，统一交付日期；影响范围仅元数据。

没有延期的小问题；没有第二轮复审。修复由失败后通过的回归检查及整套相关功能检查验证。

## 验收索引

| 批准的要求 | 结果与证据 |
| --- | --- |
| 删除地图及加载链 | 地图源模块删除；readable-story四屏宽请求检查；构建无splatViewer块 |
| 首屏阅读设置、窄屏及焦点 | readable-story覆盖320/390/768/1440；effects覆盖存储抛错、系统与手动动效切换 |
| 新数据、去重复及原文回查 | 24项事实/13项来源，新增7项；17.1正文最多一次；public-evidence及submission-facts检查 |
| 人物与审计收进证据中心 | 默认折叠，展开恢复3位人物、10组编码、94条原指标；生产连续开合和唯一ID检查 |
| 四章及积极结尾 | 来历→传播→学习→日常制作教学；正文鱼灯为主、徽墨作对照；无虚构采访或转换率 |
| 保留作品互动 | browser、games、reply、media、scroll、coverage、corpus、integrated-story、accessibility、effects |
| 静态成品交付 | build及production-reading；最终ZIP逐项哈希、CSV及解压运行结果以交付目录验收记录为准 |

截图与运行结果在artifacts/readable-story及其他测试指定目录。真实ZIP验收写入交付目录的交付验收.json与评审与验收.md。本报告不替代成品验证结果。

仅验证了本机Edge及手机尺寸/触摸模拟；未声称实体手机或Safari测试，也不承诺竞赛具体得分。
## 最终成品实测：通过

成品及源码ZIP已真实解压，1172个文件的字节数与SHA-256全部一致。清单日期2026-10-13；CSV分别为24项事实、10组选片段编码、94项原指标与30条线索。

解压成品在4186端口实际启动；390/1440像素阻断外网后，无页面错误或本地资源错误，视频MIME、Range响应、暂停与本地问题卡下载通过。另在同一成品禁用WebGL验证两门工艺回退及正文、来源；动效关闭、恢复、存储抛错、系统减少动态与手动开启覆盖均通过。

本轮16个相关回归脚本退出码均为0，本地问答11项单元用例通过。源码对应cc7a8f6。具名备份为20261013T004045Z-v14-readable-verified-f8ea90；旧交付及备份未覆盖。

- 被看见之后_V1.4-清晰主线版_成品.zip：4770683字节，SHA-256 `d33892a09a77f8c834c7970baa2f4d2a04769899c24162cc31c3b7b65ccf427a`
- 被看见之后_V1.4-清晰主线版_源码.zip：4543436字节，SHA-256 `e74ec0084513ae61ade9fbeddd914bb48f38c3977a6c9d92266f2d42a346775a`

交付包不含开发依赖、缓存、密钥与原始调查文件。本轮没有外部发布；解压成品后双击打开作品.cmd，或使用目前的本机预览地址。

## 执行账本

# SDD ledger — plan: docs/superpowers/plans/2026-10-12-readable-heritage.md

Base: 28e6894. Spec and implementation plan approved; user selected direct execution in the current directory with independent final review.
Backup: 20261012T115657Z-before-readable-implementation-3b81af.
Pre-flight: Task 1 publicMeasure/publicSource shapes match Tasks 2–3; source count becomes dynamic while coverage denominator remains 10.
Pre-flight: Tasks 2–3 share chapter IDs and case selection with Task 4 and Task 5; existing tests asserting a map or old headings must be updated to the approved requirements.
Ruling: use the current master working directory — user explicitly selected the current directory; no external merge or publication. Cost if wrong: restore the named backup into a recovery directory.
Task 1: complete. New-fact test failed with missing training-colleges, then evidence/fact-overlay and exhaustive corpus tests passed after 7 measures and 3 primary sources were added. Original corpus and 10-group coverage untouched.
Ruling: assemble Tasks 2 and 3 as one composition change, then test both chapter order and archive isolation — they share App placement and a half-moved EvidenceReader would contradict the new reading order. Cost if wrong: the single composition commit can be restored together.
Tasks 2–3: in progress; BASE is Task 1 commit. Run readable-story --content RED before replacing the composition.

Setup note: standard Git Bash path was absent; portable Git Bash was subsequently located at D:/文火/apps/Git/bin/bash.exe and the scoped helper now runs.
Ruling: local-government candidate pages timed out; use independently read primary sources instead, adding two village-specific measures from the 2024 Xinhua report. Cost if wrong: later source recovery may add useful local training figures.

Task 2: complete (5766b9c..cc94924). Missing history failed RED; content browser check passed at320/390/768/1440 with chapter order and playback de-duplication.
Task 3: complete (same composition range). No map requests or nodes; people/methods folded, 3 people and10 coding groups reappear when opened; source-note navigation and unique IDs passed.
Task 4: complete. Header setting locator failed RED; full readable-story suite then passed four widths, header target44px, focus return, reduced-video and stable seals.

Task 5: complete. Browser, complete games, new facts/overlay, media, coverage/corpus reader,11 local reply unit cases and desktop/mobile conversation checks passed. Production fallback passed390/1440. Manual-motion reply bug reproduced with500ms failure and fixed with actual page preference observer. Paper caption contrast failed at3.80, token corrected and accessibility test passed. Old lazy-load and fixed-copy assertions were adapted to actual new behavior.
Task 6: in progress. Version1.4, delivery instructions and source/CSV counts synchronized; build contains no splatViewer chunk and unused Spark dependency removed. Final review and ZIP verification remain.

Final review: independent readable_final_review, 28e6894..be9a6af. Critical0, Important1, Minor1; Declined-to-judge [].
Final: Ruling: regrade stale manifest date as Important for delivery traceability — the October3 date predates this release and its October12 source check; reuse releaseDate — cost if wrong: metadata-only correction.
Final fix pass: effects manual-on/system-reduce browser reproduction failed RED. Fix effective preference before OS fallback; seal mobile scroll uses resolved motion prop. Delivery date is a reversible metadata correction, checked against actual generated package rather than a code-mirroring test.
Verification correction: browser.mjs counted lazy evidence pins before mount; wait for its first rendered pin, retain exact three-pin assertion. Same lazy mount behavior already verified in integrated-story.
Final: fixed manual-on/system-reduce precedence — effects RED→GREEN; full relevant suite16/16 scripts passed, unit reply11/11. Final review metadata correction verified by actual archive checker in Task6. All functional review findings addressed in one fix pass.

Task 6: complete. Build passed; backup20261013T004045Z-v14-readable-verified-f8ea90. New ZIPs verified by real extraction1172 files,24/10/94/30 CSV records and releaseDate2026-10-13. Extracted preview4186 passed390/1440 with blocked external network; production WebGL fallback and motion/storage suite passed. Goal requirements7/7 audited in delivery report.
