<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from "@/components/ui/button";
import {
  genSession,
  checkTranslatorUsability,
  genTranslator,
} from '@rejax/browser-ai'
import {
  Trash2,
  Copy,
  CopyCheck,
  LoaderPinwheel,
  RefreshCcw,
  Languages,
  Ruler,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useClipboard,
  useStorage,
} from '@vueuse/core'
import { marked } from 'marked'
/// <reference types="chrome"/>

const { copy } = useClipboard()

const session = ref<Session | null>(null)
const explainController = ref<AbortController | null>(null)
const translateController = ref<AbortController | null>(null)
const selectedText = ref('')
const explaination = ref('')
const parsedExplaination = ref('')
const copied = ref(false)
const explaining = ref(false)
const storage = useStorage('aparecium-settings', {
  translateTo: 'en',
  len: 50,
})
const canTranslate = ref(false)
const translateTo = ref(storage.value.translateTo)
const langList = [
  {
    label: 'English',
    value: 'en',
  },
  {
    label: '中文',
    value: 'zh',
  },
]
const translating = ref(false)
const translator = ref<Translator | null>(null)
const translatedExplaination = ref('')
const length = ref(storage.value.len)
const lengthList = [
  {
    label: 'Short',
    value: 50,
  },
  {
    label: 'Medium',
    value: 100,
  },
  {
    label: 'Long',
    value: 200,
  },
]
const selectedContext = ref({
  before: '',
  after: '',
})

const isAutoDetect = ref(false)
const chromeVersion = ref('')
const chromeVersionFirst = computed(() => {
  if (!chromeVersion.value) return ''
  return chromeVersion.value.split('.')[0]
})

function genInitialPrompts() {
  const prompts = {
    'children': `You are a friendly teacher who loves to help children learn new words and understand sentences. Use simple language and fun examples. When a child asks about a word or sentence, explain it using simple terms, relatable examples, and engaging analogies. For example, if asked, 'What does 'happy' mean?', you might say: 'Happy means feeling good inside, like when you get your favorite toy!' After explaining, ask the child if they have any questions or if they want to know about another word. Avoid using complex vocabulary or adult concepts.`,
    normal: `You are a language expert who explains words and phrases in their proper context. When given a text and its surrounding context, explain the meaning while considering how the context affects the interpretation. If there is no context, explain the word or phrase in isolation. Use simple terms, relatable examples, and engaging analogies. If you don't understand the content, say so and provide suggestions for finding the answer. Format output in markdown and keep responses under ${length.value} words.`,
  }
  const initialPrompts = [
    {
      role: 'system',
      content: prompts.normal,
    },
  ]
  return initialPrompts
}

let debounceTimer: NodeJS.Timeout

watch(selectedText, (newText) => {
  abort()
  if (!newText) return
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(() => {
    if (newText && session.value) {
      explainController.value = new AbortController()
      explain(explainController.value.signal)
    }
  }, 800)
})

