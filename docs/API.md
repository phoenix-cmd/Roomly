# Roomly — RESTful API Specification (`/api/v1`)

## 1. Conventions & Standards
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization: Bearer <jwt_access_token>` or secure HttpOnly cookie.
- **Tenant Context**: Staff endpoints derive hotel scope from validated user memberships. Where explicit, `hotelId` is validated against user's permitted hotel memberships.
- **Standard Success Response**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "2026-10-30T00:00:00.000Z" }
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_INVENTORY",
      "message": "One or more requested dates have no remaining room capacity.",
      "details": [ ... ]
    },
    "correlationId": "req_8f10b2..."
  }
  ```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new guest account |
| `POST` | `/auth/login` | Public | Authenticate user, return JWT + User object |
| `POST` | `/auth/refresh` | Public (Refresh Cookie/Token) | Rotate access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token |
| `GET` | `/auth/me` | Authenticated | Get current authenticated user profile & memberships |
| `POST` | `/auth/forgot-password` | Public | Send password reset email token |
| `POST` | `/auth/reset-password` | Public | Reset password using valid token |

### 2.2 Public Discovery & Hotels (`/api/v1/hotels` & `/api/v1/rooms`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/hotels` | Public | List active hotel properties (filters: city, stars) |
| `GET` | `/hotels/:id` | Public | Get detailed hotel profile, policies, amenities |
| `GET` | `/hotels/:id/room-categories` | Public | List available room categories for a hotel |
| `GET` | `/hotels/:id/room-categories/:categoryId` | Public | Get room category specifications, gallery, policies |
| `GET` | `/hotels/:id/availability` | Public | Query availability & live pricing for check-in/out range |

### 2.3 Reservations & Checkout (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/bookings/hold` | Authenticated (Guest) | Atomically lock inventory & create temporary hold |
| `GET` | `/bookings/:id` | Authenticated (Owner / Staff) | Fetch reservation details, status, pricing breakdown |
| `POST` | `/bookings/:id/cancel` | Authenticated (Owner / Manager) | Cancel reservation, release inventory, trigger refund |
| `GET` | `/bookings/guest/my-bookings` | Authenticated (Guest) | List current & past bookings for logged-in guest |

### 2.4 Payments & Webhooks (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payments/create-intent` | Authenticated (Guest) | Create payment intent with configured payment gateway |
| `POST` | `/payments/confirm-mock` | Authenticated (Dev/Test only) | Test double to confirm payment in non-prod |
| `POST` | `/payments/webhook` | Public (Signature Verified) | Process external payment gateway webhook events |
| `POST` | `/payments/:id/refund` | Authenticated (Manager/Admin) | Issue manual or automated refund |

### 2.5 Front-Desk Operations (`/api/v1/operations`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/operations/:hotelId/dashboard` | Staff / Manager | Today's arrivals, departures, occupancy, alerts |
| `GET` | `/operations/:hotelId/arrivals` | Staff / Manager | Expected check-ins for specified date |
| `GET` | `/operations/:hotelId/departures` | Staff / Manager | Expected check-outs for specified date |
| `POST` | `/operations/:hotelId/check-in` | Staff / Manager | Assign room and mark booking as `CHECKED_IN` |
| `POST` | `/operations/:hotelId/check-out` | Staff / Manager | Complete departure and trigger room cleaning |
| `GET` | `/operations/:hotelId/rooms` | Staff / Manager | Real-time physical room grid with statuses |

### 2.6 Housekeeping (`/api/v1/housekeeping`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/housekeeping/:hotelId/tasks` | Staff / Manager | List cleaning & maintenance tasks |
| `PATCH`| `/housekeeping/:hotelId/rooms/:roomId/status` | Staff / Manager | Update room status (`DIRTY` -> `CLEANED` -> `INSPECTED`) |
| `POST` | `/housekeeping/:hotelId/tasks` | Staff / Manager | Create custom maintenance / cleaning task |

### 2.7 Management, Inventory & Pricing (`/api/v1/management`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/management/:hotelId/inventory` | Manager / Admin | Get inventory grid across dates & categories |
| `POST` | `/management/:hotelId/inventory/batch-update` | Manager / Admin | Adjust total allotment or price override by date range |
| `POST` | `/management/:hotelId/room-categories` | Manager / Admin | Create or edit room category |
| `GET` | `/management/:hotelId/reports/occupancy` | Manager / Admin | Occupancy, RevPAR, ADR reports |
| `GET` | `/management/:hotelId/reports/financial` | Manager / Admin | Gross bookings, taxes, refunds breakdown |
| `GET` | `/management/:hotelId/staff` | Manager / Admin | Manage staff hotel memberships & permissions |

### 2.8 Platform Administration (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/hotels` | Platform Admin | System-wide hotel directory |
| `POST` | `/admin/hotels` | Platform Admin | Onboard new hotel property |
| `GET` | `/admin/audit-logs` | Platform Admin | Query system audit trails |
| `GET` | `/admin/health` | Platform Admin | System health, worker status, DB metrics |
