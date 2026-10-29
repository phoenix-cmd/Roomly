# Roomly — Luxury Hotel Booking & Operations Platform

> A production-oriented MERN platform pairing an art-directed luxury editorial guest booking experience with an operations and property management system for hotel staff and administrators.

---

## Key Capabilities

1. **Luxury Editorial Public Experience**:
   - Art-directed visual identity: Warm ivory (`#F7F3EC`), Deep charcoal (`#24231F`), Champagne gold (`#B69A68`), Sandstone (`#E6DED2`), Muted olive (`#737866`).
   - Editorial typography (Cormorant Garamond & Inter), responsive booking widget, room category exploration, live pricing calculation, and high-fidelity room galleries.

2. **Concurrency-Safe Date-Based Inventory**:
   - Atomic conditional hold/reserve mechanics across consecutive nights.
   - 15-minute temporary reservation holds with automatic background expiration and inventory restoration.
   - Guaranteed prevention of double-booking or overselling under high concurrency.

3. **Multi-Tenant Operations System**:
   - Dedicated dashboards for **Front Desk** (Today's arrivals/departures, room assignments, check-in, check-out).
   - Real-time **Housekeeping Board** (Turnover, Clean, Inspection states, Task ticketing).
   - **Hotel Manager Suite** (Inventory allotment matrix, seasonal rates, staff permissions, RevPAR/ADR occupancy analytics).
   - **Platform Administration** (Multi-property directory, system audit logs, global health metrics).

4. **Security & Financial Precision**:
   - Authoritative monetary rates stored in integer minor units (cents).
   - Modular payment adapter architecture (`Stripe`, `Razorpay`, `MockSandbox`).
   - Idempotent payment webhook deduplication and server-verified confirmations.
   - Granular RBAC, JWT access/refresh token rotation, strict CORS, rate limiting, and input validation schemas via Zod.

---

## Architecture & Technology Stack

- **Architecture**: Modular Monolith with Domain-Driven Design in an npm workspaces monorepo.
- **Frontend (`apps/web`)**: React 18, TypeScript, Vite, React Router 6, Redux Toolkit, Material UI (Operational Dashboards), Semantic HTML & Luxury CSS Tokens.
- **Backend (`apps/api`)**: Node.js, Express, TypeScript, Mongoose ODM (MongoDB), Zod, Helmet, Bcrypt, Winston logger.
- **Testing**: Vitest, Supertest, Concurrency Stress Suite.

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v25)
- npm >= 9
- MongoDB (Local instance or MongoDB Atlas replica set)

### 1. Installation
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `apps/api/.env`:
```bash
cp .env.example apps/api/.env
```

### 3. Seed Database with Luxury Demo Properties
Populates luxury hotel properties (e.g. *The Grand Azure Riviera*, *Aethelgard Manor*), room categories, physical rooms, inventory allotments for 90 days, staff accounts, and sample bookings:
```bash
npm run seed
```

### 4. Development Servers
Run both API and Web client concurrently:
```bash
npm run dev
```
- Web Client: [http://localhost:3000](http://localhost:3000)
- REST API: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- Health Check: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### 5. Running Automated Tests & Quality Gates
```bash
# Run backend test suite
npm --prefix apps/api test

# Run frontend test suite
npm --prefix apps/web test

# Run inventory concurrency race-condition test
npm --prefix apps/api test:concurrency

# Run full project type check & build verification
npm run build
```

---

## Pre-Configured Demo Credentials
After running `npm run seed`:

| Persona | Email | Password | Role & Scope |
|---|---|---|---|
| **Platform Admin** | `admin@roomly.luxury` | `AdminPass123!` | System-wide administrator |
| **Hotel Manager** | `manager@riviera.luxury` | `ManagerPass123!` | Manager at The Grand Azure Riviera |
| **Front Desk** | `frontdesk@riviera.luxury` | `StaffPass123!` | Front Desk Staff at The Grand Azure Riviera |
| **Housekeeper** | `housekeeper@riviera.luxury`| `StaffPass123!` | Housekeeper at The Grand Azure Riviera |
| **Guest** | `guest@example.com` | `GuestPass123!` | Verified guest with active booking |
