# ADR 0001: Modular Monolith and Monorepo Workspace Structure

## Context
Roomly requires multiple user interfaces (luxury guest booking engine, staff front-desk, housekeeping board, manager portal, platform admin) and a rich backend handling real-time inventory, booking state machines, payments, and multi-tenant hotel operations. Microservices introduce unnecessary operational overhead, distributed network latency, and eventual consistency challenges for high-stakes inventory and payment transactions.

## Decision
We architect Roomly as a **Modular Monolith** organized in an npm workspace monorepo:
- `apps/web`: React 18, TypeScript, Vite, React Router, Redux Toolkit for UI state, Luxury Editorial design system with CSS custom properties, and Material UI for operational back-office dashboards.
- `apps/api`: Node.js, Express, TypeScript, Mongoose ODM, structured into domain modules (`auth`, `hotels`, `rooms`, `inventory`, `bookings`, `payments`, `operations`, `housekeeping`, `reports`).
- Shared clean interfaces and DTOs.

## Consequences
- Single unified deployment option with clean module boundaries.
- Easy to run locally and test end-to-end.
- Enables atomic MongoDB multi-document transactions without distributed sagas or 2PC coordinators.
- Modules can be extracted into microservices in the future if high scale demands it.
