---
type: research-design
created: 2026-08-17
status: proposed
schema: nessrc.track-design@2
---

# Custom Track V2 数据模型

## 核心决策

V2 的权威真相是“可组合区域/边界网络 + 语义图层”；驾驶中心线/路线是可选参考图，不再反向决定全部可见区域。原因是 track-3/15/25/50/90/100 证明真实商品允许 junction、figure-8、合流和多环路，而边界自交与驾驶线交汇具有完全不同的合法性。

```text
TrackDocument
├── canvas（成品尺寸、单位、出血和坐标系）
├── paths（可复用的 line / circularArc / cubicBezier 边界）
├── regions（outer / hole 组成的铺装、内岛、runoff）
├── curbRuns（沿 path 的开放区间与侧别）
├── markings / symbols（标线、停车位、起点、Logo）
├── driveGraph（可选 junction/route 参考）
├── constraints（供应商配置的硬/软规则）
├── provenance（模板、导入、生成器、迁移来源）
└── derived（服务端重新计算的摘要，不是权威输入）
```

## 推荐 schema 草案

下面是约束后的示例，不是可直接上线的最终 JSON Schema：

```json
{
  "schema": "nessrc.track-design",
  "version": 2,
  "id": "td_01...",
  "units": "m",
  "canvas": {
    "width": 3.0,
    "height": 4.9,
    "axis": "x-right-y-down",
    "trimBox": { "x": 0, "y": 0, "width": 3.0, "height": 4.9 },
    "bleed": { "top": null, "right": null, "bottom": null, "left": null }
  },
  "paths": [
    {
      "id": "path_outer",
      "closed": true,
      "start": { "x": 0.08, "y": 0.12 },
      "segments": [
        { "id": "seg_1", "kind": "line", "to": { "x": 2.6, "y": 0.12 } },
        {
          "id": "seg_2",
          "kind": "cubicBezier",
          "c1": { "x": 2.88, "y": 0.12 },
          "c2": { "x": 2.92, "y": 0.42 },
          "to": { "x": 2.92, "y": 0.7 },
          "join": "smooth"
        },
        {
          "id": "seg_3",
          "kind": "circularArc",
          "center": { "x": 2.4, "y": 0.7 },
          "radius": 0.52,
          "startAngle": 0,
          "sweepAngle": 1.5707963268
        }
      ]
    }
  ],
  "regions": [
    {
      "id": "region_asphalt",
      "class": "asphalt",
      "contours": [
        { "pathId": "path_outer", "role": "outer" },
        { "pathId": "path_island_1", "role": "hole" }
      ],
      "styleId": "surface_dark_asphalt"
    }
  ],
  "curbRuns": [
    {
      "id": "curb_1",
      "pathId": "path_island_1",
      "range": {
        "from": { "segmentId": "island_seg_2", "t": 0.1 },
        "to": { "segmentId": "island_seg_4", "t": 0.72 },
        "wrap": false
      },
      "side": "regionExterior",
      "width": 0.035,
      "pattern": { "kind": "alternating", "colors": ["#ffffff", "#168bd2"], "period": 0.12 }
    }
  ],
  "markings": [
    { "id": "start", "kind": "startGrid", "pathId": "mark_start", "styleId": "white_checkered" }
  ],
  "symbols": [
    { "id": "pit", "kind": "parkingBayArray", "transform": [1, 0, 0, 1, 0.4, 0.3], "params": { "count": 6 } }
  ],
  "driveGraph": {
    "nodes": [
      { "id": "j1", "kind": "junction", "point": { "x": 1.5, "y": 2.1 } }
    ],
    "edges": [
      { "id": "e1", "pathId": "drive_a", "from": "j1", "to": "j1", "direction": "both" }
    ],
    "routes": [
      { "id": "main", "edgeIds": ["e1", "e2", "e3"], "closed": true }
    ]
  },
  "constraints": {
    "profileId": "supplier-unconfirmed-v1",
    "minFeature": null,
    "minGap": null,
    "minBoundaryRadius": null,
    "allowedBoundaryTouches": "declared-only",
    "canvasContainment": "trim-or-bleed"
  },
  "provenance": {
    "origin": "template",
    "sourceId": "track-100-vetted",
    "generator": null,
    "migratedFrom": null
  },
  "renderer": { "requiredMajor": 2, "stylePack": "nessrc-default@1" },
  "derived": {
    "geometryRevision": "sha256:...",
    "validatorVersion": "v2-prototype",
    "canvasAreaM2": 14.7,
    "regionAreaM2": 10.84,
    "topology": { "components": 1, "holes": 3, "driveJunctions": 1 },
    "valid": true
  }
}
```

## 几何语义

### 权威与派生

