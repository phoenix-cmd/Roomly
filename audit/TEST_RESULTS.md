# Roomly Verification & Automated Test Results

## 1. Test Execution Summary

The following test suites, commands, and automated checks were executed during the audit:

| Command / Suite | Scope | Exit Code | Result | Evidence / Summary |
| :--- | :--- | :---: | :---: | :--- |
| `npm --prefix apps/api test` | Backend unit & concurrency tests | `0` | **PASS** | 2 test files passed, 6 total tests passed in 3.58s. |
| `npm --prefix apps/web test` | Frontend web test runner | `1` | **FAIL** | Vitest found zero test files in `apps/web`. Exited code 1. |
| `npm --prefix apps/api run build` | Backend TypeScript compilation | `0` | **PASS** | `tsc` compiled `src/` to `dist/` cleanly with no errors. |
| `npm --prefix apps/web run build` | Frontend TypeScript & Vite bundle | `0` | **PASS** | 2,583 modules compiled to `dist/` in 16.00s. Warning on 774 kB chunk. |
| `npm audit` | Dependency vulnerability scan | `1` | **FAIL** | 10 vulnerabilities detected (2 Critical, 3 High, 5 Moderate). |
| `node scripts/verify-system.js` | Architecture documentation verification | `0` | **PASS** | 12 markdown documents and ADRs verified present. |
| `scratch/test_concurrency.ts` | 5 concurrent holds on uninitialized date | `0` | **FAIL (Repro)** | 1 succeeded, 4 crashed with MongoDB `E11000` duplicate key error. |
| `scratch/test_concurrency.ts` | Double confirmation boundary guard | `0` | **FAIL (Repro)** | `heldCount` decremented to `-1`, `bookedCount` incremented to `2`. |
| `scratch/test_security_and_logic.ts`| CORS origin reflection with credentials | `0` | **FAIL (Repro)** | Reflected `https://evil-attacker.com` with `credentials: true`. |
| `scratch/test_security_and_logic.ts`| Cross-tenant refund (IDOR / BOLA) | `0` | **FAIL (Repro)** | Manager of Hotel A successfully refunded Payment of Hotel B. |
| `scratch/test_security_and_logic.ts`| Staff access to `GET /bookings/:id` | `0` | **FAIL (Repro)** | Staff received HTTP 403 Forbidden on legitimate booking. |
| `scratch/test_double_cancel.ts` | Concurrent double cancellation | `0` | **FAIL (Repro)** | Booked count dropped from 2 to 0 for 1 cancelled booking. |

---

## 2. Detailed Automated Test Case Log

### Test Case 1: Authoritative Integer Cents Pricing Snapshot
- **File**: `apps/api/tests/pricing.test.ts`
- **Command**: `npm --prefix apps/api test`
- **Status**: **PASS**
- **Log Output**:
  ```text
  ✓ tests/pricing.test.ts (4 tests) 5ms
    ✓ correctly generates stay dates between check-in and check-out (inclusive-exclusive)
    ✓ throws error when check-out precedes or equals check-in
    ✓ validates ISO date format YYYY-MM-DD correctly
    ✓ calculates authoritative monetary amounts strictly in integer cents
  ```

---

### Test Case 2: Pre-Existing Allotment Concurrency
- **File**: `apps/api/tests/concurrency.test.ts`
- **Command**: `npm --prefix apps/api test`
- **Status**: **PASS**
- **Log Output**:
  ```text
  ✓ tests/concurrency.test.ts (2 tests) 794ms
    ✓ prevents overselling when 10 simultaneous concurrent requests compete for the last available room
    ✓ atomically rolls back multi-night holds if any single night in the range is exhausted
  ```

---

### Test Case 3: Concurrency on Un-Provisioned Inventory Dates (Stress Check)
- **Script**: `scratch/test_concurrency.ts`
- **Status**: **FAIL (Defect Repro: CRITICAL)**
- **Evidence**:
  ```text
  Testing concurrency on un-provisioned date...
  Results of 5 concurrent holds on uninitialized date:
    Request 0: Fulfilled
    Request 1: Rejected with E11000 duplicate key error collection: test.inventorydays index: hotelId_1_roomCategoryId_1_date_1 dup key: { hotelId: ObjectId('...'), roomCategoryId: ObjectId('...'), date: "2027-01-01" }
    Request 2: Rejected with E11000 duplicate key error ...
    Request 3: Rejected with E11000 duplicate key error ...
    Request 4: Rejected with E11000 duplicate key error ...
  Inventory docs count: 1
  Held count: 1, Total: 3
  ```

---

### Test Case 4: Double Payment Confirmation Inventory Corruption
- **Script**: `scratch/test_concurrency.ts`
- **Status**: **FAIL (Defect Repro: CRITICAL)**
- **Evidence**:
  ```text
  Testing confirmHoldToBooked when hold count is 0...
  Held count after double confirm: -1
  Booked count after double confirm: 2
  ```

---

### Test Case 5: Duplicate Cancellation Inventory Release
- **Script**: `scratch/test_double_cancel.ts`
- **Status**: **FAIL (Defect Repro: CRITICAL)**
- **Evidence**:
  ```text
  [MockEmail] Cancellation Notification for RML-CANCELTEST sent to cancel@test.com
  [MockEmail] Cancellation Notification for RML-CANCELTEST sent to cancel@test.com
  Initial booked count was 2. After double-cancellation of 1 booking, booked count is: 0
  ```

---

### Test Case 6: Permissive Cross-Origin Reflection (CORS)
- **Script**: `scratch/test_security_and_logic.ts`
- **Status**: **FAIL (Defect Repro: CRITICAL)**
- **Evidence**:
  ```text
  --- 1. Testing CORS with unauthorized external origin and credentials ---
  CORS Access-Control-Allow-Origin header: https://evil-attacker.com
  CORS Access-Control-Allow-Credentials header: true
  ```

---

### Test Case 7: Cross-Tenant Refund (IDOR / BOLA)
- **Script**: `scratch/test_security_and_logic.ts`
- **Status**: **FAIL (Defect Repro: CRITICAL)**
- **Evidence**:
  ```text
  --- 4. Testing Cross-Tenant Refund (IDOR) ---
  Refund response status: 200
  Payment B status after Manager A refunded it: REFUNDED
  ```

---

### Test Case 8: Staff Access to Booking Details
- **Script**: `scratch/test_security_and_logic.ts`
- **Status**: **FAIL (Defect Repro: HIGH)**
- **Evidence**:
  ```text
  --- 5. Testing Staff Access to GET /api/v1/bookings/:id ---
  Manager A viewing booking from Hotel A status: 403
  Manager A response body: {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied to this booking.'
    }
  }
  ```

---

### Test Case 9: Web Client Test Execution
- **Command**: `npm --prefix apps/web test`
- **Status**: **FAIL (Missing Tests)**
- **Evidence**: Vitest exited with code 1; 0 test files found.

---

### Test Case 10: Dependency Vulnerability Audit
- **Command**: `npm audit`
- **Status**: **FAIL (10 Vulnerabilities)**
- **Evidence**:
  - `tinypool` (Critical) Prototype pollution gadget
  - `nodemailer` (High) SMTP injection & SSRF
  - `zod` (High) Memory exhaustion in collection validation
  - `react-router` (Moderate) Open redirect CVE-2025-68470
  - `esbuild` (Moderate) Dev server request reflection

