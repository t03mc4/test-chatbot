# Changelog

## v2.1.0 (2025-01-24)

### Added

- Example questions feature: Display predefined questions after chat initialization
- New API integration: `/sales-chat/example-questions` endpoint
- Welcome message UI with Tutku branding
- Interactive question cards with colored icons
- One-time use: Questions disappear after first message is sent
- Hover effects on question cards for better UX

### Technical

- Added `exampleQuestions` state to store questions from API
- Created `fetchExampleQuestions()` function to fetch questions independently
- Created `handleExampleQuestionClick()` function to handle question selection
- Updated empty state UI to show welcome message and question cards
- Questions only fetch when chat history is empty (messages.length === 0)
- Example questions fetch logic moved from init to onMounted after loadChatHistory

## v2.0.1 (2025-01-20)

### Added

- Markdown rendering for bot responses using markdown-it
- Custom prose styles for markdown elements
- Character-by-character typing animation (30ms delay)
- Links in bot messages now open in new tab (target="\_blank")
- Security attributes (rel="noopener noreferrer") added to all links
- Connection loss detection: Shows warning when page is refreshed before bot responds
- Warning messages displayed in yellow box with border

### Changed

- Bot messages now render as HTML with markdown support
- Typing animation changed from word-by-word to character-by-character
- Added v-html rendering for bot messages
- Markdown text is re-rendered on each character to ensure valid HTML (no flickering tags)
- Messages now support `isWarning` flag for connection loss warnings

### Technical

- Installed markdown-it and @types/markdown-it
- Added MarkdownIt instance for parsing
- Custom CSS styles for prose elements (p, ul, ol, code, pre, h1-h6, blockquote, a)
- Custom link renderer override for target="\_blank" behavior
- Added connection loss detection in `loadChatHistory()` function
- Warning messages stored in chat history with `isWarning: true` flag

## v2.0.0 (2025-01-20)

### Breaking Changes

- Removed `data-user-id`, `data-thread-id`, `data-company-id` attributes
- Added `data-app-id` and `data-app-name` attributes
- Changed props: `userId/threadId/companyId` → `appId/appName`

### Added

- Chat initialization API integration
- Send message API integration
- Session management with localStorage (`ta_ChatSession`)
- Chat history tracking (`ta_ChatHistory`)
- Automatic user IP detection via ipify API
- User agent detection
- Session persistence across page reloads
- ISO 8601 timestamp formatting for message created_at

### Changed

- Widget now initializes chat session on first load
- API structure completely updated
- LocalStorage keys renamed for better organization
- ChatSession now stores app_id, app_name, ip, userAgent

### Technical

- Endpoint: POST /sales-chat/init
- Endpoint: POST /sales-chat/send
- ChatSession interface expanded with additional fields
- sendMessage fully functional with real API
- Props interface updated in ChatbotWidget.vue
- widget.ts updated to read new data attributes

## v1.0.1 (2025-01-20)

### Added

- Auto-scroll to latest message on chat open, message send, and bot response
- Typing animation for bot responses (word-by-word streaming effect)
- Smooth open/close animations for chatbot window

### Changed

- Bot responses now appear gradually with typing effect (100-200ms per word)
- Chat window animates with scale and opacity transitions
- Improved user experience with smooth scrolling

### Technical

- Added `nextTick` and `watch` for scroll management
- Implemented `typeMessage` function for streaming effect
- Added Vue `Transition` component for animations
- Added `messagesContainer` ref for scroll control

## v1.0.0 (2025-01-20)

### Initial Release

- Chat widget UI with modern design
- API integration with backend
- localStorage for chat history persistence
- Responsive mobile design
- Data attribute configuration
- Loading indicator with animated dots
- Error handling
- Script tag auto-detection
- CDN-ready build
