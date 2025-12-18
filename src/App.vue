<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { checkPromptAvailability, requestModelDownloadProgress } from '@rejax/browser-ai'
import DarkMode from '@/components/DarkMode.vue'
import NotSupportTip from '@/components/NotSupportTip.vue'
import Explainer from '@/components/explainer/index.vue'

const isSupport = ref(false)
const isReady = ref(false)
const msg = ref('')

onMounted(async () => {
  const checkRes = await checkPromptAvailability()
  console.log(checkRes)
  const { available, loadingModel, message } = checkRes
  isSupport.value = available
  msg.value = message
  isReady.value = true
  if (loadingModel) {
    requestModelDownloadProgress((progress) => {
      console.log(progress)
    })
  }
})
</script>

<template>
  <div class="dark:bg-[rgb(2,8,23)] min-h-screen box-border p-6">
    <NotSupportTip v-if="isReady && !isSupport" :msg="msg" />
    <Explainer v-else-if="isReady" />
    <DarkMode class="fixed right-6 top-6" />
  </div>
</template>

<style scoped>

</style>