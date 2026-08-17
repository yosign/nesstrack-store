---
type: research-evidence-index
created: 2026-08-17
status: complete
---

# Evidence index

| 证据 | 位置 | 说明 |
|---|---|---|
| 研究计划 | `../Plan_2026-08-17_Custom_Track_Editor.md` | 已确认执行边界 |
| 12 张缓存样本 | `../../../tools/trace_output/cache/track-{3,15,25,35,45,50,60,70,80,90,100,110}.jpg` | 商品缩略图；不复制以免重复二进制 |
| 旧管线既有输出 | `../../../tools/trace_output/templates.json`, `track-80_debug.png` | 研究前只保存了 track-80 两点直线 |
| 本次隔离复跑 | `Validation_Log.md` | 12 样本结果、V1/候选 spike、测试记录 |
| 版本与许可证快照索引 | `Source_Versions.md` | 仓库 commit、registry 版本、许可证和访问日 |
| V1 压力脚本 | `../spikes/v1_geometry_probe.ts` | 不改产品代码，可直接由现有 vite-node 运行 |
| 候选几何脚本 | `../spikes/candidate_geometry_probe.mjs` | 依赖装在临时目录，不改产品 package.json |

没有把临时 clone、`node_modules` 或 debug 图片写入仓库。验证临时目录位于 `/tmp`，可随系统清理；可复现命令与结果均记录在 Markdown。

