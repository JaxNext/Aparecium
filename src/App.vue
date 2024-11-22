<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { checkPromptUsability } from '@rejax/browser-ai'
import DarkMode from '@/components/DarkMode.vue'
import NotSupportTip from '@/components/NotSupportTip.vue'
import Explainer from '@/components/explainer/index.vue'


const isSupport = ref(false)
const isReady = ref(false)

onMounted(async () => {
  const checkRes = await checkPromptUsability()
  isSupport.value = checkRes?.available
  isReady.value = true
})
</script>

<template>
  <div class="dark:bg-[rgb(2,8,23)] min-h-screen box-border p-6">
    <NotSupportTip v-if="isReady && !isSupport" />
    <Explainer v-else-if="isReady" />
    <DarkMode class="fixed right-6 top-6" />
  </div>
</template>

<style scoped>

</style>