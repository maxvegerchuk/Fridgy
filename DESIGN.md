---
name: Fridgy
description: Household kitchen management app — pantry, shopping lists, and recipes for families.
colors:
  primary: "#5CA547"
  primary-light: "#EAF5E6"
  primary-mid: "#C5E3BC"
  primary-deep: "#3D7A30"
  primary-darkest: "#2A5520"
  status-warning: "#F2C94C"
  status-warning-bg: "#FEF9E7"
  status-danger: "#E03B36"
  status-danger-bg: "#FEF0EF"
  canvas: "#F8FAF4"
  surface: "#FFFFFF"
  border: "#EEF1EA"
  border-mid: "#D8DDD3"
  text-muted: "#9BA395"
  text-secondary: "#5C6358"
  text-primary: "#2E3529"
  text-deep: "#1A2E1A"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "26px"
  body-large:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "23px"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  badge:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-primary-active:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "44px"
  button-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  button-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "52px"
    padding: "0 24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 16px"
  badge-green:
    backgroundColor: "{colors.primary-mid}"
    textColor: "{colors.primary-deep}"
    rounded: "9999px"
    height: "24px"
    padding: "0 10px"
  badge-warning:
    backgroundColor: "{colors.status-warning-bg}"
    textColor: "#D4A017"
    rounded: "9999px"
    height: "24px"
    padding: "0 10px"
  badge-danger:
    backgroundColor: "{colors.status-danger-bg}"
    textColor: "{colors.status-danger}"
    rounded: "9999px"
    height: "24px"
    padding: "0 10px"
---

# Design System: Fridgy

## 1. Overview

**Creative North Star: "The Farmers Market Receipt"**

Fridgy is a domestic tool, used in kitchens and grocery aisles by people who cook for their households. The interface should feel the way a good handwritten receipt looks: clean ruled structure, ink that doesn't bleed, just enough warmth from the paper to feel organic rather than clinical. It is not a tech product. It is not a commerce platform. It is the thing that helps you know what you have.

The dominant color in the neutral palette is not gray: it's a cultivated, pressed-leaf green, subtly tinting every surface from the app canvas (`#F8FAF4`) to the deepest text (`#1A2E1A`). This is intentional and non-negotiable. The tint is quiet but pervasive, and it makes the interface feel alive in a way no gray-based system can. The single saturated accent, a clear earthy green (`#5CA547`), earns its presence precisely because everything around it holds back.

Density is low. Information appears when it's needed, not to impress. The app is used one-handed in a bright supermarket, or standing at the counter before dinner. Speed of comprehension is the metric, not feature visibility.

**Key Characteristics:**
- Pressed-leaf green tints every neutral; no pure grays anywhere
- Single green accent; all other color is status-semantic (warning yellow, danger red)
- DM Sans for all headings, Inter for all body: the split is absolute
- Flat surfaces by default; shadows reserved for floating layers only
- Rounded-md (12px) as the universal shape; rounder only for pills and bottom sheets
- Phosphor icons in regular weight at rest, fill on active

## 2. Colors: The Pressed Leaf Palette

Every color in this system either grows from the same organic green root or serves a clear semantic role (warning, danger). There is no decorative accent spectrum.

### Primary
- **Field Green** (`#5CA547`): The single brand accent. Used on primary buttons, active tab indicators, focus rings, ingredient-available states, and pantry status dots. Never used decoratively. Its rarity is the signal.
- **Canopy** (`#3D7A30`): Deep green. Active states on Field Green surfaces, deep text on green backgrounds.
- **Grove** (`#2A5520`): Darkest green. Rarely used directly; serves as the dark anchor for green tonal ramps.

### Secondary
- **Pale Shoot** (`#EAF5E6`): The lightest green. Background tint for available-ingredient rows, success-adjacent callouts, any surface that needs a gentle green signal without color weight.
- **Young Leaf** (`#C5E3BC`): Badge background for positive/owner states. The green-tinted mid-surface.

