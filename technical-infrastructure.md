# AI Blocker — Technical Infrastructure Plan

## Context

Build a browser extension that lets users filter out AI-generated content from their web browsing — images, chatbot widgets, AI-written text, and requests to AI service APIs. The product targets a broad consumer base and is monetized via a freemium model: a free tier using local blocklists (private, fast, no account needed) and a paid tier (~$4.99/mo) that adds cloud-based ML detection for images and text.

The user is a CS/CE double BS student who wants to ship a real, publishable product. The plan is phased so Phase 1 produces a working free-tier extension that can go live and collect users before the backend is built.

---

## Architecture Overview

Two repositories:

| Repo | Purpose |
|------|---------|
| `ai-blocker-extension` | Chrome MV3 + Firefox WebExtensions |
| `ai-blocker-backend` | Fastify API — auth, detection proxy, blocklist serving, Stripe |

Detection strategy: **blocklist-first, cloud fallback**
- Free tier: DNR network rules + CSS selector removal + C2PA metadata parsing (all local)
- Paid tier: Hive Moderation (images) + GPTZero (text) via backend proxy

---

## Extension File Structure

```
ai-blocker-extension/
├── manifest.json                    # Chrome MV3
├── manifest.firefox.json            # Firefox overrides
├── src/
│   ├── background/
│   │   ├── service-worker.ts        # Entry point, alarm handler
│   │   ├── blocklist-manager.ts     # Loads/updates blocklist → DNR rules
│   │   ├── dnr-rule-builder.ts      # Converts blocklist JSON → DNR format
│   │   ├── message-router.ts        # Routes content script ↔ background messages
│   │   ├── subscription-cache.ts    # Caches tier in chrome.storage.local
│   │   ├── update-scheduler.ts      # Periodic blocklist update via chrome.alarms
│   │   └── auth-manager.ts          # JWT store + refresh
│   ├── content/
│   │   ├── index.ts                 # Orchestrates the scan pipeline
│   │   ├── pipeline/
│   │   │   ├── widget-remover.ts    # CSS selector engine + MutationObserver
│   │   │   ├── image-scanner.ts     # 4-phase image detection pipeline
│   │   │   ├── text-scanner.ts      # Structural heuristics + cloud API
│   │   │   └── mutation-observer.ts # Watches for dynamically injected AI widgets
│   │   ├── detectors/
│   │   │   ├── c2pa-detector.ts     # Parses JUMBF/C2PA from image ArrayBuffer
│   │   │   ├── dom-classifier.ts    # Heuristic alt/class/data-* sniffing
│   │   │   └── url-classifier.ts    # Trie-based URL pattern matching
│   │   └── ui/
│   │       ├── overlay.ts           # Blocked-image placeholder + reveal button
│   │       └── tooltip.ts           # "AI detected" tooltip on hover
│   ├── popup/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── Dashboard.tsx        # Block counts + master toggle
│   │       ├── Settings.tsx         # Per-feature toggles, threshold sliders
│   │       ├── Account.tsx          # Login/logout/upgrade
│   │       └── PremiumGate.tsx      # Upsell wall wrapping paid features
│   ├── shared/
│   │   ├── types/
│   │   │   ├── blocklist.ts
│   │   │   ├── detection.ts
│   │   │   ├── messages.ts          # Typed message bus (all content↔bg comms)
│   │   │   ├── subscription.ts
│   │   │   └── settings.ts
│   │   └── constants.ts
│   └── db/
│       ├── idb-schema.ts            # IndexedDB schema + migrations
│       ├── detection-cache.ts       # Cache detection results by URL hash (7-day TTL)
│       └── stats-store.ts           # Block counters per domain/type/date
```

---

## Backend File Structure

