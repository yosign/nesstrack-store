---
type: research-report
created: 2026-08-17
status: complete-with-open-business-gates
project: nesstrack-store
---

# NessRC 高保真自定义赛道编辑器研究

## 1. 执行摘要

### 推荐结论

采用“**可组合铺装区域/边界网络 + curb/标线语义层 + 可选驾驶参考图**”的 V2 混合模型。不要继续把单中心线视为赛道唯一真相，也不要把中心线自交一概判为非法。

理由来自真实样本而非抽象偏好：12 张缓存图中，11 张有明确设计，它们全部包含独立内岛、外边界或开放边界；track-3/15/25/50/90 明确存在 figure-8、交汇、合流或多可选环路。真实画面是一整块沥青/场地上由边界、负空间、局部 curb、停车区和标线共同定义路线。单 ribbon 即便换成更漂亮的 Bézier，也仍表达错对象。

推荐技术边界：

- 保留 React + SVG 作为交互/渲染壳，不先换 Canvas 框架。
- V2 持久化 line / circular arc / cubic Bézier 边界、regions/holes、开放 curb runs、markings/symbols 和可选 driveGraph。
- 编辑期用 `@flatten-js/core` 处理圆弧、命中、距离与空间查询；提交/Worker 用 `clipper2-ts` 对自适应展平并量化的整数 polygon 做 boolean、offset 与拓扑规范化。
- V1 renderer 冻结为历史订单兼容层；V1 “另存 V2”只能声明视觉近似，不批量覆盖历史 JSON。
- 简单模式以审核过的模板、参数模块和整体变形生成合法初稿；高级模式才暴露边界节点/切线、区域、curb 区间和 junction。
- 图片导入改成“区域分割优先”，中心线/骨架只派生可选 drive graph。AI 只解释意图或产候选，不能直接生成生产文件。

### 当前证据强度

已完成两个仓库源码/提交链路审计、12 张样本逐图检查、旧提取脚本隔离复跑、V1 压力 spike、关键候选源码测试与最小几何验证。`clipper2-ts` 当前源码 337/337 通过，FlattenJS 533/533 通过；V1 当前 48 项也全通过，但 bow-tie 边界交叉和静默钳宽均能通过现有 bounds。

最大限制是仓库没有高清平面源、生产矢量和供应商文件/容差规范。因此本报告能确定正确的数据范式和工程路线，不能宣称已确定毫米级最小半径、间距、出血、DPI、色彩或最终文件格式。

## 2. NessRC 真实设计语言与制造规则

决定“像真实 NessRC”的优先级是：

1. 区域拓扑与负空间：外场、内岛、洞、开放端、junction、多环路。
2. 边界节奏：长直、发夹、S 区、收放与局部不对称，而不是每个点一个相同圆角。
3. curb 的选择性：只覆盖指定边界区间，具有侧别、宽度、颜色和条纹周期。
4. 领域对象：停车/pit、起终点、箭头、车位、checker、安全区、Logo。
5. 视觉主题：沥青纹理、轮胎印、草地/水泥/runoff；它们与制造边界分层。

因此合法性也要分对象：同一 region ring 的未声明自交/重叠、洞越界、过小特征属于硬错误；driveGraph 的显式 junction、figure-8、合流/分流是合法结构。缩略图无法判断平面交汇是否代表立交，V2 初版不引入高程，需业务确认是否存在桥接商品。

已知计价链路按成品矩形 `width × height × 材料单价`，不是中心线长度或铺装面积。V2 必须把 canvas 成品尺寸作为稳定一等字段。其他制造参数全部设为可配置且未确认，不能写死猜测值。

## 3. V1 审计

V1 以 `anchors{x,y,r,w}`、`closed` 和 `strokeW` 表示一条路径。`geometry.ts` 在折线拐点插圆弧；`ribbon.ts` 以 0.025 m 密度采样再按法线偏移。它的优点是数据小、SVG 直观、已有撤销/重做与越界提示，适合作为兼容层。

主要问题：

