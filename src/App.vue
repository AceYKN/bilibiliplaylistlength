<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue'
import type { VideoItem, ResultData } from './types'
import { parseInput, fmtDurLong } from './utils'
import { fetchViewInfo, fetchAllSeasonVideos, fetchAllSeriesVideos } from './api'

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

// =============================================
//  Reactive State
// =============================================
const inputVal    = ref('')
const loading     = ref(false)
const loadingText = ref('正在获取视频信息…')
const error       = ref<string | null>(null)
const result      = ref<ResultData | null>(null)

const isDark = ref(
  localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
)

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})

function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// =============================================
//  URL Query Sync
// =============================================
function syncToUrl(val: string) {
  const url = new URL(window.location.href)
  if (val) {
    url.searchParams.set('q', val)
  } else {
    url.searchParams.delete('q')
  }
  window.history.replaceState(null, '', url.toString())
}

function readFromUrl(): string {
  const url = new URL(window.location.href)
  return url.searchParams.get('q') ?? ''
}

// =============================================
//  Debounce guard
// =============================================
let searchLock = false

async function handleSearch() {
  if (searchLock) return
  const raw = inputVal.value.trim()
  if (!raw) return

  const parsed = parseInput(raw)
  if (!parsed) {
    error.value =
      '无法识别输入格式。请输入 BV号（如 BV1GJ411x7h7）、完整视频链接，或 space.bilibili.com 合集 / 系列页面的链接。'
    return
  }

  searchLock        = true
  loading.value     = true
  loadingText.value = '正在获取视频信息…'
  error.value       = null
  result.value      = null

  syncToUrl(raw)

  const onProgress = (text: string) => { loadingText.value = text }

  try {
    let videos: VideoItem[] = []
    let title = '', type = '', thumbnail = '', uploader = ''
    let aid = '', bvid = ''

    if (parsed.kind === 'season') {
      videos = await fetchAllSeasonVideos(parsed.mid!, parsed.seasonId!, onProgress)
      title  = `合集 (season_id: ${parsed.seasonId})`
      type   = '合集'
    } else if (parsed.kind === 'series') {
      videos = await fetchAllSeriesVideos(parsed.mid!, parsed.seriesId!, onProgress)
      title  = `系列 (series_id: ${parsed.seriesId})`
      type   = '系列'
    } else {
      const queryBvid = parsed.kind === 'bv' ? parsed.id! : null
      const queryAid  = parsed.kind === 'av' ? parsed.id! : null
      const info = await fetchViewInfo(queryBvid, queryAid)
      thumbnail  = info.pic || ''
      uploader   = info.owner?.name || ''
      aid        = String(info.aid || '')
      bvid       = info.bvid || ''

      if (info.ugc_season) {
        const season     = info.ugc_season
        title            = season.title || info.title
        type             = '合集'
        const inlineCount: number = (season.sections ?? []).reduce(
          (s: number, sec: any) => s + (sec.episodes?.length || 0), 0,
        )
        if (season.total && inlineCount >= season.total) {
          for (const sec of season.sections ?? []) {
            for (const ep of sec.episodes ?? []) {
              videos.push({
                title:    ep.title || ep.arc?.title || `集 ${videos.length + 1}`,
                duration: ep.arc?.duration ?? ep.page?.duration ?? 0,
                bvid:     ep.bvid,
              })
            }
          }
        } else {
          videos = await fetchAllSeasonVideos(
            String(info.owner.mid), String(season.id), onProgress,
          )
        }
        if (videos.length === 0) {
          videos = await fetchAllSeasonVideos(
            String(info.owner.mid), String(season.id), onProgress,
          )
        }
      } else if (info.pages?.length > 1) {
        title  = info.title
        type   = '分P视频'
        for (const p of info.pages) {
          videos.push({ title: p.part || `P${p.page}`, duration: p.duration || 0, bvid: info.bvid, page: p.page })
        }
      } else {
        title  = info.title
        type   = '单视频'
        videos = [{ title: info.title, duration: info.duration || 0, bvid: info.bvid }]
      }
    }

    if (videos.length === 0) throw new Error('未能获取到任何视频数据，请确认链接是否正确。')

    const totalSec = videos.reduce((s, v) => s + (v.duration || 0), 0)
    const avgSec   = totalSec / videos.length
    const minSec   = Math.min(...videos.map((v) => v.duration || 0))
    const maxSec   = Math.max(...videos.map((v) => v.duration || 0))

    result.value = {
      title, type, thumbnail, uploader, aid, bvid, videos,
      totalSec, avgSec, minSec, maxSec,
      totalDurLong: fmtDurLong(totalSec),
    }
  } catch (err: unknown) {
    error.value = `获取失败：${err instanceof Error ? err.message : String(err)}`
  } finally {
    loading.value = false
    searchLock = false
  }
}

// =============================================
//  Lifecycle: restore from URL
// =============================================
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