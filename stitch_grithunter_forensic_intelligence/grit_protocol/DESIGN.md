```markdown
# Design System Document: Forensic Precision

## 1. Overview & Creative North Star: "The Forensic Console"
The core philosophy of this design system is **The Forensic Console**. We are moving away from the soft, friendly aesthetics of traditional HR-tech and toward the cold, high-stakes precision of a laboratory environment. This system is designed for power users who demand lightning-fast data processing and an authoritative interface that feels like a specialized instrument rather than a generic marketplace.

To break the "template" look, we employ **Intentional Asymmetry** and **Rigid Geometry**. By utilizing a strictly 0px border-radius scale, we create a sense of structural integrity. Information is not "presented"; it is "interrogated." We achieve depth through tonal layering and surgical light sources rather than traditional skeuomorphic shadows.

---

## 2. Colors: Surgical Accents & Deep Slate
The palette is rooted in the void—a deep, charcoal environment (`#0B0E14`) where data is brought into focus through high-contrast typography and piercing accent colors.

### The Palette
- **Primary (Grit Green):** `#00FF41`. Used for "Positive Markers"—qualified candidates, verified skills, and successful builds.
- **Secondary (Warning Amber):** `#FFB800`. Used exclusively for "AI-Slop Flags" and technical inconsistencies.
- **Background/Surface:** The `surface_dim` (`#10131a`) and `surface_container_lowest` (`#0b0e14`) provide the base for the "Dark Room" effect.

### The "No-Line" Rule
Prohibit the use of 1px solid borders for sectioning. Boundaries must be defined through background color shifts. For instance, a technical profile section should utilize `surface_container_low` against a `surface` background. The change in tone is the boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Level:** `surface`
- **Main Content Areas:** `surface_container_low`
- **Interactive Technical Modules:** `surface_container_high`
- **Floating Overlays:** `surface_container_highest` with a 15% opacity `outline` Ghost Border.

### The "Glass & Gradient" Rule
To prevent the dark theme from feeling "flat," use subtle radial gradients on main surfaces. A faint glow of `primary_container` (`#00FF41`) at 5% opacity in the top-left corner of a container mimics the light from a terminal screen, providing a "visual soul."

---

## 3. Typography: Technical Authority
We pair the utilitarian clarity of **Inter** with the structural personality of **Space Grotesk**. For technical evidence (code, git logs, raw data), use **JetBrains Mono**.

- **Display & Headlines:** Use `display-lg` (Space Grotesk, 3.5rem) to anchor views. The high-contrast scale between a massive display title and small, dense data points creates an editorial "Pro-Level" feel.
- **UI Controls:** Use `label-md` (Space Grotesk, 0.75rem). The slightly geometric nature of Space Grotesk ensures that even at small sizes, the UI feels engineered.
- **The Evidence Layer:** All technical data must be rendered in Monospace. This signals to the user that they are looking at "raw" truths, not marketing summaries.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are forbidden. They are too "soft" for a forensic lab.

- **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_highest` card on a `surface_container_low` background to create a "Natural Lift."
- **Ambient Glows:** When a "floating" effect is required (e.g., a critical alert), use an ambient glow. The shadow must be the color of the accent (e.g., `primary_fixed_dim` at 10% opacity) with a large 32px blur. It should look like light emitting from a screen, not a shadow cast by a sun.
- **The Ghost Border:** If a container requires a hard edge for accessibility, use the `outline_variant` token at 20% opacity. This "Ghost Border" provides a hint of structure without cluttering the visual field.
- **Glassmorphism:** For dropdowns and technical overlays, use `surface_container_highest` with a `backdrop-filter: blur(12px)`. This keeps the "Forensic" context visible beneath the active operation.

---

## 5. Components: Engineered Utility

### Buttons (90-Degree Precision)
- **Primary:** Background `#00FF41`, Text `#003907`. 0px radius. Use a `1px` inner glow on hover to simulate a physical backlit key.
- **Secondary:** Transparent background, `outline` Ghost Border. 
- **States:** On `:active`, the button should "flicker" briefly—a 50ms opacity shift to mimic technical hardware response.

### Technical Input Fields
- **Style:** Underline only, using `outline_variant`. The label should be in `label-sm` (Space Grotesk), positioned in the top-left, resembling a data-entry terminal prompt (`> NAME_`).
- **Error State:** Shift the underline to `error` (`#ffb4ab`) and add a subtle 2px glow.

### The "Evidence Card"
Forbid divider lines. Use vertical white space (16px, 24px) to separate candidate attributes. 
- **Header:** `title-sm` (Inter, Bold).
- **Metadata:** `label-sm` (Space Grotesk) in `on_surface_variant`.
- **Background:** `surface_container_low`.

### Logic Chips
Small, rectangular tags with 0px radius. 
- **Positive Marker:** `primary_container` background with `on_primary_container` text.
- **AI-Slop Warning:** `secondary_container` background with `on_secondary_container` text.

### The "Scan-Line" Loader
Instead of a spinning circle, use a horizontal "Scan-Line"—a `primary` color line that moves vertically across the container, mimicking a document scanner or a radar sweep.

---

## 6. Do's and Don'ts

### Do:
- **Prioritize Density:** If you can fit more relevant data into a view without sacrificing legibility, do it. This is a tool for experts.
- **Use Monospacing for Values:** Any number or technical ID should be monospaced to ensure alignment in data columns.
- **Embrace the Void:** Use the deepest background (`#0B0E14`) to make the "Grit Green" pop with clinical intensity.

### Don't:
- **No Rounded Corners:** Never use `border-radius`. A single 4px corner will break the forensic aesthetic.
- **No HR-Tech Fluff:** Avoid "Hello, User!" or celebratory animations. The tone is "Data Found," not "Great job!"
- **No High-Contrast Borders:** Never use a 100% opaque white or grey border. Use tonal shifts or Ghost Borders only.
- **No Standard Shadows:** Avoid generic CSS `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`. It is too soft and "web-standard."

---

## 7. Signature Interaction: The "Surgical Hover"
When a user hovers over a data point or candidate row, do not just change the background color. Apply a subtle `primary` glow to the text and display a "Technical Trace"—a 1px vertical line of `primary_fixed` on the far left edge of the screen, indicating the current line of interrogation. High-end, precise, and authoritative.```