### Neutral (Pressed Leaf family)
- **Deep Ink** (`#1A2E1A`): The darkest neutral. Page-level headings, maximum contrast text. Every neutral in this system is tinted toward this value, not toward pure black.
- **Dark Bark** (`#2E3529`): Primary text on light backgrounds. Body copy, list item names.
- **Sage Shadow** (`#5C6358`): Secondary text, labels, descriptions.
- **Stone Dust** (`#9BA395`): Muted text, placeholders, inactive tab labels.
- **Pale Border** (`#D8DDD3`): Input borders, mid-weight dividers.
- **Ghost Line** (`#EEF1EA`): Light dividers, header bottom borders, card borders.
- **Paper** (`#F8FAF4`): App canvas. The base layer every screen renders on.
- **White Surface** (`#FFFFFF`): Cards, sheets, input fills, header backgrounds.

### Semantic
- **Amber Warning** (`#F2C94C`) on **Cream** (`#FEF9E7`): Missing-ingredients badges, need-few recipe status.
- **Alert Red** (`#E03B36`) on **Blush** (`#FEF0EF`): Errors, danger states, missing-many recipe status.

### Named Rules
**The Pressed Leaf Rule.** No pure grays, ever. Every neutral is tinted toward `#1A2E1A` (hue ~134). If a color reads as gray under any ambient light, it's wrong. Recalibrate toward the green root.

**The One Voice Rule.** `#5CA547` (Field Green) is the only saturated color that appears outside of semantic status contexts. It occupies at most 10% of any given screen. Its scarcity is what makes it speak.

## 3. Typography

**Display Font:** DM Sans (warm geometric sans, fallback: system-ui, sans-serif)
**Body Font:** Inter (neutral humanist sans, fallback: system-ui, sans-serif)

**Character:** DM Sans leads all structural labels, page titles, section headers, and recipe names with authority and warmth. Inter handles all data-level text: quantities, ingredient names, descriptions, form fields. The split is absolute. Never use Inter for a heading; never use DM Sans for body copy. The contrast between their personalities creates hierarchy without needing font size alone.

### Hierarchy
- **Display** (800, 32px, lh 1.2, ls -0.02em): Splash screens and marketing surfaces only. Not used in the main app shell.
- **Headline** (800, 26px, lh 1.25, ls -0.01em): Page-level titles on auth screens. Rare in the app.
- **Title** (700, 22px, lh 26px): The dominant heading size for pantry, recipes, shopping list headers. DM Sans.
- **Heading 3** (700, 18px, lh 1.3): Section headers within pages, bottom sheet titles. DM Sans.
- **Body Large** (600, 17px, lh 1.5): Emphasized body content, button labels. Inter semibold.
- **Body** (400, 16px, lh 24px): Default form input text, descriptions. Inter regular.
- **Body Small** (400, 15px, lh 23px): The workhorse. Used on list item names, ingredient names, recipe card content. Inter regular.
- **Label / Caption** (600, 14px, lh 1.4): Form field labels, metadata. Inter semibold.
- **Badge** (700, 13px, lh 1): Status chips, category labels, tab bar labels. Inter bold, frequently uppercase.

### Named Rules
**The Hard Split Rule.** DM Sans is for headings (structural identity). Inter is for data (content). Mixing them within a single text hierarchy level is prohibited.

**The 16px Floor Rule.** All input and form text is forced to 16px via `style={{ fontSize: '16px' }}` to prevent iOS auto-zoom. Never override this for interactive fields.

## 4. Elevation

Fridgy uses flat surfaces by default. The kitchen-counter metaphor doesn't float things in the air; items rest on the surface. Shadows only appear when an element is genuinely floating above the layout: bottom sheets, drag handles, floating action buttons.

