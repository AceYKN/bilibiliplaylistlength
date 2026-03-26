<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResultData } from '../types'

const props = defineProps<{ result: ResultData }>()

const DAILY_HOUR_OPTIONS = [
  { label: '30 分钟',  sec: 1800  },
  { label: '1 小时',   sec: 3600  },
  { label: '1.5 小时', sec: 5400  },
  { label: '2 小时',   sec: 7200  },
  { label: '3 小时',   sec: 10800 },
]
const DAILY_SPEED_OPTIONS = [
  { label: '0.75x', rate: 0.75 },
  { label: '1x',    rate: 1.0  },
  { label: '1.25x', rate: 1.25 },
  { label: '1.5x',  rate: 1.5  },
  { label: '2x',    rate: 2.0  },
]

const dailyHourIdx  = ref(1)
const dailySpeedIdx = ref(3)

const dailyResult = computed(() => {
  const speedOpt = DAILY_SPEED_OPTIONS[dailySpeedIdx.value]
  const hourOpt  = DAILY_HOUR_OPTIONS[dailyHourIdx.value]
  if (!speedOpt || !hourOpt) return 0
  return Math.ceil(props.result.totalSec / speedOpt.rate / hourOpt.sec)
})
</script>

<template>
  <div class="card">
    <div class="card-title">观看计划</div>
    <div class="plan-controls">
      <span>如果每天观看</span>
      <select v-model.number="dailyHourIdx" class="plan-select">
        <option v-for="(opt, i) in DAILY_HOUR_OPTIONS" :key="i" :value="i">{{ opt.label }}</option>
      </select>
      <span>，以</span>
      <select v-model.number="dailySpeedIdx" class="plan-select">
        <option v-for="(opt, i) in DAILY_SPEED_OPTIONS" :key="i" :value="i">{{ opt.label }}</option>
      </select>
      <span>倍速播放</span>
    </div>
    <div class="plan-result">
      您将在 <span class="plan-days">{{ dailyResult }}</span> 天内看完
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

.plan-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 16px;
}

.plan-select {
  height: 36px;
  border: 2px solid var(--border);
  border-radius: 6px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  background: var(--input-bg);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s;
}

.plan-select:focus { border-color: var(--pink); }

.plan-result {
  text-align: center;
  font-size: 15px;
  color: var(--text-sub);
  padding: 14px;
  background: var(--bg);
  border-radius: 10px;
}

.plan-days {
  font-size: 36px;
  font-weight: 800;
  color: var(--pink);
  font-variant-numeric: tabular-nums;
  margin: 0 4px;
}



@media (max-width: 640px) {
  .plan-controls { font-size: 13px; }
}
</style>
