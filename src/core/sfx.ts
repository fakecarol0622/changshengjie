// ===== WebAudio 程序合成音效（无需素材，离线可用） =====
let ctx: AudioContext | null = null
let on = true

export function setAudio(onOff: boolean) {
  on = onOff
  if (onOff && musicOn) startMusic()
}
export function audioOn(): boolean {
  return on
}

// ===== 背景音乐（程序合成：五声音阶随机短句循环，无素材离线可用） =====
let musicOn = true
let bgmTimer: number | undefined
const BGM_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]
function bgmPhrase() {
  if (!on || !musicOn) return
  tone(130.81, 3.8, 'sine', 0.012) // 低音铺底
  const n = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < n; i++) {
    const f = BGM_SCALE[Math.floor(Math.random() * BGM_SCALE.length)]
    tone(f, 1.5 + Math.random(), 'sine', 0.016, i * (0.6 + Math.random() * 0.45))
  }
}
export function setMusic(v: boolean) {
  musicOn = v
  if (v) startMusic()
  else stopMusic()
}
export function startMusic() {
  if (bgmTimer || !musicOn) return
  bgmTimer = window.setInterval(bgmPhrase, 4200)
  bgmPhrase()
}
export function stopMusic() {
  if (bgmTimer) { window.clearInterval(bgmTimer); bgmTimer = undefined }
}

function ac(): AudioContext | null {
  if (!on) return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
  const c = ac()
  if (!c) return
  try {
    const o = c.createOscillator()
    const g = c.createGain()
    const t0 = c.currentTime + delay
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(c.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  } catch { /* ignore */ }
}

function noise(dur: number, vol: number, delay = 0) {
  const c = ac()
  if (!c) return
  try {
    const len = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = c.createBufferSource()
    src.buffer = buf
    const g = c.createGain()
    const t0 = c.currentTime + delay
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 900
    src.connect(f).connect(g).connect(c.destination)
    src.start(t0)
  } catch { /* ignore */ }
}

export const sfx = {
  click: () => tone(760, 0.05, 'triangle', 0.05),
  coin: () => { tone(1318, 0.06, 'sine', 0.07); tone(1760, 0.09, 'sine', 0.06, 0.05) },
  success: () => { tone(660, 0.09, 'sine', 0.08); tone(880, 0.1, 'sine', 0.08, 0.08); tone(1174, 0.16, 'sine', 0.07, 0.16) },
  fail: () => { tone(220, 0.16, 'sawtooth', 0.06); tone(174, 0.22, 'sawtooth', 0.05, 0.1) },
  rare: () => { tone(784, 0.12, 'sine', 0.09); tone(988, 0.12, 'sine', 0.09, 0.1); tone(1318, 0.2, 'sine', 0.09, 0.2); noise(0.3, 0.03, 0.2) },
  epic: () => {
    tone(523, 0.14, 'sine', 0.09); tone(659, 0.14, 'sine', 0.09, 0.11)
    tone(784, 0.14, 'sine', 0.09, 0.22); tone(1046, 0.3, 'sine', 0.1, 0.33)
    noise(0.5, 0.04, 0.3)
  },
  thunder: () => { noise(0.7, 0.12); tone(70, 0.5, 'sine', 0.12, 0.02) },
  levelup: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.16, 'sine', 0.08, i * 0.09)) },
  breakthrough: () => {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'sine', 0.09, i * 0.12))
    noise(0.8, 0.05, 0.5)
  },
}
