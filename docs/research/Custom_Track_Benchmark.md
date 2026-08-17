---
type: research-benchmark
created: 2026-08-17
status: baseline-complete
---

# Custom Track Benchmark 与验证记录

## 已执行基线

| 验证 | 环境/版本 | 结果 | 解释 |
|---|---|---|---|
| 商城 V1 测试 | Node 23.6.1, Vitest 3.2.4, commit `1ffff37` | 4 files / 48 tests 全通过，376 ms | 证明当前既有行为稳定，不证明制造合法 |
| 缓存图提取复跑 | 当前 `trace_thumbnails.py`，隔离临时目录，12 张本地缓存 | 8 张 `polyline too short`；4 张产出 | 形式成功率 4/12 |
| 提取人工验收 | 查看 4 张 debug overlay | track-60/80/90 是两点直线；track-35 只追到顶部局部 | 完整有效重建 0/12 |
| V1 bow-tie 压力例 | `spikes/v1_geometry_probe.ts` | bounds 接受；中心折线 1 交叉；内/外边界各 3 交叉 | V1 合法性漏检 |
| V1 急弯宽度 | 同上 | 请求 0.4 m，渲染最小 0.07 m，bounds 接受 | 静默几何变更 |
| Clipper2 TS 源码测试 | `clipper2-ts@2.0.1-18`, commit `bf6e030` | 官方当前源码 337/337 通过，541 ms | 浏览器确定性 polygon boolean/offset 候选通过初筛 |
| FlattenJS 源码测试 | `@flatten-js/core@1.6.13`, commit `332ffff` | 533/533 通过；语句覆盖 83.19% | 编辑期 arcs/segments/polygon/空间查询候选通过初筛 |
| 候选最小 spike | `candidate_geometry_probe.mjs` | 减孔得正/负两环；圆角 offset 56 点；bow-tie 规范化成 2 路径；1000 次 difference 约 11 ms | 在此机器与小语料上满足交互预算；不是移动端结论 |
| Bezier.js spike | `6.1.4` | 长度/化简/offset API 可运行 | 可作曲线数学辅助，offset 不能作为最终区域内核 |
| polygon-clipping spike | `0.15.7` | 减孔可运行；1000 次约 17–24 ms | 纯 JS boolean 备选，但无 offset |

所有时间仅是本机微基准，执行批次存在抖动；不得外推为最终性能承诺。复现命令和原始摘要见 `evidence/Validation_Log.md`。

## 为什么旧图像提取失败

现管线先用固定 HSV 阈值把“灰色沥青 + 蓝/青 curb”当轨面，再只保留最大连通域，骨架化后遇到环就返回 `networkx.find_cycle` 找到的任意一个环，否则取一个最长路。真实图中全场往往同为沥青，内岛、边缘、阴影和轮胎印也相连。因此：

- segmentation 没有“道路带”这个唯一前景类别；
- 最大连通域会吞并全场或只挑到错误区域；
- `find_cycle` 返回任意小环，不是完整边界网络；
- 最长路会把多 junction 图压成一条直线；
- 固定 `strokeW=0.18` 丢失所有局部宽度与区域语义。

## V2 统一测试语料

### 真实集

- 第一层 12 个现有缓存，只用于拓扑/分层回归。
- 正式层至少 20 个高清源：简单双环、figure-8、junction、多内岛、开放边界、停车区、教学模块、纯底材、复杂 S 区各有覆盖。
- 每个 ground truth 包含：canvas、规范化区域 rings、开放边界、curb 区间、标线/实例、可选 drive graph、来源与人工确认人。

### 人工压力集

重复点、零长段、近共线、bow-tie、相切、重叠边、1 mm 缝、洞触外环、方向错误、极短 cubic、尖 cusp、offset 大于局部特征、闭环接缝、1/100/1000 节点、超界与非有限数。

### 用户任务集

模板变形、模块组合、空白区域设计、参考图校正描摹、V1 只读打开并“另存 V2”、合法 junction、新增 curb/停车区、导出并由供应商检查。

## 指标与门槛建议

| 维度 | V2 原型门槛 | 上线门槛 |
|---|---:|---:|
| 拓扑 | 20 个正式样本的 components/holes/junction/open-end 全一致 | 100%，否则不得自动提交 |
| 区域几何 | 轮廓 IoU ≥ 0.90；双向 Hausdorff ≤ 成品短边 1% | IoU ≥ 0.95；P95 边界误差需落入供应商容差 |
| curb/标线 | 区间 F1 ≥ 0.85 | 人工复核后 100% 无越界/错侧 |
| 合法性 | 压力集检测召回 ≥ 95%，无崩溃 | 硬约束召回 100%，误报经业务确认 |
| 交互性能 | 200 控制点拖拽 P95 < 16 ms；校验 worker P95 < 50 ms | 在目标移动机实测达标 |
| 导出 | 尺寸误差 < 0.1%，所有环闭合且可重解析 | 供应商签字通过 SVG/PDF/PNG 规范 |
| 兼容 | V1 fixtures 预览像素差可解释 | 所有历史 V1 仍由冻结 renderer 打开 |
| 易用性 | 普通用户 5 人完成 3 任务 | 至少 10 人；成功率 ≥ 80%，中位耗时较 V1 降低 ≥ 30% |

SSIM/像素相似只做辅助；不允许它掩盖洞数、junction、边界交叉等拓扑错误。驾驶线自交不能单独作为失败；按 `driveGraph` junction 语义判断。

## 尚未执行

- 没有高清/生产 ground truth，因此不能给出真实 IoU、Hausdorff、曲率或宽度误差。
- 没有目标低端手机，不能给出移动端包体/FPS 结论。
- 没有供应商文件规范，不能验证 PDF/X、DXF、DPI、色彩与出血。
- 未将 Clipper2 TS 接入产品；当前结论只授权进入隔离 prototype，不等于依赖已批准上线。