```
ai-blocker-backend/
├── src/
│   ├── server.ts
│   ├── config.ts                    # Zod-validated env vars
│   ├── plugins/
│   │   ├── auth.ts                  # fastify-jwt verify plugin
│   │   ├── rateLimit.ts
│   │   └── stripe.ts                # Webhook signature verification
│   ├── routes/
│   │   ├── auth/                    # register, login, refresh
│   │   ├── detect/
│   │   │   ├── image.ts             # POST /detect/image → Hive proxy (paid)
│   │   │   └── text.ts              # POST /detect/text → GPTZero proxy (paid)
│   │   ├── blocklist/
│   │   │   ├── manifest.ts          # GET /blocklist/manifest.json
│   │   │   └── rules.ts             # GET /blocklist/:version/rules.json
│   │   ├── sync/settings.ts         # GET/PUT /sync/settings (paid)
│   │   └── billing/
│   │       ├── checkout.ts          # POST /billing/checkout → Stripe session
│   │       ├── portal.ts            # POST /billing/portal → Stripe portal link
│   │       └── webhook.ts           # POST /billing/webhook → handle Stripe events
│   ├── services/
│   │   ├── detection/
│   │   │   ├── hive.service.ts
│   │   │   └── gptzero.service.ts
│   │   ├── blocklist/
│   │   │   ├── compiler.ts          # Merges source lists → rules.json
│   │   │   └── publisher.ts         # Uploads compiled list to S3/CDN
│   │   ├── subscription.service.ts
│   │   ├── user.service.ts
│   │   └── cache.service.ts         # Redis wrapper for detection result caching
│   ├── db/
│   │   ├── client.ts                # Prisma singleton
│   │   └── schema.prisma            # users, subscriptions, blocklist_versions
│   └── middleware/
│       ├── requirePaid.ts           # 402 if free tier
│       └── quotaGuard.ts            # 429 if monthly quota exceeded
├── scripts/
│   └── compile-blocklist.ts         # CI: build + publish blocklist to CDN
└── docker-compose.yml               # Local: Fastify + Postgres + Redis
```

---

## Key Data Models (TypeScript)

```typescript
// Detection result — returned by all detectors
interface DetectionResult {
  isAI: boolean;
  confidence: number;       // 0.0–1.0
  source: "dnr" | "url-pattern" | "dom-heuristic" | "c2pa" | "hive" | "gptzero";
  contentType: "image" | "text" | "widget" | "network-request";
  detail?: string;          // e.g. "C2PA producer: Adobe Firefly"
}

// Typed message bus — all content ↔ background communication
type ExtensionMessage =
  | { type: "DETECT_IMAGE";  imageUrl: string; imageHash: string }
  | { type: "DETECT_TEXT";   textSample: string; pageUrl: string }
  | { type: "STAT_INCREMENT"; contentType: ContentType; domain: string }
  | { type: "CREATE_CHECKOUT" }
  | { type: "GET_SUBSCRIPTION" };

// Subscription
interface SubscriptionStatus {
  tier: "free" | "paid";
  quotaUsed: number;
  quotaLimit: number;       // 0 for free (no API calls allowed), 1000 for paid
  renewsAt?: string;
}

// User settings
interface UserSettings {
  enabled: boolean;
  imageBlocking: { enabled: boolean; useCloudFallback: boolean; confidenceThreshold: number };
  textBlocking: { enabled: boolean; useCloudFallback: boolean; confidenceThreshold: number; minimumWordCount: number };
  widgetBlocking: { enabled: boolean; customSelectors: string[] };
  networkBlocking: { enabled: boolean };
  allowlist: { domain: string; disableAll: boolean }[];
}
```

---

## Content Script Pipeline (image-scanner.ts)

Four phases run in order; early match skips later phases:

1. **URL pattern trie** (sync, ~0ms) — O(1) lookup against known AI image CDN patterns
2. **DOM heuristics** (sync, ~1ms) — check `alt`, `className`, `data-*` for AI signals
3. **C2PA metadata** (async, free) — fetch image bytes, parse JUMBF manifest, match known AI generators. Gated: images >10KB only, max 20/page, results cached 7 days.
4. **Cloud API** (async, paid only) — send to `/detect/image` → Hive Moderation. Rate-limited at 10 images/minute via token bucket. Results cached in IDB for 7 days.

