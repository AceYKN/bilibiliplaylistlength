<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResultData } from '../types'
import { fmtDur, fmtDurLong } from '../utils'

const props = defineProps<{ result: ResultData }>()

const withList = ref(false)
const copiedKey = ref<string | null>(null)

function setCopied(key: string) {
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = null }, 2000)
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

const briefText = computed(() => {
  const r = props.result
  const lines = [
    `📺 ${r.title}`,
    `📁 ${r.type} | ${r.videos.length} 个视频${r.uploader ? ` | UP 主：${r.uploader}` : ''}`,
    `⏱ 总时长：${fmtDur(r.totalSec)}（${fmtDurLong(r.totalSec)}）`,
    `📊 平均 ${fmtDur(r.avgSec)} / 最短 ${fmtDur(r.minSec)} / 最长 ${fmtDur(r.maxSec)}`,
  ]
  return lines.join('\n')
})

const fullText = computed(() => {
  const r = props.result
  const header = briefText.value
  const list = r.videos
    .map((v, i) => `${String(i + 1).padStart(3, ' ')}. ${v.title}  ${fmtDur(v.duration)}`)
    .join('\n')
  return `${header}\n\n视频列表：\n${list}`
})

const previewText = computed(() => withList.value ? fullText.value : briefText.value)

async function copyBrief() {
  await writeClipboard(briefText.value)
  setCopied('brief')
}

async function copyFull() {
  await writeClipboard(fullText.value)
  setCopied('full')
}

function shareResult() {
  const text = previewText.value
  if (navigator.share) {
    navigator.share({ title: `B站时长 - ${props.result.title}`, text })
  } else {
    writeClipboard(text)
    setCopied('share')
  }
}
</script>

<template>
  <div class="card summary-card">
    <div class="card-title">复制 / 分享</div>

    <!-- 预览区 -->
    <pre class="summary-text">{{ previewText }}</pre>

    <!-- 含列表开关 -->
    <label class="toggle-row">
      <input type="checkbox" v-model="withList" />
      <span>预览 / 复制时包含完整视频列表（{{ result.videos.length }} 条）</span>
    </label>

    <!-- 操作按钮 -->
    <div class="summary-actions">
      <button
        class="summary-btn"
        :class="{ ok: copiedKey === 'brief' }"
        @click="copyBrief"
      >
        {{ copiedKey === 'brief' ? '✅ 已复制' : '📋 复制摘要' }}
      </button>
      <button
        class="summary-btn"
        :class="{ ok: copiedKey === 'full' }"
        @click="copyFull"
      >
        {{ copiedKey === 'full' ? '✅ 已复制' : '📋 复制含视频列表' }}
      </button>
      <button
        class="summary-btn share-btn"
        :class="{ ok: copiedKey === 'share' }"
        @click="shareResult"
      >
        {{ copiedKey === 'share' ? '✅ 已复制' : '📤 分享' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-title {
  font-size: 15px;
  font-weight: 700;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 2.5px solid var(--pink);
  display: inline-block;
}

.summary-text {
  background: var(--bg);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
  margin-bottom: 10px;
  max-height: 220px;
  overflow-y: auto;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-row input { accent-color: var(--pink); cursor: pointer; }

.summary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-btn {
  flex: 1;
  min-width: 100px;
  height: 40px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
  white-space: nowrap;
}

.summary-btn:hover { border-color: var(--pink); background: #ffeef4; }
.summary-btn:active { transform: scale(0.97); }
.summary-btn.ok { border-color: #4caf50; color: #4caf50; background: #f1f8f1; }
</style>
