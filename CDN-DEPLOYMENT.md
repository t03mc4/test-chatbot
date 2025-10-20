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

Customer adds this script tag to their website:

```html
<script src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"></script>
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

    <script src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"></script>
  </body>
</html>
```

## Local Testing

Use `embed-example.html` to test locally:

1. Build the widget: `npm run build`
2. Open `embed-example.html` in browser

## Configuration

Widget auto-initializes on page load. No manual setup required.

## Future: Customer ID

Next phase will add customer unique ID support:

```html
<script
  src="https://your-cdn-url.com/tutku-chatbot-widget.iife.js"
  data-customer-id="UNIQUE_ID"
></script>
```
