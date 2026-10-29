# Roomly — Security Engineering & Threat Model

## 1. Security Architecture & Threat Model (STRIDE)

| Threat Category | Potential Vector | Mitigation in Roomly |
|---|---|---|
| **Spoofing** | Forged JWTs or hijacked session tokens | Signed HS256/RS256 JWTs with 15-minute expiration, rotating refresh tokens stored in HttpOnly SameSite cookies, explicit token revocation check. |
| **Tampering** | Parameter tampering on room prices or booking status | Authoritative monetary rates and pricing snapshots computed exclusively server-side from database records. No client-supplied totals trusted. |
| **Repudiation** | Denying booking cancellations or staff check-in actions | Comprehensive `AuditLog` records capturing `userId`, `action`, `resourceId`, timestamp, IP address, and payload delta. |
| **Information Disclosure** | Leakage of password hashes, cross-hotel guest records | Mongoose schemas flag sensitive fields with `select: false`. Strict tenant boundary middleware verifies `hotelId` against user memberships. |
| **Denial of Service** | Automated reservation spam holding all room inventory | Atomic 15-minute hold TTL with background cleanup; IP & User-based rate limiting on `/bookings/hold` and `/auth/login`. |
| **Elevation of Privilege** | Guest attempting to access front-desk or management routes | Enforced RBAC middleware validating roles (`GUEST`, `FRONT_DESK`, `HOUSEKEEPING`, `HOTEL_MANAGER`, `PLATFORM_ADMIN`) before route execution. |

---

## 2. Authentication & Credential Storage
- **Password Hashing**: `bcryptjs` with salt rounds = 12.
- **Access Tokens**: Short-lived (15 minutes), containing `{ userId, email, globalRole }`.
- **Refresh Tokens**: Long-lived (7 days), persisted with hash and revoked upon logout or password change.
- **Client Storage**: Never store sensitive tokens or credit card information in LocalStorage or Redux.

---

## 3. Multi-Tenant Authorization Enforcement
Every endpoint operating on hotel-scoped data applies the `requireHotelPermission(permission)` or `requireHotelMembership([roles])` middleware:
1. Extracts `hotelId` from route param.
2. Queries the user's `HotelMembership` record for `(req.user.id, hotelId)`.
3. If not found or inactive, immediately rejects with `403 Forbidden` ("Access denied for this property").
4. If role or permission is insufficient, rejects with `403 Forbidden`.
5. Platform Admins (`globalRole: PLATFORM_ADMIN`) are allowed bypass for auditing with an audit event recorded.

---

## 4. Payment & Webhook Security
1. **Raw Body Verification**: Webhook route `/api/v1/payments/webhook` verifies cryptographic signatures against raw request buffer before JSON parsing.
2. **Idempotent Execution**: Webhook events persist to `WebhookEvent` with unique compound index `{ provider, eventId }`. Duplicate deliveries receive `200 OK` without re-processing side-effects.
3. **No Card Data**: Roomly never touches, processes, or stores raw primary account numbers (PAN) or CVVs. All card interactions are tokenized directly with the provider client SDK.

---

## 5. HTTP & Transport Security
- **Headers**: Enforced via `helmet` (Strict-Transport-Security, Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
- **CORS**: Strict origin whitelist configured via `CLIENT_URL` environment variable.
- **Rate Limiting**: `express-rate-limit` with stricter windows on auth endpoints (5 attempts / 15 minutes) and checkout endpoints.
