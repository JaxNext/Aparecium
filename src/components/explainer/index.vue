<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from "@/components/ui/button"
import {
  Trash2,
  Copy,
  CopyCheck,
  LoaderPinwheel,
  RefreshCcw,
  Languages,
  Ruler,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClipboard } from '@vueuse/core'
import { useExplanation } from '@/composables/useExplanation'
import './explainer.css'
import { useTranslation } from '@/composables/useTranslation'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
/// <reference types="chrome"/>

const { copy } = useClipboard()

const {
  session,
  explainController,
  explaination,
  parsedExplaination,
  explaining,
  length,
  lengthList,
  initSession,
  explain,
  abortExplain,
  changeLength,
  getChromeVersion,
} = useExplanation()

const {
  canTranslate,
  translateTo,
  translating,
  translatedExplaination,
  langList,
  checkAvailability,
  translate,
  changeLang,
  abortTranslate,
} = useTranslation()

const {
  speaking,
  speak,
  stopSpeech,
} = useSpeechSynthesis()

const selectedText = ref('')
const copied = ref(false)
const selectedContext = ref({
  before: '',
  after: '',
})
const isAutoDetect = ref(false)

let debounceTimer: NodeJS.Timeout

watch(selectedText, (newText) => {
  abort()
  if (!newText) return
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    if (newText && session.value) {
      explainController.value = new AbortController()
      runExplain(explainController.value.signal)
    }
  }, 800)
})

async function runExplain(signal: AbortSignal) {
  const context = isAutoDetect.value
    ? selectedContext.value
    : { before: '', after: '' }

  await explain(selectedText.value, context, signal)
  await translate(parsedExplaination.value)
}

function abort() {
  abortExplain()
  abortTranslate()
  stopSpeech()
}

async function clearInput() {
  selectedText.value = ''
}

async function copyExplaination() {
  copy(explaination.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1000)
}

async function redo() {
  await abort()
  explainController.value = new AbortController()
  runExplain(explainController.value.signal)
}

async function handleChangeLang(lang: string) {
  await changeLang(lang)
  if (parsedExplaination.value) {
    await translate(parsedExplaination.value)
  }
}

async function handleChangeLength(len: number) {
  await changeLength(len)
  if (selectedText.value) {
    abort()
    explainController.value = new AbortController()
    runExplain(explainController.value.signal)
  }
}

function handleSpeak() {
  const textToRead = translatedExplaination.value || explaination.value
  speak(textToRead, translateTo.value)
}

onMounted(async () => {
  getChromeVersion()
  if (chrome?.runtime) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'textSelected') {
        isAutoDetect.value = true
        selectedText.value = message.text
        selectedContext.value = message.context
      }
    })
  }
  await initSession()
  await checkAvailability()
})
</script>

<template>
  <div class="title text-2xl font-bold mb-2 gradient-text">🪄 Aparecium!</div>
  <div class="desc text-sm font-thin dark:text-gray-400 mb-2">Select a word and read the explaination</div>
  <Separator class="mb-4" />
  <div class="title-row flex justify-between items-center mb-4">
    <div class="sub-title text-lg font-bold dark:text-white">Source Text</div>
    <div class="btn-box">
      <Button
        v-if="selectedText"
        class="w-[24px] h-[24px]"
        variant="outline"
        size="icon"
        @click="clearInput"
      >
        <Trash2
          class="w-[14px] h-[14px] text-gray-400"
        />
      </Button>
    </div>
  </div>
    <Textarea
      v-model="selectedText"
      placeholder=""
      class="source-text pretty-scrollbar text-sm dark:text-white mb-4 whitespace-pre-line pr-[18px] h-[60px] resize-none overflow-y-auto"
      @focus="isAutoDetect = false"
      @blur="isAutoDetect = true"
    />
  <!-- Explaination -->
  <div class="title-row flex items-center mb-4">
    <div class="sub-title text-lg font-bold dark:text-white">Explaination</div>
    <div v-if="explaining || translating" class="loading-box ml-[6px] flex items-center">
      <LoaderPinwheel class="w-[14px] h-[14px] text-gray-400 animate-spin" />
      <div class="status text-xs text-gray-500 ml-1">{{ explaining ? 'Explaining' : 'Translating' }}</div>
    </div>
    <div class="btn-box ml-auto flex items-center">
      <Button
        v-if="explaination && !explaining && !translating"
        class="mr-2 w-[24px] h-[24px]"
        variant="outline"
        size="icon"
        :title="speaking ? 'Stop' : 'Read Aloud'"
        @click="handleSpeak"
      >
        <VolumeX v-if="speaking" class="w-[14px] h-[14px] text-red-400" />
        <Volume2 v-else class="w-[14px] h-[14px] text-gray-400" />
      </Button>
      
      <Button
        v-if="selectedText"
        class="mr-2 w-[24px] h-[24px]"
        variant="outline"
        size="icon"
        title="Redo"
        @click="redo"
      >
        <RefreshCcw class="w-[14px] h-[14px] text-gray-400" />
      </Button>
      <DropdownMenu v-if="canTranslate && explaination && !explaining">
        <DropdownMenuTrigger as-child>
          <Button
            class="mr-2 w-[24px] h-[24px]"
            variant="outline"
            size="icon"
            title="Translate"
          >
            <Languages class="w-[14px] h-[14px] text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-28">
          <DropdownMenuLabel>Translate to</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="lang in langList"
            :key="lang.value"
            :value="lang.value"
            :checked="translateTo === lang.value"
            @click="handleChangeLang(lang.value)"
          >
            {{ lang.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu v-if="explaination && !explaining">
        <DropdownMenuTrigger as-child>
          <Button
            class="mr-2 w-[24px] h-[24px]"
            variant="outline"
            size="icon"
            title="Length"
          >
            <Ruler class="w-[14px] h-[14px] text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-28">
          <DropdownMenuLabel>Length</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="len in lengthList"
            :key="len.value"
            :value="len.value"
            :checked="len.value === length"
            @click="handleChangeLength(len.value)"
          >
            {{ len.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        v-if="explaination && !explaining"
        class="w-[24px] h-[24px]"
        variant="outline"
        size="icon"
        :disabled="copied"
        :title="copied ? 'Copied!' : 'Copy'"
        @click="copyExplaination"
      >
        <Copy v-if="!copied" class="w-[14px] h-[14px] text-gray-400" />
        <CopyCheck v-else class="w-[14px] h-[14px] text-green-500" />
      </Button>
    </div>
  </div>
  <div
    v-if="parsedExplaination && !translatedExplaination"
    class="explaination pretty-scrollbar text-lg dark:text-white h-[calc(100vh-325px)] whitespace-pre-line overflow-y-auto pr-[18px] leading-normal border border-gray-200 rounded-md dark:border-gray-800 p-2"
    v-html="parsedExplaination"></div>
  <div
    v-if="translatedExplaination"
    class="explaination pretty-scrollbar text-lg dark:text-white h-[calc(100vh-325px)] whitespace-pre-line overflow-y-auto pr-[18px] leading-normal border border-gray-200 rounded-md dark:border-gray-800 p-2"
    v-html="translatedExplaination"></div>
</template>

