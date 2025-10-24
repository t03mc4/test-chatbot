import './assets/main.css'
import { createApp } from 'vue'
import ChatbotWidget from './components/ChatbotWidget.vue'

const initWidget = () => {
  const scripts = document.querySelectorAll('script')
  let scriptTag: HTMLScriptElement | null = null

  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i]
    if (
      script &&
      (script.hasAttribute('data-app-id') || script.src.includes('tutku-chatbot-widget'))
    ) {
      scriptTag = script as HTMLScriptElement
      break
    }
  }

  const appId = scriptTag?.getAttribute('data-app-id') || ''
  const appName = scriptTag?.getAttribute('data-app-name') || ''

  const widgetContainer = document.createElement('div')
  widgetContainer.id = 'tutku-ai-chatbot-widget'
  document.body.appendChild(widgetContainer)

  const app = createApp(ChatbotWidget, {
    appId,
    appName,
  })
  app.mount(widgetContainer)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget)
} else {
  initWidget()
}
