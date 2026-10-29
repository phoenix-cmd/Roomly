# Roomly — Testing Strategy & Quality Assurance Plan

## 1. Test Levels & Coverage Strategy

Roomly uses a multi-tier testing strategy ensuring business correctness, inventory concurrency safety, security boundaries, and smooth user flows:

```
        ┌─────────────────────────────┐
        │       E2E Tests (5%)        │  Playwright / Flow integration
        ├─────────────────────────────┤
        │   Integration Tests (35%)   │  Supertest + Memory/Replica MongoDB
        ├─────────────────────────────┤
        │      Unit Tests (60%)       │  Vitest / Jest: Pricing, Invariants, Validators
        └─────────────────────────────┘
```

---

## 2. Key Areas of Test Coverage

### 2.1 Pricing & Financial Invariants
- Calculations for multi-night stays with weekend rate multipliers.
- Accurate tax and cleaning fee computation down to the exact cent.
- Cancellation refund calculations with penalty window boundaries.

### 2.2 Inventory Concurrency & Race Conditions
- Simultaneous requests attempting to hold the last available room for the same date range: exactly ONE succeeds, the other receives `INSUFFICIENT_INVENTORY`.
- Multi-night atomic locking across consecutive dates (e.g. 5 nights): if any single night has 0 capacity, all nights are rolled back and untouched.
- Auto-expiration of temporary holds: verify that releasing an expired hold restores `heldCount` exactly once without affecting `bookedCount`.

### 2.3 Multi-Tenant Isolation & RBAC
- Attempt by Staff of Hotel A to access Hotel B's reservations -> `403 Forbidden`.
- Attempt by unauthenticated guest to access front desk or management routes -> `401 Unauthorized`.
- Guest attempting to view another guest's booking details -> `404 Not Found` or `403 Forbidden`.

### 2.4 Payment & Webhook Idempotency
- Duplicate delivery of `payment_intent.succeeded` webhook must not create duplicate confirmation emails, duplicate inventory deductions, or duplicate payment records.
- Failed webhook signatures must be rejected with `400 Bad Request`.

---

## 3. Test Scripts & Execution Commands

```bash
# Run unit & integration tests in backend
npm --prefix apps/api test

# Run concurrency-specific inventory test
npm --prefix apps/api test:concurrency

# Run frontend tests
npm --prefix apps/web test

# Run end-to-end / verification script
npm run verify
```
