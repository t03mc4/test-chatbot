<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

// Override link renderer to open links in new tab
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  if (!token) return defaultRender(tokens, idx, options, env, self)

  const aIndex = token.attrIndex('target')

  if (aIndex < 0) {
    token.attrPush(['target', '_blank'])
  } else if (token.attrs && token.attrs[aIndex]) {
    token.attrs[aIndex][1] = '_blank'
  }

  // Add rel="noopener noreferrer" for security
  const relIndex = token.attrIndex('rel')
  if (relIndex < 0) {
    token.attrPush(['rel', 'noopener noreferrer'])
  } else if (token.attrs && token.attrs[relIndex]) {
    token.attrs[relIndex][1] = 'noopener noreferrer'
  }

  return defaultRender(tokens, idx, options, env, self)
}

const props = withDefaults(
  defineProps<{
    appId?: string
    appName?: string
  }>(),
  {
    appId: '',
    appName: '',
  },
)

const isOpen = ref(false)
const message = ref('')
const messages = ref<Array<{ text: string; sender: 'user' | 'bot'; isWarning?: boolean; words?: string[] }>>([])
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const exampleQuestions = ref<string[]>([])

const STORAGE_KEY_SESSION = 'ta_ChatSession'
const STORAGE_KEY_HISTORY = 'ta_ChatHistory'

interface ChatSession {
  conversation_id: string
  user_id: string
  created_at: string
  app_id: string
  app_name: string
  ip: string
  userAgent: string
}

const chatSession = ref<ChatSession | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return '0.0.0.0'
  }
}

