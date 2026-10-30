# Roomly Link, Navigation & Interaction Audit

## 1. Overview

This document presents a comprehensive audit of all internal routes, external links, anchor links, buttons, and user interaction states across the Roomly web application.

---

## 2. Broken Internal Links & Navigation Failures

### Finding NAV-001: Header Hash Anchors Broken on Non-Home Routes
- **Severity**: MEDIUM
- **Priority**: HIGH
- **Component**: [`apps/web/src/components/common/Header.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/common/Header.tsx#L82-L103)
- **Description**: The top navigation bar includes `<a href="#story">The Sanctuary</a>` and `<a href="#amenities">Experiences</a>`.
- **Reproduction**:
  1. Navigate to `/rooms`, `/checkout`, `/dashboard`, or `/login`.
  2. Click "The Sanctuary" or "Experiences" in the main navigation.
  3. The browser URL changes to `/rooms#story` or `/checkout#story`.
- **Expected Behavior**: Navigation smoothly directs to the home page anchors `/#story` and `/#amenities` from any page.
- **Actual Behavior**: The page does nothing; anchor elements `#story` and `#amenities` do not exist on non-home routes.
- **Root Cause**: Relative hash links `<a href="#...">` resolve relative to current page path rather than root `/#...`.
- **Recommended Solution**: Change `href="#story"` to `href="/#story"` or use a navigation handler that scrolls to elements if on home page or navigates to `/#story` if on another route.

---

### Finding NAV-002: Catch-All Route Silently Redirects Instead of Showing Branded 404
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Component**: [`apps/web/src/App.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/App.tsx#L52)
- **Description**: The fallback route is configured as `<Route path="*" element={<Navigate to="/" replace />} />`.
- **Reproduction**:
  1. Enter an invalid URL directly in the browser address bar, such as `http://localhost:3000/invalid-path-404`.
  2. The page flashes and silently redirects to the homepage `/`.
- **Expected Behavior**: A luxury editorial 404 "Page Not Found" sanctuary page should inform the guest that the requested resource does not exist, with navigation back to safety.
- **Actual Behavior**: The user is silently relocated to the homepage with no feedback, causing confusion on mistyped links or expired booking confirmations.
- **Root Cause**: Wildcard route unconditionally navigates to `/`.
- **Recommended Solution**: Implement a dedicated `NotFoundPage.tsx` adhering to the Luxury Editorial aesthetic.

---

### Finding NAV-003: Direct Navigation to `/checkout` Freezes in Infinite Loading State
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/web/src/pages/CheckoutPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/CheckoutPage.tsx#L40-L63)
- **Description**: When a user navigates directly to `/checkout` (or refreshes the page with missing query parameters), the page permanently displays "Preparing your reservation details..." and never resolves.
- **Reproduction**:
  1. Navigate directly to `http://localhost:3000/checkout`.
  2. The page renders the loading text indefinitely.
- **Expected Behavior**: If `hotelId` or `categoryId` is missing, the page should display a friendly notice with a button to "Select a Suite" redirecting to `/rooms`.
- **Actual Behavior**: `loading` state is initialized to `true` (`useState(true)`). The `loadPricing` effect checks `if (hotelId && categoryId)`, which is false, so it skips data fetching and never calls `setLoading(false)`.
- **Root Cause**: Lack of an `else` branch handling missing query parameters in the checkout effect.
- **Recommended Solution**: Add fallback validation:
  ```tsx
  if (!hotelId || !categoryId) {
    setLoading(false);
    setError('No room category selected. Please explore our suites first.');
    return;
  }
  ```

---

### Finding NAV-004: Infinite Loading Hang on Operational Portals for Guests & Admins
- **Severity**: HIGH
- **Priority**: HIGH
- **Components**: 
  - [`apps/web/src/pages/StaffDashboardPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/StaffDashboardPage.tsx#L24-L47)
  - [`apps/web/src/pages/ManagerDashboardPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/ManagerDashboardPage.tsx#L28-L48)
  - [`apps/web/src/pages/HousekeepingPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/HousekeepingPage.tsx#L17-L35)
- **Description**: Front desk, management, and housekeeping pages retrieve the property identifier using `user?.memberships?.[0]?.hotelId`. When accessed by an unauthenticated user, a pure guest, or a platform administrator (who has no memberships array), the effect returns immediately without setting `loading` to false.
- **Reproduction**:
  1. Open a private browser window (unauthenticated) or sign in as Platform Admin.
  2. Navigate directly to `/staff/dashboard` or `/manager/dashboard`.
  3. The page remains stuck in an infinite loading spinner.
- **Expected Behavior**: The user should be redirected to `/login` or shown an access denied banner ("No hotel property affiliation found").
- **Actual Behavior**: The dashboard hangs indefinitely with a blank background.
- **Root Cause**: Early return `if (!hotelId) return;` skips `setLoading(false)`.
- **Recommended Solution**: Check for authentication and hotel membership upfront. If absent, set `loading = false` and redirect to login or show an unauthorized state.

---

## 3. Dead Buttons & Non-Interactive Elements

### Finding NAV-005: Footer Policy Links Are Non-Interactive Plain Spans
- **Severity**: LOW
- **Priority**: LOW
- **Component**: [`apps/web/src/components/common/Footer.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/common/Footer.tsx#L136-L140)
- **Description**: The footer displays "Privacy Policy", "Terms of Reservation", and "Guest Charter".
- **Reproduction**:
  1. Scroll to the footer of any page.
  2. Attempt to click "Privacy Policy" or "Terms of Reservation".
  3. Cursor does not change to a pointer and clicking yields no response.
- **Expected Behavior**: Should link to active policy modals or dedicated policy routes (`/privacy`, `/terms`, `/guest-charter`).
- **Actual Behavior**: Rendered as non-interactive `<span>` elements.
- **Recommended Solution**: Create dedicated policy views or interactive luxury modals displaying official reservation terms and guest charters.

---

### Finding NAV-006: Footer Property Links Lack Hotel Identifiers
- **Severity**: LOW
- **Priority**: LOW
- **Component**: [`apps/web/src/components/common/Footer.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/common/Footer.tsx#L56-L71)
- **Description**: The footer lists "The Grand Azure Riviera (Cannes)", "Aethelgard Manor & Alpine Spa (St. Moritz)", and "Private Coastal Villas". All three links point to `<Link to="/rooms">` without passing a hotel property query or slug.
- **Reproduction**:
  1. Click "Aethelgard Manor & Alpine Spa (St. Moritz)".
  2. The page loads `/rooms` displaying The Grand Azure Riviera instead of filtering to the selected property.
- **Expected Behavior**: Navigates to `/rooms?hotelSlug=aethelgard-manor` or `/rooms?hotelId=...` and preselects the corresponding hotel in the property selector.
- **Actual Behavior**: Always displays the first hotel returned by the API.
- **Recommended Solution**: Pass `hotelSlug` or `hotelId` in the route parameter and have `RoomsPage` read `searchParams.get('hotelId')`.

---

## 4. Navigation & Interaction Audit Matrix

| Route / UI Component | Action / Interaction | Type | Target Destination | Status | Defect Reference |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `Header` Logo | Click "ROOMLY •" | Internal Link | `/` | **PASS** | - |
| `Header` Suites & Villas | Click "Suites & Villas" | Internal Link | `/rooms` | **PASS** | - |
| `Header` The Sanctuary | Click "The Sanctuary" | Anchor Link | `#story` | **FAIL** | NAV-001 |
| `Header` Experiences | Click "Experiences" | Anchor Link | `#amenities` | **FAIL** | NAV-001 |
| `Header` Demo Persona | Click Persona Switcher | Dropdown Menu | In-place switch & redirect | **PASS** | - |
| `Header` Sign In | Click "Sign In" | Internal Link | `/login` | **PASS** | - |
| `Header` Sign Out | Click LogOut button | Action | Clear session & redirect `/` | **PASS** | - |
| `Header` Reserve Suite | Click "Reserve Suite" | Internal Link | `/rooms` | **PASS** | - |
| `Hero` Discover | Click "Discover Sanctuary" | Anchor Link | `#story` | **PASS** | Works on homepage |
| `BookingBar` Search | Submit date search | Form / Navigation | `/rooms?checkInDate=...` | **PASS** | - |
| `RoomCard` Details | Click "Details" | Modal Trigger | `RoomDetailsModal` | **PASS** | - |
| `RoomCard` Reserve | Click "Reserve" | Navigation | `/checkout?...` | **PASS** | - |
| `RoomDetailsModal` | Click "Proceed to Reserve" | Navigation | `/checkout?...` | **PASS** | - |
| `RoomDetailsModal` | Click Gallery Dots | Image Switch | In-place active image | **PARTIAL** | Missing aria-labels |
| `RoomsPage` Property | Select Hotel dropdown | State update | Refetches category list | **PASS** | - |
| `RoomsPage` Rate Slider | Drag Max Rate slider | Client Filter | Filters visible cards | **PASS** | - |
| Direct `/checkout` | Direct URL / refresh | Route | `/checkout` | **FAIL** | NAV-003 |
| Direct `/staff/dashboard` | Direct URL as Guest | Route Guard | `/staff/dashboard` | **FAIL** | NAV-004 |
| Direct `/manager/dashboard` | Direct URL as Guest | Route Guard | `/manager/dashboard` | **FAIL** | NAV-004 |
| Direct `/admin/dashboard` | Direct URL as Guest | Route Guard | `/admin/dashboard` | **FAIL** | SEC-007 |
| Direct `/invalid-route` | Direct 404 URL | Fallback Route | Branded 404 page | **FAIL** | NAV-002 |
| `Footer` Privacy Policy | Click Policy | Internal Link | Non-interactive span | **FAIL** | NAV-005 |
| `Footer` Terms | Click Terms | Internal Link | Non-interactive span | **FAIL** | NAV-005 |
| `Footer` Hotel Links | Click St. Moritz hotel | Filtered Link | `/rooms` | **FAIL** | NAV-006 |

