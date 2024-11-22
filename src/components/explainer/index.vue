<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { genSession } from '@rejax/browser-ai'
import { CircleX, Copy } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'

const { copy } = useClipboard()

const prompts = {
  'children': `You are a friendly teacher who loves to help children learn new words and understand sentences. Use simple language and fun examples. When a child asks about a word or sentence, explain it using simple terms, relatable examples, and engaging analogies. For example, if asked, 'What does 'happy' mean?', you might say: 'Happy means feeling good inside, like when you get your favorite toy!' After explaining, ask the child if they have any questions or if they want to know about another word. Avoid using complex vocabulary or adult concepts.`,
  normal: `You are a language expert who can explain any sentence in a way that is easy to understand. When a user gives you a word or sentence, explain it using simple terms, relatable examples, and engaging analogies. For example, if given, 'cat', you might say: 'A cat is a kind of animal, has one head and four legs………… If you don't understand the given content, you tell the user you don't know and give them some suggestions to find the answer.`,
}
const initialPrompts = [
  {
    role: 'system',
    content: prompts.normal,
  },
]
const session = ref(null)
const abortController = ref(null)
const selectedText = ref('')
const explaination = ref('')

let debounceTimer: NodeJS.Timeout

watch(selectedText, (newText) => {
  abort()
  if (!newText) return
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(() => {
    if (newText) {
      abortController.value = new AbortController()
      explain(abortController.value.signal)
    }
  }, 800)
})

async function explain(signal: AbortSignal) {
  const stream = await session.value.promptStreaming(selectedText.value, {
    signal,
  })
  for await (const chunk of stream) {
    explaination.value = (chunk)
  }
}

function abort() {
  if (abortController.value) {
    abortController.value.abort()
  }
  explaination.value = ''
}

async function clearInput() {
  selectedText.value = ''
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
  <div class="title text-lg font-bold dark:text-white mb-8">Left to select, right to explain</div>
  <!-- Source Text from user selection -->
  <Separator label="Source Text" class="mb-4" />
  <div class="relative">
    <Textarea
      v-model="selectedText"
      placeholder=""
      class="source-text text-sm dark:text-white max-h-[300px] overflow-y-auto mb-4 whitespace-pre-line pr-[18px]"
    />
    <Button
      v-if="selectedText"
      class="absolute right-2 top-2"
      variant="outline"
      size="icon"
      @click="clearInput"
    >
      <CircleX
        class="w-[12px] h-[12px] text-gray-500 dark:text-white"
      />
    </Button>
  </div>
  <!-- Explaination -->
  <template v-if="explaination">
    <Separator label="Explaination" class="mb-4" />
    <div class="relative">
      <div class="explaination text-sm dark:text-white h-[calc(100vh-240px)] whitespace-pre-line overflow-y-auto pr-[18px]">
        {{ explaination }}
      </div>
      <Button
        v-if="explaination"
        class="absolute right-2 top-2"
        variant="outline"
        size="icon"
        @click="copy(explaination)"
      >
        <Copy class="w-[12px] h-[12px] text-gray-500 dark:text-white" />
      </Button>
    </div>
  </template>
</template>

<style scoped>

</style>