- 曲率只有 0 与 `1/r`，不能表达连续复合弯；更根本的是不能表达多个区域、洞、开放边界和 junction。
- 急弯宽度会被 `safeMaxWidthAt` 静默缩小，订单保存请求值而不是实际几何。
- `unfoldEdge` 把反向 offset 点折叠到前点，可能制造零长边，且不做全局拓扑修复。
- bounds 只检查最终 extent。实跑 bow-tie：中心折线 1 次交叉、内外边界各 3 次交叉，仍 `ok=true` 并可提交。
- 当前 10 个手工模板中只有 7 个标记商品来源，且都把复杂区域近似为单 ribbon。
- 订单只存 JSONB 与 public PNG。商城查看页能重渲染 V1；外层 `Nesstrack` 后台全仓库未消费自定义字段，共享查询列和报价仍只认商品 IDs，形成实际生产链路盲区。

详见 `Custom_Track_V1_Audit.md`。

## 4. 数据模型与几何算法比较

| 模型 | 表达力 | 易用性 | 结论 |
|---|---|---|---|
| 中心线 + 对称 width | 一条普通道路好，多区域/junction 差 | 最简单 | 仅保留为快速模块/参考线 |
| 中心线 + 左右 width profile | 局部不对称略好 | 尚可 | 仍不能成为真实样本真相 |
| 成对左右边界 | 单一走廊好 | 控制复杂 | 对多个内岛/共享区域仍别扭 |
| 模块图 | 对普通买家高效 | 最好 | 简单模式/生成器，不是底层唯一模型 |
| OpenDRIVE road/lane/junction | 道路网络很强 | 对本产品过重 | 借鉴分层，不采用全量 schema |
| **区域/边界网络 + drive graph** | 与 12 样本最匹配 | 需双层 UI | **V2 权威模型** |

曲线 primitive 初版选择 line、circular arc、cubic Bézier。cubic 与 SVG/编辑器生态最兼容；G1 通过 smooth handle 自动维持，G2 作为分析/自动优化目标。Clothoid 的弧长/曲率性质很好，但浏览器与序列化成本更高，先用于离线/高级生成并按误差转 cubic。

权威曲线与派生 polygon 分开：authoring 层保留可编辑曲线；校验层按误差自适应展平，量化为 0.01 mm 整数网格，再做 region boolean/offset/距离。每次 artifact 记录 kernel、scale、容差和 checksum，避免设备差异改变拓扑。

## 5. 开源项目与论文证据

### 核心入围

