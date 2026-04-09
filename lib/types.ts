// 材质类型定义
export type MaterialType = 'pvc' | 'cloth' | 'brick_a'

// 模型比例类型定义
export type ScaleType = '1:24' | '1:64'

// 经销商类型定义
export type DealerType = 'taobao' | 'douyin' | 'wechat_qishu_rc' | 'wechat_made_in_china' | 'overseas_self_operated' | 'douyin_hao'

export const DEALERS: Record<DealerType, string> = {
  taobao: '淘宝',
  douyin: '抖音',
  wechat_qishu_rc: '微信七叔RC',
  wechat_made_in_china: '微信中国制造',
  overseas_self_operated: '海外自营',
  douyin_hao: '抖音郝老师'
}

// 订单状态类型定义（合并了生产状态和发货状态）
export type OrderStatus = 'pending' | 'in_production' | 'shipped'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'PENDING',
  in_production: 'IN PRODUCTION',
  shipped: 'SHIPPED',
}

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: '订单已创建，等待开始生产',
  in_production: '订单正在生产中',
  shipped: '订单已完成并发货'
}

export const MATERIALS: Record<MaterialType, { label: string; factoryLabel: string }> = {
  pvc: {
    label: 'PVC',
    factoryLabel: 'PET',
  },
  cloth: {
    label: 'RACE CLOTH',
    factoryLabel: '油画布',
  },
  brick_a: {
    label: 'BRICK-A',
    factoryLabel: '5MM PVC',
  },
}

// 赛道信息类型（originalUrl 仅服务端使用，不对外暴露）
export interface Track {
  id: string
  name: string
  thumbnailUrl: string
  originalUrl?: string
}

// 赛道材质映射类型
export type TrackMaterials = Record<string, MaterialType>

// 赛道数量映射类型
export type TrackQuantities = Record<string, number>

// 分享数据类型
export interface ShareData {
  address: string
  trackId: string
  material?: MaterialType
}

/**
 * 从赛道名称中提取尺寸信息
 * 例如: "1.5x2.2+油画布切边+客户信息" -> "1.5x2.2"
 * 例如: "2.0x3.0浅色" -> "2.0x3.0"
 */
export function extractTrackSize(trackName: string): string {
  // 匹配数字x数字的模式（支持小数）
  const sizeMatch = trackName.match(/^(\d+\.?\d*)[xX×](\d+\.?\d*)/)
  
  if (sizeMatch) {
    return `${sizeMatch[1]}x${sizeMatch[2]}`
  }
  
  // 如果没有匹配到标准格式，返回原名称
  return trackName
}

/**
 * 从备注中提取尺寸信息
 * 支持多种格式：
 * - "1.5x2.2" 或 "1.5×2.2"
 * - "1.5x2.2, 2.0x3.0" (多个尺寸)
 * - "赛道1: 1.5x2.2" (带标签)
 * 返回所有找到的尺寸数组，每个元素为 {width: number, height: number}
 */
export function extractSizesFromNotes(notes: string | null | undefined): Array<{width: number, height: number}> | null {
  if (!notes) return null
  
  // 匹配所有尺寸模式（支持 x、X、×）
  const sizePattern = /(\d+\.?\d*)[xX×](\d+\.?\d*)/g
  const matches = notes.matchAll(sizePattern)
  const sizes: Array<{width: number, height: number}> = []
  
  for (const match of matches) {
    const width = parseFloat(match[1])
    const height = parseFloat(match[2])
    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      sizes.push({ width, height })
    }
  }
  
  return sizes.length > 0 ? sizes : null
}

/**
 * 获取赛道的显示名称（只显示尺寸）
 */
export function getTrackDisplayName(track: Track): string {
  return extractTrackSize(track.name)
}

/**
 * 从赛道材质映射中获取指定赛道的材质
 * @param trackMaterials 赛道材质映射对象
 * @param trackId 赛道ID
 * @param defaultMaterial 默认材质（如果未找到）
 */
export function getTrackMaterial(
  trackMaterials: TrackMaterials | null | undefined,
  trackId: string,
  defaultMaterial: MaterialType = 'pvc'
): MaterialType {
  if (!trackMaterials || typeof trackMaterials !== 'object') {
    return defaultMaterial
  }
  return trackMaterials[trackId] || defaultMaterial
}
