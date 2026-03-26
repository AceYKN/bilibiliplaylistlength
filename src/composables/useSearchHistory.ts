import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { fmtDurLong } from '../utils'

export interface HistoryRecord {
  /** 用户原始输入 */
  query: string
  /** 结果标题 */
  title: string
  /** 类型：合集 / 分P视频 / 单视频 */
  type: string
  /** 视频数量 */
  count: number
  /** 总时长（秒） */
  totalSec: number
  /** 记录时间戳 */
  timestamp: number
}

const MAX_HISTORY = 5

const history = useStorage<HistoryRecord[]>('bili-length-history', [])

function addRecord(record: Omit<HistoryRecord, 'timestamp'>) {
  const newRecord: HistoryRecord = { ...record, timestamp: Date.now() }
  // 去重：同 query 只保留最新
  const filtered = history.value.filter((r) => r.query !== record.query)
  filtered.unshift(newRecord)
  history.value = filtered.slice(0, MAX_HISTORY)
}

function removeRecord(query: string) {
  history.value = history.value.filter((r) => r.query !== query)
}

function clearHistory() {
  history.value = []
}

function formatAge(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export function useSearchHistory() {
  const hasHistory = computed(() => history.value.length > 0)

  return {
    history,
    hasHistory,
    addRecord,
    removeRecord,
    clearHistory,
    formatAge,
    fmtDurLong,
  }
}
