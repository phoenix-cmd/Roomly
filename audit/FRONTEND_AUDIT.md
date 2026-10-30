# Roomly Frontend Functionality & Component Audit

## 1. Overview & Architecture Inspection

- **Framework**: React 18.3.1 with TypeScript 5.7.3 and Vite 6.0.7
- **Styling Architecture**: Vanilla CSS Variables (`variables.css`) and Custom Design System (`luxury.css`) complemented by selective Emotion / MUI packages.
- **Routing**: `react-router-dom` v6.28.1
- **State Management**: React Context (`AuthContext`) and local component state. Redux Toolkit is listed in `package.json` dependencies but is unused in the implementation.

---

## 2. Frontend Critical & High-Priority Defects

### Finding FE-001: Absence of Route Guards (`ProtectedRoute`) Across All Dashboards
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/web/src/App.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/App.tsx#L37-L49)
- **Description**: All operational dashboard routes are exposed directly without route guards:
  - `/dashboard` (Guest Sanctuary)
  - `/staff/dashboard` (Front Desk)
  - `/staff/housekeeping` (Housekeeping)
  - `/manager/dashboard` (Hotel Management)
  - `/admin/dashboard` (Platform Admin)
- **Reproduction**:
  1. Clear browser session storage / log out.
  2. Navigate directly to `/admin/dashboard` or `/manager/dashboard`.
  3. The page renders its full UI shell instead of redirecting unauthenticated users to `/login`.
- **Expected Behavior**: A reusable `<ProtectedRoute allowedRoles={[...]} />` should verify authentication status and redirect to `/login?redirect=...` if unauthenticated, or to an unauthorized view if role privileges are insufficient.
- **Actual Behavior**: The component mounts and triggers API requests that fail with 401/403, causing blank cards or infinite loading states.
- **Root Cause**: Route guards were completely omitted from React Router configuration in `App.tsx`.
- **Recommended Solution**: Implement an authentication and role-checking wrapper component:
  ```tsx
  export const ProtectedRoute: React.FC<{ allowedRoles?: string[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.globalRole)) {
      // check membership role as well
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };
  ```

---

### Finding FE-002: Test Runner Exits With Error Code 1 Due to Missing Frontend Test Suite
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/web/package.json`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/package.json#L10)
- **Description**: Running `npm --prefix apps/web test` fails immediately with exit code 1.
- **Evidence**:
  ```text
  > @roomly/web@1.0.0 test
  > vitest run

  RUN v2.1.9 C:/Users/bs162/Desktop/Roomly/apps/web
  No test files found, exiting with code 1
  ```
- **Expected Behavior**: Frontend repository should contain comprehensive component, hook, and integration tests verifying rendering, booking workflows, form validation, and route guards.
- **Actual Behavior**: Zero test files exist in `apps/web/src`.
- **Recommended Solution**: Configure `@testing-library/react` and `@testing-library/jest-dom` in `vitest.config.ts` and author unit and integration tests for critical components.

---

### Finding FE-003: Hardcoded Demo Guest Data Pre-Populating Checkout Form
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Component**: [`apps/web/src/pages/CheckoutPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/CheckoutPage.tsx#L27-L31)
- **Description**: The checkout form initializes its inputs with hardcoded demo data when no user is logged in:
  ```tsx
  const [firstName, setFirstName] = useState(user?.firstName || 'Eleanora');
  const [lastName, setLastName] = useState(user?.lastName || 'Vane');
  const [email, setEmail] = useState(user?.email || 'guest@example.com');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [specialRequests, setSpecialRequests] = useState('Chilled champagne on arrival');
  ```
- **Expected Behavior**: Form inputs should initialize empty (`''`) for unauthenticated users, or pre-populate strictly from the verified authenticated profile of the active user.
- **Actual Behavior**: A real guest attempting to book without logging in sees another person's name, email, and phone number already populated in the form fields.
- **Root Cause**: Development convenience fallback left in production code.
- **Recommended Solution**: Default input values to empty strings when `user` is null.

---

