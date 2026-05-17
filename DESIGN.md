---
name: Bajet Buddy Design System
colors:
  surface: '#fffaf4'
  surface-dim: '#ead8c2'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff4e8'
  surface-container: '#f7efe6'
  surface-container-high: '#f5e6d6'
  surface-container-highest: '#ead8c2'
  on-surface: '#1c1917'
  on-surface-variant: '#57504a'
  inverse-surface: '#1c140c'
  inverse-on-surface: '#fff4e8'
  outline: '#9a8268'
  outline-variant: '#ead8c2'
  surface-tint: '#ba6200'
  primary: '#ba6200'
  on-primary: '#ffffff'
  primary-container: '#fff4e8'
  on-primary-container: '#2f1400'
  inverse-primary: '#fcd9b6'
  secondary: '#944e00'
  on-secondary: '#ffffff'
  secondary-container: '#f5e6d6'
  on-secondary-container: '#2f1400'
  tertiary: '#d97706'
  on-tertiary: '#ffffff'
  tertiary-container: '#b35e00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1c0062'
  on-primary-fixed-variant: '#4816cb'
  secondary-fixed: '#c2e8ff'
  secondary-fixed-dim: '#75d1ff'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d67'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#ffb780'
  on-tertiary-fixed: '#2f1400'
  on-tertiary-fixed-variant: '#6f3800'
  background: '#fffaf4'
  on-background: '#1c1917'
  surface-variant: '#f5e6d6'
typography:
  display-lg:
    fontFamily: Fredoka
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
  headline-lg:
    fontFamily: Fredoka
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: Fredoka
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.5px
  stats-xl:
    fontFamily: Fredoka
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 52px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is built to transform the often-daunting task of personal finance into a delightful, gamified adventure. It draws inspiration from modern ed-tech apps, prioritizing a "bouncy" and approachable feel that encourages daily engagement. 

The aesthetic is a high-contrast blend of **Tactile Modernism** and **Retro Pixel Art**. While the core interface uses smooth, rounded surfaces and 3D "squishy" effects, the soul of the product—the squirrel mascot—is rendered in a nostalgic pixel-art style. This contrast creates a unique brand identity that feels both technologically current and emotionally grounded. 

The personality is helpful, encouraging, and vibrant, aimed at making users feel like they are "leveling up" their financial health rather than just tracking expenses.

## Colors

The palette is now anchored on **#BA6200** as the product colour. Brand orange drives primary actions, progress, charts, active navigation, focus states, and high-value surfaces.

- **Primary & Secondary:** #BA6200 and #944E00 define the interface identity, supported by warm cream surfaces (#FFF4E8, #F5E6D6).
- **Functional Colors:** Red remains reserved for true danger or overspend states. Amber remains for warnings. Avoid blue, purple, and green as generic accents unless they carry a deliberate semantic meaning.
- **Mascot Special Colors:** Parchment and warm-orange surfaces should sit inside the same brand family so mascot and finance UI feel connected.
- **Dark Mode:** Dark surfaces use warm near-black (#1C140C) with brand-orange highlights rather than navy or purple undertones.

## Typography

This design system utilizes a dual-font approach to balance playfulness with readability.

- **Fredoka:** Used for all headings, large numbers, and currency displays. Its rounded terminals match the "squishy" UI components and reinforce the friendly brand voice.
- **Nunito Sans:** Used for body copy, descriptions, and labels. It provides excellent legibility at smaller sizes while maintaining a slightly rounded, approachable character that complements Fredoka.
- **Currency & Numbers:** Financial figures should always use Fredoka to emphasize the "game score" aspect of budgeting.

## Layout & Spacing

The layout is built on a **4px base grid** with a fluid columns approach. 

- **Mobile First:** A 4-column grid with 20px margins is the standard.
- **Pacing:** Use generous "breathable" margins (24px+) between different card sections to avoid a cluttered "finance spreadsheet" look. 
- **Grouping:** Elements within a card should use tight 8px or 12px spacing, while the cards themselves are separated by 16px or 24px to create clear visual buckets.

## Elevation & Depth

This design system rejects traditional soft shadows in favor of a **Tactile/Chunky** approach.

- **3D Press Effect:** Components like buttons and interactive cards feature a 4px solid bottom shadow (the "lip"). This creates a physical depth that "flattens" when pressed, mimicking a mechanical button.
- **Depth Layers:** Background surfaces use a very subtle inner-glow or "soft plastic" gradient rather than drop shadows.
- **Glassmorphism:** Use sparingly for navigation bars or overlays to maintain context, using a high-blur (20px) and a subtle white border.
- **Mascot Cards:** These use a double-border technique (a thick outer border with a thin inner inset) to mimic the look of physical trading cards.

## Shapes

The shape language is consistently ultra-rounded to evoke a "soft" and "safe" emotional response.

- **Cards:** Use a 24px radius for large containers.
- **Buttons:** Use a 16px radius.
- **Pixel Art Exception:** While the UI is rounded, the mascot and its immediate decorative icons remain pixelated. The containers holding these pixel assets should still follow the rounded UI rules, creating a "frame" for the retro art.

## Components

### Buttons
Buttons are the primary tactile element. They must have a **4px solid bottom border** (darker shade of the button color). On `:active` states, the button should translate 2px downwards, and the border height should decrease to 2px, simulating a physical press.

### Mascot Cards
Special "Parchment" cards used for the squirrel mascot. They feature a #F5E6C8 background, a 2px solid #C8964A border, and a secondary inner border with a 4px offset. The title within these cards should be center-aligned in Fredoka.

### Progress Bars
Thick (12px-16px height), highly rounded bars. The "fill" should have a subtle glossy top-half gradient to look like a liquid or plastic tube.

### Input Fields
Large, pill-shaped or highly rounded boxes with a subtle 2px inset border. Focus states should use #BA6200 with a soft outer stroke.

### Chips/Badges
Small, chunky labels with high-contrast backgrounds. Use for categories like "Food," "Transport," or "Rent." These do not need the 3D shadow unless they are clickable.