On detection: hide element immediately → insert placeholder overlay with "AI Image Blocked" + reveal button.

---

## Blocklist Format

Two-file system (manifest checked every 4h, payload only fetched on version change):

**`manifest.json`** (~200 bytes):
```json
{ "version": "2024.06.08.1", "ruleCount": 1847, "cssSelectorCount": 312, "checksumSha256": "a3f1...", "tier": "free" }
```

**`rules.json`** contains three arrays:
- `dnrRules[]` — Chrome DNR format, applied directly via `updateDynamicRules()`
- `cssSelectors[]` — `{ id, selector, action: "remove"|"hide", domains? }`
- `urlPatterns[]` — glob patterns for in-process URL classifier

Source lists live in the repo under `blocklist-sources/` and are compiled by `scripts/compile-blocklist.ts` on every merge to `main` via GitHub Actions. Free tier rules use IDs 1–999; paid tier 1000–9999.

---

## Freemium Gate — Three Layers

1. **Backend middleware** (`requirePaid.ts`) — 402 on all `/detect/*` and `/sync/*` routes for free users
2. **Service worker** — checks `subscription-cache.ts` before making any API request; returns error without hitting the network
3. **Popup UI** (`PremiumGate.tsx`) — wraps paid features in an upsell wall

Subscription status cached in `chrome.storage.local`, refreshed on popup open + every 6h. Trusted for up to 72h if offline (avoids disrupting paying users).

---

## Stripe Subscription Flow

```
User clicks "Upgrade" in popup
→ background calls POST /billing/checkout → Stripe session URL
→ chrome.tabs.create({ url: sessionUrl }) opens Stripe hosted checkout
→ User pays → Stripe fires webhook to POST /billing/webhook
→ checkout.session.completed → backend sets tier = "paid"
→ Extension polls /auth/me → tier updates → features unlock
```

Webhook events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed` (3-day grace period), `invoice.payment_succeeded` (reset quota).

---

## Publishing

**Chrome Web Store:** Build → zip `dist/chrome/` → submit with privacy policy, screenshot, host permission justification for `<all_urls>`. Review: 1–3 days.

**Firefox AMO:** Uses `manifest.firefox.json` to patch background format + add gecko ID. Submit source ZIP alongside built ZIP. First review: 1–2 weeks. Subsequent updates: automated signing via `web-ext`.

---

## Build Roadmap

### Phase 1 — Working Free Tier (Weeks 1–6)
- Weeks 1–2: Extension scaffold (webpack, MV3 manifest, popup shell, chrome.storage)
- Weeks 3–4: Core blocking (blocklist manager, DNR rules, widget remover, URL classifier, overlay UI)
- Week 5: C2PA detection
- Week 6: Stats display, MutationObserver, publish to Chrome + Firefox

### Phase 2 — Backend Infrastructure (Weeks 7–10)
- Week 7: Fastify + Prisma + auth routes → deploy to Railway/Fly.io
- Week 8: Blocklist CDN (S3 + CloudFront) + GitHub Actions compile pipeline
- Week 9: Stripe integration (checkout, portal, webhook)
- Week 10: Account UI in popup, token refresh, error monitoring (Sentry)

### Phase 3 — Paid Tier Features (Weeks 11–14)
- Week 11: Hive Moderation → `/detect/image`
- Week 12: GPTZero → `/detect/text` + text banner UI
- Week 13: Cloud settings sync
- Week 14: Premium blocklist tier for paid users

### Phase 4 — Growth (Week 15+)
- Trie-based URL classifier (Aho-Corasick, needed above ~500 patterns)
- Open blocklist source repo for community contributions (drives organic growth)
- Safari via `safari-web-extension-converter`
- Annual pricing ($39.99/yr) for lower churn
- Local ONNX model for offline paid detection (reduces API cost at scale)

---

## Verification

- **Unit tests:** Jest for blocklist compiler, C2PA parser, DNR rule builder
- **E2E tests:** Playwright with `playwright-chromium-extension` against test pages with known AI images and chatbot widgets
- **Manual test pages:** Local HTML file with a Midjourney CDN image, Intercom embed, and GPT-watermarked text
- **Stripe:** Test mode with card `4242 4242 4242 4242` before going live
- **Performance:** Chrome DevTools Performance tab — content script should add <50ms to page load

---

## Developer Setup & Workflow

### Prerequisites

Install these before starting:

```bash
node --version   # Need 20+ (use nvm to manage versions)
npm --version    # Comes with Node
docker --version # For running Postgres + Redis locally
git --version
```

Recommended tools:
- **VS Code** with extensions: ESLint, Prettier, Chrome DevTools Protocol
- **nvm** (Node Version Manager) — lets you switch Node versions per project

---

### Repo Structure

Use **two separate Git repos** (not a monorepo). They share TypeScript types via copy-paste at first; extract to a shared npm package later if needed.

```
~/projects/
├── ai-blocker-extension/   # Git repo 1
└── ai-blocker-backend/     # Git repo 2
```

---

### Extension: Initial Scaffold

```bash
mkdir ai-blocker-extension && cd ai-blocker-extension
git init
npm init -y

