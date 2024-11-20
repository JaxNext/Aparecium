<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Separator } from '@/components/ui/separator'
import { promptStreaming, genSession } from '@rejax/browser-ai'

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
const selectedText = ref('')
const explaination = ref('')

// Add debounced watcher
let debounceTimer: NodeJS.Timeout

watch(selectedText, (newText) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(() => {
    if (newText) {
      // Todo: If new text comes in before the last session is done, we need to cancel the last session and start a new one
      
      explain()
    }
  }, 800)
})

async function explain() {
  session.value = await genSession({initialPrompts})
  console.log('session', session.value)

  const stream = session.value.promptStreaming(selectedText.value)
  for await (const chunk of stream) {
    explaination.value = chunk
  }
}

onMounted(async () => {
  // Listen for messages from the background script
  if (!chrome?.runtime) return
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
  <div class="source-text text-sm dark:text-white max-h-[300px] overflow-y-auto mb-4">
    {{ selectedText }}
  </div>
  <!-- Explaination -->
  <template v-if="explaination">
    <Separator label="Explaination" class="mb-4" />
    <div class="explaination text-sm dark:text-white">
      {{ explaination }}
    </div>
  </template>
</template>

<style scoped>
.selected-text-container {
  margin: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>