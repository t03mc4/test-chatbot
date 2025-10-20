import './assets/main.css'
import { createApp } from 'vue'
import ChatbotWidget from './components/ChatbotWidget.vue'

const initWidget = () => {
  const widgetContainer = document.createElement('div')
  widgetContainer.id = 'tutku-ai-chatbot-widget'
  document.body.appendChild(widgetContainer)

  const app = createApp(ChatbotWidget)
  app.mount(widgetContainer)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget)
} else {
  initWidget()
}
