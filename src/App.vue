<script setup lang="ts">
import DarkMode from '@/components/DarkMode.vue'
</script>

<template>
  <div class="dark:bg-[rgb(2,8,23)] min-h-screen box-border p-6">
    <h1 class="text-2xl font-bold dark:text-white">Hello World</h1>
    <DarkMode class="fixed right-2 top-2" />
  </div>
</template>