### Shadow Vocabulary
- **Ambient low** (`0 1px 2px rgba(0,0,0,0.05)`): Segment control's active segment. The gentlest possible lift, barely perceptible.
- **Ambient** (`0 2px 8px rgba(0,0,0,0.06)`): Cards, chips with elevation context. Still restrained.
- **Mid** (`0 4px 16px rgba(0,0,0,0.08)`): FABs, standalone floating elements.
- **Lift** (`0 8px 32px rgba(0,0,0,0.10)`): Bottom sheets. The most prominent shadow in the system; reserved for modal-layer surfaces that slide over the main canvas.

### Named Rules
**The Flat-By-Default Rule.** A list item has no shadow. A card in a scrollable feed has no shadow. A page header has no shadow. Depth is expressed through background color steps (White Surface over Paper), not elevation. Reach for a shadow only when the element genuinely floats.

## 5. Components

### Buttons
Confident at every size. Rounded-md (12px) on all variants; this radius never changes for buttons. The primary is unambiguous: Field Green fill, white label.

- **Shape:** Gently rounded (12px). No fully rounded pills; that's for filter chips.
- **Primary:** Field Green (`#5CA547`) fill, white text, 44px default height. Active state: Canopy (`#3D7A30`). Disabled: neutral-200 fill, neutral-400 text.
- **Secondary:** White fill, Pale Border (`#D8DDD3`) 1px stroke, Dark Bark text. Active: Paper background.
- **Ghost:** No background, no border. Dark Bark text, Paper active background.
- **Danger:** Alert Red (`#E03B36`) fill, white text. Active: red-700.
- **Sizes:** sm (36px), md (44px, default), lg (52px).
- **Loading state:** Animated spinner replaces label; button stays at full width.
- **Active animation:** `scale(0.95)` on press, `transition-transform` only. No layout animations.

### Filter Chips (FilterTabs)
Used for segmenting content lists: "All / Available / Missing" on Recipes, "All / Categories" on Pantry.

- **Shape:** Full-pill (rounded-full). This is the only place in the app where shape intentionally contrasts with button radius.
- **Active:** Field Green fill, white text.
- **Inactive:** Paper fill (`#EEF1EA`), Sage Shadow text.
- **Height:** 36px minimum. Never shorter.
- **Count badge:** Appears inline to the right of the label, in lighter text (green-100 on active, neutral-400 on inactive).

### Segment Control
Used for top-level page tab switching (Mine / Explore on Recipes).

- **Container:** Ghost Line background (`#EEF1EA`), 4px padding, 12px radius.
- **Active segment:** White Surface, Ambient Low shadow, 10px radius. Dark Bark text.
- **Inactive:** Transparent, Sage Shadow text.
- **Animation:** `scale(0.95)` on press.

### Inputs / Fields
- **Style:** White Surface fill, Pale Border stroke (1px, `#D8DDD3`), 12px radius, 44px height.
- **Focus:** 2px Field Green ring (`#5CA547`), border becomes transparent.
- **Error state:** Alert Red border (`#E03B36`), red error message below in badge text.
- **Placeholder:** Stone Dust (`#9BA395`).
- **Font size:** Locked at 16px regardless of context (prevents iOS zoom).
- **Labels:** Caption size (14px, 600 weight, Inter), 6px gap above input.

### Badges
Inline status indicators on member roles, recipe availability, ingredient states. Always pill-shaped.

- **Green (positive/owner):** Young Leaf background (`#C5E3BC`), Canopy text (`#3D7A30`).
- **Warning:** Cream background (`#FEF9E7`), Amber text (`#D4A017`).
- **Danger:** Blush background (`#FEF0EF`), Alert Red text (`#E03B36`).
- **Neutral:** Ghost Line background (`#EEF1EA`), Sage Shadow text (`#5C6358`).
- **Size:** 24px height, 10px horizontal padding, 13px/700 Inter.

### Bottom Sheet
The primary modal surface. Slides up from the bottom. Used for add-item, edit-quantity, add-member, ingredient selection.

