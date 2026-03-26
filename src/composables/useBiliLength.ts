import { ref } from 'vue'
import type { VideoItem, ResultData } from '../types'
import { parseInput, fmtDurLong } from '../utils'
import { fetchViewInfo, fetchAllSeasonVideos, fetchAllSeriesVideos } from '../api'

const inputVal    = ref('')
const loading     = ref(false)
const loadingText = ref('正在获取视频信息…')
const error       = ref<string | null>(null)
const result      = ref<ResultData | null>(null)

let searchLock = false

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
  return new URL(window.location.href).searchParams.get('q') ?? ''
}

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

export function useBiliLength() {
  return {
    inputVal,
    loading,
    loadingText,
    error,
    result,
    handleSearch,
    readFromUrl,
  }
}
