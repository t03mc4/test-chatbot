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
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const exampleQuestions = ref<string[]>([])
const showNewChatModal = ref(false)

const STORAGE_KEY_SESSION = 'ta_ChatSession'

interface ChatSession {
  conversation_id: string
  user_id: string
  created_at: string
  app_id: string
  app_name: string
  ip: string
  userAgent: string
}

interface HistoryItem {
  conversation_id: string
  ts: string
  role: string
  content: string
  app_id: string
  user_id: string
  ip: string
  ua: string
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
  } catch (error) {
    console.error('Failed to initialize chat:', error)
  }
}

const fetchChatHistory = async () => {
  if (!chatSession.value?.conversation_id) return

  try {
    const response = await fetch(
      `https://v2g2t755g3.execute-api.eu-central-1.amazonaws.com/sales-chat/history?conversation_id=${chatSession.value.conversation_id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (data.items && Array.isArray(data.items)) {
      messages.value = data.items.map((item: HistoryItem) => ({
        text: item.role === 'user' ? item.content : md.render(item.content),
        sender: item.role === 'user' ? 'user' : 'bot',
      }))

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
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
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

  isSending.value = false
}

const sendMessage = async () => {
  if (!message.value.trim() || isLoading.value || !chatSession.value) return

  const userMessage = message.value
  message.value = ''

  messages.value.push({
    text: userMessage,
    sender: 'user',
  })
  scrollToBottom()

  isLoading.value = true
  isSending.value = true

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

    isLoading.value = false

    const data = await response.json()

    await typeMessage(data.answer)
    await fetchChatHistory()
  } catch (error) {
    console.error('API Error:', error)
    isLoading.value = false
    isSending.value = false
    await typeMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.')
  }
}

const handleExampleQuestionClick = (question: string) => {
  exampleQuestions.value = []
  message.value = question
  sendMessage()
}

const openNewChatModal = () => {
  showNewChatModal.value = true
}

const closeNewChatModal = () => {
  showNewChatModal.value = false
}

const startNewChat = async () => {
  closeNewChatModal()

  localStorage.removeItem(STORAGE_KEY_SESSION)
  chatSession.value = null
  messages.value = []
  exampleQuestions.value = []

  await initChat()
  await fetchChatHistory()

  if (messages.value.length === 0) {
    await fetchExampleQuestions()
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !isSending.value && !isLoading.value) {
    event.preventDefault()
    sendMessage()
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(async () => {
  await initChat()
  await fetchChatHistory()

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
        class="mb-4 flex relative flex-col bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] md:max-h-[600px]">
        <div class="flex items-center justify-between px-6 py-4 bg-[#6246FF] rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="h-10 flex items-center justify-center">
              <img src="../assets/img/logo.svg" alt="Tutku" class="w-full h-full object-cover">
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button @click="openNewChatModal" class="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button @click="toggleChat" class="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth">
          <div v-if="messages.length === 0" class="flex flex-col h-full">
            <div class="mb-4">
              <div class="bg-[#F4F4F5] rounded-2xl px-4 py-3 shadow-sm inline-block rounded-bl-sm">
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
                class="w-full bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2 text-left group cursor-pointer">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="w-5 h-5 text-blue-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
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
          <div class="flex items-center gap-2">
            <textarea v-model="message" @keypress="handleKeyPress" placeholder="Ask me anything" rows="2"
              :disabled="isSending || isLoading"
              class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400" />
            <button @click="sendMessage" :disabled="!message.trim() || isLoading || isSending"
              class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer">
              <img src="../assets/img/message_icon.svg" alt="Send" class="w-6 h-6">
            </button>
          </div>
        </div>

        <div v-if="showNewChatModal"
          class="absolute top-0 left-0 w-full h-full z-50 flex items-center justify-center bg-black/50 rounded-2xl"
          @click="closeNewChatModal">
          <div @click.stop class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Start a New Chat?</h3>
            <p class="text-sm text-gray-600 mb-6">Are you sure you want to start a new chat? Your current conversation
              will
              end.</p>

            <div class="flex gap-3">
              <button @click="closeNewChatModal"
                class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                No
              </button>
              <button @click="startNewChat"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Yes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>



    <button @click="toggleChat" :class="[
      'w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center relative',
      isOpen ? 'rotate-0' : 'hover:scale-110',
    ]">
      <img v-if="!isOpen" src="../assets/img/chatbot_icon.svg" alt="Chatbot Icon" class="w-7 h-7">
      <img v-else src="../assets/img/arrow_down.svg" alt="Send" class="w-4 h-4">

      <div class="absolute w-8 h-8 bottom-0 left-0 bg-indigo-600 rounded-md -z-10 transform transition-all duration-300"
        :class="isOpen ? 'top-0 -left-2' : 'bottom-0 -right-2'"></div>
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
