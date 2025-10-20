# Tutku AI Chatbot Widget

Embeddable chatbot widget for customer websites. Single script integration with API backend.

## Features

- Single script tag integration
- Real-time chat with API backend
- Chat history stored in localStorage
- Loading indicators
- Error handling
- Responsive mobile design
- Tailwind 4 styling

## Requirements

- Node.js 20.19+ or 22.12+

## Development Setup

```sh
npm install
npm run dev
```

## Build for CDN

```sh
npm run build
```

Output: `dist/tutku-chatbot-widget.iife.js`

## Customer Integration

Add script tag with configuration:

```html
<script
  src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"
  data-user-id="CUSTOMER_USER_ID"
  data-thread-id="CUSTOMER_THREAD_ID"
  data-company-id="CUSTOMER_COMPANY_ID"
></script>
```

## Configuration

- `data-user-id`: User/Authorization ID
- `data-thread-id`: Thread ID for conversation
- `data-company-id`: Company identifier

## Local Testing

```sh
npm run build
```

Open `local-test.html` in browser.

## API

Endpoint: `https://77l9cfpip2.execute-api.eu-central-1.amazonaws.com/chat`

Request:

```json
{
  "user_id": "string",
  "thread_id": "string",
  "question": "string",
  "company_id": "string"
}
```

Response:

```json
{
  "thread_id": "string",
  "answer": "string",
  "contact_hr": boolean,
  "user_email": string,
  "admin_email": string
}
```

## Tech Stack

- Vue 3
- TypeScript
- Tailwind 4
- Vite

## Documentation

See `CDN-DEPLOYMENT.md` for deployment instructions.
