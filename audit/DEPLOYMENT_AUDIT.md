# Roomly Vercel, Serverless Architecture & Deployment Audit

## 1. Executive Summary & Configuration Review

The Roomly monorepo includes a root `vercel.json` file intended to orchestrate the simultaneous deployment of the Express API backend (`apps/api`) and the Vite React frontend (`apps/web`).

A rigorous architectural review reveals critical mismatches between the repository's current structure and standard Vercel serverless deployment specifications.

---

## 2. Critical & High Deployment Defects

### Finding DEP-001: Invalid `vercel.json` Schema (`"services"` Block)
- **Severity**: HIGH
- **Priority**: IMMEDIATE
- **Component**: [`vercel.json`](file:///c:/Users/bs162/Desktop/Roomly/vercel.json)
- **Description**: The repository's `vercel.json` uses an invalid top-level schema:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "services": {
      "api": {
        "root": "apps/api",
        "framework": "express"
      },
      "web": {
        "root": "apps/web",
        "framework": "vite",
        "rewrites": [...]
      }
    },
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": {
          "service": "api"
        }
      }, ...
    ]
  }
  ```
- **Impact**: In the official Vercel OpenAPI schema (`https://openapi.vercel.sh/vercel.json`), `"services"` is not a valid top-level property for standard Vercel Hobby or Pro deployments. In `rewrites`, the `destination` property must be a string URL/path (e.g. `"/api/index.js"`), not an object (`{ "service": "api" }`). Deploying this file to Vercel will trigger a build/deployment configuration error.
- **Root Cause**: Attempting to treat Vercel like an internal microservices orchestrator rather than a static site CDN and serverless functions platform.
- **Recommended Solution**:
  1. For single-project monorepo deployment: Move the Express app entry point into an `api/index.ts` serverless function at the root or configure `builds` / `functions` in `vercel.json`.
  2. For multi-project deployment (recommended best practice on Vercel): Deploy `apps/web` as one Vercel project pointing to the Vite root, and `apps/api` as a standalone Node/Serverless project, setting `CLIENT_URL` and `API_URL` environment variables accordingly.

---

### Finding DEP-002: In-Memory Background Scheduler Disabled & Incompatible with Serverless
- **Severity**: HIGH
- **Priority**: IMMEDIATE
- **Components**:
  - [`apps/api/src/server.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/server.ts#L82)
  - [`apps/api/src/jobs/holdExpirationJob.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/jobs/holdExpirationJob.ts#L41-L52)
- **Description**:
  In `apps/api/src/server.ts`:
  ```ts
  // Auto-start server only in standalone / local runtime (not in Vercel function context)
  if (!process.env.VERCEL) {
    bootstrap();
  }
  ```
  `bootstrap()` initializes the background hold expiration scheduler (`startHoldExpirationScheduler()`). When deployed to Vercel, `process.env.VERCEL` is automatically set by the platform runtime. Consequently:
  1. `bootstrap()` is **never called**.
  2. `startHoldExpirationScheduler()` is **never started**.
  3. Even if started, serverless functions freeze between HTTP requests; background timers (`setInterval`) cannot run in serverless execution environments.
- **Impact**: Any reservation placed in `PENDING_PAYMENT` that is abandoned by a guest will permanently lock suite inventory in the database, preventing future guests from booking those dates.
- **Recommended Solution**:
  Expose an endpoint `POST /api/v1/jobs/release-expired-holds` protected by a secret key (`CRON_SECRET`), and configure a Vercel Cron job in `vercel.json`:
  ```json
  {
    "crons": [
      {
        "path": "/api/v1/jobs/release-expired-holds",
        "schedule": "* * * * *"
      }
    ]
  }
  ```

---

### Finding DEP-003: Aggressive Database Connection Timeout During Serverless Cold Starts
- **Severity**: MEDIUM
- **Priority**: HIGH
- **Component**: [`apps/api/src/db/connection.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/db/connection.ts#L17)
- **Description**:
  ```ts
  const conn = await mongoose.connect(connectionUri, {
    serverSelectionTimeoutMS: 2000,
    autoIndex: true,
  });
  ```
  In serverless environments, cold starts connecting across public internet to external managed databases (e.g. MongoDB Atlas) frequently experience network latency between 1500ms and 3000ms on initial TLS handshake.
- **Impact**: Setting `serverSelectionTimeoutMS` to 2000ms causes intermittent `MongooseServerSelectionError: connection timed out` failures on cold starts during initial request dispatch.
- **Recommendation**:
  Increase `serverSelectionTimeoutMS` to `10000` (10 seconds) for production, disable `autoIndex: false` in production (indexes should be built during migration scripts), and enable connection pooling caching across invocations.

---

### Finding DEP-004: Insecure Fallback Secrets in Production Environment Schema
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/api/src/config/env.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/config/env.ts#L9-L39)
- **Description**: `env.ts` provides default fallback strings for all core secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). If an operator forgets to configure these variables in the Vercel Dashboard, the deployment will succeed without errors, but the production environment will run with known default cryptographic keys.
- **Recommendation**: Enforce strict validation in `envSchema` that requires explicit values for production environments:
  ```ts
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET) throw new Error('Missing JWT_ACCESS_SECRET in production');
  }
  ```

---

## 3. Deployment Readiness Checklist

| Requirement | Current Status | Remediation Required |
| :--- | :---: | :--- |
| Frontend compiles successfully with Vite | **PASS** | Completed without compile errors |
| Backend compiles successfully with TypeScript (`tsc`) | **PASS** | Completed without compile errors |
| Single-page app client routing rewrite | **PASS** | `/index.html` fallback configured |
| Serverless API function entry point | **FAIL** | No `api/index.ts` handler exists |
| Vercel Cron Job for Hold Expiration | **FAIL** | Relies on in-memory `setInterval` |
| MongoDB Connection Pool Caching | **PASS** | `readyState >= 1` guard exists in `connection.ts` |
| Safe Production Bootstrapping | **FAIL** | Auto-seeds demo accounts if DB is empty |
| Production Environment Secrets Validation | **FAIL** | Fallback defaults prevent build-time alerts |
| Zero External Dependency Vulnerabilities | **FAIL** | 10 vulnerabilities present in dependencies |

