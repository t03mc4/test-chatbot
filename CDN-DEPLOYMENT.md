# CDN Deployment Guide

## Requirements

### Node.js Version

- **Required**: Node.js 20.19+ or 22.12+
- **Check version**: `node --version`
- **Upgrade if needed**: Use nvm or download from nodejs.org

## Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for CDN

```bash
npm run build
```

## Build Output

Build creates files in `dist/` folder:

- `tutku-chatbot-widget.iife.js` - Main widget script
- `tutku-chatbot-widget.css` - Widget styles (if not inlined)

## Deployment

### Upload to CDN

Upload `dist/` folder contents to CDN server.

### Customer Integration

Customer adds this script tag to their website with configuration data attributes:

```html
<script
  src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"
  data-app-id="CUSTOMER_APP_ID"
  data-app-name="CUSTOMER_APP_NAME"
></script>
```

Place script tag before closing `</body>` tag.

### Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Customer Website</title>
  </head>
  <body>
    <h1>Website Content</h1>

    <script
      src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"
      data-app-id="Ottoo_Hr_1_Tutku"
      data-app-name="TutkuAI"
    ></script>
  </body>
</html>
```

## Local Testing

Use `embed-example.html` to test locally:

1. Build the widget: `npm run build`
2. Open `embed-example.html` in browser

## Configuration

Widget auto-initializes on page load. Configuration is provided via data attributes:

- `data-app-id`: Application ID
- `data-app-name`: Application name

## Features

- Real-time chat with API backend
- Chat history stored in localStorage
- Loading indicator during API calls
- Error handling
- Responsive mobile design
- Auto-scroll to latest messages
