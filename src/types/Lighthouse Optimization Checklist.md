# Lighthouse Optimization Checklist

## Performance (LCP, FID/INP, CLS, TTFB)

### Critical Rendering Path

- [ ] Inline critical CSS (`<style>` in `<head>`) and defer non-critical CSS
- [ ] Add `rel="preload"` for key resources (fonts, hero images, critical scripts)
- [ ] Add `rel="preconnect"` for third-party origins (analytics, CDNs, APIs)
- [ ] Defer or async non-critical JavaScript (`defer` / `async` attributes)
- [ ] Eliminate render-blocking resources (move scripts to bottom or defer)

### JavaScript

- [ ] Code-split with `React.lazy()` + `Suspense` for route-level splitting
- [ ] Tree-shake unused code (verify with `source-map-explorer` or `bundlephobia`)
- [ ] Minimize main thread work — break long tasks (>50ms) into smaller chunks
- [ ] Use `requestIdleCallback` or `scheduler.yield()` for non-urgent work
- [ ] Remove unused dependencies and polyfills
- [ ] Set up proper chunking strategy in Vite/Webpack (vendor, shared, route chunks)

### Images & Media

- [ ] Use modern formats: **WebP** or **AVIF** with `<picture>` fallbacks
- [ ] Serve responsive images via `srcset` and `sizes` attributes
- [ ] Lazy-load below-the-fold images (`loading="lazy"`)
- [ ] Explicitly set `width` and `height` on all `<img>` and `<video>` elements (prevents CLS)
- [ ] Use `fetchpriority="high"` on LCP image
- [ ] Compress images (target 85% quality for JPEG/WebP)
- [ ] Use CSS `aspect-ratio` for media containers

### Fonts

- [ ] Self-host fonts instead of loading from Google Fonts
- [ ] Use `font-display: swap` (or `optional` for non-critical fonts)
- [ ] Subset fonts to only needed character ranges
- [ ] Preload critical font files (`rel="preload" as="font" crossorigin`)
- [ ] Limit font variants (weights/styles) to what's actually used

### Server & Caching

- [ ] Enable HTTP/2 or HTTP/3
- [ ] Set aggressive `Cache-Control` headers for static assets (immutable, max-age=31536000)
- [ ] Enable Brotli or Gzip compression
- [ ] Use a CDN for static assets
- [ ] Optimize TTFB — target < 200ms (check server response time, DB queries)
- [ ] Implement `stale-while-revalidate` caching strategy where appropriate

### Core Web Vitals Specifics

- [ ] **LCP < 2.5s** — Prioritize hero image/text rendering; preload LCP resource
- [ ] **INP < 200ms** — Debounce handlers, avoid layout thrashing, use `startTransition`
- [ ] **CLS < 0.1** — Reserve space for dynamic content, ads, embeds, and fonts

---

## Accessibility (a11y)

- [ ] All images have descriptive `alt` text (decorative images use `alt=""`)
- [ ] Proper heading hierarchy (`h1` → `h2` → `h3`, no skipped levels)
- [ ] Sufficient color contrast ratios (4.5:1 normal text, 3:1 large text)
- [ ] All interactive elements are keyboard-accessible (visible focus indicators)
- [ ] Form inputs have associated `<label>` elements
- [ ] Use semantic HTML (`<nav>`, `<main>`, `<article>`, `<button>` vs `<div>`)
- [ ] ARIA attributes used correctly (prefer native semantics first)
- [ ] Skip-to-content link present
- [ ] `lang` attribute set on `<html>` element
- [ ] Touch targets are at least 48×48px

---

## Best Practices

- [ ] Serve site over HTTPS
- [ ] No mixed content (HTTP resources on HTTPS pages)
- [ ] No `document.write()` usage
- [ ] No vulnerable JavaScript libraries (run `npm audit`)
- [ ] Proper `Content-Security-Policy` headers configured
- [ ] No browser errors logged in the console
- [ ] Use passive event listeners where applicable
- [ ] Avoid `unload` event listeners (use `pagehide` instead)
- [ ] Ensure correct image aspect ratios (no stretched/squished images)

---

## SEO

- [ ] Page has a `<title>` element (unique per page, 50-60 chars)
- [ ] Page has a `<meta name="description">` (unique per page, 150-160 chars)
- [ ] Proper use of `<meta name="viewport">` for mobile
- [ ] Page returns HTTP 200 status code
- [ ] Links have descriptive text (no "click here")
- [ ] `robots.txt` is valid and not blocking important resources
- [ ] Structured data (JSON-LD) for rich results where applicable
- [ ] Canonical URLs set (`<link rel="canonical">`)
- [ ] `hreflang` set for multi-language sites
- [ ] All pages are crawlable and indexable

---

## PWA (if applicable)

- [ ] Valid `manifest.json` with icons, name, start_url, display
- [ ] Service worker registered with offline fallback
- [ ] Responds with 200 when offline
- [ ] Splash screen configured
- [ ] Redirects HTTP → HTTPS

---

## Quick Wins (High Impact, Low Effort)

| Action                             | Impact    | Metric   |
| ---------------------------------- | --------- | -------- |
| Preload LCP image                  | 🔴 High   | LCP      |
| Add `width`/`height` to images     | 🔴 High   | CLS      |
| Defer non-critical JS              | 🔴 High   | LCP, INP |
| Enable Brotli compression          | 🟡 Medium | All      |
| Self-host & subset fonts           | 🟡 Medium | LCP, CLS |
| Add `fetchpriority="high"` to hero | 🟡 Medium | LCP      |
| Lazy-load offscreen images         | 🟡 Medium | LCP      |

---

## Measurement Tools

- **Lighthouse** — Chrome DevTools → Lighthouse tab (or CI via `lighthouse-ci`)
- **PageSpeed Insights** — [pagespeed.web.dev](https://pagespeed.web.dev)
- **WebPageTest** — [webpagetest.org](https://www.webpagetest.org)
- **Chrome DevTools Performance tab** — For runtime profiling (long tasks, layout shifts)
- **`web-vitals` npm package** — Real User Monitoring (RUM) in production
- **Bundle analyzer** — `npx vite-bundle-visualizer` or `source-map-explorer`
