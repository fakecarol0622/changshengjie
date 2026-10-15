import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// 移动端：禁止捏合缩放（iOS Safari 会忽略 user-scalable，需拦截手势事件）
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, e => e.preventDefault(), { passive: false })
}
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false })

createApp(App).use(createPinia()).mount('#app')
