<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoItem } from '../types'
import { fmtDur } from '../utils'

const props = defineProps<{ videos: VideoItem[] }>()

const COLLAPSED_COUNT = 8
const epExpanded = ref(false)

const displayedVideos = computed(() =>
  epExpanded.value ? props.videos : props.videos.slice(0, COLLAPSED_COUNT),
)
</script>

<template>
  <div class="card">
    <div class="ep-header">
      <div class="card-title">视频列表</div>
      <button
        v-if="videos.length > COLLAPSED_COUNT"
        class="ep-toggle-btn"
        @click="epExpanded = !epExpanded"
      >
        {{ epExpanded ? '收起列表' : `展开全部 (${videos.length})` }}
      </button>
    </div>
    <div class="ep-list">
      <div v-for="(v, i) in displayedVideos" :key="i" class="ep-item">
        <span class="ep-num">{{ i + 1 }}.</span>
        <a
          v-if="v.bvid"
          class="ep-title ep-link"
          :href="`https://www.bilibili.com/video/${v.bvid}${v.page ? '?p=' + v.page : ''}`"
          target="_blank"
          rel="noopener noreferrer"
          :title="v.title"
        >{{ v.title }}</a>
        <span v-else class="ep-title" :title="v.title">{{ v.title }}</span>
        <span class="ep-dur">{{ fmtDur(v.duration) }}</span>
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

.ep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ep-header .card-title { margin-bottom: 0; }

.ep-toggle-btn {
  font-size: 13px;
  color: var(--blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.ep-toggle-btn:hover { background: var(--hover-bg); }

.ep-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 2px;
  border-bottom: 1px solid var(--bg);
  font-size: 13px;
}

.ep-item:last-child { border-bottom: none; }
.ep-num   { min-width: 30px; text-align: right; color: var(--text-sub); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.ep-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ep-link  { color: var(--blue); text-decoration: none; }
.ep-link:hover { text-decoration: underline; }
.ep-dur   { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--pink); white-space: nowrap; flex-shrink: 0; }


</style>
