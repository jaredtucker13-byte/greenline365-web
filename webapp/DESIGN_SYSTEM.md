# GreenLine365 Futuristic OS Design System

## 🎯 Design Vision

GreenLine365 is being transformed into a **futuristic operating system for local businesses**. The design language draws inspiration from high-tech control centers, command interfaces, and modern OS design with:

- **Dark, high-contrast aesthetic** with deep backgrounds
- **Neon green accents** as the primary brand color
- **Glassmorphism** for depth and layering
- **Smooth animations** that make the interface feel alive
- **OS-inspired UI patterns** (panels, modules, system notifications)

---

## 🎨 Color Palette

### Primary Colors

#### Neon Green (Primary Accent)
- **Primary:** `#00FF00` - Use for CTAs, active states, key highlights
- **Variations:** 
  - Light: `#33FF33`, `#66FF66`
  - Dark: `#00CC00`, `#009900`
- **Usage:** Primary buttons, active navigation items, important headings, success states

#### Neon Teal/Cyan (Secondary Accent)
- **Primary:** `#00FFFF`
- **Variations:**
  - Light: `#33FFFF`, `#66FFFF`
  - Dark: `#00CCCC`, `#009999`
- **Usage:** Secondary elements, supporting graphics, data visualization, hover states

#### Neon Amber/Orange (Warning/Live States)
- **Primary:** `#FF9500`
- **Usage:** Warnings, live indicators, urgent notifications, "hot" features

### Background Colors

#### OS Dark
- **Base:** `#0A0A0A` - Primary background
- **Variations:**
  - Pure Black: `#000000` - For maximum contrast
  - Charcoal: `#1A1A1A` - For layered panels
  - Dark Gray: `#252525` - For hover states

### Neutral Colors

- **White:** `#FFFFFF` - Primary text
- **White 80%:** `rgba(255, 255, 255, 0.8)` - Body text
- **White 60%:** `rgba(255, 255, 255, 0.6)` - Secondary text
- **White 40%:** `rgba(255, 255, 255, 0.4)` - Disabled text
- **White 10%:** `rgba(255, 255, 255, 0.1)` - Borders, dividers

---

## 🔮 Glassmorphism System

Glassmorphism creates the illusion of frosted glass panels floating above the background.

### Standard Glass (`.glass`)
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 1rem;
```
**Usage:** Cards, panels, modals

### Strong Glass (`.glass-strong`)
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.15);
```
**Usage:** Navigation bars, important panels, overlays

### Green Glass (`.glass-green`)
```css
background: rgba(0, 255, 0, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(0, 255, 0, 0.2);
```
**Usage:** Success notifications, featured cards, active states

### Teal Glass (`.glass-teal`)
```css
background: rgba(0, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(0, 255, 255, 0.2);
```
**Usage:** Secondary features, data displays, info notifications

### OS Panel (`.os-panel`)
Special panel with top neon accent line:
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 
  0 8px 32px rgba(0, 0, 0, 0.37),
  inset 0 1px 0 rgba(255, 255, 255, 0.05);
```
Plus a gradient top border for that "system interface" look.

---

## 🔘 Button System

### Primary Buttons (`.btn-primary`)
**Style:**
- Pill-shaped (`border-radius: 9999px`)
- Neon green gradient background
- Black text for contrast
- Inner glow + drop shadow
- Hover: Lift effect (`translateY(-2px)`)
- Active: Press effect (`translateY(0)`)

**Usage:** Main CTAs, primary actions, "Start Your Engine", "Get Started", "Book Demo"

**Code Example:**
```jsx
<Button variant="primary" size="lg">
  Start Your Engine
</Button>
```

### Secondary Buttons (`.btn-secondary`)
**Style:**
- Pill-shaped
- Transparent background
- Neon green border (2px, 50% opacity)
- Neon green text
- Backdrop blur
- Hover: Fill with green tint, border brightens

**Usage:** Secondary actions, "Learn More", "View Details"

**Code Example:**
```jsx
<Button variant="secondary" size="md">
  Learn More
