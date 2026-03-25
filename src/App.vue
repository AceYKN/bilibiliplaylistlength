<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'

// =============================================
//  Types
// =============================================
interface VideoItem {
  title: string
  duration: number
  bvid?: string
}

interface ResultData {
  title: string
  type: string
  thumbnail: string
  uploader: string
  videos: VideoItem[]
  totalSec: number
  avgSec: number
  minSec: number
  maxSec: number
  totalDurLong: string
}

interface ParsedInput {
  kind: 'season' | 'series' | 'bv' | 'av'
  id?: string
  mid?: string
  seasonId?: string
  seriesId?: string
}

// =============================================
//  Utils
// =============================================
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtDur(sec: number): string {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function fmtDurLong(sec: number): string {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h} 小时 ${m} 分 ${s} 秒`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
}

// =============================================
//  API
// =============================================
const BILI_API = 'https://api.bilibili.com'

// 优先使用通过环境变量配置的自有 Cloudflare Worker 代理（推荐）
// 在项目根目录创建 .env.local 文件写入：VITE_BILI_PROXY=https://xxx.workers.dev/
// GitHub Actions 中在仓库 Settings → Secrets → Actions 添加同名 Secret 并在 workflow 里注入
const CUSTOM_PROXY: string = (import.meta.env.VITE_BILI_PROXY as string | undefined) ?? ''

const CORS_PROXIES = [
  ...(CUSTOM_PROXY ? [CUSTOM_PROXY + '?url='] : []),
  '',  // 直连（在 localhost 开发时有效）
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
]

async function apiFetch<T = unknown>(url: string): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyPrefix = CORS_PROXIES[i]
    const fullUrl = proxyPrefix ? proxyPrefix + encodeURIComponent(url) : url
    const ctrl = new AbortController()
    const timer = setTimeout(
      () => ctrl.abort(new DOMException('请求超时', 'TimeoutError')),
      10000,
    )
    try {
      const res = await fetch(fullUrl, { signal: ctrl.signal, credentials: 'omit' })
      clearTimeout(timer)
      if (!res.ok) continue
      return (await res.json()) as T
    } catch (e: unknown) {
      clearTimeout(timer)
      const isTimeout =
        e instanceof DOMException &&
        (e.name === 'AbortError' || e.name === 'TimeoutError')
      lastErr = isTimeout ? new Error('请求超时，请检查网络连接后重试') : e
    }
  }
  throw lastErr ?? new Error('所有请求方式均失败，请稍后重试')
}

async function fetchViewInfo(bvid: string | null, aid: string | null) {
  const param = bvid
    ? `bvid=${encodeURIComponent(bvid)}`
    : `aid=${encodeURIComponent(aid!)}`
  const data = await apiFetch<{ code: number; message: string; data: any }>(
    `${BILI_API}/x/web-interface/view?${param}`,
  )
  if (data.code !== 0)
    throw new Error(`B站 API 返回错误：${data.message}（code ${data.code}）`)
  return data.data
}

async function fetchAllSeasonVideos(
  mid: string,
  seasonId: string,
  onProgress: (msg: string) => void,
): Promise<VideoItem[]> {
  const videos: VideoItem[] = []
  let page = 1
  const pageSize = 30
  let total = Infinity
  while (videos.length < total) {
    onProgress(`正在拉取合集视频… ${videos.length} / ${total === Infinity ? '?' : total}`)
    const url =
      `${BILI_API}/x/polymer/web-space/seasons_archives_list` +
      `?mid=${encodeURIComponent(mid)}&season_id=${encodeURIComponent(seasonId)}` +
      `&page_num=${page}&page_size=${pageSize}&sort_reverse=false`
    const data = await apiFetch<{ code: number; message: string; data: any }>(url)
    if (data.code !== 0) throw new Error(`获取合集列表失败：${data.message}`)
    const archives: any[] = data.data?.archives ?? []
    for (const arc of archives) {
      videos.push({
        title: arc.title || `视频 ${videos.length + 1}`,
        duration: arc.duration || 0,
        bvid: arc.bvid,
      })
    }
    total = data.data?.page?.total ?? archives.length
    if (archives.length === 0) break
    page++
  }
  return videos
}

async function fetchAllSeriesVideos(
  mid: string,
  seriesId: string,
  onProgress: (msg: string) => void,
): Promise<VideoItem[]> {
  const videos: VideoItem[] = []
  let page = 1
  const pageSize = 30
  let total = Infinity
  while (videos.length < total) {
    onProgress(`正在拉取系列视频… ${videos.length} / ${total === Infinity ? '?' : total}`)
    const url =
      `${BILI_API}/x/series/archives` +
      `?mid=${encodeURIComponent(mid)}&series_id=${encodeURIComponent(seriesId)}` +
      `&only_normal=true&sort=asc&pn=${page}&ps=${pageSize}`
    const data = await apiFetch<{ code: number; message: string; data: any }>(url)
    if (data.code !== 0) throw new Error(`获取系列列表失败：${data.message}`)
    const archives: any[] = data.data?.archives ?? []
    for (const arc of archives) {
      videos.push({
        title: arc.title || `视频 ${videos.length + 1}`,
        duration: arc.duration || 0,
        bvid: arc.bvid,
      })
    }
    total = data.data?.page?.total ?? archives.length
    if (archives.length === 0) break
    page++
  }
  return videos
}

function parseInput(raw: string): ParsedInput | null {
  const s = raw.trim()
  const colM = s.match(
    /space\.bilibili\.com\/(\d+)\/channel\/collectiondetail[^?]*\?[^#]*\bsid=(\d+)/i,
  )
  if (colM) return { kind: 'season', mid: colM[1], seasonId: colM[2] }
  const serM = s.match(
    /space\.bilibili\.com\/(\d+)\/channel\/seriesdetail[^?]*\?[^#]*\bsid=(\d+)/i,
  )
  if (serM) return { kind: 'series', mid: serM[1], seriesId: serM[2] }
  const bvM = s.match(/BV[a-zA-Z0-9]{10}/)
  if (bvM) return { kind: 'bv', id: bvM[0] }
  const avM = s.match(/[aA][vV](\d+)/)
  if (avM) return { kind: 'av', id: avM[1] }
  return null
}

// =============================================
//  Reactive State
// =============================================
const inputVal    = ref('')
const loading     = ref(false)
const loadingText = ref('正在获取视频信息…')
const error       = ref<string | null>(null)
const result      = ref<ResultData | null>(null)
const dailyCount  = ref(2)
const epExpanded  = ref(false)

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
//  Computed
// =============================================
const stats = computed(() => {
  if (!result.value) return []
  const { totalSec, avgSec, minSec, maxSec } = result.value
  return [
    { val: fmtDur(totalSec), lbl: '总时长' },
    { val: fmtDur(avgSec),   lbl: '平均每集' },
    { val: fmtDur(minSec),   lbl: '最短' },
    { val: fmtDur(maxSec),   lbl: '最长' },
  ]
})

const speedPlans = computed(() => {
  if (!result.value) return []
  const total = result.value.totalSec
  return [
    { rate: 0.5,  label: '0.5x',  note: '慢速',   hl: false },
    { rate: 0.75, label: '0.75x', note: '',        hl: false },
    { rate: 1.0,  label: '1x',    note: '正常',   hl: true  },
    { rate: 1.25, label: '1.25x', note: '',        hl: false },
    { rate: 1.5,  label: '1.5x',  note: '推荐',   hl: false },
    { rate: 2.0,  label: '2x',    note: '两倍速',  hl: false },
  ].map((sp) => {
    const dur     = total / sp.rate
    const saved   = total - dur
    const noteText = sp.note
      ? sp.note
      : saved > 0
        ? `节省 ${fmtDur(saved)}`
        : saved < 0
          ? `多花 ${fmtDur(-saved)}`
          : ''
    return { ...sp, dur: fmtDur(dur), noteText }
  })
})

const days = computed(() =>
  result.value
    ? Math.ceil(result.value.videos.length / Math.max(1, dailyCount.value || 1))
    : 0,
)

const dailyPlans = computed(() => {
  if (!result.value) return []
  const avgSec = result.value.avgSec
  const daily  = Math.max(1, dailyCount.value || 1)
  return [
    { rate: 0.75, label: '0.75x 速' },
    { rate: 1.0,  label: '1x 速'   },
    { rate: 1.5,  label: '1.5x 速' },
    { rate: 2.0,  label: '2x 速'   },
  ].map((sp) => ({ ...sp, time: fmtDur((daily * avgSec) / sp.rate) }))
})

// =============================================
//  Actions
// =============================================
async function handleSearch() {
  const raw = inputVal.value.trim()
  if (!raw) return

  const parsed = parseInput(raw)
  if (!parsed) {
    error.value =
      '无法识别输入格式。请输入 BV号（如 BV1GJ411x7h7）、完整视频链接，或 space.bilibili.com 合集 / 系列页面的链接。'
    return
  }

  loading.value     = true
  loadingText.value = '正在获取视频信息…'
  error.value       = null
  result.value      = null
  epExpanded.value  = false

  const onProgress = (text: string) => { loadingText.value = text }

  try {
    let videos: VideoItem[] = []
    let title = '', type = '', thumbnail = '', uploader = ''

    if (parsed.kind === 'season') {
      videos = await fetchAllSeasonVideos(parsed.mid!, parsed.seasonId!, onProgress)
      title  = `合集 (season_id: ${parsed.seasonId})`
      type   = '合集'
    } else if (parsed.kind === 'series') {
      videos = await fetchAllSeriesVideos(parsed.mid!, parsed.seriesId!, onProgress)
      title  = `系列 (series_id: ${parsed.seriesId})`
      type   = '系列'
    } else {
      const bvid = parsed.kind === 'bv' ? parsed.id! : null
      const aid  = parsed.kind === 'av' ? parsed.id! : null
      const info = await fetchViewInfo(bvid, aid)
      thumbnail  = info.pic || ''
      uploader   = info.owner?.name || ''

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
          videos.push({ title: p.part || `P${p.page}`, duration: p.duration || 0, bvid: info.bvid })
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
      title, type, thumbnail, uploader, videos,
      totalSec, avgSec, minSec, maxSec,
      totalDurLong: fmtDurLong(totalSec),
    }
  } catch (err: unknown) {
    error.value = `获取失败：${err instanceof Error ? err.message : String(err)}`
  } finally {
    loading.value = false
  }
}

function fillExample(val: string) {
  inputVal.value = val
}

function onThumbError(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <div class="app">
    <button class="theme-toggle" :title="isDark ? '切换到亮色' : '切换到深色'" @click="toggleDark">
      {{ isDark ? '☀️' : '🌙' }}
    </button>
    <header class="header">
      <div class="header-icon">⏱</div>
      <h1>B站视频时长计算器</h1>
      <p>输入BV号或视频链接，分析合集 / 分P视频的时长信息</p>
    </header>

    <main class="main">
      <!-- 搜索卡片 -->
      <div class="card search-card">
        <div class="search-row">
          <input
            v-model="inputVal"
            type="text"
            class="search-input"
            placeholder="BV1GJ411x7h7 或完整视频链接 / 合集页面链接"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter="handleSearch"
          />
          <button class="search-btn" :disabled="loading" @click="handleSearch">
            {{ loading ? '查询中…' : '查 询' }}
          </button>
        </div>
        <div class="search-tips">
          <span class="tip-label">支持格式：</span>
          <span class="tip-tag" @click="fillExample('BV1GJ411x7h7')">BV号</span>
          <span class="tip-tag" @click="fillExample('https://www.bilibili.com/video/BV1GJ411x7h7')">视频链接</span>
          <span class="tip-tag" @click="fillExample('https://space.bilibili.com/UID/channel/collectiondetail?sid=XXXX')">合集页链接</span>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="card loading-section">
        <div class="spinner"></div>
        <p>{{ loadingText }}</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="card error-section">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{{ error }}</p>
        <div class="error-help">
          <strong>常见原因：</strong><br />
          • B站 API 限制跨域访问，公共代理可能不稳定——建议部署 Cloudflare Worker（见项目 <code>cloudflare-worker.js</code>）<br />
          • 网络波动或请求超时，请稍后重试<br />
          • BV号 / 链接格式有误<br />
          • 视频已被删除或设置了权限
        </div>
      </div>

      <!-- 结果区域 -->
      <template v-if="result">
        <!-- 视频信息 -->
        <div class="card">
          <div class="vi-wrap">
            <img
              v-if="result.thumbnail"
              :src="result.thumbnail"
              class="vi-thumb"
              alt="封面"
              @error="onThumbError"
            />
            <div class="vi-text">
              <div class="vi-title" :title="result.title">{{ result.title }}</div>
              <div class="vi-badges">
                <span class="badge badge-type">{{ result.type }}</span>
                <span class="badge badge-count">共 {{ result.videos.length }} 个视频</span>
                <span v-if="result.uploader" class="badge badge-up">UP：{{ result.uploader }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 时长统计 -->
        <div class="card">
          <div class="card-title">时长统计</div>
          <div class="stats-grid">
            <div v-for="stat in stats" :key="stat.lbl" class="stat-item">
              <div class="stat-val">{{ stat.val }}</div>
              <div class="stat-lbl">{{ stat.lbl }}</div>
            </div>
          </div>
          <div class="stats-total-row">总计：<strong>{{ result.totalDurLong }}</strong></div>
        </div>

        <!-- 倍速时长 -->
        <div class="card">
          <div class="card-title">倍速时长</div>
          <div class="speed-grid">
            <div
              v-for="sp in speedPlans"
              :key="sp.label"
              class="speed-item"
              :class="{ hl: sp.hl }"
            >
              <div class="speed-rate">{{ sp.label }}</div>
              <div class="speed-dur">{{ sp.dur }}</div>
              <div class="speed-note">{{ sp.noteText }}</div>
            </div>
          </div>
        </div>

        <!-- 追番计划 -->
        <div class="card">
          <div class="card-title">追番计划</div>
          <div class="daily-controls">
            每天看
            <input
              v-model.number="dailyCount"
              type="number"
              class="daily-num-input"
              min="1"
              max="9999"
            />
            集，共需 <span class="daily-days-highlight">{{ days }}</span> 天看完
          </div>
          <div class="daily-grid">
            <div v-for="dp in dailyPlans" :key="dp.label" class="daily-item">
              <div class="di-speed">{{ dp.label }}</div>
              <div class="di-time">{{ dp.time }}</div>
              <div class="di-label">每日用时</div>
            </div>
          </div>
        </div>

        <!-- 视频列表 -->
        <div class="card">
          <div class="ep-header">
            <div class="card-title">视频列表</div>
            <button class="ep-toggle-btn" @click="epExpanded = !epExpanded">
              {{ epExpanded ? '收起列表' : '展开全部' }}
            </button>
          </div>
          <div class="ep-list" :class="{ expanded: epExpanded }">
            <div v-for="(v, i) in result.videos" :key="i" class="ep-item">
              <span class="ep-num">{{ i + 1 }}.</span>
              <span class="ep-title" :title="v.title">{{ v.title }}</span>
              <span class="ep-dur">{{ fmtDur(v.duration) }}</span>
            </div>
          </div>
        </div>
      </template>
    </main>

    <footer class="footer">
      数据来源于 B站公开 API · 所有计算均在本地浏览器完成 · 仅供学习参考
    </footer>
  </div>
</template>

<style>
/* ===========================
   全局 & Reset
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

/* ===========================
   头部
=========================== */
.header {
  text-align: center;
  padding: 52px 0 36px;
}

.header-icon { font-size: 52px; line-height: 1; margin-bottom: 14px; }
.header h1   { font-size: 28px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 8px; }
.header p    { color: var(--text-sub); font-size: 14px; }

/* ===========================
   通用卡片
=========================== */
.card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 2.5px solid var(--pink);
  display: inline-block;
}

/* ===========================
   搜索
=========================== */
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
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.tip-tag:hover { background: #ffeef4; color: var(--pink); }

/* ===========================
   加载
=========================== */
.loading-section { text-align: center; padding: 40px 24px; }

.spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--border);
  border-top-color: var(--pink);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto 14px;
}

@keyframes spin { to { transform: rotate(360deg); } }
.loading-section p { color: var(--text-sub); font-size: 14px; }

/* ===========================
   错误
=========================== */
.error-section { border-left: 4px solid #ff5252; }
.error-icon    { font-size: 32px; margin-bottom: 10px; text-align: center; }

.error-text {
  color: #c62828;
  font-size: 14px;
  margin-bottom: 12px;
  word-break: break-all;
  text-align: center;
}

.error-help {
  background: #fff8f8;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.8;
}

/* ===========================
   视频信息
=========================== */
.vi-wrap  { display: flex; gap: 16px; align-items: flex-start; }
.vi-thumb {
  width: 130px; height: 87px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  background: var(--bg);
}

.vi-text { flex: 1; min-width: 0; }

.vi-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vi-badges { display: flex; flex-wrap: wrap; gap: 6px; }

.badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.badge-type  { background: #ffeef4; color: var(--pink); }
.badge-count { background: #e3f4fb; color: var(--blue); }
.badge-up    { background: #f3e5f5; color: #7b1fa2; }

/* ===========================
   统计
=========================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 4px;
}

.stat-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 8px;
  text-align: center;
}

.stat-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--pink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  line-height: 1.1;
}

.stat-lbl  { font-size: 12px; color: var(--text-sub); }

.stats-total-row {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--text-sub);
}

/* ===========================
   倍速
=========================== */
.speed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 4px;
}

.speed-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 8px;
  text-align: center;
}

.speed-item.hl {
  background: linear-gradient(135deg, #ffeef4 0%, #e3f4fb 100%);
}

.speed-rate { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.speed-dur  { font-size: 14px; font-weight: 600; color: var(--blue); font-variant-numeric: tabular-nums; margin-bottom: 3px; }
.speed-note { font-size: 11px; color: var(--text-sub); min-height: 14px; }

/* ===========================
   追番计划
=========================== */
.daily-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text-sub);
  margin-bottom: 14px;
}

.daily-num-input {
  width: 64px;
  height: 36px;
  border: 2px solid var(--border);
  border-radius: 6px;
  padding: 0 8px;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.daily-num-input:focus { border-color: var(--pink); }

.daily-days-highlight { font-size: 20px; font-weight: 700; color: var(--pink); }

.daily-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.daily-item { background: var(--bg); border-radius: 10px; padding: 12px 6px; text-align: center; }
.di-speed   { font-size: 12px; color: var(--text-sub); margin-bottom: 4px; }
.di-time    { font-size: 16px; font-weight: 700; color: var(--blue); margin-bottom: 3px; }
.di-label   { font-size: 11px; color: var(--text-sub); }

/* ===========================
   视频列表
=========================== */
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

.ep-toggle-btn:hover { background: #e3f4fb; }

.ep-list         { max-height: 340px; overflow-y: auto; }
.ep-list.expanded { max-height: none; }

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
.ep-dur   { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--pink); white-space: nowrap; flex-shrink: 0; }

/* ===========================
   页脚
=========================== */
.footer { text-align: center; padding: 32px 0 8px; font-size: 12px; color: #bbb; }

/* ===========================
   深色模式切换按钮
=========================== */
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 999;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
  line-height: 1;
  padding: 0;
}

.theme-toggle:hover  { transform: scale(1.1); }
.theme-toggle:active { transform: scale(0.95); }

/* ===========================
   深色模式变量覆盖
=========================== */
html.dark {
  --bg:       #141414;
  --card:     #1e1e1e;
  --text:     #e0e0e0;
  --text-sub: #999999;
  --border:   #333333;
  --shadow:   0 2px 12px rgba(0, 0, 0, 0.5);
}

html.dark .search-input {
  background: #262626;
  color: var(--text);
}

html.dark .search-input:focus { background: #2e2e2e; }

html.dark .tip-tag           { background: #2a2a2a; }
html.dark .tip-tag:hover     { background: #3a2328; color: var(--pink); }

html.dark .daily-num-input {
  background: #262626;
  color: var(--text);
}

html.dark .error-help        { background: #2a1818; }

html.dark .speed-item.hl {
  background: linear-gradient(135deg, #3a1e26 0%, #1a2e38 100%);
}

html.dark .ep-toggle-btn:hover { background: #1a2e38; }

/* ===========================
   响应式
=========================== */
@media (max-width: 640px) {
  .header { padding: 36px 0 28px; }
  .header-icon { font-size: 40px; }
  .header h1   { font-size: 22px; }

  .search-row  { flex-direction: column; }
  .search-btn  { height: 44px; }

  .vi-wrap  { flex-direction: column; }
  .vi-thumb { width: 100%; height: 180px; }

  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .speed-grid { grid-template-columns: repeat(2, 1fr); }
  .daily-grid { grid-template-columns: repeat(2, 1fr); }

  .stat-val { font-size: 18px; }
}
</style>