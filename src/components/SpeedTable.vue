<script setup lang="ts">
import { computed } from 'vue'
import type { ResultData } from '../types'
import { fmtDur } from '../utils'

const props = defineProps<{ result: ResultData }>()

const speedPlans = computed(() => {
  const total = props.result.totalSec
  return [
    { rate: 0.5,  label: '0.5x',  hl: false },
    { rate: 0.75, label: '0.75x', hl: false },
    { rate: 1.0,  label: '1x',    hl: true  },
    { rate: 1.25, label: '1.25x', hl: false },
    { rate: 1.5,  label: '1.5x',  hl: false },
    { rate: 2.0,  label: '2x',    hl: false },
  ].map((sp) => {
    const dur   = total / sp.rate
    const saved = total - dur
    const noteText = saved > 0
      ? `节省 ${fmtDur(saved)}`
      : saved < 0
        ? `多用 ${fmtDur(-saved)}`
        : '原速播放'
    return { ...sp, dur: fmtDur(dur), noteText }
  })
})
</script>

<template>
  <div class="card">
    <div class="card-title">倍速时长</div>
    <div class="speed-table">
      <div v-for="sp in speedPlans" :key="sp.label" class="speed-row" :class="{ hl: sp.hl }">
        <span class="speed-row-rate">{{ sp.label }}</span>
        <span class="speed-row-dur">{{ sp.dur }}</span>
        <span class="speed-row-note">{{ sp.noteText }}</span>
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

.speed-table { display: flex; flex-direction: column; gap: 2px; }

.speed-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
}

.speed-row.hl { background: linear-gradient(90deg, #ffeef4 0%, #e3f4fb 100%); }
.speed-row.hl .speed-row-rate { color: var(--pink); }

.speed-row-rate { width: 52px; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.speed-row-dur  { flex: 1; font-size: 14px; font-weight: 600; color: var(--blue); font-variant-numeric: tabular-nums; }
.speed-row-note { font-size: 12px; color: var(--text-sub); text-align: right; min-width: 80px; }

:deep(html.dark) .speed-row.hl {
  background: linear-gradient(90deg, #3a1e26 0%, #1a2e38 100%);
}
</style>
