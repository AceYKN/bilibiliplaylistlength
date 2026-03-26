import type { VideoItem } from './types'

const BILI_API = 'https://api.bilibili.com'

const CUSTOM_PROXY: string = (import.meta.env.VITE_BILI_PROXY as string | undefined) ?? ''

const CORS_PROXIES = [
  ...(CUSTOM_PROXY ? [CUSTOM_PROXY + '?url='] : []),
  '',
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
]

/** 记住上一次成功的代理索引，下次优先使用 */
let lastSuccessIdx = 0

async function singleFetch<T>(url: string, proxyPrefix: string, signal: AbortSignal): Promise<T> {
  const fullUrl = proxyPrefix ? proxyPrefix + encodeURIComponent(url) : url
  const res = await fetch(fullUrl, { signal, credentials: 'omit' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function apiFetch<T = unknown>(url: string): Promise<T> {
  // 按「上次成功的代理优先」排序
  const ordered = [
    ...CORS_PROXIES.slice(lastSuccessIdx),
    ...CORS_PROXIES.slice(0, lastSuccessIdx),
  ]

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new DOMException('请求超时', 'TimeoutError')), 15000)

  try {
    // Promise.any 并行竞争，最先成功的胜出
    const result = await Promise.any(
      ordered.map((proxy, i) =>
        singleFetch<T>(url, proxy, ctrl.signal).then((data) => {
          // 记住此次成功的真实索引
          lastSuccessIdx = CORS_PROXIES.indexOf(proxy)
          return data
        }),
      ),
    )
    return result
  } catch (e: unknown) {
    if (e instanceof AggregateError) {
      const hasTimeout = e.errors.some(
        (err) => err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError'),
      )
      throw hasTimeout
        ? new Error('请求超时，请检查网络连接后重试')
        : new Error('所有请求方式均失败，请稍后重试')
    }
    throw e
  } finally {
    clearTimeout(timer)
    ctrl.abort() // 取消还在进行的请求
  }
}

export async function fetchViewInfo(bvid: string | null, aid: string | null) {
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

export async function fetchAllSeasonVideos(
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

export async function fetchAllSeriesVideos(
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
