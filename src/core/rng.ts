// ===== 随机数工具（可播种） =====
let state = 123456789 >>> 0

export function setSeed(s: number) {
  state = (s >>> 0) || 1
}

export function getSeed(): number {
  return state
}

// mulberry32
export function rnd(): number {
  state |= 0
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function rf(a: number, b: number): number {
  return a + rnd() * (b - a)
}

export function ri(a: number, b: number): number {
  return Math.floor(rf(a, b + 1))
}

export function chance(p: number): boolean {
  return rnd() < p
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const a = shuffle([...arr])
  return a.slice(0, n)
}

export function weighted<T>(items: { w: number; v: T }[]): T {
  let sum = 0
  for (const it of items) sum += it.w
  let r = rnd() * sum
  for (const it of items) {
    r -= it.w
    if (r <= 0) return it.v
  }
  return items[items.length - 1].v
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

let uidSeq = 1
export function uid(): number {
  return uidSeq++
}
export function setUidSeq(n: number) {
  uidSeq = Math.max(uidSeq, n + 1)
}
