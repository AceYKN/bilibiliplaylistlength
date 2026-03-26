<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <div class="card loading-section">
    <div class="spinner"></div>
    <p>{{ text }}</p>
  </div>
</template>

<style scoped>
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
</style>