async function explain(signal: AbortSignal) {
  console.log('isAutoDetect', isAutoDetect.value);
  if (!isAutoDetect.value) {
    selectedContext.value = {
      before: '',
      after: '',
    }
  }
  if (!session.value) return
  explaining.value = true
  // const prompt = `
  //   Here is the text that needs to be explained:
  //   ${selectedText.value}

  //   Here is the context where this text appears:
  //   <Context>
  //   ${selectedContext.value.before} [${selectedText.value}] ${selectedContext.value.after}
  //   </Context>

  //   Please explain the text above using simple terms, relatable examples, and engaging analogies.

  //   You will output as the following structure:
  //   <Structure>
  //     <Meaning>${!selectedContext.value.before && !selectedContext.value.after ? 'Explain the text in isolation.' : 'The specific meaning in the given context above.'}</Meaning>
  //     <Synonyms>Up to 3 words that are similar in meaning to the text.</Synonyms>
  //     <Example>A example to help understand the meaning.</Example>
  //   </Structure>

  //   Keep your explanation under ${length.value} words and format the response in markdown.
  // `
  const prompt = `
    Here is the text that needs to be explained:
    ${selectedText.value}

    Here is the context where this text appears:
    ${selectedContext.value.before} [${selectedText.value}] ${selectedContext.value.after}

    Please explain the text above using simple terms, relatable examples, and engaging analogies. Keep your explanation under ${length.value} words and format the response in markdown.
  `
  const stream = await session.value.promptStreaming(prompt, {
    signal,
  })
  for await (const chunk of stream) {
    if (chromeVersionFirst.value > '131') {
      explaination.value += chunk
    } else {
      explaination.value = chunk
    }
    parsedExplaination.value = marked(explaination.value)
  }
  explaining.value = false
  await translate()
}
function abort () {
  abortExplain()
  abortTranslate()
}
function abortExplain() {
  if (explainController.value) {
    explainController.value.abort()
  }
  explaination.value = ''
  parsedExplaination.value = ''
  explaining.value = false
}

function abortTranslate() {
  if (translateController.value) {
    translateController.value.abort()
  }
  translatedExplaination.value = ''
  translating.value = false
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
  explain(explainController.value.signal)
}

async function changeLang(lang: string) {
  translateTo.value = lang
  storage.value.translateTo = lang
  if (parsedExplaination.value) {
    translator.value = null
    await translate()
  }
}

async function translate() {
  if (!canTranslate.value || translateTo.value === 'en') {
    translatedExplaination.value = parsedExplaination.value
    return
  }
  translating.value = true
  if (!translator.value) {
    translator.value = await genTranslator({
      sourceLanguage: 'en',
      targetLanguage: translateTo.value,
    })
  }
  translateController.value = new AbortController()
  translatedExplaination.value = await translator.value.translate(parsedExplaination.value, {
    signal: translateController.value.signal,
  })
  translating.value = false
}

async function changeLength(len: number) {
  length.value = len
  storage.value.len = len
  session.value = await genSession({
    initialPrompts: genInitialPrompts(),
  })
  if (selectedText.value) {
    abort()
    explainController.value = new AbortController()
    explain(explainController.value.signal)
  }
}

onMounted(async () => {
  getChromeVersion()
  // Listen for messages from the background script
  if (chrome?.runtime) {
    console.log('onMounted', storage.value.len, typeof storage.value.len)

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'textSelected') {
        isAutoDetect.value = true
        selectedText.value = message.text
        selectedContext.value = message.context
      }
    })
  }
  session.value = await genSession({
    initialPrompts: genInitialPrompts(),
  })

  canTranslate.value = (await checkTranslatorUsability({
    sourceLanguage: 'en',
    targetLanguage: 'zh',
  }))?.available ?? false

})

function getChromeVersion() {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/Chrome\/([0-9.]+)/);
  chromeVersion.value = match ? match[1] : '';
}
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
        class=""
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
      <DropdownMenu v-if="canTranslate && explaination && !explaining">
        <DropdownMenuTrigger as-child>
          <Button
            class="mr-2"
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
            @click="changeLang(lang.value)"
          >
            {{ lang.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu v-if="explaination && !explaining">
        <DropdownMenuTrigger as-child>
          <Button
            class="mr-2"
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
            @click="changeLength(len.value)"
          >
            {{ len.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        v-if="explaination && !explaining"
        class=""
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

.gradient-text {
  background: linear-gradient(135deg, #FF0080 0%, #7928CA 50%, #FF4D4D 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-shadow: 0 0 1px rgba(0,0,0,0.1);
}

/* Brighter gradient for dark mode */
@media (prefers-color-scheme: dark) {
  .gradient-text {
    background: linear-gradient(135deg, #FF1493 0%, #9D4EDD 50%, #FF6B6B 100%);
    -webkit-background-clip: text;
    background-clip: text;
    filter: brightness(1.2) contrast(1.1);
  }
}
</style>