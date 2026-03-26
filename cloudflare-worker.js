/**
 * Cloudflare Worker — B站 API CORS 代理
 *
 * ★ 部署方法（Web 编辑器，最简单）：
 * 1. 登录 https://dash.cloudflare.com
 * 2. 左侧 Workers & Pages → Create → 选 "Hello World" 模板 → Create
 * 3. 点击右上角 "Edit code"
 * 4. 全选编辑器内容，粘贴本文件全部内容 → Deploy
 * 5. 复制 Worker URL（形如 https://bilibiliplaylistlength.你的名字.workers.dev）
 * 6. 在本项目根目录创建 .env.local，写入：
 *      VITE_BILI_PROXY=https://bilibiliplaylistlength.你的名字.workers.dev
 *    （注意：结尾不加斜杠）
 * 7. GitHub Actions：仓库 Settings → Secrets → Actions → New secret
 *      名称: VITE_BILI_PROXY  值: 同上
 *    并在 .github/workflows/deploy.yml 的 "npm run build" 步骤下加：
 *      env:
 *        VITE_BILI_PROXY: ${{ secrets.VITE_BILI_PROXY }}
 */

const ALLOWED_HOSTS = ['api.bilibili.com', 'space.bilibili.com']

const ALLOWED_ORIGINS = [
  'https://aceykn.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || ''
  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return origin
  return ALLOWED_ORIGINS[0] // 不匹配时不返回 *，阻止跨域
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResp(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  })
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(request) })
  }

  const { searchParams } = new URL(request.url)
  const targetRaw = searchParams.get('url')
  if (!targetRaw) return jsonResp({ error: 'Missing url param' }, 400, request)

  let target
  try {
    target = new URL(targetRaw)
  } catch (_) {
    return jsonResp({ error: 'Invalid url param' }, 400, request)
  }

  // 安全：仅允许代理 B站 API 域名，防止 SSRF 滥用
  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    return jsonResp({ error: 'Forbidden host' }, 403, request)
  }

  try {
    const resp = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
      },
      redirect: 'follow',
    })
    const body = await resp.text()
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...corsHeaders(request),
      },
    })
  } catch (err) {
    return jsonResp({ error: String(err) }, 502, request)
  }
}

// Service Worker 格式（兼容 Cloudflare Web 编辑器默认模式）
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