- [Clipper2](https://github.com/AngusJohnson/Clipper2) / [clipper2-ts](https://github.com/countertype/clipper2-ts)：BSL-1.0；活跃；本次源码测试 337/337。推荐做 polygon 内核，但 TS port 使用 JS Number/部分 BigInt，需 Node LTS、Safari 和真实退化集复核。
- [FlattenJS](https://github.com/alexbol99/flatten-js)：MIT，`1.6.13`，2026-08-04 发布；533/533、83.19% statement coverage。推荐编辑期 geometry，但 boolean 要求输入有效且不原生保存 cubic。
- [Bezier.js](https://github.com/Pomax/bezierjs)：MIT；曲线长度、曲率、reduce/offset API 已跑。作为小型数学辅助，不承担生产 offset。
- [VTracer](https://github.com/visioncortex/vtracer)：Rust/WASM/Python，当前 1.0 alpha 活跃；适合把高清图变成区域候选，不提供 NessRC 语义/制造保证。
- OpenCV/scikit-image：已有管线依赖；保留分割/轮廓/medial axis 工具，但算法顺序从“直接找中心线”改为“先确认可打印区域与层”。

### 明确不选

- Paper.js 不作为 geometry truth：框架侵入、包大，React+SVG 已够表达交互壳。
- CGAL straight skeleton package 为 GPL 且 WASM/构建过重，只作算法参考。
- JSTS/Turf 面向 GIS/拓扑通用场景，包体或抽象成本高于本项目需要。
- DeepSVG 仓库没有可核验 LICENSE 且训练域为 icons/fonts，按淘汰规则排除。
- 全量 OpenDRIVE 1.9.0 面向静态道路仿真、lane/elevation/signal XML 交换，远超平面赛道垫需求。

完整版本、许可证、提交日期、能力与来源见 `Custom_Track_Editor_Open_Source_Matrix.md` 与 `evidence/Source_Versions.md`。

## 6. 六类路线与混合方案

### A. 矢量路径/样条

必要但不充分。cubic/arc 能明显改善局部弯道与编辑手感，但只升级中心线仍会错过真实拓扑。作为所有 boundary paths 的基础 primitive 纳入 V2。

### B. 道路/赛道专用模型

OpenDRIVE 的 reference line、lanes、objects/roadmarks、junction 分层印证“驾驶参考与表面/对象应分离”。NessRC 应采用更小的二维领域模型，避免仿真高程、交通语义和 XML 成本。

### C. 程序化生成

优先做可解释的模块/模板变形：发夹、S、chicane、loop/lobe、parking/pit、junction。由 seed + 参数生成多个候选，先经硬约束过滤，再按画布利用率、弯道多样性和模板风格排序。比单个随机结果更适合普通买家。

### D. 约束优化与自动修复

拖拽热路径用局部投影、吸附、碰撞排斥和回弹预览；全局几何在 Worker。Differential evolution/CMA-ES 等高调用量优化只放离线/服务端候选生成。优化器不能修改用户几何后不告知，必须展示 diff 并允许拒绝。

### E. 图像分割/矢量化

当前管线 12 张完整有效重建 0/12。根因是把全场沥青错误假设为单道路带，并把多环图压成任意 cycle/最长路。新离线管线：色彩/语义区域 → 透视/尺度校正 → outer/holes/open boundaries → VTracer/轮廓拟合 → curb/marking 分类 → 人工审核 → V2；medial axis 仅派生 driveGraph/宽度候选。

### F. 生成式 AI

StarVector/InternSVG 等证明通用 image/text→SVG 进步，但 benchmark 主要是 icons/logo/diagram，没有 NessRC 硬约束。AI 可把“做一个双环、蓝白 curb”翻译成受限 commands，或生成待审核 SVG 草稿；所有输出必须 primitive 白名单、复杂度限制、重建 V2 和服务端重验。

### G. 推荐混合产品

简单模式：尺寸/主题 → 模板或模块候选 → 整体变形 → 明白易读的错误/修复。高级模式：region/hole、boundary handles、curb range、marking/symbol、drive junction/route。两者共享 V2 domain commands 和同一 validator，没有“简单模型另存一套 JSON”的分裂。

## 7. Prototype / benchmark 结果

旧脚本形式产出 4/12，但 3 个是两点直线，另一个只追到小局部，人工有效率为 0%。V1 48 项测试全过却漏掉 bow-tie 和静默钳宽，说明当前测试断言了实现自洽而不是业务合法。

候选 spike 中，Clipper2 TS 正确得到外环/负面积洞、round offset，并把 bow-tie 按 fill rule 规范化成 2 个路径；1000 次小矩形减孔约 11 ms。FlattenJS 可正确表示两 face 的洞区并做 contains。微基准只证明值得进入 prototype，不是移动端 SLA。

正式 gate：20 个高清 ground truth 拓扑 100% 一致，原型 IoU ≥ 0.90、上线 ≥ 0.95（或供应商容差），硬约束压力集上线召回 100%，目标移动机 200 控制点拖拽 P95 < 16 ms、Worker 校验 P95 < 50 ms。详见 `Custom_Track_Benchmark.md`。

## 8. 推荐 V2 架构与用户流程

```text
UI commands / history
        ↓
V2 authoring document（curves + semantic layers）
        ├── SVG interactive renderer
        ├── fast local diagnostics（FlattenJS / spatial index）
        └── Worker canonicalizer
              curve flatten → integer quantize → Clipper2
              → topology/manufacturing report → derived cache
                         ↓
server repeats validation → immutable artifacts/checksum → order/backoffice
```

用户流程：选成品尺寸 → 选模板/参数候选 → 拖整体与关键模块 → 添加/删除边界或 curb/标线 → 实时看到“可生产/需修复”及具体位置 → 提交前完整服务端检查 → 生成不可变预览和生产 artifact。

## 9. V1、数据库与生产迁移

短期不修改旧订单。新增版本分发，V1 继续由冻结 renderer；V2 订单保存权威 JSON、canonical geometry summary、validator/renderer version、不可变 SVG/PNG/report 与 checksum。外层后台必须先增加自定义订单显示、尺寸/材料报价、下载和拒绝/重做状态。

V1 转 V2 时，把冻结 renderer 的 ribbon 规范化成 `legacyConvertedSurface`，保留原 payload。自动 curb 标低可信度，像素/几何差超阈值就只读。这个过程不是语义无损，因此不得批量覆盖数据库。

生产出口在供应商确认前不锁死：SVG 是编辑/交换首选；PDF/高分辨率 PNG 很可能需要但尚无事实；DXF 仅在供应商要求切割/CAD 时实现。无论格式，尺寸、trim/bleed、色彩、字体/Logo、最小线宽和闭环必须由签字规范驱动。

## 10. 路线图、风险与待确认

推荐主线粗略 10–16 周，分为生产/样本 gate、兼容与订单地基、6 样本 geometry spike、V2 MVP、生产上线；高阶导入/生成/AI 再加 6–12+ 周。完整 gate、风险和团队边界见 `Custom_Track_Implementation_Roadmap.md`。

必须由业务补齐：

1. 5–10 个代表性高清平面/生产源，优先 3/15/25/50/90/100。
2. 工厂实际输入格式、单位、最小半径/特征/间距、出血/边距、DPI/色彩、字体/Logo、安全区。
3. 自定义订单定价是否仍只按成品矩形面积，是否有设计/复杂度附加费。
4. 默认用户确认为普通买家，专业模式是否仅内部/特定账号开放。
5. 是否存在桥梁/立体交叉、多车道物理语义或必须支持的开放赛道。
6. AI/服务端调用的隐私、成本与允许范围。

## 11. 主要参考资料

访问日 2026-08-17；详细版本/许可证见 evidence：

- [W3C SVG 2 Paths](https://www.w3.org/TR/SVG/paths.html)：compound paths、line/cubic/arc/close。
- [ASAM OpenDRIVE 1.9.0](https://www.asam.net/standards/detail/opendrive/)：reference line、lanes、objects/roadmarks、junctions；2026-05-19 发布。
- [Clipper2 官方仓库与文档](https://github.com/AngusJohnson/Clipper2)：polygon clipping/offset，BSL-1.0。
- [FlattenJS](https://github.com/alexbol99/flatten-js)：2D geometry、holes、distance/relations，MIT。
- [scikit-image medial axis/skeletonize](https://scikit-image.org/docs/stable/api/skimage.morphology)：medial axis 是 distance transform ridges。
- [CGAL Straight Skeleton 6.2](https://doc.cgal.org/latest/Straight_skeleton_2/index.html)：polygon-with-holes offset；该 package GPL。
- [VTracer](https://github.com/visioncortex/vtracer)：Rust/WASM raster-to-vector 区域候选。
- [SAM 2](https://github.com/facebookresearch/sam2)：Apache-2.0 promptable segmentation。
- [Togelius et al., Making Racing Fun](https://web-archive.southampton.ac.uk/cogprints.org/5221/1/Togelius2006Making.pdf) 与 [Search-based PCG survey](https://pure.itu.dk/en/publications/search-based-procedural-content-generation/)：参数化 track representation + fitness 搜索。
- [Parish & Müller, Procedural Modeling of Cities](https://people.eecs.berkeley.edu/~sequin/CS285/PAPERS/Parish_Muller01.pdf)：global goals + local constraints 的 road generation。
- [SciPy differential_evolution](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.differential_evolution.html)：约束全局搜索与并行边界。
- [StarVector](https://github.com/joanrod/star-vector) / [AAAI publication](https://ojs.aaai.org/index.php/AAAI/article/view/35369)：image/text→SVG code 的能力与域边界。

## 产物索引

- `Custom_Track_Editor_Open_Source_Matrix.md`
- `Custom_Track_Real_Sample_Features.md`
- `Custom_Track_V1_Audit.md`
- `Custom_Track_V2_Data_Model.md`
- `Custom_Track_Benchmark.md`
- `Custom_Track_Implementation_Roadmap.md`
- `evidence/README.md`
- `spikes/`