</Button>
```

### Ghost Buttons (`.btn-ghost`)
**Style:**
- Rounded rectangle (12px radius)
- Subtle glass background
- White text
- Minimal border
- Hover: Slight background brightening

**Usage:** Tertiary actions, navigation links, cancel buttons

---

## ✏️ Typography System

### Font Families

#### Display Font: **Poppins**
- **Weights:** 400 (Regular), 600 (Semibold), 700 (Bold), 800 (Extra Bold)
- **Usage:** All headings (H1-H6), CTAs, important labels
- **Characteristics:** Rounded, modern, tech-forward

#### Body Font: **Inter**
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold)
- **Usage:** Body text, paragraphs, UI elements, descriptions
- **Characteristics:** Clean, highly readable, professional

### Hierarchy

#### H1 (Hero Headlines)
```css
font-family: 'Poppins';
font-weight: 700 (Bold);
font-size: 
  - Mobile: 2.5rem (40px)
  - Tablet: 3.5rem (56px)
  - Desktop: 4rem (64px)
color: white
```
**Usage:** Main page headlines, hero sections

#### H2 (Section Headers)
```css
font-family: 'Poppins';
font-weight: 700;
font-size:
  - Mobile: 2rem (32px)
  - Desktop: 3rem (48px)
color: white
```

#### H3 (Subsection Headers)
```css
font-family: 'Poppins';
font-weight: 600;
font-size: 1.5rem (24px)
color: white
```

#### Body Text
```css
font-family: 'Inter';
font-weight: 400;
font-size: 1rem (16px)
line-height: 1.75 (28px)
color: rgba(255, 255, 255, 0.8)
```

#### Small Text
```css
font-family: 'Inter';
font-size: 0.875rem (14px)
color: rgba(255, 255, 255, 0.6)
```

### Neon Text Accents

Use `<NeonText>` component to highlight key words in headings:

```jsx
<h1>
  The Operating System for <NeonText variant="green">Local Business</NeonText>
</h1>
```

**Variants:**
- `green` - Solid neon green
- `teal` - Solid neon teal
- `gradient` - Green-to-teal gradient
- Add `glow` prop for text-shadow effect

---

## 🎬 Animation Principles

### Core Principles

1. **GPU-Accelerated Only**
   - Use `transform` and `opacity` properties
   - Avoid animating `width`, `height`, `top`, `left`
   - Keeps animations smooth at 60fps

2. **Smooth Easing**
   - Default: `power3.out` (cubic-bezier for smooth deceleration)
   - Bouncy: `back.out(1.7)` (for playful elements)
   - Linear: `none` (for continuous scrolling effects)

3. **Respect User Preferences**
   - Always check `prefers-reduced-motion`
   - Provide fallback for users who disable motion
   - CSS automatically handles this via media query

### Animation Types

#### Scroll-Triggered Reveals
Elements fade in and slide up as they enter the viewport:
```javascript
scrollAnimations.fadeIn('.feature-card');
```

**Settings:**
- Trigger: When element reaches 80% of viewport
- Duration: 1s
- Easing: power3.out

#### Stagger Animations
Multiple elements animate sequentially:
```javascript
scrollAnimations.staggerFadeIn('.card-grid > *');
```

**Settings:**
- Stagger delay: 0.15s between elements
- Duration: 0.8s per element

#### Parallax Scrolling
Background elements move at different speeds:
```javascript
scrollAnimations.parallax('.background-orb', 0.5);
```

#### Hover Animations
- **Cards:** Lift (`translateY(-4px)`) + glow intensifies
- **Buttons:** Scale up (`scale(1.02)`) + shadow grows
- **Icons:** Float effect (`translateY(-2px)`)

#### Text Animations
- **Line-by-line reveal:** Headlines animate word-by-word
- **Typewriter:** Text types out character by character
- **Word stagger:** Words fade in sequentially

---

## 🧩 Component Usage Guide

### GlassCard Component

```jsx
import { GlassCard } from '@/components/ui/os';

<GlassCard 
  variant="green"     // default | strong | green | teal
  glow="green"        // none | green | teal
  hover={true}        // Enable hover lift effect
  className="p-6"
>
  <h3>Feature Title</h3>
  <p>Feature description...</p>
</GlassCard>
```

### OSPanel Component

```jsx
import { OSPanel } from '@/components/ui/os';

