<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useBiliLength } from './composables/useBiliLength'
import { useTheme } from './composables/useTheme'
import { useSearchHistory } from './composables/useSearchHistory'

import ThemeToggle from './components/ThemeToggle.vue'
import SearchCard from './components/SearchCard.vue'
import LoadingCard from './components/LoadingCard.vue'
import ErrorCard from './components/ErrorCard.vue'
import VideoInfo from './components/VideoInfo.vue'
import DurationStats from './components/DurationStats.vue'
import SpeedTable from './components/SpeedTable.vue'
import RangeCalculator from './components/RangeCalculator.vue'
import WatchPlan from './components/WatchPlan.vue'
import VideoList from './components/VideoList.vue'
import ResultSummary from './components/ResultSummary.vue'
import SearchHistory from './components/SearchHistory.vue'

const { inputVal, loading, loadingText, error, result, handleSearch, readFromUrl } = useBiliLength()
const { isDark, toggleDark } = useTheme()
const { addRecord } = useSearchHistory()

// 搜索成功后自动写入历史
watch(result, (r) => {
  if (r) {
    addRecord({
      query: inputVal.value.trim(),
      title: r.title,
      type: r.type,
      count: r.videos.length,
      totalSec: r.totalSec,
    })
  }
})

function onSelectHistory(query: string) {
  inputVal.value = query
  handleSearch()
}

onMounted(() => {
  const q = readFromUrl()
  if (q) {
    inputVal.value = q
    handleSearch()
  }
})
</script>

<template>
  <div class="app">
    <ThemeToggle :isDark="isDark" @toggle="toggleDark" />

    <header class="header">
      <div class="header-icon">⏱</div>
      <h1>B站视频时长计算器</h1>
      <p>输入BV号或视频链接，分析合集 / 分P视频的时长信息</p>
    </header>

    <main class="main">
      <SearchCard v-model="inputVal" :loading="loading" @search="handleSearch" />

      <SearchHistory v-if="!loading && !result" @select="onSelectHistory" />

      <LoadingCard v-if="loading" :text="loadingText" />

      <ErrorCard v-if="error" :message="error" />

      <template v-if="result">
        <VideoInfo :result="result" />
        <DurationStats :result="result" />
        <SpeedTable :result="result" />
        <RangeCalculator v-if="result.videos.length > 1" :result="result" />
        <WatchPlan :result="result" />
        <ResultSummary :result="result" />
        <VideoList :videos="result.videos" />
      </template>
    </main>

    <footer class="footer">
      结果仅供估算参考 · 数据来自 B站公开接口 · 不会保存你的输入内容 · Made with ❤️ for community
    </footer>
  </div>
</template>

<style>
/* ===========================
   全局 & Reset（必须保留为全局以设置 CSS 变量）
=========================== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --pink:      #fb7299;
  --pink-dark: #e8638a;
  --blue:      #00a1d6;
  --bg:        #f4f5f7;
  --card:      #ffffff;
  --text:      #18191c;
  --text-sub:  #757575;
  --border:    #e8e8e8;
  --shadow:    0 2px 12px rgba(0, 0, 0, 0.08);
  --radius:    14px;
  --radius-sm: 8px;
  --grad-hero:    linear-gradient(135deg, #ffeef4 0%, #e3f4fb 100%);
  --grad-hero-h:  linear-gradient(90deg, #ffeef4 0%, #e3f4fb 100%);
  --grad-copied:  linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  --input-bg:     #fafafa;
  --input-focus:  #ffffff;
  --tag-bg:       #f0f0f0;
  --error-help-bg: #fff0f0;
  --hover-bg:     #e3f4fb;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
               "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
               "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

html.dark {
  --bg:       #141414;
  --card:     #1e1e1e;
  --text:     #e0e0e0;
  --text-sub: #999999;
  --border:   #333333;
  --shadow:   0 2px 12px rgba(0, 0, 0, 0.5);
  --grad-hero:    linear-gradient(135deg, #3a1e26 0%, #1a2e38 100%);
  --grad-hero-h:  linear-gradient(90deg, #3a1e26 0%, #1a2e38 100%);
  --grad-copied:  linear-gradient(135deg, #1a3a1a 0%, #1a3a2a 100%);
  --input-bg:     #262626;
  --input-focus:  #2e2e2e;
  --tag-bg:       #2a2a2a;
  --error-help-bg: #2a1818;
  --hover-bg:     #1a2e38;
}
</style>

<style scoped>
.app {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 16px 60px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 头部 */
.header {
  text-align: center;
  padding: 52px 0 36px;
}

.header-icon { font-size: 52px; line-height: 1; margin-bottom: 14px; }
.header h1   { font-size: 28px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 8px; }
.header p    { color: var(--text-sub); font-size: 14px; }

/* 通用卡片 */
:deep(.card) {
  background: var(--card);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

/* 页脚 */
.footer { text-align: center; padding: 32px 0 8px; font-size: 12px; color: #bbb; }

@media (max-width: 640px) {
  .header { padding: 36px 0 28px; }
  .header-icon { font-size: 40px; }
  .header h1   { font-size: 22px; }
}
</style>