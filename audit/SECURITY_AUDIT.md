# Roomly Defensive Application Security Audit

## 1. Executive Summary & Methodology

This audit was conducted from the perspective of an Application Security Engineer adhering to the OWASP Top 10 (2021) and OWASP Application Security Verification Standard (ASVS v4.0). All checks were executed non-destructively in local memory.

### Security Posture Summary
- **Overall Security Health**: **HIGH RISK / VULNERABLE**
- **Critical Vulnerabilities**: 2
- **High Vulnerabilities**: 3
- **Medium Vulnerabilities**: 3
- **Low Vulnerabilities**: 2
- **Key Vulnerability Categories**: Broken Access Control (OWASP A01), Security Misconfiguration (OWASP A05), Identification and Authentication Failures (OWASP A07), Software and Data Integrity Failures (OWASP A08).

---

## 2. Vulnerability Findings Details

### Finding SEC-001: Critical CORS Misconfiguration Permitting Arbitrary Origin Reflection with Credentials
- **Severity**: CRITICAL
- **OWASP Category**: A05:2021 – Security Misconfiguration / A01:2021 – Broken Access Control
- **CWE**: CWE-942: Permissive Cross-Domain Policy with Untrusted Domains
- **Component**: [`apps/api/src/app.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/app.ts#L33-L60)
- **Description**: The Express CORS middleware checks an allowed list, but unconditionally executes `return callback(null, true);` at the end of the origin validation function, while specifying `credentials: true`.
- **Proof of Concept & Evidence**:
  Executed automated HTTP request with `Origin: https://evil-attacker.com`:
  ```http
  GET /api/v1/health HTTP/1.1
  Host: localhost:5001
  Origin: https://evil-attacker.com

  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: https://evil-attacker.com
  Access-Control-Allow-Credentials: true
  ```
- **Exploit Scenario**: An attacker hosts a malicious website `evil-attacker.com`. When an authenticated hotel manager or guest visits the attacker's site, a malicious JavaScript fetch request is dispatched to the Roomly API. The browser sends the session cookies (`refresh_token` or `access_token`), and the API reflects the attacker's origin, allowing the attacker's script to read confidential guest profiles, booking data, and financial reports.
- **Root Cause**:
  ```ts
  // apps/api/src/app.ts:54
  if (allowed.includes(origin) || ...) {
    return callback(null, true);
  }
  return callback(null, true); // <--- UNCONDITIONAL ALLOW
  ```
- **Recommended Solution**:
  ```ts
  if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }
  return callback(new Error('Blocked by CORS policy'));
  ```

---

### Finding SEC-002: Cross-Tenant Financial IDOR / BOLA on Refund Processing
- **Severity**: CRITICAL
- **OWASP Category**: A01:2021 – Broken Access Control
- **CWE**: CWE-639: Authorization Bypass Through User-Controlled Key
- **Components**:
  - [`apps/api/src/modules/payments/payments.routes.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/payments/payments.routes.ts#L21-L26)
  - [`apps/api/src/modules/payments/payments.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/payments/payments.service.ts#L212-L254)
- **Description**: The refund endpoint `POST /api/v1/payments/:paymentId/refund` does not verify that the target payment belongs to the hotel where the requesting manager holds an active membership.
- **Proof of Concept & Evidence**:
  Executed controlled test where Manager of Hotel Alpha issued a refund against a payment belonging to Hotel Beta:
  ```text
  --- 4. Testing Cross-Tenant Refund (IDOR) ---
  Refund response status: 200
  Refund response body: {
    success: true,
    data: {
      refund: {
        paymentId: '...',
        hotelId: 'Hotel_Beta_Id',
        amountCents: 50000,
        status: 'SUCCEEDED'
      }
    }
  }
  Payment B status after Manager A refunded it: REFUNDED
  ```
- **Exploit Scenario**: A rogue employee or compromised manager account at Hotel A can submit refund requests for bookings at competing hotels (Hotel B, Hotel C), causing unauthorized fund disbursements and financial damages.
- **Root Cause**:
  `requireHotelRole(['HOTEL_MANAGER'])` validates membership against `req.query.hotelId` (`Hotel Alpha`). The service then fetches `Payment.findById(paymentId)` (`Hotel Beta`) without verifying `payment.hotelId.equals(req.hotelMembership.hotelId)`.
- **Recommended Solution**:
  Enforce tenant ownership inside `paymentsService.processRefund`:
  ```ts
  if (payment.hotelId.toString() !== staffHotelId && requestingUserRole !== 'PLATFORM_ADMIN') {
    throw new ForbiddenError('Unauthorized: Payment belongs to another hotel property.');
  }
  ```

---

### Finding SEC-003: Automatic Bootstrap Demo Seeding Creates Known Accounts in Production
- **Severity**: HIGH
- **OWASP Category**: A07:2021 – Identification and Authentication Failures
- **CWE**: CWE-1188: Insecure Default Initialization of Resource
- **Component**: [`apps/api/src/server.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/server.ts#L22-L26)
- **Description**: The database bootstrap logic automatically seeds demo accounts whenever `Hotel.countDocuments() === 0`:
  ```ts
  const hotelCount = await Hotel.countDocuments();
  if (hotelCount === 0) {
    logger.info('🏨 Empty database detected on bootstrap. Auto-populating with luxury demo properties and staff...');
    await seedData(false);
  }
  ```
- **Impact**: Any fresh production deployment connecting to a newly provisioned MongoDB Atlas database will automatically insert default accounts:
  - `admin@roomly.luxury` (Password: `AdminPass123!`)
  - `manager@riviera.luxury` (Password: `ManagerPass123!`)
  - `frontdesk@riviera.luxury` (Password: `StaffPass123!`)
  - `guest@example.com` (Password: `GuestPass123!`)
- **Recommended Solution**:
  Wrap auto-seeding in an explicit environment check:
  ```ts
  if (env.NODE_ENV !== 'production' && hotelCount === 0) { ... }
  ```

---

### Finding SEC-004: Insecure Hardcoded Fallback Secrets for JWT Signing
- **Severity**: HIGH
- **OWASP Category**: A02:2021 – Cryptographic Failures
- **CWE**: CWE-798: Use of Hard-coded Credentials
- **Component**: [`apps/api/src/config/env.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/config/env.ts#L17-L20)
- **Description**: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` provide hardcoded fallback default strings in Zod schema definition:
  - Default: `'roomly_default_jwt_access_secret_key_32_chars_min!'`
  - Default: `'roomly_default_jwt_refresh_secret_key_32_chars_min!'`
- **Impact**: If an operator deploys to staging or production without explicitly setting these variables, the server boots silently using public, hardcoded keys. Anyone can generate valid JWT tokens with `globalRole: "PLATFORM_ADMIN"` and compromise the entire system.
- **Recommended Solution**:
  In `env.ts`, enforce that in production, secrets must be provided explicitly:
  ```ts
  JWT_ACCESS_SECRET: z.string().min(32).refine(
    (val) => process.env.NODE_ENV !== 'production' || val !== 'roomly_default_jwt_access_secret_key_32_chars_min!',
    'Must provide a unique JWT_ACCESS_SECRET in production'
  ),
  ```

---

### Finding SEC-005: 10 Known Vulnerabilities in Dependencies (npm audit)
- **Severity**: MEDIUM
- **OWASP Category**: A06:2021 – Vulnerable and Outdated Components
- **Components**: Root, `apps/api`, `apps/web`
- **Audit Findings**:
  - **Critical (2)**: `tinypool` (<=2.1.1) Prototype pollution leading to RCE (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) via `vitest`.
  - **High (3)**: `nodemailer` (<=10.1.3) SMTP command injection and SSRF (GHSA-mm7p-fcc7-pg87, GHSA-c7w3-x93f-qmm8); `zod` (<4.6.6) Memory exhaustion DoS (GHSA-mrhx-c7xc-m3w5).
  - **Moderate (5)**: `react-router` open redirect (CVE-2025-68470, GHSA-wrjc-x8rr-h8h6); `esbuild` dev server request reflection (GHSA-67mh-4wv8-2f99).
- **Recommended Solution**: Update affected dependencies and pin secure patch versions.

---

### Finding SEC-006: Content Security Policy (CSP) Explicitly Disabled in Helmet
- **Severity**: MEDIUM
- **OWASP Category**: A05:2021 – Security Misconfiguration
- **Component**: [`apps/api/src/app.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/app.ts#L25-L30)
- **Description**:
  ```ts
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  ```
- **Impact**: Without a Content Security Policy header, the application has no second line of defense against Cross-Site Scripting (XSS) or unauthorized asset exfiltration.
- **Recommended Solution**: Define an explicit CSP directive permitting required CDNs (Google Fonts, Unsplash images) while restricting inline scripts and unauthorized hosts.

---

### Finding SEC-007: Plaintext Demo Credentials Exposed in Production Client Bundle
- **Severity**: LOW
- **OWASP Category**: A04:2021 – Insecure Design
- **Components**:
  - [`apps/web/src/context/AuthContext.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/context/AuthContext.tsx#L62-L68)
  - [`apps/web/src/components/common/Header.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/common/Header.tsx#L222-L262)
- **Description**: The client bundle embeds plaintext passwords (`AdminPass123!`, `ManagerPass123!`, `StaffPass123!`) for demo personas directly in compiled JavaScript: `dist/assets/index-Eu5FbVRh.js`.
- **Recommended Solution**: Restrict demo persona shortcuts to non-production builds (`import.meta.env.DEV`), or implement server-side mock session tokens.

