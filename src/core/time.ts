// 游戏日统一使用北京时间，避免设备时区改变刷新时间。
export const DAY_MS = 86400000
export const GAME_OFFSET_MS = 8 * 3600000
export function gameDayKey(now = Date.now()): number {
  return Math.floor((now + GAME_OFFSET_MS) / DAY_MS)
}
export function gameWeekKey(now = Date.now()): number {
  return Math.floor(gameDayKey(now) / 3)
}
export function resetIn(now = Date.now(), days = 1): number {
  const period = DAY_MS * days
  return period - ((now + GAME_OFFSET_MS) % period)
}