<OSPanel className="p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 h-12 rounded-xl bg-neon-green-500/20 flex items-center justify-center">
      <Icon />
    </div>
    <div>
      <h3>System Status</h3>
      <p>All systems operational</p>
    </div>
  </div>
</OSPanel>
```

### Button Component

```jsx
import { Button } from '@/components/ui/os';

// Primary CTA
<Button variant="primary" size="lg">
  Start Your Engine
</Button>

// With icon
<Button 
  variant="primary"
  icon={<ArrowIcon />}
  iconPosition="right"
>
  Get Started
</Button>

// Full width
<Button variant="secondary" fullWidth>
  Learn More
</Button>
```

### NeonText Component

```jsx
import { NeonText } from '@/components/ui/os';

<h1>
  Build Your <NeonText variant="gradient" glow>Digital Empire</NeonText>
</h1>
```

---

## 🎨 Special Effects

### Neon Borders

Add glowing borders to elements:

```jsx
<div className="neon-border rounded-xl p-6">
  Content with green neon glow
</div>

<div className="neon-border-teal rounded-xl p-6">
  Content with teal neon glow
</div>
```

### Circuit Board Background

Subtle grid pattern for tech aesthetic:

```jsx
<div className="circuit-bg p-12">
  <h2>System Overview</h2>
</div>
```

### Gradient Text

```jsx
<span className="text-gradient-green">Green Gradient</span>
<span className="text-gradient-neon">Neon Gradient</span>
```

### Glow Text

```jsx
<h1 className="glow-text">Glowing Green Text</h1>
<h1 className="glow-text-teal">Glowing Teal Text</h1>
```

---

## 📐 Layout Principles

### Section Structure

Each major section follows this pattern:

```jsx
<section className="py-20 px-6 relative">
  <div className="max-w-7xl mx-auto">
    {/* Section Header */}
    <div className="text-center mb-12">
      <h2 className="text-4xl font-display font-bold">
        Section <NeonText variant="green">Title</NeonText>
      </h2>
      <p className="text-white/60 mt-4">Section description</p>
    </div>
    
    {/* Section Content */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cards/Panels */}
    </div>
  </div>
  
  {/* Background Effects */}
  <div className="absolute inset-0 -z-10">
    {/* Radial glows, orbs, etc. */}
  </div>
</section>
```

### Grid System

- **1 column:** Mobile default
- **2 columns:** Tablets (768px+)
- **3 columns:** Desktop (1024px+)
- **4 columns:** Large desktop (1280px+)

**Gap:** 1.5rem (24px) between cards

### Spacing

- **Section padding:** `py-20` (5rem / 80px vertical)
- **Container padding:** `px-6` (1.5rem / 24px horizontal)
- **Card padding:** `p-6` (1.5rem / 24px)
- **Max width:** `max-w-7xl` (1280px)

---

## 🌐 Navigation Design

### Sticky Nav with Blur

The navigation bar:
- Starts transparent at top of page
- Becomes translucent glass on scroll
- Sticky position (stays at top)
- Backdrop blur increases with scroll

```jsx
// GSAP ScrollTrigger automatically adds 'nav-scrolled' class
<nav className="fixed top-0 w-full z-50 transition-all duration-300">
  {/* Nav content */}
</nav>
```

```css
/* Default state */
nav {
  background: rgba(10, 10, 10, 0.3);
}

