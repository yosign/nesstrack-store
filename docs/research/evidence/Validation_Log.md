---
type: validation-log
created: 2026-08-17
status: complete
---

# Validation log — 2026-08-17

## 项目基线

- 外层 `Nesstrack`: `0bd5255`, branch `main`。
- 商城 `nesstrack-store`: `1ffff37`, branch `master`。
- 商城测试：`npm test` → 4 files / 48 tests passed，约 376 ms。

## 旧缩略图提取

执行方式：把 `trace_thumbnails.py`、`lib/tracks.ts` 和 12 张缓存图复制到 `/tmp/nesstrack-trace.*`，在副本中运行，未改仓库输出。

```bash
python3 tools/trace_thumbnails.py \
  --only track-3,track-15,track-25,track-35,track-45,track-50,track-60,track-70,track-80,track-90,track-100,track-110
```

| 样本 | 程序结果 | 人工复核 |
|---|---|---|
| 3 | polyline too short | 失败 |
| 15 | polyline too short | 失败 |
| 25 | polyline too short | 失败 |
| 35 | 10 anchors, closed | 只追到顶部局部，失败 |
| 45 | polyline too short | 失败 |
| 50 | polyline too short | 失败 |
| 60 | 2 anchors, open | 纯灰底上的贯穿直线，假阳性 |
| 70 | polyline too short | 失败 |
| 80 | 2 anchors, open | 中央贯穿直线，假阳性 |
| 90 | 2 anchors, open | 中央贯穿直线，假阳性 |
| 100 | polyline too short | 失败 |
| 110 | polyline too short | 失败 |

形式产出 4/12；完整有效重建 0/12。

## V1 压力验证

```bash
node_modules/.bin/vite-node --script docs/research/spikes/v1_geometry_probe.ts
```

关键输出：

```json
{
  "case": "bow-tie centerline",
  "boundsValidatorAccepts": true,
  "anchorPolylineCrossings": 1,
  "outerBoundaryCrossings": 3,
  "innerBoundaryCrossings": 3
}
```

```json
{
  "case": "requested width wider than tight fillet",
  "requestedWidth": 0.4,
  "renderedMinWidth": 0.07,
  "boundsValidatorAccepts": true
}
```

## 候选源码测试

### clipper2-ts

- commit `bf6e0303217bdffcbe2f03ab7f6218194df8e7e4`。
- `npm install --legacy-peer-deps --ignore-scripts && npm test`。
- 10 files / 337 tests passed，约 541 ms。
- 普通 `npm install` 在本机 npm 10.9.2/Node 23.6.1 遇到 npm Arborist `edgesOut` 错误；使用 legacy peer resolution 后库测试通过。此问题是 prototype 构建链风险，需在项目支持的 Node LTS 重验。

### FlattenJS

- commit `332ffff47c7fa53d3586cd6898da1bbb8444e9cf`。
- 533 tests passed，约 426 ms。
- coverage：statements 83.19%、branches 78.28%、functions 84.82%、lines 83.53%。

## 候选最小几何 spike

临时依赖：`@flatten-js/core@1.6.13`, `clipper2-ts@2.0.1-18`, `bezier-js@6.1.4`, `polygon-clipping@0.15.7`。

```bash
node docs/research/spikes/candidate_geometry_probe.mjs /tmp/<dependency-root>
```

一次代表性输出（本机微基准有抖动）：

```json
{
  "clipper": {
    "differencePathCount": 2,
    "signedAreas": [100000000, -24000000],
    "roundOffsetPathCount": 1,
    "roundOffsetPointCount": 56,
    "normalizedBowTiePathCount": 2,
    "thousandDifferencesMs": 10.88
  },
  "flatten": {
    "valid": true,
    "faceCount": 2,
    "area": 8400,
    "containsHoleCenter": false,
    "containsSurfacePoint": true
  },
  "bezier": {
    "length": 146.06,
    "reducedSegments": 2,
    "offsetSegments": 2
  },
  "polygonClipping": {
    "differencePolygonCount": 1,
    "thousandDifferencesMs": 24.35
  }
}
```

这些数字只证明 API 和小规模运算可运行；未验证目标手机、真实 1000 点设计或最终包体。