# Core dependencies
npm install -D typescript webpack webpack-cli ts-loader
npm install -D @types/chrome
npm install -D react react-dom @types/react @types/react-dom
npm install -D css-loader style-loader mini-css-extract-plugin
npm install -D copy-webpack-plugin
npm install -D jest ts-jest @types/jest

# Runtime dependencies (bundled into extension)
npm install idb          # IndexedDB wrapper (much easier than raw IDB)
npm install zod          # Runtime type validation
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "jsx": "react",
    "strict": true,
    "outDir": "dist",
    "lib": ["ES2020", "DOM"]
  },
  "include": ["src"]
}
```

**`webpack.config.ts`** — multi-entry, one bundle per context:
```typescript
import path from "path";
import CopyPlugin from "copy-webpack-plugin";

export default {
  mode: "development",
  devtool: "cheap-module-source-map",
  entry: {
    "background/service-worker": "./src/background/service-worker.ts",
    "content/index":             "./src/content/index.ts",
    "popup/index":               "./src/popup/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist/chrome"),
    filename: "[name].js",
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: { extensions: [".ts", ".tsx", ".js"] },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "assets", to: "assets" },
      ],
    }),
  ],
};
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "build":         "webpack --config webpack.config.ts",
    "build:watch":   "webpack --config webpack.config.ts --watch",
    "build:firefox": "webpack --config webpack.config.ts --env firefox",
    "build:prod":    "webpack --config webpack.config.ts --mode production",
    "test":          "jest",
    "test:watch":    "jest --watch",
    "lint":          "eslint src --ext .ts,.tsx"
  }
}
```

---

### Extension: Local Dev Loop

**Step 1 — Start the file watcher:**
```bash
npm run build:watch
# Webpack recompiles on every file save → outputs to dist/chrome/
```

**Step 2 — Load the unpacked extension in Chrome:**
1. Open Chrome → go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/chrome/` folder
5. The extension now appears in your toolbar

**Step 3 — Reload after changes:**
- Content script changes: just refresh the tab you're testing on
- Service worker / manifest changes: click the circular reload icon on the extension card in `chrome://extensions`
- Popup changes: close and reopen the popup

**Debugging each context:**
| Context | How to open DevTools |
|---------|---------------------|
| Popup | Right-click popup → Inspect |
| Content script | F12 on the page → Console (select extension context from dropdown) |
| Service worker | `chrome://extensions` → click "Service Worker" link under your extension |