/* Scrolled state */
nav.nav-scrolled {
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
```

### Logo Design

New logo concept:
- Compact mark (radar/chip/signal icon)
- "GreenLine365" wordmark
- Neon green color
- Font: Poppins Bold

---

## 🎭 Design Patterns

### Hero Section Pattern

```
┌─────────────────────────────────────────┐
│  [Navigation Bar with blur]             │
├─────────────────────────────────────────┤
│                                         │
│  Left Side:                Right Side:  │
│  • Multi-line headline       • Phone    │
│    with neon accent           mockup    │
│  • Supporting text            floating  │
│  • 2 CTAs                     with      │
│                               shadow    │
│  Background: Abstract shapes, orbs      │
│                                         │
└─────────────────────────────────────────┘
```

### Feature Grid Pattern

```
┌──────────┬──────────┬──────────┐
│  Icon    │  Icon    │  Icon    │
│  Title   │  Title   │  Title   │
│  Desc    │  Desc    │  Desc    │
│          │          │          │
│ [Glass]  │ [Glass]  │ [Glass]  │
└──────────┴──────────┴──────────┘
```

Each card:
- Icon in colored circle (20% opacity background)
- Bold title
- 2-3 line description
- Optional "Learn more" link
- Hover: Lift + glow

### CTA Band Pattern

```
┌─────────────────────────────────────────┐
│                                         │
│        Ready to Transform Your          │
│              Business?                  │
│                                         │
│        [Primary CTA]  [Secondary]       │
│                                         │
│  Background: Strong neon gradient       │
└─────────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

When implementing a new section:

- [ ] Use dark background (`#0A0A0A` or darker)
- [ ] Add radial gradient glows in background
- [ ] Use Poppins for all headings
- [ ] Add `<NeonText>` accent to key words
- [ ] Wrap cards in `<GlassCard>` or `<OSPanel>`
- [ ] Use new button system for all CTAs
- [ ] Add scroll-triggered animations with GSAP
- [ ] Ensure glassmorphism borders are visible
- [ ] Test hover states on interactive elements
- [ ] Verify animations respect `prefers-reduced-motion`
- [ ] Check mobile responsiveness
- [ ] Ensure text contrast meets accessibility standards

---

## 🎯 Brand Voice

The visual design should communicate:

- **Powerful:** Like a command center that controls everything
- **Intelligent:** AI-powered, smart automation
- **Modern:** Cutting-edge technology
- **Accessible:** Complex power made simple
- **Trustworthy:** Enterprise-grade, secure, reliable

Avoid:
- ❌ Childish or playful tones
- ❌ Cluttered or busy layouts
- ❌ Harsh, jarring animations
- ❌ Low contrast text (maintain WCAG AA)
- ❌ Overusing neon (it's an accent, not the base)

---

## 📚 Resources

### Tailwind Classes Quick Reference

**Glassmorphism:**
- `.glass` - Standard frosted glass
- `.glass-strong` - Enhanced blur
- `.glass-green` - Green-tinted
- `.glass-teal` - Teal-tinted
- `.os-panel` - System panel with accent

**Buttons:**
- `.btn-primary` - Main CTA style
- `.btn-secondary` - Outline style
- `.btn-ghost` - Minimal style

**Effects:**
- `.neon-border` - Green glowing border
- `.neon-border-teal` - Teal glowing border
- `.circuit-bg` - Tech grid pattern
- `.glow-text` - Text with green glow
- `.card-hover` - Hover lift effect

**Colors:**
- `bg-neon-green-500` - Bright green
- `bg-neon-teal-500` - Bright teal
- `bg-os-dark` - Deep black
- `text-neon-green-500` - Green text

**Shadows:**
- `shadow-neon-green` - Green glow shadow
- `shadow-neon-teal` - Teal glow shadow
- `shadow-glass` - Depth shadow

---

## 🎬 Animation Examples

### Fade In on Scroll
```javascript
import { useGSAP, scrollAnimations } from '@/lib/gsap';

useGSAP(() => {
  scrollAnimations.fadeIn('.feature-section');
});
```

### Stagger Cards
```javascript
useGSAP(() => {
  scrollAnimations.staggerFadeIn('.feature-card');
});
```

### Parallax Background
```javascript
useGSAP(() => {
  scrollAnimations.parallax('.bg-orb', 0.3);
});
```

### Nav Blur on Scroll
```javascript
import { createNavBlur } from '@/lib/gsap';

useGSAP(() => {
  createNavBlur('.main-nav');
});
```

---

## 📝 Notes for Future Development

- All new components should follow glassmorphism principles
- Maintain consistent spacing (multiples of 4px/0.25rem)
- Use semantic HTML for accessibility
- Test all animations on mobile devices
- Keep component library DRY - reuse existing components
- Document any new patterns in this file
- Regularly audit for performance (Lighthouse score 90+)

---

**Last Updated:** January 9, 2026  
**Version:** 1.0  
**Maintained By:** Development Team
