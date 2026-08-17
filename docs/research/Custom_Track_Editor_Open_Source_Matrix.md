---
type: research-evidence-matrix
created: 2026-08-17
status: complete
evidence_cutoff: 2026-08-17
---

# 自定义赛道开源/算法证据矩阵

## 评级方式

证据等级：A = 本次运行源码测试/最小验证；B = 审计源码、许可证和官方文档；C = 论文/README 能力但未运行；D = 二手信息。维护日期取 shallow clone 的 HEAD 或 registry `time.modified`，并不等同于长期维护承诺。

## 入围开源项目

| 候选 | 核验版本/维护 | 许可证 | 能力与边界 | 证据 | 结论 |
|---|---|---|---|---|---|
| [Clipper2](https://github.com/AngusJohnson/Clipper2) / [clipper2-ts](https://github.com/countertype/clipper2-ts) | TS `2.0.1-18`, HEAD 2026-07-04；上游 HEAD 2026-04-20 | BSL-1.0 | union/difference/intersection/xor、open/closed offset、fill rules、triangulation；只处理展平后的 polygon，不保存 Bézier | A：官方 TS 源码 337/337；减孔/round offset/bow-tie/微基准已跑 | **推荐为 V2 规范化/boolean/offset 内核**；固定版本、整数尺度；先补真实压力集 |
| [FlattenJS](https://github.com/alexbol99/flatten-js) | `1.6.13`, HEAD 2026-08-04 | MIT | point/segment/circular arc/polygon、distance/intersection、PlanarSet、holes/boolean；要求输入 face 无自交/重叠，不支持 cubic primitive | A：533/533，覆盖 83.19%；洞包含/面积已跑 | **推荐编辑期命中、距离、圆弧与轻量空间查询**；提交期仍交 Clipper2 |
| [Bezier.js](https://github.com/Pomax/bezierjs) | `6.1.4`, HEAD 2023-11-16 | MIT | cubic 求值、长度、曲率、reduce、近似 offset | A：本次 API spike 可运行 | **可选小依赖**；可自行实现所需 cubic 数学，不能把其近似 offset 当制造内核 |
| [polygon-clipping](https://github.com/mfogel/polygon-clipping) | `0.15.7`, registry 2023-12-18 | MIT | GeoJSON 风格 MultiPolygon boolean；无 offset/curve | A：减孔和 1000 次微基准通过 | 纯 JS 备选/交叉 oracle；功能不如 Clipper2 TS 完整 |
| [Paper.js](https://github.com/paperjs/paper.js) | `0.12.18`, HEAD 2024-07-17；解包约 12.3 MB | MIT | Canvas scene graph、Bezier/path、boolean、hit test、SVG import/export | B；本次未集成 | 不作几何真相依赖。能力广但框架侵入大、维护较慢；当前 React+SVG 可先保留 |
| [VTracer](https://github.com/visioncortex/vtracer) | npm `1.0.0-alpha.3`, HEAD 2026-08-15 | npm 标为 MIT OR Apache-2.0；仓库 license 需在集成时复核 | Rust/WASM/Python raster→SVG，color/watershed、cutout、spline、palette；输出视觉区域，不认识 NessRC 语义 | B；维护活跃，未在 12 样本上安装 alpha 运行 | **离线导入候选**。用于初始区域候选，之后仍要 palette/语义映射和人工审核 |
| [OpenCV](https://github.com/opencv/opencv) + [scikit-image](https://scikit-image.org/docs/stable/api/skimage.morphology) | 本机 4.10.0 / 0.26.0 | Apache-2.0 / BSD-3-Clause | 分割、轮廓、distance transform、medial axis/skeletonize | A：现有管线实跑 12 样本 | 保留离线工具，但改为“区域先行 + 多层分割”；骨架仅生成可选 drive graph |
| [SAM 2](https://github.com/facebookresearch/sam2) | SAM 2.1；官方仓库 | Apache-2.0（代码/模型 checkpoint） | promptable image segmentation；需要模型/GPU/服务资源，输出 mask 而非制造几何 | C | 可做员工离线抠图助手；不进核心浏览器路径，不自动下单 |
| [pyclothoids](https://github.com/phillipd94/pyclothoids) | `0.2.0` 2025-04 | MIT | 弧长参数化 clothoid、切线与曲率闭式表达；Python/C++ | C | 高级生成/平滑研究候选；不作为 V2 初版持久化或浏览器依赖 |
| [scenariogeneration](https://github.com/pyoscx/scenariogeneration) | HEAD 2026-07-02 | MPL-2.0 | Python 生成 OpenDRIVE/OpenSCENARIO，road/junction/signal/object；其 xodr 覆盖仍以 1.7.1 为基准 | B | 借鉴测试与 junction 语义；不集成商城核心 |
| [esmini](https://github.com/esmini/esmini) | 活跃 C++ 工程 | MPL-2.0 | OpenDRIVE RoadManager、viewer/plotter；大型仿真依赖 | B | 可作 OpenDRIVE 交换验证器，当前不值得引入 |
| [JSTS](https://github.com/bjornharrtell/jsts) | npm `2.12.1`, 2024-11；约 3.7 MB | EDL-1.0 OR EPL-1.0 | JTS 的 topology/buffer/relate JS 端口 | B | 能力强但包体/许可证/API 复杂度高；Clipper2+FlattenJS 足够时不选 |
| [Turf](https://github.com/Turfjs/turf) | `7.4.0`, 2026-08-03 | MIT | GIS/GeoJSON 操作与 buffer | B | 面向经纬度/GIS，NessRC 米制小平面会引入错误抽象；不选核心 |

## AI / 学习式候选

| 候选 | 许可证/维护 | 官方能力证据 | NessRC 适用性 |
|---|---|---|---|
| [StarVector](https://github.com/joanrod/star-vector) | 代码 Apache-2.0；HEAD 2025-11-07 | image/text→SVG code；SVG-Bench 覆盖 icon、logo、diagram 等；README 明示不适合 natural images/illustrations | 只能生成候选/分层草稿；没有 region topology、最小特征或可制造保证，必须 sandbox、解析白名单 SVG、确定性重验 |
| [DeepSVG](https://github.com/alexandre01/deepsvg) | HEAD 2024-08；仓库未找到实际 LICENSE 文件 | NeurIPS 2020，面向 icons/fonts 的生成与插值 | **按淘汰规则排除**：许可证不明确，域不匹配，Python 3.7/CUDA 10.1 时代环境 |
| [VectorFusion](https://vectorfusion.github.io/) | 论文；常见 GitHub 实现为非官方 | 文本到 SVG，使用预训练扩散模型和可微 rasterizer | 适合视觉灵感，不适合结构化赛道；延迟/算力/可重复性不满足核心编辑 |
| [InternSVG](https://github.com/hmwang2002/InternSVG) | Apache-2.0；ICLR 2026 官方仓库 | 多模态 SVG 任务 | 仍是通用 SVG benchmark 证据；无 NessRC 生产规则，列为后续观察 |

结论：截至 2026-08-17，没有一项通用 SVG 生成研究提供“制造级几何合法 + NessRC 领域语义 + 可编辑结构”的直接证据。AI 只能输出不可信提案，不能成为生产文件生成器。

## 算法/标准证据

| 技术 | 一手来源 | 可复用点 | 决策 |
|---|---|---|---|
| SVG compound paths | [W3C SVG 2 Paths](https://www.w3.org/TR/SVG/paths.html) | line/cubic/arc/close、多个 subpath 可形成 holes | 作为确定性渲染/交换格式，不直接当领域 schema |
| OpenDRIVE 1.9.0 | [ASAM 官方](https://www.asam.net/standards/detail/opendrive/) | reference line、lanes、roadmarks、objects、roads/junctions 分离；2026-05-19 发布 | 借鉴“区域/参考线/junction 分层”，不采纳全量 XML |
| Polygon boolean/offset | [Clipper2 官方](https://www.angusj.com/clipper2/Docs/Overview.htm) | 整数鲁棒 boolean、fill rule、open/closed offset | V2 硬校验与派生区域核心 |
| Polygon holes/关系 | [FlattenJS 官方](https://github.com/alexbol99/flatten-js) | islands/holes、validity、distance、DE-9IM 关系 | 编辑期与诊断；无效输入先挡住 |
| Straight skeleton | [CGAL 6.2 手册](https://doc.cgal.org/latest/Straight_skeleton_2/index.html) | polygon-with-holes 的 inward offset/骨架 | 算法参考；该 package 是 GPL，不在前端分发；且 straight skeleton 不等同 medial axis |
| Medial axis | [scikit-image 0.26](https://scikit-image.org/docs/stable/api/skimage.morphology) | distance transform ridges、可同时取局部宽度 | 只从已正确分割的 region 派生 drive graph/宽度候选 |
| Clothoid | [pyclothoids](https://github.com/phillipd94/pyclothoids) | 曲率沿弧长线性变化，适合平滑 road reference | 高级自动平滑；转换为 cubic 再落 V2 |
| Search-based track PCG | [Togelius et al. 2006](https://web-archive.southampton.ac.uk/cogprints.org/5221/1/Togelius2006Making.pdf), [SBPCG survey](https://pure.itu.dk/en/publications/search-based-procedural-content-generation/) | 参数向量→B-spline，fitness 过滤候选 | 支持“多候选 + 硬约束过滤”，不支持无校验的一键最终稿 |
| L-system road growth | [Parish & Müller 2001](https://people.eecs.berkeley.edu/~sequin/CS285/PAPERS/Parish_Muller01.pdf) | global goals + local constraints 的道路网络生成 | 对多环/网络生成有启发，NessRC 更适合有限模块/模板变形 |
| Differential evolution | [SciPy 1.17 docs](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.differential_evolution.html) | 无梯度全局搜索、支持 bounds/constraints/并行 | 服务端/离线候选生成；调用次数大，不放拖拽热路径 |
| Racing line optimization | [Heilmeier et al.](https://arxiv.org/abs/1902.00606) | 轨迹和速度优化是已知边界上的下游任务 | 证明 drive line 应为独立派生层，不应反过来定义所有场地区域 |

## 推荐依赖边界

```text
React + SVG（现有交互壳）
  ├─ 自研 V2 domain/schema/commands/history
  ├─ cubic 数学：小型自研或 Bezier.js
  ├─ 编辑期：FlattenJS（hit/distance/arc/PlanarSet）
  ├─ Worker/提交前：Clipper2 TS（flatten→quantize→boolean/offset/topology）
  └─ 离线模板：OpenCV/scikit-image + VTracer/SAM2 可选 + 人工语义审核
```

首次 prototype 应记录 tree-shaken 包体、Safari/iOS BigInt 兼容、200/1000 控制点性能和退化样例；在此之前不把任何候选加入生产 `package.json`。

