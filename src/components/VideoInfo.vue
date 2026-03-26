<script setup lang="ts">
import type { ResultData } from '../types'

defineProps<{ result: ResultData }>()

function onThumbError(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="card">
    <div class="vi-wrap">
      <img
        v-if="result.thumbnail"
        :src="result.thumbnail"
        class="vi-thumb"
        alt="封面"
        loading="lazy"
        width="130"
        height="87"
        @error="onThumbError"
      />
      <div class="vi-text">
        <div class="vi-kicker">视频信息</div>
        <div class="vi-title" :title="result.title">{{ result.title }}</div>
        <div class="vi-meta-list">
          <span class="vi-meta-pill vi-meta-primary">{{ result.type }}</span>
          <span class="vi-meta-pill">{{ result.videos.length }} 个视频</span>
          <span v-if="result.uploader" class="vi-meta-pill">UP 主 · {{ result.uploader }}</span>
        </div>
        <div v-if="result.aid || result.bvid" class="vi-id-list">
          <span v-if="result.bvid" class="vi-id-chip">BV {{ result.bvid }}</span>
          <span v-if="result.aid" class="vi-id-chip">AV {{ result.aid }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vi-wrap  { display: flex; gap: 16px; align-items: flex-start; }
.vi-thumb {
  width: 130px; height: 87px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  background: var(--bg);
}

.vi-text { flex: 1; min-width: 0; padding-top: 2px; }

.vi-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 8px;
}

.vi-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.35;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vi-meta-list,
.vi-id-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vi-meta-list { margin-bottom: 10px; }

.vi-meta-pill,
.vi-id-chip {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}

.vi-meta-primary {
  background: linear-gradient(135deg, #ffeef4 0%, #fef5f8 100%);
  border-color: #ffd7e4;
  color: var(--pink);
}

.vi-id-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .vi-wrap  { flex-direction: column; }
  .vi-thumb { width: 100%; height: 180px; }
}
</style>
