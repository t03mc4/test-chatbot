# Changelog

## v1.0.1 (2025-01-20)

### Added

- Auto-scroll to latest message on chat open, message send, and bot response
- Typing animation for bot responses (word-by-word streaming effect)
- Smooth open/close animations for chatbot window

### Changed

- Bot responses now appear gradually with typing effect (30ms per word)
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
- Data attribute configuration (user-id, thread-id, company-id)
- Loading indicator with animated dots
- Error handling
- Script tag auto-detection
- CDN-ready build