- 权威：`paths + regions + semantic layers` 的用户可编辑参数。
- 派生：曲线自适应展平后的整数多边形、triangulation、preview、面积、净距和 validation report。派生数据可缓存但必须由指定 kernel/version 重建。
- 订单快照：除权威 JSON 外，保存不可变 canonical SVG、preview、validator report 与 checksum，避免未来 renderer 变化改写历史订单外观。

### 曲线类型

- V2 初版只需 line、circular arc、cubic Bézier。它们足以覆盖 SVG、圆弧发夹和自由 S 弯。
- cubic 默认保证节点 G1；“smooth”模式镜像/共线切线手柄。G2 只作为分析/自动优化目标，不强迫普通用户理解。
- clothoid 可用于高级程序生成/驾驶参考线，不放入 V2 第一版持久化 primitive。浏览器/生产生态对 cubic 更成熟，clothoid 可按误差上限转 cubic。

### 整数规范化

authoring JSON 保存米制有限小数；进入 Clipper2 前按 `100000 units/m` 量化（0.01 mm）。对当前最大 4 m 画布远低于 JS safe integer。每次校验记录 scale 和展平容差，避免不同设备产生不同拓扑。

### 合法性分类

| 对象 | 硬错误 | 可合法情况 |
|---|---|---|
| region contour | 未声明自交、重叠边、洞越出 outer、洞触 outer（除非规范允许）、小于最小特征 | 多 outer components、多个 holes |
| open boundary/curb | 越出允许区域、零长度、错侧、端帽不满足规则 | 开放路径、相邻 run 共享端点 |
| driveGraph | 未声明的跨越、断路 route、悬空 node | 显式 junction、figure-8、多路线、合流/分流 |
| markings | 越界、不可打印最小线宽 | 可跨 drive edge，不改变区域拓扑 |

## 校验管线

1. Schema：版本、ID 唯一、有限数、范围、引用完整。
2. Curve：零长、cusp、G1/G2、曲率和自适应展平误差。
3. Topology：使用整数 polygon kernel 规范化 rings，检查方向、holes、重叠与声明的触碰。
4. Manufacturing：canvas/bleed、最小特征、最小净距、最小边界半径、线宽、颜色/资产。
5. Drive：单独验证 route 连通与 junction 声明，不把所有交叉当边界错误。
6. Output：canonical 排序/量化、checksum、SVG round-trip、preview 与报告。

编辑线程只做局部快速检查；完整 polygon boolean/offset 与全局距离在 Web Worker 中；订单提交必须在服务端用同版本规则重验。

## V1 兼容与迁移

### 默认策略：不改写历史

- parser 改为版本分发：`parseV1` 和 `parseV2`；V1 继续由冻结的 `renderer-v1` 渲染。
- 现有 `custom_track_design` 可继续存版本化 JSONB，但外围 API/TypeScript 契约要显式加入 discriminator，不能把 V2 强塞入现有 `TrackDesign` 类型。
- 订单显示以订单时生成的不可变 artifact 优先，动态 renderer 仅作编辑/回退。

### “另存为 V2”转换

1. 用冻结 V1 renderer 按固定容差生成 ribbon rings。
2. 规范化为一个 `legacyConvertedSurface` region，同时保留原 V1 payload 与 renderer 版本。
3. 中心样本可导入 `driveGraph` 参考 edge，但标记 `confidence: legacy-derived`。
4. V1 自动 kerb 只能转成普通 curb run 并标记低可信度；不能声称恢复真实路缘语义。
5. 比较转换前后的 canonical render；超过阈值则只读打开，不允许自动迁移。

此转换是视觉近似，不是语义无损。任何历史订单都不应批量覆盖原 JSON。

## 订单/后台消费契约建议

后续实施时至少需要（本研究不改数据库）：

- `design_version`, `geometry_revision`, `validator_version`, `validation_status`；
- 权威 JSONB；不可变 SVG/preview/report URL 与 checksum；
- canvas width/height 的可信冗余列用于报价与检索；
- 工厂下载状态和“待人工修复”状态；
- 服务端创建 artifact，客户端 public PNG 不能作为生产来源。

## 不采用的模型

- 单中心线 + width profile：适合普通道路，不足以表达独立区域和多路线。
- 左右边界成对：比中心线强，但仍难表示多个内岛、共享 junction 和停车区域。
- 全量 OpenDRIVE：当前 1.9.0 能表达参考线、lanes、junctions、roadmarks，但面向道路仿真且 XML/语义远超平面赛道垫；只借鉴 reference/lanes/junction 分离思想，不采用其 schema。
- 纯自由 SVG：渲染表达够强，但没有领域 ID、约束、版本与可制造语义；V2 应可确定性导出 SVG，而不是直接把任意 SVG 当数据库模型。

