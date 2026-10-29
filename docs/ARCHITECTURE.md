# Roomly — Architecture & System Design Document

## 1. System Overview & Architectural Paradigm
Roomly is designed as a **Modular Monolith** with TypeScript across both the backend (`apps/api`) and the frontend (`apps/web`). This avoids premature distributed systems complexity while enforcing domain-driven modularity, clean boundaries, and independent testability.

```
                              ┌──────────────────────────────────┐
                              │     Client Browser / Mobile      │
                              │      (React + Vite + TS)         │
                              └────────────────┬─────────────────┘
                                               │ HTTPS / JSON API
                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 apps/api (Express + TS)                                │
│                                                                                        │
│  [Security Layer: Helmet, CORS Whitelist, Rate Limiters, JSON Body Parser, Sanitizer] │
│                                                                                        │
│  [Middleware: AuthN (JWT + Cookie/Bearer), Tenant Context Resolver, RBAC Guard]        │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 Domain Modules                                   │  │
│  │                                                                                  │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────┐  │  │
│  │  │     Auth      │ │     Users     │ │    Hotels     │ │ Rooms & Categories   │  │  │
│  │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └──────────┬───────────┘  │  │
│  │  ┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐ ┌──────────┴───────────┐  │  │
│  │  │  Inventory &  │ │   Bookings    │ │   Payments    │ │ Front Desk Check-in  │  │  │
│  │  │ Availability  │ │               │ │   & Refunds   │ │      & Check-out     │  │  │
│  │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └──────────┬───────────┘  │  │
│  │  ┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐ ┌──────────┴───────────┐  │  │
│  │  │  Housekeeping │ │    Invoices   │ │    Reviews    │ │ Reports & Analytics  │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         Infrastructure & Service Adapters                        │  │
│  │  • PaymentGateway (Stripe / Razorpay / MockSandboxAdapter)                        │  │
│  │  • EmailService (Nodemailer / MockEmailService)                                  │  │
│  │  • StorageService (LocalDisk / CloudS3Adapter)                                    │  │
│  │  • HoldExpirationScheduler / Cleanup Worker                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                               │                                        │
│                                               ▼ Mongoose ODM                           │
│                                 ┌───────────────────────────┐                          │
│                                 │     MongoDB Replica Set   │                          │
│                                 │ (ACID Multi-Doc Tx Support│                          │
│                                 └───────────────────────────┘                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & Workspace Structure

```text
roomly/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript Backend
│   │   ├── src/
│   │   │   ├── config/          # Zod-validated environment config
│   │   │   ├── middleware/      # Auth, Tenant Isolation, Error, Rate Limiting
│   │   │   ├── modules/         # Cohesive Domain Slices
│   │   │   │   ├── auth/        # Login, Register, JWT, Tokens
│   │   │   │   ├── users/       # Profiles, Roles
│   │   │   │   ├── hotels/      # Properties, Memberships, Policies
│   │   │   │   ├── rooms/       # Categories, Physical Rooms, Amenities
│   │   │   │   ├── inventory/   # Date-based allotments, atomic hold/release
│   │   │   │   ├── bookings/    # Lifecycle state machine, pricing snapshot
│   │   │   │   ├── payments/    # Gateway abstraction, webhooks, refunds
│   │   │   │   ├── operations/  # Front-desk, arrivals/departures, checkin/out
│   │   │   │   ├── housekeeping/# Room cleaning status, task assignments
│   │   │   │   ├── reviews/     # Verified guest feedback
│   │   │   │   ├── notifications# In-app alerts and notifications
│   │   │   │   ├── invoices/    # Billing records & PDF/HTML rendering
│   │   │   │   └── reports/     # Aggregations for RevPAR, ADR, Occupancy
│   │   │   ├── adapters/        # Payment (Stripe/Mock), Email, Storage
│   │   │   ├── jobs/            # Scheduled hold expiration, email retry
│   │   │   ├── utils/           # Logger, Money, Date helpers
│   │   │   └── server.ts        # App bootstrap and graceful shutdown
│   │   ├── tests/               # Unit, Integration, Concurrency test suites
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # React 18 + Vite + TypeScript Frontend
│       ├── src/
│       │   ├── api/             # Typed Axios HTTP client with interceptors
│       │   ├── assets/          # Brand photography, logos, icons
│       │   ├── components/      # UI components (Luxury public + MUI admin)
│       │   │   ├── public/      # Header, Hero, BookingBar, RoomCard, Footer
│       │   │   ├── guest/       # Guest dashboard, booking history, refund tracker
│       │   │   ├── staff/       # Front-desk board, check-in dialog, room grid
│       │   │   ├── manager/     # Room category config, inventory table, rate planner
│       │   │   └── common/      # Buttons, Modal, Toast, StatusBadge
│       │   ├── context/         # AuthContext, NotificationContext
│       │   ├── hooks/           # useAuth, useAvailability, useBooking
│       │   ├── pages/           # Routed pages per persona
│       │   ├── routes/          # ProtectedRoute, RoleGuard, PublicRoute
│       │   ├── styles/          # Design tokens (variables.css, luxury.css)
│       │   ├── types/           # Shared DTOs, Enums, Interfaces
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── docs/                        # Architecture, PRD, API, Security, Database, ADRs
├── scripts/                     # Seed data script, verification runner
├── .env.example
├── package.json                 # Monorepo root workspace manifest
└── README.md
```

---

## 3. Core Domain State Machines

### 3.1 Booking Lifecycle State Machine
```
              [Create Reservation]
                       │
                       ▼
               PENDING_PAYMENT
               │             │
   (Payment Success)    (Hold Expired / Payment Failed / Guest Cancelled)
               │             │
               ▼             ▼
           CONFIRMED      EXPIRED / CANCELLED
               │
          (Arrival Date: Front-Desk Check-In)
               │
               ▼
           CHECKED_IN
               │
         (Departure Date: Front-Desk Check-Out)
               │
               ▼
          CHECKED_OUT
```

### 3.2 Payment State Machine
```
      [Initiate Checkout]
              │
              ▼
           CREATED ───► PENDING ───► FAILED
                          │
                   (Webhook Verified)
                          │
                          ▼
                      SUCCEEDED
                          │
                 (Guest Refund Request)
                          │
                          ▼
                   REFUND_PENDING
                    │          │
         (Gateway Success)  (Gateway Denied)
                    │          │
                    ▼          ▼
                 REFUNDED   REFUND_FAILED
```

---

## 4. Design Principles (SOLID Implementation)
1. **Single Responsibility**: Each module encapsulates only its specific domain rules (e.g., `inventory.service.ts` only modifies inventory allocations; `pricing.service.ts` calculates rate snapshots).
2. **Open / Closed Principle**: Payment processing uses an interface `IPaymentGateway` with interchangeable adapters (`StripePaymentAdapter`, `RazorpayPaymentAdapter`, `MockSandboxPaymentAdapter`). Adding a new payment provider requires zero changes to the core booking service.
3. **Liskov Substitution**: Any payment or email provider contract can be substituted in testing or production environments without altering caller behavior.
4. **Interface Segregation**: Service contracts are strictly typed with small, purpose-built interfaces rather than monolithic God-objects.
5. **Dependency Inversion**: High-level modules (e.g. `BookingService`) rely on abstractions (`IPaymentGateway`, `IEmailService`, `IStorageService`) injected during application bootstrap.
