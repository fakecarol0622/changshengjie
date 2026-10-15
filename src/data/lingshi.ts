import { idleLingshi } from './realms'

// 用同一境界的参考挂机产出衡量福利，保留新手最低奖励。
export function lingshiReward(lv: number, minutes: number, minimum = 0): number {
  const level = Math.max(0, Math.min(439, lv))
  return Math.max(minimum, Math.round(idleLingshi(level, 5, 1.5) * minutes * 60))
}
export function dailyLingshiRewards(lv: number) {
  return { gift: lingshiReward(lv, 120, 3000), chest: lingshiReward(lv, 360, 10000) }
}
export function stageLingshiReward(lv: number, boss: boolean): number {
  return lingshiReward(lv, boss ? 240 : 60, 1500)
}
export function realmLingshiReward(major: number): number {
  return Math.max(lingshiReward(major * 40, 240, 10000), Math.round(5000 * Math.pow(2.2, major - 1)))
}
export function dungeonLingshiReward(lv: number, multiplier: number, mine = false): number {
  const legacy = (mine ? 200 * Math.pow(1.02225, lv) : 100 * Math.pow(1.02458, lv))
  return Math.round(Math.max(mine ? 1500 : 1000, legacy, lingshiReward(lv, 30)) * multiplier)
}
