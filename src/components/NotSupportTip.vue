<template>
  <div class="text-center dark:text-slate-50">
    <h2 class="text-2xl font-bold mt-24">{{ msg || defaultMsg }}</h2>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  msg: string
}>()
const defaultMsg = 'Sorry, this feature is not supported in your browser.'
</script>