<script setup lang="ts">
import { useSearchHistory } from '../composables/useSearchHistory'

const { history, hasHistory, removeRecord, clearHistory, formatAge, fmtDurLong } =
  useSearchHistory()

defineEmits<{ select: [query: string] }>()
</script>

<template>
  <div v-if="hasHistory" class="card history-card">
    <div class="history-header">
      <span class="history-title">🕒 最近查询</span>
      <button class="clear-btn" @click="clearHistory">清空</button>
    </div>
    <ul class="history-list">
      <li v-for="item in history" :key="item.query" class="history-item">
        <button class="history-main" @click="$emit('select', item.query)">
          <span class="history-name">{{ item.title }}</span>
          <span class="history-meta">
            {{ item.type }} · {{ item.count }} 个视频 · {{ fmtDurLong(item.totalSec) }}
          </span>
          <span class="history-age">{{ formatAge(item.timestamp) }}</span>
        </button>
        <button class="remove-btn" title="删除" @click.stop="removeRecord(item.query)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history-card {
  padding: 16px 20px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.clear-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text-sub);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
}
.clear-btn:hover {
  color: var(--pink);
  background: var(--tag-bg);
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.history-item:hover {
  background: var(--hover-bg);
}

.history-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  min-width: 0;
}

.history-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.history-meta {
  color: var(--text-sub);
  font-size: 12px;
  white-space: nowrap;
}

.history-age {
  margin-left: auto;
  color: var(--text-sub);
  font-size: 11px;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-sub);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}
.history-item:hover .remove-btn {
  opacity: 1;
}
.remove-btn:hover {
  color: var(--pink);
}

@media (max-width: 640px) {
  .history-main {
    flex-wrap: wrap;
    gap: 4px;
  }
  .history-name {
    max-width: 100%;
    flex-basis: 100%;
  }
  .history-age {
    margin-left: 0;
  }
}
</style>
