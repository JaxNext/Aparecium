<script setup lang="ts">
import { Button } from '@/components/ui/button'

import { Sun, Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

// Pass { disableTransition: false } to enable transitions
const mode = useColorMode()
</script>

<template>
  <Button
    variant="outline"
    class="px-2 py-4 h-6"
    @click="mode = mode === 'dark' ? 'light' : 'dark'"
  >
    <Moon class="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Sun class="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-slate-50" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>