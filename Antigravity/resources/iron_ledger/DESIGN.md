# Design System Document: The Kinetic Precision Framework

## 1. Overview & Creative North Star: "The Performance Atelier"
This design system moves away from the "cluttered spreadsheet" aesthetic typical of administrative tools. Instead, it adopts the **Performance Atelier** philosophy: a high-end, editorial approach to gym management. It treats data like a luxury fitness magazine—spacious, authoritative, and surgically precise.

We break the "template" look by utilizing **intentional asymmetry** and **tonal layering**. Large-scale typography serves as a structural element, while negative space is treated as a functional tool to reduce cognitive load for high-stakes administrative tasks. This is not just a dashboard; it is a premium command center.

---

### 2. Colors: The Depth of Professionalism
The palette focuses on deep, "Atmospheric Navys" and "Vibrant Kinetic Accents."

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. We define boundaries through background shifts. For example, a `surface-container-low` data table should sit on a `surface` background. The eye perceives the edge through the shift in value, not a rigid stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine paper.
    *   **Base:** `surface` (#f9f9ff)
    *   **Sectioning:** `surface-container-low` (#f0f3ff)
    *   **Primary Work Cards:** `surface-container-lowest` (#ffffff) for maximum "pop."
*   **The Glass & Gradient Rule:** For floating navigation or "Quick Action" overlays, use `surface` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** Use a subtle linear gradient from `primary` (#000000) to `primary-container` (#00174b) for main CTA buttons to give them a weighted, metallic "equipment" feel.

---

### 3. Typography: Editorial Authority
We use **Inter** as our sole typeface, relying on extreme scale and weight contrast to create hierarchy.

*   **Display (Large Data Points):** Use `display-lg` (3.5rem) for critical metrics like "Monthly Revenue." It should feel heroic and undeniable.
*   **Headlines (Section Labels):** `headline-sm` (1.5rem) uses tighter letter-spacing (-0.02em) to look modern and "compressed."
*   **The Label/Body Contrast:** Use `label-md` (0.75rem) in all-caps with increased letter-spacing (+0.05em) for table headers, paired with `body-md` (0.875rem) for the data itself. This creates a clear "Metadata vs. Data" distinction.

---

### 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "software-generic." We use **Ambient Depth**.

*   **The Layering Principle:** Place a `surface-container-highest` element behind a `surface-container-lowest` element to create a natural "lift" without a single shadow.
*   **Ambient Shadows:** If a card *must* float (e.g., a modal), use a highly diffused shadow: `box-shadow: 0 20px 40px rgba(17, 28, 45, 0.06)`. The tint is derived from `on-surface`, making it feel like a natural shadow cast in a brightly lit gym studio.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use `outline-variant` (#c6c6cd) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use for sidebars to allow the "vibrant accent" colors of the background to subtly bleed through, keeping the dark UI from feeling heavy or "closed in."

---

### 5. Components: Precision Primitives

*   **Buttons:**
    *   *Primary:* Solid `primary` (#000000) with `on-primary` (#ffffff) text. Use `md` (0.375rem) roundedness.
    *   *Kinetic Action:* For "Add Member" or "Start Session," use `surface-tint` (#0053db) to draw the eye.
*   **Data Cards:** Forbidden use of divider lines. Separate "Member Name" from "Plan Status" using `12` (2.75rem) of vertical spacing.
*   **Chips:** 
    *   *Status:* Use `tertiary-fixed` (#ffddb8) for "Pending" and `error_container` (#ffdad6) for "Overdue." These must be pill-shaped (`full` roundedness).
*   **Input Fields:** Ghost-style inputs. No background, only a bottom stroke using `outline-variant` at 20%. Upon focus, transition the background to `surface-container-high`.
*   **Gym-Specific Components:**
    *   *Capacity Meter:* A horizontal bar using a gradient from `surface-container-highest` to `on-tertiary-container` (#b87500) to show real-time gym occupancy.
    *   *Metric Strips:* Ultra-thin, full-width rows with `1.5` (0.3rem) padding, using `surface-container-low` hover states for interactivity.

---

### 6. Do’s and Don’ts

**Do:**
*   **Do** use `20` (4.5rem) spacing between major layout blocks to let the data "breathe."
*   **Do** use `on-surface-variant` (#45464d) for secondary information to maintain high-contrast legibility without visual noise.
*   **Do** align all numerical data to the right in tables to ensure "ragged-right" editorial cleanliness.

**Don’t:**
*   **Don't** use pure hex #000000 for text; use `on-background` (#111c2d) to keep the "Deep Blue" DNA alive.
*   **Don't** use traditional "Card-on-Grey-Background" patterns. Use `surface` as your canvas and `surface-container` tiers as your shapes.
*   **Don't** use icons without labels for primary navigation. In an admin context, clarity is the highest form of luxury.

---

### 7. Layout Strategy: The Power Grid
The dashboard should feel like a high-end magazine spread. Use a 12-column grid, but purposefully leave the first 2 columns empty in certain sections to create a "white space gutter" that draws the eye toward the center content. This "asymmetric breathing room" is the hallmark of a custom, premium experience.