<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ResultData } from '../types'
import { fmtDur, fmtDurLong } from '../utils'

const props = defineProps<{ result: ResultData }>()

const total = computed(() => props.result.videos.length)

// ---- 模式切换 ----
const mode = ref<'progress' | 'custom'>('progress')

// ---- 共享：倍速 ----
const customSpeed = ref(1.5)
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]

// ---- 进度模式 ----
const currentEp = ref(1)

function clampCurrent() {
  currentEp.value = Math.max(0, Math.min(currentEp.value || 0, total.value))
}

const watchedSec = computed(() =>
  props.result.videos.slice(0, currentEp.value).reduce((s, v) => s + (v.duration || 0), 0),
)
const remainSec = computed(() => props.result.totalSec - watchedSec.value)
const remainSpeedSec = computed(() =>
  customSpeed.value > 0 ? remainSec.value / customSpeed.value : remainSec.value,
)
const pct = computed(() =>
  props.result.totalSec > 0
    ? Math.round((watchedSec.value / props.result.totalSec) * 1000) / 10
    : 0,
)
const pctStyle = computed(() => `${pct.value}%`)

// ---- 自定义区间模式 ----
const fromIdx = ref(1)
const toIdx = ref(total.value)

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

// 切换到进度模式时，同步自定义区间
watch(currentEp, (ep) => {
  if (mode.value === 'progress') {
    fromIdx.value = ep + 1 > total.value ? total.value : ep + 1
    toIdx.value = total.value
  }
})
</script>

<template>
  <div class="card">
    <div class="card-title">区间计算</div>

    <!-- 模式 tab -->
    <div class="mode-tabs">
      <button class="mode-tab" :class="{ active: mode === 'progress' }" @click="mode = 'progress'">
        观看进度
      </button>
      <button class="mode-tab" :class="{ active: mode === 'custom' }" @click="mode = 'custom'">
        自定义区间
      </button>
    </div>

    <!-- 进度模式 -->
    <template v-if="mode === 'progress'">
      <div class="ctrl-row">
        <span>我已看完前</span>
        <input v-model.number="currentEp" type="number" class="num-input" :min="0" :max="total" @change="clampCurrent" />
        <span>集（共 {{ total }} 集）</span>
        <span class="ctrl-sep">·</span>
        <span>倍速</span>
        <select v-model.number="customSpeed" class="speed-select">
          <option v-for="sp in SPEED_OPTIONS" :key="sp" :value="sp">{{ sp }}x</option>
        </select>
      </div>

      <!-- 进度条 -->
      <div class="bar-wrap">
        <div class="bar-fill" :style="{ width: pctStyle }">
          <span v-if="pct >= 12" class="bar-text">{{ pct }}%</span>
        </div>
        <span v-if="pct < 12" class="bar-pct-out" :style="{ left: pctStyle }">{{ pct }}%</span>
      </div>

      <div class="stats-grid stats-4">
        <div class="stat-cell hero">
          <div class="stat-v accent">{{ fmtDur(watchedSec) }}</div>
          <div class="stat-l">已看时长</div>
        </div>
        <div class="stat-cell">
          <div class="stat-v">{{ fmtDur(remainSec) }}</div>
          <div class="stat-l">剩余原速</div>
          <div class="stat-s">{{ fmtDurLong(remainSec) }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-v blue">{{ fmtDur(remainSpeedSec) }}</div>
          <div class="stat-l">剩余 {{ customSpeed }}x</div>
          <div class="stat-s" v-if="remainSec - remainSpeedSec > 0">节省 {{ fmtDur(remainSec - remainSpeedSec) }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-v" style="font-size:22px">{{ pct }}%</div>
          <div class="stat-l">完成度</div>
        </div>
      </div>
    </template>

    <!-- 自定义区间模式 -->
    <template v-else>
      <div class="ctrl-row">
        <span>从第</span>
        <input v-model.number="fromIdx" type="number" class="num-input" :min="1" :max="total" @change="clampFrom" />
        <span>集 到第</span>
        <input v-model.number="toIdx" type="number" class="num-input" :min="1" :max="total" @change="clampTo" />
        <span>集</span>
        <button class="pill-btn" @click="selectAll">全选</button>
        <span class="ctrl-sep">·</span>
        <span>倍速</span>
        <select v-model.number="customSpeed" class="speed-select">
          <option v-for="sp in SPEED_OPTIONS" :key="sp" :value="sp">{{ sp }}x</option>
        </select>
      </div>

      <div class="range-hint">
        共 <strong>{{ rangeVideos.length }}</strong> 集（第 {{ validFrom }} ~ {{ validTo }} 集）
      </div>

      <div class="stats-grid stats-3">
        <div class="stat-cell hero">
          <div class="stat-v accent" style="font-size:24px">{{ fmtDur(rangeTotalSec) }}</div>
          <div class="stat-l">区间总时长</div>
          <div class="stat-s">{{ fmtDurLong(rangeTotalSec) }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-v">{{ fmtDur(rangeAvgSec) }}</div>
          <div class="stat-l">平均每集</div>
        </div>
        <div class="stat-cell">
          <div class="stat-v blue">{{ fmtDur(rangeSpeedSec) }}</div>
          <div class="stat-l">{{ customSpeed }}x 倍速</div>
          <div class="stat-s" v-if="speedSaved > 0">节省 {{ fmtDur(speedSaved) }}</div>
          <div class="stat-s" v-else-if="speedSaved < 0">多用 {{ fmtDur(-speedSaved) }}</div>
        </div>
      </div>
    </template>
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

/* ---- mode tabs ---- */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.mode-tab {
  flex: 1;
  height: 36px;
  border: none;
  background: var(--bg);
  color: var(--text-sub);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.mode-tab.active {
  background: var(--pink);
  color: #fff;
}

/* ---- controls row ---- */
.ctrl-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 14px;
}
.ctrl-sep { color: var(--text-sub); }

.num-input {
  width: 68px;
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
.num-input::-webkit-inner-spin-button,
.num-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.num-input:focus { border-color: var(--pink); }

.speed-select {
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
.speed-select:focus { border-color: var(--pink); }

.pill-btn {
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
.pill-btn:hover { background: var(--pink-dark); }
.pill-btn:active { transform: scale(0.96); }

/* ---- progress bar ---- */
.bar-wrap {
  position: relative;
  height: 28px;
  background: var(--bg);
  border-radius: 14px;
  overflow: visible;
  margin-bottom: 16px;
}
.bar-fill {
  height: 100%;
  min-width: 0;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--pink), var(--blue));
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  transition: width 0.35s ease;
}
.bar-text {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.bar-pct-out {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pink);
  white-space: nowrap;
}

/* ---- range hint ---- */
.range-hint {
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 8px;
}

/* ---- stats grid ---- */
.stats-grid {
  display: grid;
  gap: 10px;
}
.stats-4 { grid-template-columns: repeat(4, 1fr); }
.stats-3 { grid-template-columns: repeat(3, 1fr); }

.stat-cell {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
}
.stat-cell.hero { background: var(--grad-hero); }

.stat-v {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
  line-height: 1.2;
}
.stat-v.accent { color: var(--pink); }
.stat-v.blue { color: var(--blue); }

.stat-l { font-size: 12px; color: var(--text-sub); margin-bottom: 2px; }
.stat-s { font-size: 11px; color: var(--text-sub); }

@media (max-width: 640px) {
  .stats-4 { grid-template-columns: repeat(2, 1fr); }
  .stats-3 { grid-template-columns: 1fr; }
  .ctrl-row { font-size: 13px; }
}
</style>
