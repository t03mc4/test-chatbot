# CDN Cache Management

## jsDelivr Cache Issue

jsDelivr caches files for 7 days. GitHub updates do not immediately reflect on CDN.

## Solutions

### 1. Use Commit Hash (Immediate)

```html
<script src="https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot@COMMIT_HASH/dist/tutku-chatbot-widget.iife.js"></script>
```

Replace `COMMIT_HASH` with actual commit hash.

### 2. Use Git Tag Version

```bash
git tag v1.0.1
git push origin v1.0.1
```

```html
<script src="https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot@v1.0.1/dist/tutku-chatbot-widget.iife.js"></script>
```

### 3. Purge jsDelivr Cache

Visit: `https://purge.jsdelivr.net/gh/t03mc4/test-chatbot/dist/tutku-chatbot-widget.iife.js`

Wait 5-10 minutes for global purge.

### 4. Force Refresh with Query Parameter

```html
<script src="https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot/dist/tutku-chatbot-widget.iife.js?v=1.0.1"></script>
```

## Production CDN Strategy

### Versioning System

Each release:

1. Update version in `package.json`
2. Build: `npm run build`
3. Create git tag: `git tag v1.0.x`
4. Push with tags: `git push origin main --tags`
5. Update customer script with new version

### Customer Script Format

```html
<script
  src="https://your-cdn.com/tutku-chatbot-widget-v1.0.1.iife.js"
  data-user-id="USER_ID"
  data-thread-id="THREAD_ID"
  data-company-id="COMPANY_ID"
></script>
```

### Build Script Naming

Modify `vite.config.ts` to include version in filename.

### Cache Headers

Set on CDN:

- `Cache-Control: public, max-age=31536000, immutable` (for versioned files)
- Use version in filename for cache busting

### Rollback Strategy

Keep previous versions available:

- `tutku-chatbot-widget-v1.0.0.iife.js`
- `tutku-chatbot-widget-v1.0.1.iife.js`
- `tutku-chatbot-widget-v1.0.2.iife.js`

Customers can rollback by changing script version.

## Cloudflare CDN

For production Cloudflare CDN:

1. Upload file with version in name
2. Use Cloudflare API to purge cache:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://your-cdn.com/tutku-chatbot-widget.iife.js"]}'
```

## Best Practices

1. Version in filename (not query parameter)
2. Git tags for releases
3. Semantic versioning (v1.0.0, v1.0.1, v1.1.0)
4. Document version changes
5. Notify customers of updates
6. Keep old versions accessible
7. Test before customer deployment

## Current Test URLs

- GitHub: `https://github.com/t03mc4/test-chatbot/blob/main/dist/tutku-chatbot-widget.iife.js`
- jsDelivr: `https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot/dist/tutku-chatbot-widget.iife.js`
- Versioned: `https://cdn.jsdelivr.net/gh/t03mc4/test-chatbot@COMMIT_HASH/dist/tutku-chatbot-widget.iife.js`
