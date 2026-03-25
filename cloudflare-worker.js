/**
 * Cloudflare Worker — B站 API CORS 代理
 *
 * 部署步骤：
 * 1. 注册/登录 https://dash.cloudflare.com
 * 2. 进入 Workers & Pages → Create → Create Worker
 * 3. 将本文件全部内容粘贴到编辑器 → Save and Deploy
 * 4. 复制分配的 URL（形如 https://xxx.xxx.workers.dev）
 * 5. 在本项目根目录创建 .env.local 文件，写入：
 *    VITE_BILI_PROXY=https://xxx.xxx.workers.dev/
 * 6. 重新构建并部署即可（GitHub Actions 在 Secrets 中添加同名变量）
 */

const ALLOWED_HOSTS = ['api.bilibili.com', 'space.bilibili.com']

export default {
  async fetch(request) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const incoming = new URL(request.url)
    const targetRaw = incoming.searchParams.get('url')

    if (!targetRaw) {
      return new Response(JSON.stringify({ error: 'Missing url param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    let target
    try {
      target = new URL(targetRaw)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid url param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 安全：只允许代理 B站 API 域名，防止 SSRF 滥用
    if (!ALLOWED_HOSTS.includes(target.hostname)) {
      return new Response(JSON.stringify({ error: 'Forbidden host' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    try {
      const resp = await fetch(target.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://www.bilibili.com',
          Origin: 'https://www.bilibili.com',
        },
        redirect: 'follow',
      })

      const body = await resp.text()
      return new Response(body, {
        status: resp.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
