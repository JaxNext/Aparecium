import { ref } from 'vue'
import { genTranslator, checkTranslatorAvailability } from '@rejax/browser-ai'
import { useStorage } from '@vueuse/core'

export function useTranslation() {
  const storage = useStorage('aparecium-settings', {
    translateTo: 'en',
  })

  const canTranslate = ref(false)
  const translateTo = ref(storage.value.translateTo)
  const translating = ref(false)
  const translator = ref<Translator | null>(null)
  const translatedExplaination = ref('')

  const langList = [
    { label: 'English', value: 'en' },
    { label: '中文', value: 'zh' },
  ]

  async function checkAvailability() {
    canTranslate.value = (await checkTranslatorAvailability({
      sourceLanguage: 'en',
      targetLanguage: 'zh',
    }))?.available ?? false
  }

  async function translate(text: string, signal?: AbortSignal) {
    if (!canTranslate.value || translateTo.value === 'en') {
      translatedExplaination.value = text
      return
    }

    translating.value = true

    if (!translator.value) {
      translator.value = await genTranslator({
        sourceLanguage: 'en',
        targetLanguage: translateTo.value,
      })
    }

    translatedExplaination.value = await translator.value.translate(text, {
      signal,
    })
    translating.value = false
  }

  async function changeLang(lang: string) {
    translateTo.value = lang
    storage.value.translateTo = lang
    translator.value = null
  }

  function abortTranslate() {
    if (translator.value) {
      translator.value = null
    }
    translatedExplaination.value = ''
    translating.value = false
  }

  return {
    canTranslate,
    translateTo,
    translating,
    translatedExplaination,
    langList,
    checkAvailability,
    translate,
    changeLang,
    abortTranslate,
  }
}