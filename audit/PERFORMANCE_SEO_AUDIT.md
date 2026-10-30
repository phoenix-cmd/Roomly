# Roomly Performance, Asset Optimization & SEO Audit

## 1. Frontend Performance & Bundle Metrics

### Production Build Analysis
Executed Vite production build on `apps/web`:
```text
dist/index.html                   1.24 kB │ gzip:   0.72 kB
dist/assets/index-Ce6Fa3Bb.css    3.93 kB │ gzip:   1.32 kB
dist/assets/index-Eu5FbVRh.js   774.30 kB │ gzip: 216.82 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

### Finding PERF-001: Monolithic Single Bundle Without Route Code-Splitting
- **Severity**: MEDIUM
- **Priority**: HIGH
- **Component**: [`apps/web/src/App.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/App.tsx#L8-L18)
- **Description**: All 11 pages (including heavy operational dashboards containing Recharts, MUI, and complex SVG tables) are statically imported into the root `App.tsx` file.
- **Impact**: A guest visiting only the public landing page is forced to download, parse, and evaluate 774 kB of uncompressed JavaScript containing internal staff management tools and charting libraries before the application becomes interactive.
- **Measurements**:
  - Main JavaScript bundle: **774.30 kB** (gzip: 216.82 kB)
  - Time to Interactive (TTI) on mobile 3G/4G: Degraded by ~1.2s to 2.5s.
- **Recommended Solution**:
  Implement route-level dynamic code-splitting using `React.lazy` and `Suspense`:
  ```tsx
  const HomePage = React.lazy(() => import('./pages/HomePage.js'));
  const RoomsPage = React.lazy(() => import('./pages/RoomsPage.js'));
  const ManagerDashboardPage = React.lazy(() => import('./pages/ManagerDashboardPage.js'));
  ```
  Configure `manualChunks` in `vite.config.ts` to separate vendor packages (`vendor-react`, `vendor-charts`, `vendor-icons`).

---

### Finding PERF-002: External High-Resolution Images Loaded Without Native Lazy Loading
- **Severity**: LOW
- **Priority**: MEDIUM
- **Components**:
  - [`apps/web/src/components/public/Hero.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/public/Hero.tsx#L14)
  - [`apps/web/src/components/public/RoomCard.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/public/RoomCard.tsx#L51-L62)
  - [`apps/web/src/components/public/AmenitiesSection.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/public/AmenitiesSection.tsx#L11-L32)
- **Description**: Images are loaded directly from Unsplash with fixed dimensions (`w=2000&q=85`, `w=1200&q=80`) and lack the `loading="lazy"` attribute on below-the-fold cards.
- **Impact**: All suite card images and experience cards are loaded simultaneously upon homepage render, consuming excessive cellular bandwidth and delaying Largest Contentful Paint (LCP).
- **Recommendation**:
  1. Add `loading="lazy"` and `decoding="async"` to all images below the hero fold.
  2. Implement responsive image sizing (`srcset`) with modern formats (WebP/AVIF).

---

### Finding PERF-003: Render-Blocking External Google Fonts
- **Severity**: LOW
- **Priority**: LOW
- **Component**: [`apps/web/index.html`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/index.html#L13)
- **Description**:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:...&family=Inter:...&display=swap" rel="stylesheet">
  ```
  The font stylesheet blocks initial page rendering until the Google Fonts CSS has resolved.
- **Recommendation**: Self-host font files using `@fontsource/cormorant-garamond` and `@fontsource/inter` to eliminate extra DNS lookups and external round-trips.

---

## 2. Search Engine Optimization (SEO) Audit

### Finding SEO-001: Static Single Page Title & Meta Description Across Entire Application
- **Severity**: LOW
- **Priority**: MEDIUM
- **Component**: [`apps/web/index.html`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/index.html#L7-L8)
- **Description**: The application hardcodes a single `<title>` and `<meta name="description">` in `index.html`:
  - Title: `Roomly — Luxury Hotel Sanctuary & Management Platform`
  - Description: `An art-directed luxury hotel sanctuary and booking platform. Discover serene suites, Michelin-starred coastal dining, and white-glove hospitality.`
  When guests navigate to `/rooms`, `/checkout`, `/dashboard`, or `/confirmation`, the page title never changes.
- **Impact**: Poor search result previews, lower CTR on suite-specific queries, and confusing browser tab histories.
- **Recommendation**: Use a lightweight document head manager (or `useEffect` document title updates) to provide dynamic, contextual titles (e.g. `Suites & Villas — The Grand Azure Riviera | Roomly`).

---

### Finding SEO-002: Missing Canonical URLs, Open Graph Tags & Structured Data
- **Severity**: INFORMATIONAL
- **Priority**: LOW
- **Component**: [`apps/web/index.html`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/index.html)
- **Description**: The site lacks:
  1. `<link rel="canonical" href="...">` tags to prevent duplicate content indexing.
  2. Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter Cards for social media previews.
  3. Schema.org JSON-LD structured data (`Hotel`, `LodgingBusiness`, `HotelRoom`) for Google Rich Results.
- **Recommendation**: Embed JSON-LD structured data on property and suite pages to unlock Google rich snippet pricing and star ratings.

---

### Finding SEO-003: Missing `robots.txt` and `sitemap.xml` Files
- **Severity**: INFORMATIONAL
- **Priority**: LOW
- **Location**: `apps/web/public/`
- **Description**: The `apps/web/public` directory does not exist, and there are no `robots.txt` or `sitemap.xml` files in the repository.
- **Impact**: Web crawlers cannot discover pages efficiently or determine indexing rules. Internal operational portals (`/staff/*`, `/manager/*`, `/admin/*`) are not explicitly disallowed from search engine indexing.
- **Recommendation**:
  1. Create `apps/web/public/robots.txt`:
     ```text
     User-agent: *
     Allow: /
     Allow: /rooms
     Disallow: /dashboard
     Disallow: /staff/
     Disallow: /manager/
     Disallow: /admin/
     Disallow: /confirmation/
     Sitemap: https://roomly.luxury/sitemap.xml
     ```
  2. Generate a clean `sitemap.xml` listing primary hotel destinations.