### Finding FE-004: Lack of Global React Error Boundary
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Component**: [`apps/web/src/main.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/main.tsx)
- **Description**: There is no top-level React Error Boundary wrapping the application.
- **Expected Behavior**: If an uncaught rendering error or malformed data occurs in a child component (e.g. invalid date parsing or unexpected API payload shape), the error boundary should display a graceful fallback error view with a "Reload Sanctuary" button.
- **Actual Behavior**: Any unhandled rendering exception crashes the entire React fiber tree, displaying a completely blank white screen to the user.
- **Recommended Solution**: Implement an `ErrorBoundary` component wrapping `<App />` in `main.tsx`.

---

### Finding FE-005: Form Labels Lack Semantic Input Associations
- **Severity**: LOW
- **Priority**: MEDIUM
- **Components**:
  - [`apps/web/src/components/public/BookingBar.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/public/BookingBar.tsx#L75-L100)
  - [`apps/web/src/pages/LoginPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/LoginPage.tsx#L67-L91)
  - [`apps/web/src/pages/RegisterPage.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/pages/RegisterPage.tsx#L53-L100)
- **Description**: Form inputs are rendered adjacent to `<label>` tags that lack `htmlFor` attributes, and the corresponding `<input>` elements lack matching `id` attributes.
- **Expected Behavior**: Clicking a label focuses the input; screen readers accurately associate the label with the input.
- **Actual Behavior**: Labels are purely visual text tags; screen readers may announce inputs without proper accessible names.
- **Recommended Solution**: Add unique `id` and `htmlFor` pairs or wrap `<input>` directly inside `<label>`.

---

## 3. Roomly Page-by-Page Audit Matrix

| Page / Feature Area | Implementation Status | Functional Quality | Observations & Findings |
| :--- | :---: | :---: | :--- |
| **Public Website** | | | |
| Homepage (`/`) | **PASS** | High | Hero, booking bar, story, suite cards, amenities, reviews render accurately. |
| Header Navigation | **PARTIAL** | Medium | Desktop navigation works; hash links `#story`/`#amenities` fail on subpages; no mobile drawer. |
| Footer | **PARTIAL** | Medium | Accreditations and branding render well; policy spans are non-interactive. |
| Room Listing (`/rooms`) | **PASS** | High | Dynamic inventory availability search and fallback catalog both operational. |
| Room Search / Filter Bar | **PASS** | High | Date validation enforces check-out > check-in; updates URL query parameters. |
| Price Filter Slider | **PASS** | Medium | Client-side slider filters suites; works smoothly. |
| Suite Sorting Controls | **NOT IMPLEMENTED** | None | No sort dropdown by price, size, or rating. |
| Suite Pagination | **NOT IMPLEMENTED** | None | Entire catalog rendered in single grid without pagination. |
| Suite Details Modal | **PASS** | High | Spec grid, amenities list, image carousel, and reserve CTA function properly. |
| Guest Registration (`/register`) | **PASS** | High | Form validation, password minimum length, and backend account creation work. |
| Guest Login (`/login`) | **PASS** | High | Credential authentication, cookie setting, and 1-click demo switcher function. |
| Password Recovery | **NOT IMPLEMENTED** | None | No "Forgot Password" UI or reset flow exists. |
| **Guest Dashboard** | | | |
| Guest Stays (`/dashboard`) | **PASS** | High | Displays confirmation code, hotel details, dates, settled price, and status badges. |
| Profile Editing | **NOT IMPLEMENTED** | None | No profile management or password change view. |
| Reservation Cancellation | **PASS** | High | Self-service cancellation with confirmation prompt and status update. |
| Refund Tracking | **NOT IMPLEMENTED** | None | No refund status tracking or timeline displayed. |
| Itinerary / Invoices | **PASS** | Medium | Itinerary view on `/confirmation/:id` with window.print() support. |
| In-App Notifications | **NOT IMPLEMENTED** | None | No notification bell or alerts interface. |
| **Staff Front Desk** | | | |
| Operations Overview (`/staff/dashboard`)| **PASS** | High | Real-time counts for arrivals, departures, occupancy, and cleaning queue. |
| Guest Search | **NOT IMPLEMENTED** | None | No search input by guest name or confirmation code. |
| Today's Arrivals Tab | **PASS** | High | Displays expected check-ins with "Process Check-In" action. |
| Physical Room Assignment | **PASS** | High | Check-in modal filters available physical rooms matching category. |
| Today's Departures Tab | **PASS** | High | Check-out action updates booking to CHECKED_OUT and dispatches cleaning. |
| Room Status Matrix | **PASS** | High | Displays color-coded physical room statuses across floors. |
| Guest Communications | **NOT IMPLEMENTED** | None | No guest messaging or concierge request system. |
| **Housekeeping Operations** | | | |
| Cleaning Board (`/staff/housekeeping`) | **PASS** | High | Displays priority cleaning queue and allows completing tasks. |
| Room Status Manual Override | **PASS** | High | Quick dropdown to update room to Clean, Dirty, or Maintenance. |
| Automatic Turnover Dispatch | **PASS** | High | Check-out automatically queues TURNOVER_CLEAN task for room. |
| **Hotel Management Dashboard** | | | |
| Management Suite (`/manager/dashboard`) | **PASS** | High | Revenue cards, ADR, RevPAR, and Recharts charts render cleanly. |
| Dynamic Inventory Grid | **PASS** | High | Interactive table allowing date-by-date allotment and rate overrides. |
| Batch Inventory Save | **PASS** | High | Submits batch updates to backend with success toast. |
| Staff Management | **NOT IMPLEMENTED** | None | No UI to add or manage hotel staff memberships. |
| Physical Room Management | **NOT IMPLEMENTED** | None | No UI to create or decommission physical hotel rooms. |
| **Platform Administration** | | | |
| Governance Suite (`/admin/dashboard`) | **PASS** | High | Global metric cards, database health liveness, and memory diagnostics. |
| Managed Hotel Directory | **PASS** | High | Lists all onboarded hotel properties with contact details. |
| Onboard New Property Modal | **PASS** | High | Form creates new hotel property with slug generation. |
| Security Audit Trail | **PASS** | High | Displays chronological audit log table with actor, action, and metadata. |
| User Management | **NOT IMPLEMENTED** | None | No user list, role modification, or account suspension interface. |

