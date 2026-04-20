import { ref } from 'vue'

export function useSpeechSynthesis() {
  const speaking = ref(false)

  function stopSpeech() {
    window.speechSynthesis.cancel()
    speaking.value = false
  }

  function speak(text: string) {
    if (speaking.value) {
      stopSpeech()
      return
    }

    if (!text) return

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = text
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    const utterance = new SpeechSynthesisUtterance(plainText)

    let voices = window.speechSynthesis.getVoices()

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices()
        
        startSpeaking(voices)
        window.speechSynthesis.onvoiceschanged = null
      }
    } else {
      startSpeaking(voices)
    }

    function startSpeaking(voicesList: SpeechSynthesisVoice[]) {
      const enVoice = voicesList.find(v => v.name.includes('Google US English'))
      if (enVoice) utterance.voice = enVoice

      utterance.onend = () => {
        speaking.value = false
      }

      utterance.onerror = () => {
        speaking.value = false
      }

      speaking.value = true
      window.speechSynthesis.speak(utterance)
    }
  }

  return {
    speaking,
    speak,
    stopSpeech,
  }
}