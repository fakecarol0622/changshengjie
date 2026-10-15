// ===== 数字 / 时间格式化 =====
const UNITS = ['', '万', '亿', '兆', '京', '垓', '秭', '穰']

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n < 0) return '-' + fmt(-n)
  if (n < 10000) {
    if (Number.isInteger(n)) return '' + n
    return n < 100 ? (Math.round(n * 10) / 10).toString() : Math.round(n).toString()
  }
  let u = 0
  let v = n
  while (v >= 10000 && u < UNITS.length - 1) {
    v /= 10000
    u++
  }
  return (Math.round(v * 100) / 100) + UNITS[u]
}

export function fmt1(n: number): string {
  return (Math.round(n * (n > 0 && n < 0.1 ? 1000 : 10)) / (n > 0 && n < 0.1 ? 1000 : 10)).toString()
}

export function fmtTime(ms: number): string {
  if (ms <= 0) return '已就绪'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}天${h}时`
  if (h > 0) return `${h}时${m}分`
  if (m > 0) return `${m}分${sec}秒`
  return `${sec}秒`
}

export function fmtDate(ts: number): string {
  const dt = new Date(ts)
  return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

export function pct(n: number): string {
  return (Math.round(n * 10) / 10) + '%'
}
