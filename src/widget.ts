import './assets/main.css'
import { createApp } from 'vue'
import ChatbotWidget from './components/ChatbotWidget.vue'

const initWidget = () => {
  const scriptTag = document.currentScript as HTMLScriptElement
  const userId = scriptTag?.getAttribute('data-user-id') || ''
  const threadId = scriptTag?.getAttribute('data-thread-id') || ''
  const companyId = scriptTag?.getAttribute('data-company-id') || ''

  const widgetContainer = document.createElement('div')
  widgetContainer.id = 'tutku-ai-chatbot-widget'
  document.body.appendChild(widgetContainer)

  const app = createApp(ChatbotWidget, {
    userId,
    threadId,
    companyId,
  })
  app.mount(widgetContainer)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget)
} else {
  initWidget()
}
