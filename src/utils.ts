import type { ParsedInput } from './types'

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function fmtDur(sec: number): string {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function fmtDurLong(sec: number): string {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h} 小时 ${m} 分 ${s} 秒`
  if (m > 0) return `${m} 分 ${s} 秒`
  return `${s} 秒`
}

export function parseInput(raw: string): ParsedInput | null {
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
