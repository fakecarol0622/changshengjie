// ===== 跨世档案（所有存档共享，存 localStorage，独立于单存档） =====
const KEY = 'changshengjie_account_v1'

export interface SaveRecord {
  n: string // 道号
  realm: string // 此生到达的境界
  power: number
  reinc: number // 第几世
  root: string // 灵根
  days: number // 此生历经天数（游戏内）
  at: number // 记录时间戳
}

export interface AccountData {
  records: SaveRecord[] // 历代身记录（新的在前）
  best: { power: number; realm: string; n: string }
}

function empty(): AccountData {
  return { records: [], best: { power: 0, realm: '', n: '' } }
}

export function loadAccount(): AccountData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const d = JSON.parse(raw) as AccountData
    if (!Array.isArray(d.records)) return empty()
    return { records: d.records, best: d.best || empty().best }
  } catch {
    return empty()
  }
}

export function pushRecord(r: SaveRecord): AccountData {
  const d = loadAccount()
  d.records.unshift(r)
  d.records = d.records.slice(0, 30)
  if (r.power > d.best.power) d.best = { power: r.power, realm: r.realm, n: r.n }
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ }
  return d
}
