# Roomly UI/UX, Luxury Aesthetic & Accessibility Audit

## 1. Aesthetic Identity & Editorial Evaluation

Roomly targets a **Luxury Editorial** design language inspired by premier architectural publications, high-end hospitality portfolios, and private sanctuary estates.

### Palette Adherence Review

| Design Token | Spec Value | Implemented Value | Visual Impression & Usage |
| :--- | :---: | :---: | :--- |
| **Warm Ivory** | `#F7F3EC` | `#F7F3EC` (`--color-warm-ivory`) | **EXCELLENT**. Creates a soothing, tactile editorial background that evokes high-grade paper stock. |
| **Deep Charcoal** | `#24231F` | `#24231F` (`--color-deep-charcoal`) | **EXCELLENT**. Rich, warm near-black providing authoritative typographic contrast. |
| **Champagne Gold**| `#B69A68` | `#B69A68` (`--color-champagne-gold`)| **GOOD AESTHETIC / FAILS WCAG**. Elegant metallic accent, but fails contrast ratios on white. |
| **Sandstone** | `#E6DED2` | `#E6DED2` (`--color-sandstone`) | **EXCELLENT**. Subtle dividers and secondary borders. |
| **Muted Olive** | `#737866` | `#737866` (`--color-muted-olive`) | **EXCELLENT**. Used tastefully for Housekeeping and natural wellness accents. |

### Typography Hierarchy

- **Editorial Serif**: *Cormorant Garamond* (Weights: 300, 400, 500, 600). Applied to headings (`h1` through `h4`), prices, and brand logo. Conveys bespoke European heritage.
- **UI Sans**: *Inter* (Weights: 300, 400, 500, 600, 700). Applied to body copy, specs, buttons, and tables. Clean and legible.
- **Letter Spacing**: Generous tracking (`0.15em` to `0.3em`) on uppercase category pre-headers reinforces the luxury magazine feel.

---

## 2. Responsive Viewport Testing

The application layout was inspected across 7 representative screen viewports:

| Viewport Width | Device Category | Responsive Behavior | Identified Defects |
| :---: | :--- | :---: | :--- |
| **320px** | Small Mobile (iPhone SE) | **POOR** | Header navigation overflows horizontally; action buttons collide; booking bar inputs stack awkwardly. |
| **375px** | Standard Mobile (iPhone 13/14) | **POOR** | Header lacks mobile hamburger menu; nav links push off-screen. |
| **430px** | Large Mobile (iPhone 14 Pro Max) | **FAIR** | Cards stack well; checkout form legible; header navigation still clipped. |
| **768px** | Tablet (iPad Portrait) | **GOOD** | 2-column card layouts render attractively; table wrappers scroll horizontally. |
| **1024px** | Laptop / Small Desktop | **EXCELLENT** | Grid systems expand naturally; spacing proportional. |
| **1440px** | Standard Desktop | **EXCELLENT** | Maximum container width (`1280px`) centers content with generous margins. |
| **1920px** | Large Desktop / Ultrawide | **EXCELLENT** | No container stretching; typography clamp values prevent oversized headings. |

### Finding UIX-001: Mobile Navigation Drawer Missing on Viewports < 768px
- **Severity**: MEDIUM
- **Priority**: HIGH
- **Component**: [`apps/web/src/components/common/Header.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/common/Header.tsx#L42-L181)
- **Description**: The header implements desktop navigation `<nav style={{ display: 'flex', gap: '32px' }}>` with no media query or hamburger toggle.
- **Impact**: On viewports below 768px, navigation links collide with the brand logo and button group, overflowing the screen horizontally and breaking mobile layouts.
- **Recommendation**: Implement a responsive mobile drawer menu triggered by a hamburger icon (`Menu` from `lucide-react`) for screens `<= 768px`.

---

## 3. Accessibility Audit (WCAG 2.2 AA Compliance)

### Finding UIX-002: Insufficient Color Contrast on Champagne Gold Accent
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Criterion**: WCAG 2.2 Level AA – 1.4.3 Contrast (Minimum)
- **Components**:
  - Buttons with `.btn-gold`: White text (`#FFFFFF`) on Champagne Gold (`#B69A68`)
  - Accent text: Champagne Gold (`#B69A68`) on Warm Ivory (`#F7F3EC`) or White (`#FFFFFF`)
- **Measurement**:
  - `#FFFFFF` on `#B69A68`: **2.52:1** (Required: **4.5:1** for normal text, **3.0:1** for large text)
  - `#B69A68` on `#FFFFFF`: **2.52:1**
- **Impact**: Guests with low vision or viewing in bright outdoor sunlight will struggle to read gold button labels, category headers, and badge indicators.
- **Recommendation**:
  Use Deep Charcoal (`#24231F`) text on Champagne Gold buttons:
  - `#24231F` on `#B69A68`: **5.81:1** (**PASSES WCAG AAA**).
  - For standalone text accents on white, darken gold to `#8C6E3D` (4.6:1 ratio).

---

### Finding UIX-003: Keyboard Focus Indicators Removed Globally Without Focus-Visible Rings
- **Severity**: LOW
- **Priority**: MEDIUM
- **Criterion**: WCAG 2.2 Level AA – 2.4.7 Focus Visible
- **Component**: [`apps/web/src/styles/luxury.css`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/styles/luxury.css#L85)
- **Description**:
  `.btn { outline: none; }` strips native browser focus rings from all button elements, but no `:focus-visible` pseudo-class is declared.
- **Impact**: Keyboard-only users navigating via `Tab` receive zero visual indication of which button currently holds focus.
- **Recommendation**:
  ```css
  .btn:focus-visible {
    outline: 2px solid var(--color-champagne-gold);
    outline-offset: 3px;
  }
  ```

---

### Finding UIX-004: Unlabeled Gallery Pagination Dots in Suite Modal
- **Severity**: LOW
- **Priority**: LOW
- **Criterion**: WCAG 2.2 Level AA – 4.1.2 Name, Role, Value
- **Component**: [`apps/web/src/components/public/RoomDetailsModal.tsx`](file:///c:/Users/bs162/Desktop/Roomly/apps/web/src/components/public/RoomDetailsModal.tsx#L118-L130)
- **Description**: Image switch buttons in the modal carousel are rendered as empty `<button>` elements with no `aria-label` or inner text.
- **Impact**: Screen readers announce "Button" with no context as to what the button controls.
- **Recommendation**: Add `aria-label={`View photo ${idx + 1} of ${images.length}`}`.

---

## 4. UX & Guest Booking Journey Usability

### Strengths
1. **Editorial Room Cards**: Showcase suite imagery, view type, square footage, bed configuration, and inclusive amenities cleanly without cognitive clutter.
2. **Transparent Price Breakdown**: Displays base nightly rate, calculated taxes, and clear totals prior to payment commitment.
3. **15-Minute Hold Countdown**: The timer banner in checkout creates reassuring clarity regarding temporary inventory reservation.
4. **Printable Itinerary Dossier**: Clean confirmation screen with immediate print option for travel documents.

### Areas for Improvement
1. **Property Discovery**: Currently, the homepage showcases only the first hotel. A multi-property destination switcher would enhance platform scalability.
2. **Interactive Maps**: Embed a styled grayscale or sepia Leaflet / Mapbox map on property details to allow guests to explore nearby beaches and Michelin restaurants.
3. **Password Visibility Toggle**: Add an eye icon toggle to password fields on login and registration pages.

