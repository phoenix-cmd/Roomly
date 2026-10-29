# ADR 0004: Multi-Tenant Hotel Isolation and Role-Based Access Control (RBAC)

## Context
Roomly supports multiple distinct hotel properties on the same platform. A staff member or manager authorized for Hotel A must never be able to inspect, modify, or export guest bookings, room lists, revenue figures, or housekeeping schedules of Hotel B by tampering with URL parameters or payload bodies.

## Decision
1. **Hotel Membership as the Tenant Scope Anchor**:
   A user's relationship with a hotel is captured in a `HotelMembership` record `{ userId, hotelId, role, permissions, isActive }`.
2. **Context Resolution Middleware**:
   For any route requiring hotel operational access (e.g. `/api/v1/operations/:hotelId/*` or `/api/v1/management/:hotelId/*`), middleware `tenantContextResolver` inspects `req.user.id` against the database for `hotelId`.
3. **No Blind Trust in Client Parameters**:
   The tenant scope is derived directly from the authenticated session. If the user does not possess an active membership for the target `hotelId`, the request is immediately rejected with `403 Forbidden`.
4. **Platform Administrator Exception**:
   Users with `globalRole: PLATFORM_ADMIN` can inspect cross-tenant entities, but each administrative query triggers an audit entry in `AuditLog`.

## Consequences
- Guaranteed multi-tenant data isolation.
- Clear audit trails for property-level access.
- Flexible role assignments (a user can be Front Desk at Hotel A, and Manager at Hotel B).
