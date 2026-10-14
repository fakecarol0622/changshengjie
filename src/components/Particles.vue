<template>
  <canvas ref="cv" class="fx-canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGame } from '../stores/game'

const g = useGame()
const cv = ref<HTMLCanvasElement | null>(null)
let raf = 0
let ctx2d: CanvasRenderingContext2D | null = null

interface P { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; col: string; spin: number }

const ambient: P[] = []
const hot: P[] = []

function resize() {
  const c = cv.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
}

function mkAmbient(init = false): P {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.12,
    vy: -0.05 - Math.random() * 0.18,
    r: 0.6 + Math.random() * 1.6,
    life: init ? Math.random() * 600 : 0,
    max: 400 + Math.random() * 400,
    col: Math.random() < 0.8 ? '232,201,106' : '200,200,220',
    spin: 0,
  }
}

function spawnBurst() {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight * 0.4
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 1 + Math.random() * 5
    hot.push({
      x: cx + (Math.random() - 0.5) * 160,
      y: cy + (Math.random() - 0.5) * 120,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1.2,
      r: 1 + Math.random() * 2.6,
      life: 0,
      max: 50 + Math.random() * 60,
      col: Math.random() < 0.7 ? '255,224,130' : '255,170,80',
      spin: 0,
    })
  }
}

function draw() {
  const c = cv.value
  if (!c || !ctx2d) return
  ctx2d.clearRect(0, 0, c.width, c.height)
  if (!g.settings.fx) { raf = requestAnimationFrame(draw); return }
  // 环境微光
  for (const p of ambient) {
    p.x += p.vx; p.y += p.vy; p.life++
    if (p.life > p.max || p.y < -10) {
      Object.assign(p, mkAmbient(false))
      p.y = c.height + 10
    }
    const alpha = 0.12 + 0.5 * Math.sin((p.life / p.max) * Math.PI)
    ctx2d.fillStyle = `rgba(${p.col},${alpha.toFixed(3)})`
    ctx2d.beginPath()
    ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx2d.fill()
  }
  // 爆发粒子
  for (let i = hot.length - 1; i >= 0; i--) {
    const p = hot[i]
    p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.985; p.life++
    if (p.life > p.max) { hot.splice(i, 1); continue }
    const alpha = 1 - p.life / p.max
    ctx2d.fillStyle = `rgba(${p.col},${(alpha * 0.95).toFixed(3)})`
    ctx2d.beginPath()
    ctx2d.arc(p.x, p.y, p.r * (0.6 + alpha), 0, Math.PI * 2)
    ctx2d.fill()
  }
  raf = requestAnimationFrame(draw)
}

watch(() => g.fx.burst, spawnBurst)
watch(() => g.settings.fx, () => { /* 立即生效于下一帧 */ })

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  ctx2d = cv.value?.getContext('2d') || null
  for (let i = 0; i < 36; i++) ambient.push(mkAmbient(true))
  raf = requestAnimationFrame(draw)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.fx-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}
</style>
