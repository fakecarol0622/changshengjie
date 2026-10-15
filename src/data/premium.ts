// 仙玉按消费能力配置：单抽30、十连280；日常供给与通关里程碑分层。
export const PREMIUM_REWARDS = {
  dailyGift: 30,
  dailyChest: 60,
  dailySign: 20,
  online: [10, 10, 20, 30, 40],
} as const

export function meditateXianyu(major: number): number { return 10 + Math.min(10, Math.max(0, major)) * 2 }
export function realmXianyu(major: number): number { return 60 + major * 20 }
export function stageXianyu(stage: number): number {
  return 20 + Math.floor((stage - 1) / 15) * 5 + (stage % 10 === 0 ? 60 + stage : 0)
}
export function towerXianyu(layer: number): number { return 20 + Math.min(30, Math.max(0, layer - 1) * 5) }