**Tip:** `chrome.storage.local` state persists between reloads. To reset, run in the service worker console:
```javascript
chrome.storage.local.clear()
```

---

### Backend: Initial Scaffold

```bash
mkdir ai-blocker-backend && cd ai-blocker-backend
git init
npm init -y

npm install fastify @fastify/jwt @fastify/rate-limit @fastify/cors
npm install @prisma/client stripe ioredis zod
npm install -D typescript ts-node nodemon prisma @types/node
```

**`docker-compose.yml`** — one command starts everything:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aiblocker
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Start local services:**
```bash
docker compose up -d          # Start Postgres + Redis in background
npx prisma migrate dev        # Apply schema, generate client
npm run dev                   # Start Fastify with nodemon hot-reload
```

**`.env` file (never commit this):**
```
DATABASE_URL="postgresql://dev:dev@localhost:5432/aiblocker"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-me-in-production-use-openssl-rand-hex-32"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
HIVE_API_KEY="..."
GPTZERO_API_KEY="..."
```

**`.env.example` (commit this — documents what's needed):**
```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
HIVE_API_KEY=
GPTZERO_API_KEY=
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev":   "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:studio":  "prisma studio",
    "db:seed":    "ts-node scripts/seed.ts"
  }
}
```

---

### Stripe Local Testing

Stripe webhooks need to reach your local machine. Use the Stripe CLI:

```bash
# Install Stripe CLI (Windows: winget install Stripe.StripeCLI)
stripe login
stripe listen --forward-to localhost:3000/billing/webhook
# This gives you a whsec_... secret — put it in STRIPE_WEBHOOK_SECRET
```

Leave this running in a terminal while testing checkout flows.

---

### Git Workflow

```
main          — stable, always deployable
dev           — integration branch, merge features here first
feature/xxx   — one branch per feature, branch off dev
```

**Commit message format:**
```
feat: add C2PA image detection
fix: widget remover not firing on SPA route changes
chore: update blocklist to v2024.06.08
```

**Before every commit:**
```bash
npm run lint    # catch type errors and style issues
npm test        # all unit tests must pass
```

---

### CI/CD (GitHub Actions)

**Extension — `.github/workflows/extension.yml`:**
```yaml
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build:prod
      - uses: actions/upload-artifact@v4
        with:
          name: chrome-extension
          path: dist/chrome/
```

**Backend — `.github/workflows/backend.yml`:**
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: aiblocker, POSTGRES_USER: dev, POSTGRES_PASSWORD: dev }
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: "postgresql://dev:dev@localhost:5432/aiblocker" }
      - run: npm test
```

---

### Deployment (Backend)

**Recommended for Phase 2: Railway.app**
- Connect your GitHub repo → Railway auto-deploys on push to `main`
- Add Postgres and Redis as Railway services (one click)
- Set environment variables in the Railway dashboard
- Free tier is enough for development; $5/mo hobby plan for production

**Alternative: Fly.io** — more control, slightly more setup, also cheap.

Both are significantly easier than AWS/GCP for a solo project at this stage.

---

### Day-to-Day Development Order (Week 1)

1. `git clone` / `git init` both repos
2. Run `npm install` in extension repo
3. Copy the `manifest.json` starter below into the extension root
4. Run `npm run build:watch`
5. Load unpacked extension in Chrome
6. Verify the popup opens (even if empty)
7. Start writing `src/background/service-worker.ts` and `src/content/index.ts`

**Starter `manifest.json`:**
```json
{
  "manifest_version": 3,
  "name": "AI Blocker",
  "version": "0.1.0",
  "description": "Filter AI-generated content from your browser.",
  "permissions": [
    "storage",
    "alarms",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16":  "assets/icons/icon16.png",
      "48":  "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  },
  "icons": {
    "16":  "assets/icons/icon16.png",
    "48":  "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  }
}
```
