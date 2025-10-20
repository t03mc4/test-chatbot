# Release Process

## Current Version: 1.0.0

## Immediate jsDelivr Cache Fix

### Option 1: Use Commit Hash

```html
<script
  src="https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot@COMMIT_HASH/dist/tutku-chatbot-widget.iife.js"
  data-user-id="a3aa1086-ff4e-47c6-81c4-01a1da01723b"
  data-thread-id="thread_ePgFSxkFT0ft9I8XyTCMUhgl"
  data-company-id="b475ce33-495c-492b-b84b-8f1fd3a20531"
></script>
```

Get commit hash: `git log -1 --format=%H`

### Option 2: Purge jsDelivr Cache

Visit: `https://purge.jsdelivr.net/gh/t03mc4/test-chatbot/dist/tutku-chatbot-widget.iife.js`

Wait 5-10 minutes.

### Option 3: Use Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

```html
<script src="https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot@v1.0.0/dist/tutku-chatbot-widget.iife.js"></script>
```

## Release Workflow

### 1. Update Version

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. Build

```bash
npm run build
```

### 3. Commit and Tag

```bash
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 4. Update Customer Scripts

Notify customers to update script tag with new version:

```html
<script src="https://cdn.url/tutku-chatbot-widget@v1.0.1"></script>
```

## Production CDN Deployment

### Cloudflare Setup

1. Upload to CDN with version in URL
2. Purge cache via API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://cdn.url/tutku-chatbot-widget.iife.js"]}'
```

### AWS CloudFront

```bash
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/tutku-chatbot-widget.iife.js"
```

## Version Strategy

### Semantic Versioning

- `v1.0.0` - Major release
- `v1.0.1` - Patch (bug fixes)
- `v1.1.0` - Minor (new features)
- `v2.0.0` - Major (breaking changes)

### Customer Migration

1. Test new version on staging
2. Notify customers 1 week before
3. Provide rollback option
4. Keep old versions available for 6 months

## Changelog

### v1.0.0 (2025-01-20)

- Initial release
- Chat widget UI
- API integration
- localStorage history
- Responsive design
- Data attribute configuration
