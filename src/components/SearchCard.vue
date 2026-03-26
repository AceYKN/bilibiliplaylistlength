<script setup lang="ts">
defineProps<{ loading: boolean }>()
const model = defineModel<string>({ required: true })
defineEmits<{ search: [] }>()
</script>

<template>
  <div class="card search-card">
    <div class="search-row">
      <input
        v-model="model"
        type="text"
        class="search-input"
        placeholder="BV1GJ411x7h7 或完整视频链接 / 合集页面链接"
        autocomplete="off"
        spellcheck="false"
        @keydown.enter="$emit('search')"
      />
      <button class="search-btn" :disabled="loading" @click="$emit('search')">
        {{ loading ? '计算中…' : '计 算' }}
      </button>
    </div>
    <div class="search-tips">
      <span class="tip-label">支持格式：</span>
      <span class="tip-tag">BV号</span>
      <span class="tip-tag">AV号</span>
      <span class="tip-tag">视频链接</span>
      <span class="tip-tag">合集页链接</span>
    </div>
    <div class="proxy-tip">
      💡 由于使用 Cloudflare 服务，中国大陆用户若请求失败，建议开启代理 / VPN 后重试。
    </div>
  </div>
</template>

<style scoped>
.search-row { display: flex; gap: 10px; }

.search-input {
  flex: 1;
  height: 48px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 16px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  background: #fafafa;
  color: var(--text);
}
.search-input:focus { border-color: var(--pink); background: #fff; }

.search-btn {
  height: 48px;
  padding: 0 26px;
  background: var(--pink);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 2px;
  transition: background 0.2s, transform 0.1s;
  white-space: nowrap;
}
.search-btn:hover   { background: var(--pink-dark); }
.search-btn:active  { transform: scale(0.97); }
.search-btn:disabled { background: #ccc; cursor: not-allowed; transform: none; }

.search-tips {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--text-sub);
}

.tip-tag {
  background: #f0f0f0;
  padding: 3px 9px;
  border-radius: 4px;
  user-select: none;
}

.proxy-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-sub);
  background: var(--bg);
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.6;
}

:deep(html.dark) .search-input { background: #262626; }
:deep(html.dark) .search-input:focus { background: #2e2e2e; }
:deep(html.dark) .tip-tag { background: #2a2a2a; }

@media (max-width: 640px) {
  .search-row  { flex-direction: column; }
  .search-input { height: 52px; font-size: 16px; }
  .search-btn  { height: 44px; }
}
</style>