const fetchExampleQuestions = async () => {
  try {
    const response = await fetch(
      `https://v2g2t755g3.execute-api.eu-central-1.amazonaws.com/sales-chat/example-questions?app_id=${props.appId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      exampleQuestions.value = data.questions
    }
  } catch (error) {
    console.error('Failed to fetch example questions:', error)
  }
}

const initChat = async () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SESSION)
    if (stored) {
      chatSession.value = JSON.parse(stored)
      return
    }

    const ip = await getUserIP()
    const userAgent = navigator.userAgent

    const response = await fetch('https://v2g2t755g3.execute-api.eu-central-1.amazonaws.com/sales-chat/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: props.appId,
        ip,
        userAgent,
        utm: {
          source: 'landing',
          campaign: 'fall-2025',
        },
        app_name: props.appName,
      }),
    })

    const data = await response.json()
    chatSession.value = {
      ...data,
      app_id: props.appId,
      app_name: props.appName,
      ip,
      userAgent,
    }

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(chatSession.value))
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([]))
  } catch (error) {
    console.error('Failed to initialize chat:', error)
  }
}

const loadChatHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (stored) {
      messages.value = JSON.parse(stored)

      // Check if last message is from user (connection was lost before bot could respond)
      if (messages.value.length > 0) {
        const lastMessage = messages.value[messages.value.length - 1]
        if (lastMessage && lastMessage.sender === 'user') {
          // Add warning message
          messages.value.push({
            text: 'Cevap verilemedi, bağlantı kesildi. Lütfen mesajınızı tekrar gönderin.',
            sender: 'bot',
            isWarning: true,
          })
          // Save updated history with warning
          saveChatHistory()
        }
      }
    }
  } catch (error) {
    console.error('Failed to load chat history:', error)
  }
}

const saveChatHistory = () => {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(messages.value))
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}

const typeMessage = async (text: string) => {
  const botMessageIndex = messages.value.length
  messages.value.push({
    text: '',
    sender: 'bot',
  })

  // Instead of appending HTML char by char, we'll append the original markdown text
  // and re-render it each time to ensure valid HTML output
  let currentText = ''

  for (let i = 0; i < text.length; i++) {
    currentText += text.charAt(i)
    if (messages.value[botMessageIndex]) {
      // Render the current portion of markdown to HTML
      messages.value[botMessageIndex]!.text = md.render(currentText)
    }
    await new Promise(resolve => setTimeout(resolve, 30))
  }

  saveChatHistory()
}

const sendMessage = async () => {
  if (!message.value.trim() || isLoading.value || !chatSession.value) return

  const userMessage = message.value
  message.value = ''

  messages.value.push({
    text: userMessage,
    sender: 'user',
  })
  saveChatHistory()
  scrollToBottom()

  isLoading.value = true

  try {
    const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

    const response = await fetch('https://v2g2t755g3.execute-api.eu-central-1.amazonaws.com/sales-chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: chatSession.value.conversation_id,
        app_id: chatSession.value.app_id,
        user_id: chatSession.value.user_id,
        message: userMessage,
        created_at: createdAt,
        ip: chatSession.value.ip,
        userAgent: chatSession.value.userAgent,
        app_name: chatSession.value.app_name,
      }),
    })

    const data = await response.json()

    isLoading.value = false
    await typeMessage(data.answer)
  } catch (error) {
    console.error('API Error:', error)
    isLoading.value = false
    await typeMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.')
  }
}

const handleExampleQuestionClick = (question: string) => {
  exampleQuestions.value = []
  message.value = question
  sendMessage()
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(async () => {
  await initChat()
  loadChatHistory()

  if (messages.value.length === 0) {
    await fetchExampleQuestions()
  }
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      <div v-if="isOpen"
        class="mb-4 flex flex-col bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] md:max-h-[600px]">
        <div class="flex items-center justify-between px-6 py-4 bg-[#6246FF] rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="h-10 flex items-center justify-center">
              <img src="../assets/img/logo.svg" alt="Tutku" class="w-full h-full object-cover">
            </div>
          </div>
          <button @click="toggleChat" class="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
              stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth">
          <div v-if="messages.length === 0" class="flex flex-col h-full">
            <div class="mb-6">
              <div class="bg-white rounded-2xl px-4 py-3 shadow-sm inline-block rounded-bl-sm">
                <p class="text-sm text-gray-800">
                  <span class="font-semibold">Tutku</span>
                </p>
                <p class="text-sm text-gray-800 mt-1">
                  Hi there! 👋 I'm Tutku. How can I help you today?
                </p>
              </div>
            </div>

            <div v-if="exampleQuestions.length > 0" class="space-y-3">
              <button v-for="(question, index) in exampleQuestions" :key="index"
                @click="handleExampleQuestionClick(question)"
                class="w-full bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-3 text-left group">
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  index === 0 ? 'bg-blue-100' :
                    index === 1 ? 'bg-purple-100' :
                      index === 2 ? 'bg-indigo-100' :
                        index === 3 ? 'bg-yellow-100' :
                          index === 4 ? 'bg-pink-100' :
                            'bg-violet-100'
                ]">
                  <svg v-if="index === 0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" class="w-5 h-5 text-blue-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  <svg v-else-if="index === 1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" class="w-5 h-5 text-purple-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg v-else-if="index === 2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" class="w-5 h-5 text-indigo-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <svg v-else-if="index === 3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" class="w-5 h-5 text-yellow-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <svg v-else-if="index === 4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" class="w-5 h-5 text-pink-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="w-5 h-5 text-violet-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900">{{ question }}</span>
              </button>
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
                : msg.isWarning
                  ? 'bg-yellow-50 text-yellow-800 border-2 border-yellow-400 rounded-bl-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm',
            ]">
              <div v-if="msg.sender === 'bot'" :class="[
                'text-sm leading-relaxed',
                msg.isWarning ? '' : 'prose prose-sm max-w-none'
              ]" v-html="msg.text"></div>
              <p v-else class="text-sm leading-relaxed">{{ msg.text }}</p>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-start">
            <div class="max-w-[80%] rounded-2xl px-4 py-2.5 bg-white text-gray-800 rounded-bl-sm shadow-sm">
              <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
          <div class="flex items-end gap-2">
            <textarea v-model="message" @keypress="handleKeyPress" placeholder="Mesajınızı yazın..." rows="1"
              class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            <button @click="sendMessage" :disabled="!message.trim() || isLoading"
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
    </Transition>

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

<style>
.prose p {
  margin: 0.5em 0;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}

.prose ul,
.prose ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
  list-style-type: disc;
}

.prose li {
  margin: 0.25em 0;
}

.prose strong {
  font-weight: 600;
}

.prose em {
  font-style: italic;
}

.prose code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: monospace;
}

.prose pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin: 0.5em 0;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose a {
  color: #4f46e5;
  text-decoration: underline;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  font-weight: 600;
  margin: 0.75em 0 0.5em 0;
}

.prose h1:first-child,
.prose h2:first-child,
.prose h3:first-child,
.prose h4:first-child,
.prose h5:first-child,
.prose h6:first-child {
  margin-top: 0;
}

.prose blockquote {
  border-left: 3px solid rgba(0, 0, 0, 0.1);
  padding-left: 0.75rem;
  margin: 0.5em 0;
  font-style: italic;
}
</style>
