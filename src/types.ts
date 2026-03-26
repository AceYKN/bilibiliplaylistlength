export interface VideoItem {
  title: string
  duration: number
  bvid?: string
  page?: number
}

export interface ResultData {
  title: string
  type: string
  thumbnail: string
  uploader: string
  aid?: string
  bvid?: string
  videos: VideoItem[]
  totalSec: number
  avgSec: number
  minSec: number
  maxSec: number
  totalDurLong: string
}

export interface ParsedInput {
  kind: 'season' | 'series' | 'bv' | 'av'
  id?: string
  mid?: string
  seasonId?: string
  seriesId?: string
}
