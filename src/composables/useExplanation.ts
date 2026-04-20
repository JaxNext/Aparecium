import { ref, computed } from 'vue'
import { genSession } from '@rejax/browser-ai'
import { useStorage } from '@vueuse/core'
import { marked } from 'marked'

export function useExplanation() {
  const storage = useStorage('aparecium-settings', {
    len: 50,
  })

  const session = ref<Session | null>(null)
  const explainController = ref<AbortController | null>(null)
  const explaination = ref('')
  const parsedExplaination = ref('')
  const explaining = ref(false)
  const length = ref(storage.value.len)

  const chromeVersion = ref('')
  const chromeVersionFirst = computed(() => {
    if (!chromeVersion.value) return ''
    return chromeVersion.value.split('.')[0]
  })

  const lengthList = [
    { label: 'Short', value: 50 },
    { label: 'Medium', value: 100 },
    { label: 'Long', value: 200 },
  ]

  function genInitialPrompts() {
    const prompts = {
      normal: `You are a language expert who explains words and phrases in their proper context. When given a text and its surrounding context, explain the meaning while considering how the context affects the interpretation. If there is no context, explain the word or phrase in isolation. Use simple terms, relatable examples, and engaging analogies. If you don't understand the content, say so and provide suggestions for finding the answer. Format output in markdown and keep responses under ${length.value} words.`,
    }
    return [
      {
        role: 'system',
        content: prompts.normal,
      },
    ]
  }

  async function initSession() {
    session.value = await genSession({
      initialPrompts: genInitialPrompts(),
    })
  }

  async function explain(
    text: string,
    context: { before: string; after: string },
    signal: AbortSignal,
  ) {
    if (!session.value) return
    explaining.value = true

    const prompt = `
    Here is the text that needs to be explained:
    ${text}

    Here is the context where this text appears:
    ${context.before} [${text}] ${context.after}

    Please explain the text above using simple terms, relatable examples, and engaging analogies. Keep your explanation under ${length.value} words and format the response in markdown.
  `
    const stream = await session.value.promptStreaming(prompt, { signal })
    for await (const chunk of stream) {
      if (chromeVersionFirst.value > '131') {
        explaination.value += chunk
      } else {
        explaination.value = chunk
      }
      parsedExplaination.value = marked(explaination.value)
    }
    explaining.value = false
  }

  function abortExplain() {
    if (explainController.value) {
      explainController.value.abort()
    }
    explaination.value = ''
    parsedExplaination.value = ''
    explaining.value = false
  }

  async function changeLength(len: number) {
    length.value = len
    storage.value.len = len
    await initSession()
  }

  function getChromeVersion() {
    const userAgent = navigator.userAgent
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    chromeVersion.value = match ? match[1] : ''
  }

  return {
    session,
    explainController,
    explaination,
    parsedExplaination,
    explaining,
    length,
    lengthList,
    genInitialPrompts,
    initSession,
    explain,
    abortExplain,
    changeLength,
    getChromeVersion,
  }
}