- **Shape:** 20px radius on top corners only. Full-width. Max height 90vh.
- **Drag handle:** 40px wide, 4px tall, Pale Border (`#D8DDD3`), centered at top, 12px vertical padding.
- **Background:** White Surface.
- **Shadow:** Lift shadow (`0 8px 32px rgba(0,0,0,0.10)`).
- **Backdrop:** `neutral-900/50` overlay behind the sheet.
- **Title row:** h3 (18px/700, DM Sans), bottom-bordered, 16px side padding.
- **Content:** Scrollable area with 16px horizontal padding.

### Navigation (Tab Bar)
Four tabs: List, Pantry, Recipes, Profile. Fixed to bottom, extends below safe area.

- **Height:** 56px + safe area inset.
- **Active:** Field Green (`#5CA547`), Phosphor icon at fill weight, Badge text below.
- **Inactive:** Stone Dust (`#9BA395`), Phosphor icon at regular weight.
- **Background:** White Surface. 1px top border in Ghost Line (`#EEF1EA`).
- **Transition:** No animation. State is instant.

### Page Header (Signature Component)
Every app page uses a fixed header with consistent structure. The header background extends behind the iOS status bar.

- **Height:** 80px content area + `env(safe-area-inset-top)` padding.
- **Outer wrapper:** White Surface fill, Ghost Line bottom border, `paddingTop: env(safe-area-inset-top)`.
- **Inner row:** 80px tall, 16px horizontal padding.
- **Back button:** 40x40px tap target, `p-1 -ml-1` alignment, CaretLeft icon (24px).
- **Action icons:** 40x40px tap targets, rounded-md active background.
- **Sub-pages:** Same structure but 56px inner height instead of 80px.

## 6. Do's and Don'ts

### Do:
- **Do** use Field Green (`#5CA547`) exclusively for primary actions, active states, and positive status. Its rarity is the signal.
- **Do** tint every neutral toward green. `#1A2E1A` is the dark anchor; use `#F8FAF4` (not white) as the app canvas.
- **Do** use DM Sans for all structural headings and Inter for all body/data text. The split is hard.
- **Do** keep surfaces flat at rest. Apply shadows only to floating layers: bottom sheets, FABs, elevated segments.
- **Do** use Phosphor icons in regular weight by default, fill weight only when active or selected.
- **Do** lock all input `font-size` to 16px to prevent iOS auto-zoom.
- **Do** use rounded-md (12px) for all interactive controls. Use rounded-full only for filter chips and badges.
- **Do** follow the page header pattern on every screen: outer wrapper with safe-area padding, fixed-height inner row.
- **Do** make all tap targets a minimum 40x40px, even when the visible icon is smaller.

### Don't:
- **Don't** use generic SaaS patterns: purple or blue accent colors, gradient fills on interactive elements, hero metric dashboards, feature-announcement UI. Fridgy is a household tool.
- **Don't** use meal-kit or commerce energy: loud product photography overlays, promotional urgency, heavy call-to-action stacking. The user is managing their kitchen, not buying something.
- **Don't** use fitness app patterns: calorie-bar metaphors, streak indicators, clinical white-and-green with judgment-forward metrics. Food here is pleasure and practicality.
- **Don't** add a side-stripe colored border to any list item, card, or callout. Never `border-left > 1px` as a colored accent.
- **Don't** use gradient text (`background-clip: text` + gradient). Emphasis is weight and size only.
- **Don't** reach for a modal when a bottom sheet or inline pattern exists. The BottomSheet component handles all transient actions.
- **Don't** use pure `#000000` or `#FFFFFF`. The darkest text is `#1A2E1A`; the lightest surface is `#FFFFFF` (surface only, not text or decorative elements).
- **Don't** add DM Sans to body copy paragraphs or data fields. Inter owns all content; DM Sans owns all chrome.
- **Don't** use identical card grids: same-sized cards with icon + heading + text repeated in a uniform grid. Recipe cards vary in visual weight based on image presence and status.
- **Don't** animate layout properties (height, width, margin, padding). Transitions are `transform` and `opacity` only.
