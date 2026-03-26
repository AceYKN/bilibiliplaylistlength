<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResultData } from '../types'
import { fmtDur, fmtDurLong } from '../utils'

const props = defineProps<{ result: ResultData }>()

const copiedDur = ref(false)

const stats = computed(() => {
  const { avgSec, minSec, maxSec } = props.result
  return [
    { val: fmtDur(avgSec), lbl: '平均每集' },
    { val: fmtDur(minSec), lbl: '最短' },
    { val: fmtDur(maxSec), lbl: '最长' },
  ]
})

async function copyDuration() {
  const text = `${fmtDur(props.result.totalSec)}（${fmtDurLong(props.result.totalSec)}）`
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copiedDur.value = true
  setTimeout(() => { copiedDur.value = false }, 2000)
}
</script>

<template>
  <div class="card">
    <div class="card-title">时长统计</div>
    <div
      class="total-hero"
      :class="{ copied: copiedDur }"
      role="button"
      tabindex="0"
      title="点击复制总时长"
      @click="copyDuration"
      @keydown.enter.space.prevent="copyDuration"
    >
      <div class="total-hero-val">{{ fmtDur(result.totalSec) }}</div>
      <div class="total-hero-lbl">
        {{ copiedDur ? '✅ 已复制！' : `原速播放总时长 · 点击复制` }}
      </div>
    </div>
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.lbl" class="stat-item">
        <div class="stat-val">{{ stat.val }}</div>
        <div class="stat-lbl">{{ stat.lbl }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-title {
  font-size: 15px;
  font-weight: 700;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 2.5px solid var(--pink);
  display: inline-block;
}

.total-hero {
  text-align: center;
  background: linear-gradient(135deg, #ffeef4 0%, #e3f4fb 100%);
  border-radius: 12px;
  padding: 20px 16px 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  user-select: none;
}

.total-hero:hover  { opacity: 0.85; }
.total-hero:active { transform: scale(0.98); }
.total-hero.copied { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }

.total-hero-val {
  font-size: 44px;
  font-weight: 800;
  color: var(--pink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -1.5px;
  line-height: 1;
  margin-bottom: 6px;
}

.total-hero-lbl { font-size: 13px; color: var(--text-sub); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

.stat-val {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-lbl { font-size: 12px; color: var(--text-sub); }

:deep(html.dark) .total-hero {
  background: linear-gradient(135deg, #3a1e26 0%, #1a2e38 100%);
}

@media (max-width: 640px) {
  .total-hero-val { font-size: 32px; }
}
</style>
