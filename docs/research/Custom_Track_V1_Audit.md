---
type: research-audit
created: 2026-08-17
status: complete
scope: [nesstrack-store, Nesstrack]
---

# Custom Track V1 审计

## 结论

V1 是一套可用的“单折线中心线 + 圆角 + 对称可变宽 ribbon”编辑器，但真实商品的设计真相主要是铺装区域、多个内岛/外边界、开放 curb、停车区与标线的组合。两者不是精度高低的差别，而是对象模型不同。V1 适合继续作为旧订单的只读兼容 renderer，不适合作为 V2 的权威几何。

## 架构与数据流

| 环节 | 真实实现 | 审计结果 |
|---|---|---|
| 入口 | `app/customize/page.tsx` | 尺寸 → 10 个当前模板/空白 → 编辑；sessionStorage 只承担页面跳转暂存 |
| 状态 | `TrackEditor.tsx`, `editor-state.ts` | 80 步撤销；点增删拖动；开/闭切换；有未接入 UI 的 `insertAnchorAfter` |
| 模型 | `lib/track-design/types.ts` | `version=1, bboxW/H, anchors{x,y,r,w}, closed, strokeW, templateId` |
| 中心线 | `geometry.ts` | 相邻直线间插固定半径圆弧；仅 G1 切接，直线到圆弧处曲率从 0 跳到 `1/r` |
| 区域 | `ribbon.ts` | 每 0.025 m 采样，按切线法向偏移；宽度在线段上 smoothstep 插值，圆弧上取节点定宽 |
| 修补 | `safeMaxWidthAt`, `unfoldEdge` | 急弯处静默钳宽；偏移反向时把采样点折叠到前一点，不能替代拓扑修复 |
| 合法性 | `bounds.ts` | 只看最终 ribbon 外包范围是否越出 bbox；没有自交、最小净距、简单环、层语义或制造校验 |
| 预览 | `preview.ts` | 浏览器生成 SVG，再 rasterize 为最长边约 1024 px 的 PNG |
| 持久化 | `app/order/page.tsx` | 订单写 `custom_track_design` JSONB 与 public bucket 的 PNG URL |
| 商城订单查看 | `app/track/page.tsx` | 重新 parse V1 并用当前 renderer 渲染；未知版本直接失败 |
| 外层工厂后台 | 外层 `Nesstrack` | 全仓库没有消费 `custom_track_design`；共享查询列、列表、计价仍只认 `track_id(s)` |

## V1 字段表达上限

| 字段 | 能表达 | 不能表达/兼容风险 |
|---|---|---|
| `version` | V1 严格判别 | parser 对 V2 无降级；需要版本分发器 |
| `bboxW/H` | 成品矩形米制尺寸 | 无单位字段、出血、DPI、裁切框、色彩空间 |
| `anchors[]` | 一条有序路径 | 多区域、多内岛、图层、分叉/合流、共享边界、对象关系 |
| `r` | 单节点圆角半径 | Bézier 手柄、G2、复合弯、渐变曲率、弧段显式类型 |
| `w` / `strokeW` | 对称总宽 | 左右独立边界、局部区域、宽度剖面语义、停车区 |
| `closed` | 一条路径开/闭 | 多环、洞、合法 junction、多条可选驾驶路线 |
| `templateId` | 模板来源提示 | 生成器版本、导入源、变换历史、许可证/资产来源 |

## 可复现失败

运行：

```bash
cd nesstrack-store
node_modules/.bin/vite-node --script docs/research/spikes/v1_geometry_probe.ts
```

结果：

- bow-tie 中心折线有 1 个交叉，生成的内、外边界各有 3 个严格交叉，但 `validateBounds().ok === true`，UI 因此允许提交。
- 请求宽度 0.4 m、圆角半径 0.05 m 时，renderer 将局部宽度静默降到 0.07 m，仍通过 bounds。订单 JSON 保存的是请求宽度，不是最终实际几何，所见、所存和可制造含义分离。
- `unfoldEdge` 只处理相邻采样段的反向位移，也不检查闭环最后一点到第一点；将坏点折叠会产生零长度边/尖点，无法证明区域简单。
- 合法的驾驶线交汇不能一概禁止；真正的硬错误应是同一制造边界的意外交叉、无意重叠、过小间隙或不一致填充拓扑。V1 没有语义来区分二者。

## 交互审计

| 任务 | 当前可用 | 主要阻碍 |
|---|---|---|
| 空白创建 | 点击空白追加点、拖点、删点、开闭环 | 点只能按末尾追加；无路径段插点、平移缩放、吸附、切线控制、成组变形 |
| 模板修改 | 10 个手工模板、整体尺寸适配 | 模板只近似单 ribbon，无法保留真实内岛/停车区/标线 |
| 参考图描摹 | 无 | 无底图导入、校正、透明度、尺度点或透视校正 |
| 旧设计打开 | 订单查看页可渲染 | 自定义页没有从订单重新编辑流程；renderer 更新可能改变历史订单画面 |
| 移动触控 | Pointer Events 与 `touchAction:none` 支持拖点 | 无双指缩放/平移，密集点选择和精细控制困难 |
| 错误恢复 | 撤销/重做、越界提示 | 无约束原因定位、自动修复预览、回弹策略、制造级错误清单 |

## 测试现状

2026-08-17 在当前提交 `1ffff37` 运行 `npm test`：4 个文件、48 项全部通过。覆盖 fillet、序列化、边界、10 个手工模板的“相邻 offset 不反向”。缺少：自交/接触/重合、最小净距、洞与多区域、闭环接缝、极端节点数、性能、属性/模糊测试、历史 renderer 快照、移动交互和订单 E2E。

## 生产与计价链路风险

1. 商城把 JSON 与预览直接从匿名客户端写 Supabase；迁移 SQL只限制 bucket，没有服务端几何校验或文件大小/类型约束的业务证据。
2. 预览 PNG 是销售/查看辅助，不是尺寸可信的生产文件；没有 SVG/PDF/DXF、裁切线、出血、色彩配置或 checksum。
3. 外层后台的 `ORDER_SHARE_COLUMNS` / `ORDER_DEALER_LIST_COLUMNS` 不含自定义字段，工厂/经销商页按现有商品 `track_id(s)` 枚举与面积定价。自定义订单在此链路会缺少赛道对象并不能正常报价。
4. 现有商品计价事实是成品矩形面积 `width × height × 材料单价`，不是铺装面积或中心线长度；V2 必须保留 canvas 成品尺寸作为稳定计价输入。

## 处置建议

- 冻结 V1 schema 与 renderer，保存版本化 renderer/预览快照；旧订单不原地改写。
- 新增 V2 版本分发与服务端校验；V2 订单同时存权威设计 JSON、规范化几何摘要、renderer 版本、不可变 SVG/高分辨率预览引用。
- 先打通外层后台的显示、报价、下载与错误状态，再开放 V2 下单。

