# V0.2 调查路径与视觉增强

主题始终是“爆火是否带来了持续传承”。新增内容是调查框架，尚不构成调查结论。

阅读路径：开篇 → 热度指标的三个视角 → 散点聚成鱼灯的三步追问 → 名录背景 → 鱼灯/徽墨案例 → 活动发生时、第一次动手、活动结束后的追踪 → 具体的人 → 关注、参与、延续 → 证据能支持的判断与边界。

没有填入未经采集的数据。新增指标位置、案例记录位置和人物档案保留待核验状态。高斯点云来自项目原创鱼灯模型的表面采样，不是实物扫描，不是项目数量。三维关系图是观察维度，不代表真实人物关系。

## 已实际接入

- [WebGL Fluid Enhanced](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced)：点击与拖动空白区域产生水墨流体。基于 [PavelDoGreat WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)。MIT；依赖保留上游许可。
- [Spark](https://github.com/sparkjsdev/spark)：PackedSplats + SplatMesh 高斯点云，随滚动从四周聚合为原创鱼灯。MIT。Spark getSplat 返回复用临时对象，保存初始坐标必须克隆。
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)：人物章节的三维观察维度关系图。MIT。
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)：章节进入、线条展开、视差和调查点云进度联动，遵循 GSAP Standard License。
- Three.js：原有鱼灯、徽墨及以上三维渲染。MIT。

徽州窗棂、马头墙轮廓为原创 SVG 装饰，仅作低对比边缘/底纹。取消独立建筑文化展段，取消徽墨拆解。

## 可查看的外部扫描参考

- https://superspl.at/scene/f44ad5f8 ：北京隆福寺天宫藻井，非徽州。
- https://superspl.at/scene/4e3df7e8 ：苏州开元寺无梁殿，非徽州。

以上是公开展示页面。未确认可下载文件及再利用授权，没有作为本站资产引入，也没有把它们当成徽州证据。当前滚动聚合不依赖外部下载；后续如获得鱼灯或对应案例的授权扫描文件，可以替换点云来源。当前页面不提供面向读者的文件上传入口。

## 验证范围

生产构建；浏览器章节/图表/来源弹窗/焦点/主题/减少动态/鱼灯展开/徽墨无展开按钮；320、390、768、1024、1920宽度无横溢出；WebGL禁用回退；流体像素变化；调查视角切换；点云聚散截图；手机点云截图；关系图就绪；证据边界切换。

GPU效果按视口延迟载入，离屏暂停；Spark分包较大，网络较慢时有加载提示。当前验证是本机 Edge，包括软件 WebGL；没有声称已经覆盖全部实体手机的帧率表现。


## 2026-09-24 地图到案例的三段转场

第二章改为：中国省界及规则红点布局 → 点云爆散 → 鱼灯聚合。初始 15% 的滚动停留地图；15%—46% 爆散；53%—91% 逐步聚合，最后保留停留。可逆滚动；减少动态时三个序号直接切换静态状态。

底图文件 public/maps/china-provinces.geojson，2026-09-24 获取自 https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json ，来源入口 https://datav.aliyun.com/portal/school/atlas/area_selector 。保留原始文件的35个要素，低纬度部分使用附图呈现。

红点规则排布用于演示动效，不模拟地区间数量差异。页面近图图例与来源说明均明确标示“非实际分布”。真实分布未完成：需要按项目提供名称、类别、经纬度/定位精度、来源、统计范围及去重口径，再替换 chinaMap.ts 的 targets 输入；严禁将动画粒子数当成名录项目数。

新增验证：地图、爆散、鱼灯三个阶段及反向滚动；桌面/手机地图截图；减少动态按钮切换。
