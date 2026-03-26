<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResultData } from '../types'
import { fmtDur, fmtDurLong } from '../utils'

const props = defineProps<{ result: ResultData }>()

const total = computed(() => props.result.videos.length)

const fromIdx = ref(1)
const toIdx = ref(total.value)
const customSpeed = ref(1.5)

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]

const validFrom = computed(() => Math.max(1, Math.min(fromIdx.value, total.value)))
const validTo = computed(() => Math.max(validFrom.value, Math.min(toIdx.value, total.value)))

const rangeVideos = computed(() =>
  props.result.videos.slice(validFrom.value - 1, validTo.value),
)

const rangeTotalSec = computed(() =>
  rangeVideos.value.reduce((s, v) => s + (v.duration || 0), 0),
)

const rangeAvgSec = computed(() =>
  rangeVideos.value.length > 0 ? rangeTotalSec.value / rangeVideos.value.length : 0,
)

const rangeSpeedSec = computed(() =>
  customSpeed.value > 0 ? rangeTotalSec.value / customSpeed.value : rangeTotalSec.value,
)

const speedSaved = computed(() => rangeTotalSec.value - rangeSpeedSec.value)

function clampFrom() {
  fromIdx.value = Math.max(1, Math.min(fromIdx.value || 1, total.value))
  if (fromIdx.value > toIdx.value) toIdx.value = fromIdx.value
}

function clampTo() {
  toIdx.value = Math.max(1, Math.min(toIdx.value || 1, total.value))
  if (toIdx.value < fromIdx.value) fromIdx.value = toIdx.value
}

function selectAll() {
  fromIdx.value = 1
  toIdx.value = total.value
}
</script>

<template>
  <div class="card">
    <div class="card-title">区间计算器</div>

    <div class="range-controls">
      <div class="range-row">
        <span class="range-label">从第</span>
        <input
          v-model.number="fromIdx"
          type="number"
          class="range-input"
          :min="1"
          :max="total"
          @change="clampFrom"
        />
        <span class="range-label">集 到第</span>
        <input
          v-model.number="toIdx"
          type="number"
          class="range-input"
          :min="1"
          :max="total"
          @change="clampTo"
        />
        <span class="range-label">集</span>
        <button class="range-btn" @click="selectAll">全选</button>
      </div>
      <div class="range-row">
        <span class="range-label">倍速</span>
        <select v-model.number="customSpeed" class="range-select">
          <option v-for="sp in SPEED_OPTIONS" :key="sp" :value="sp">{{ sp }}x</option>
        </select>
      </div>
    </div>

    <div class="range-hint">
      共 <strong>{{ rangeVideos.length }}</strong> 集（第 {{ validFrom }} ~ {{ validTo }} 集）
    </div>

    <div class="range-stats">
      <div class="range-stat-item main-stat">
        <div class="range-stat-val accent">{{ fmtDur(rangeTotalSec) }}</div>
        <div class="range-stat-lbl">区间总时长</div>
        <div class="range-stat-sub">{{ fmtDurLong(rangeTotalSec) }}</div>
      </div>
      <div class="range-stat-item">
        <div class="range-stat-val">{{ fmtDur(rangeAvgSec) }}</div>
        <div class="range-stat-lbl">区间平均时长</div>
      </div>
      <div class="range-stat-item">
        <div class="range-stat-val blue">{{ fmtDur(rangeSpeedSec) }}</div>
        <div class="range-stat-lbl">{{ customSpeed }}x 倍速时长</div>
        <div class="range-stat-sub" v-if="speedSaved > 0">
          节省 {{ fmtDur(speedSaved) }}
        </div>
        <div class="range-stat-sub" v-else-if="speedSaved < 0">
          多用 {{ fmtDur(-speedSaved) }}
        </div>
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

.range-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.range-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}

.range-label {
  font-size: 14px;
  white-space: nowrap;
}

.range-input {
  width: 72px;
  height: 36px;
  border: 2px solid var(--border);
  border-radius: 6px;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  outline: none;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.2s;
  -moz-appearance: textfield;
  appearance: textfield;
}
.range-input::-webkit-inner-spin-button,
.range-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.range-input:focus { border-color: var(--pink); }

.range-select {
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
.range-select:focus { border-color: var(--pink); }

.range-btn {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: var(--pink);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.range-btn:hover { background: var(--pink-dark); }
.range-btn:active { transform: scale(0.96); }

.range-hint {
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 8px;
}

.range-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.range-stat-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
}

.range-stat-item.main-stat {
  background: var(--grad-hero);
}

.range-stat-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
  line-height: 1.2;
}

.range-stat-val.accent { color: var(--pink); font-size: 24px; }
.range-stat-val.blue { color: var(--blue); }

.range-stat-lbl { font-size: 12px; color: var(--text-sub); margin-bottom: 2px; }
.range-stat-sub { font-size: 11px; color: var(--text-sub); }



@media (max-width: 640px) {
  .range-stats { grid-template-columns: 1fr; }
  .range-stat-val.accent { font-size: 20px; }
}
</style>
