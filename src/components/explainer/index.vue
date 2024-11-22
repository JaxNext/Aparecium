<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { genSession } from '@rejax/browser-ai'
import {
  Trash2,
  Copy,
  CopyCheck,
  LoaderPinwheel,
  RefreshCcw,
} from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClipboard } from '@vueuse/core'
import { marked } from 'marked'
/// <reference types="chrome"/>

const { copy } = useClipboard()

const prompts = {
  'children': `You are a friendly teacher who loves to help children learn new words and understand sentences. Use simple language and fun examples. When a child asks about a word or sentence, explain it using simple terms, relatable examples, and engaging analogies. For example, if asked, 'What does 'happy' mean?', you might say: 'Happy means feeling good inside, like when you get your favorite toy!' After explaining, ask the child if they have any questions or if they want to know about another word. Avoid using complex vocabulary or adult concepts.`,
  normal: `You are a language expert who can explain any sentence in a way that is easy to understand. When a user gives you a word or sentence, explain it using simple terms, relatable examples, and engaging analogies. For example, if given, 'cat', you might say: 'A cat is a kind of animal, has one head and four legs………… If you don't understand the given content, you tell the user you don't know and give them some suggestions to find the answer. Must output in markdown format. As short as possible and make sure less than 200 words.`,
}
const initialPrompts = [
  {
    role: 'system',
    content: prompts.normal,
  },
]
const session = ref<Session | null>(null)
const abortController = ref<AbortController | null>(null)
const selectedText = ref('')
const explaination = ref('')
const parsedExplaination = ref('')
const copied = ref(false)
const explaining = ref(false)

let debounceTimer: NodeJS.Timeout

watch(selectedText, (newText) => {
  abort()
  if (!newText) return
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(() => {
    if (newText && session.value) {
      abortController.value = new AbortController()
      explain(abortController.value.signal)
    }
  }, 800)
})

async function explain(signal: AbortSignal) {
  if (!session.value) return
  explaining.value = true
  const stream = await session.value.promptStreaming(selectedText.value, {
    signal,
  })
  for await (const chunk of stream) {
    explaination.value = chunk
    parsedExplaination.value = marked(chunk)
  }
  explaining.value = false
}

function abort() {
  if (abortController.value) {
    abortController.value.abort()
  }
  explaination.value = ''
  parsedExplaination.value = ''
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
  abortController.value = new AbortController()
  explain(abortController.value.signal)
}

onMounted(async () => {
  // Listen for messages from the background script
  if (!chrome?.runtime) return

  session.value = await genSession({
    initialPrompts,
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'textSelected') {
      selectedText.value = message.text
    }
  })
})
</script>

<template>
  <div class="title text-2xl font-bold dark:text-white mb-2">🪄 Aparecium!</div>
  <div class="desc text-sm font-thin dark:text-gray-400 mb-2">Select a word and read the explaination</div>
  <Separator class="mb-4" />
  <div class="title-row flex justify-between items-center mb-4">
    <div class="sub-title text-lg font-bold dark:text-white">Source Text</div>
    <div class="btn-box">
      <Button
        v-if="selectedText"
        class=""
        variant="outline"
        size="icon"
        @click="clearInput"
      >
        <Trash2
          class="w-[14px] h-[14px] text-red-500"
        />
      </Button>
    </div>
  </div>
    <Textarea
      v-model="selectedText"
      placeholder=""
      class="source-text pretty-scrollbar text-sm dark:text-white mb-4 whitespace-pre-line pr-[18px] h-[60px] resize-none overflow-y-auto"
    />
  <!-- Explaination -->
  <div class="title-row flex items-center mb-4">
    <div class="sub-title text-lg font-bold dark:text-white">Explaination</div>
    <div v-if="explaining" class="loading-box ml-[6px]">
      <LoaderPinwheel class="w-[14px] h-[14px] text-gray-400 animate-spin" />
    </div>
    <div class="btn-box ml-auto">
      <Button
        v-if="selectedText"
        class="mr-2"
        variant="outline"
        size="icon"
        title="Redo"
        @click="redo"
      >
        <RefreshCcw class="w-[14px] h-[14px] text-gray-400" />
      </Button>
      <!-- <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">
              Apple
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select> -->
      <Button
        v-if="explaination && !explaining"
        class=""
        variant="outline"
        size="icon"
        :disabled="copied"
        :title="copied ? 'Copied!' : 'Copy'"
        @click="copyExplaination"
      >
        <Copy v-if="!copied" class="w-[14px] h-[14px] text-green-500" />
        <CopyCheck v-else class="w-[14px] h-[14px] text-green-500" />
      </Button>
    </div>
  </div>
  <div class="explaination pretty-scrollbar text-lg dark:text-white h-[calc(100vh-325px)] whitespace-pre-line overflow-y-auto pr-[18px] leading-normal border border-gray-200 rounded-md dark:border-gray-800 p-2" v-html="parsedExplaination"></div>
</template>

<style scoped>

.pretty-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.pretty-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.pretty-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.pretty-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.pretty-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

.explaination :deep(p) {
  /* margin-bottom: 1em; */
}

.explaination :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.explaination :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

.explaination :deep(ul), .explaination :deep(ol) {
  padding-left: 2em;
}

.explaination :deep(blockquote) {
  border-left: 4px solid rgba(0, 0, 0, 0.2);
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 1em;
}
</style>