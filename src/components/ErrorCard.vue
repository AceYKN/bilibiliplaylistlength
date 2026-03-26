<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="card error-section">
    <div class="error-icon">⚠️</div>
    <p class="error-text">{{ message }}</p>
    <div class="error-help">
      <strong>常见原因：</strong><br />
      • B站 API 限制跨域访问，公共代理可能不稳定——建议部署 Cloudflare Worker（见项目 <code>cloudflare-worker.js</code>）<br />
      • 网络波动或请求超时，请稍后重试<br />
      • BV号 / 链接格式有误<br />
      • 视频已被删除或设置了权限
    </div>
  </div>
</template>

<style scoped>
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
  background: var(--error-help-bg);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.8;
}


</style>
