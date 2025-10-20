<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
const message = ref('')
const messages = ref<Array<{ text: string; sender: 'user' | 'bot' }>>([])

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const sendMessage = () => {
  if (!message.value.trim()) return

  messages.value.push({
    text: message.value,
    sender: 'user',
  })

  const userMessage = message.value
  message.value = ''

  setTimeout(() => {
    messages.value.push({
      text: `Echo: ${userMessage}`,
      sender: 'bot',
    })
  }, 500)
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    <div v-if="isOpen"
      class="mb-4 flex flex-col bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] md:max-h-[600px]">
      <div
        class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6 text-indigo-600">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <div>
            <h3 class="text-white font-semibold text-lg">Tutku AI</h3>
            <p class="text-indigo-100 text-xs">Online</p>
          </div>
        </div>
        <button @click="toggleChat" class="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-8 h-8 text-indigo-600">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p class="text-gray-600 font-medium">Merhaba! Size nasıl yardımcı olabilirim?</p>
            <p class="text-gray-400 text-sm mt-2">Bir mesaj göndererek sohbete başlayın.</p>
          </div>
        </div>

        <div v-for="(msg, index) in messages" :key="index" :class="[
          'flex',
          msg.sender === 'user' ? 'justify-end' : 'justify-start',
        ]">
          <div :class="[
            'max-w-[80%] rounded-2xl px-4 py-2.5',
            msg.sender === 'user'
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm',
          ]">
            <p class="text-sm leading-relaxed">{{ msg.text }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
        <div class="flex items-end gap-2">
          <textarea v-model="message" @keypress="handleKeyPress" placeholder="Mesajınızı yazın..." rows="1"
            class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          <button @click="sendMessage" :disabled="!message.trim()"
            class="bg-indigo-600 text-white rounded-xl px-5 py-3 hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <button @click="toggleChat" :class="[
      'w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center',
      isOpen ? 'rotate-0' : 'hover:scale-110',
    ]">
      <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
        stroke="currentColor" class="w-7 h-7">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
        stroke="currentColor" class="w-7 h-7">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  </div>
</template>
