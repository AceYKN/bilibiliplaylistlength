<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResultData } from '../types'
import { fmtDur, fmtDurLong } from '../utils'

const props = defineProps<{ result: ResultData }>()

const total = computed(() => props.result.videos.length)
const currentEp = ref(1)

function clamp() {
  currentEp.value = Math.max(1, Math.min(currentEp.value || 1, total.value))
}

const watchedSec = computed(() =>
  props.result.videos.slice(0, currentEp.value).reduce((s, v) => s + (v.duration || 0), 0),
)

const remainSec = computed(() => props.result.totalSec - watchedSec.value)

const pct = computed(() =>
  props.result.totalSec > 0
    ? Math.round((watchedSec.value / props.result.totalSec) * 1000) / 10
    : 0,
)

const pctStyle = computed(() => `${pct.value}%`)
</script>

<template>
  <div class="card">
    <div class="card-title">观看进度</div>

    <div class="progress-control">
      <span>我已看完前</span>
      <input
        v-model.number="currentEp"
        type="number"
        class="ep-input"
        :min="1"
        :max="total"
        @change="clamp"
      />
      <span>集（共 {{ total }} 集）</span>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar-wrap">
      <div class="progress-bar" :style="{ width: pctStyle }">
        <span v-if="pct >= 12" class="progress-bar-text">{{ pct }}%</span>
      </div>
      <span v-if="pct < 12" class="progress-pct-outside" :style="{ left: pctStyle }">{{ pct }}%</span>
    </div>

    <!-- 数据卡片 -->
    <div class="progress-stats">
      <div class="progress-stat watched">
        <div class="progress-stat-val">{{ fmtDur(watchedSec) }}</div>
        <div class="progress-stat-lbl">已看时长</div>
        <div class="progress-stat-sub">{{ fmtDurLong(watchedSec) }}</div>
      </div>
      <div class="progress-stat remain">
        <div class="progress-stat-val">{{ fmtDur(remainSec) }}</div>
        <div class="progress-stat-lbl">剩余时长</div>
        <div class="progress-stat-sub">{{ fmtDurLong(remainSec) }}</div>
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

.progress-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 16px;
}

.ep-input {
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
.ep-input::-webkit-inner-spin-button,
.ep-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ep-input:focus { border-color: var(--pink); }

/* ---- 进度条 ---- */
.progress-bar-wrap {
  position: relative;
  height: 28px;
  background: var(--bg);
  border-radius: 14px;
  overflow: visible;
  margin-bottom: 16px;
}

.progress-bar {
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

.progress-bar-text {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.progress-pct-outside {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pink);
  white-space: nowrap;
}

/* ---- 统计卡片 ---- */
.progress-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.progress-stat {
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
}

.progress-stat.watched {
  background: var(--grad-hero);
}

.progress-stat.remain {
  background: var(--bg);
}

.progress-stat-val {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
  line-height: 1.2;
}

.progress-stat.watched .progress-stat-val { color: var(--pink); }
.progress-stat.remain .progress-stat-val { color: var(--blue); }

.progress-stat-lbl { font-size: 12px; color: var(--text-sub); margin-bottom: 2px; }
.progress-stat-sub { font-size: 11px; color: var(--text-sub); }

@media (max-width: 640px) {
  .progress-stat-val { font-size: 18px; }
}
</style>
