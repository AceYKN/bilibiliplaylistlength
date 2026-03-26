<script setup lang="ts">
defineProps<{ isDark: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button class="theme-toggle" :title="isDark ? '切换到亮色' : '切换到深色'" @click="$emit('toggle')">
    <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 999;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
  line-height: 1;
  padding: 0;
}
.theme-toggle:hover  { transform: scale(1.1); }
.theme-toggle:active { transform: scale(0.95); }
</style>
