# Priyansh Soni — Portfolio


> **A sleek, high-performance portfolio website showcasing projects with smooth animations, magnetic interactions, and modern web technologies.**

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
  - [Cursor System](#cursor-system-custom-canvas-cursor)
  - [Lenis + GSAP Sync](#lenis--gsap-sync)
- [Screenshots & Demo](#-screenshots--demo)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## ✨ Features

- **Magnetic Cursor System** – Custom canvas cursor with physics-based dot & ring that responds to hover states
- **Smooth Scroll Animation** – Integrated Lenis scroll with GSAP ScrollTrigger for seamless parallax and reveal effects
- **Dark/Light Theme Toggle** – Persistent theme preference with CSS custom properties
- **Responsive Design** – Mobile-first approach with breakpoints for tablets and desktops
- **Performance Optimized** – Lazy loading, preloaded assets, optimized RAF synchronization
- **Semantic HTML** – Clean, accessible markup following best practices
- **No Build Tools Required** – Pure vanilla HTML, CSS, and ES Modules — just serve and run
- **Interactive Project Showcase** – Drag-to-scroll cards with smooth interactions
- **Preloader Animation** – Custom animated preloader with progress indication

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Language** | Vanilla JavaScript (ES Modules) |
| **Markup** | HTML5 (Semantic) |
| **Styling** | CSS3 (Custom Properties, Grid, Flexbox) |
| **Animation** | GSAP 3.12 + ScrollTrigger |
| **Scroll Library** | Lenis 1.0 (smooth scroll) |
| **Fonts** | Google Fonts (Syne, Inter) |
| **Build** | None (pure vanilla) |

**Key Libraries:**
- `gsap@3.12` – Industry-standard animation library
- `lenis@1.0` – Performant smooth scrolling
- No webpack, Vite, or build step required

---

## 📦 Installation

### Prerequisites
- **Git** (for cloning)
- **Node.js** (optional, for local HTTP server) or **Python 3** (built-in on most systems)
- **Modern browser** with ES Module support (Chrome, Firefox, Safari, Edge)

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/priyansh-portfolio.git

# Navigate to project directory
cd priyansh-portfolio
```

### Set Up Local Environment

No npm install needed! The project uses vanilla JavaScript with ES Modules. However, you'll need an **HTTP server** to run the site locally (ES Modules don't work with `file://` protocol).

---

## 🚀 Usage

### Option 1 — VS Code Live Server (Recommended for Development)

```bash
1. Install the "Live Server" extension in VS Code
2. Right-click index.html
3. Select "Open with Live Server"
4. Browser opens to http://localhost:5500
```

**Benefits:** Auto-reload on file changes, perfect for development.

### Option 2 — Python (No Install Required)

```bash
# Python 3.x
python3 -m http.server 8080

# Then open: http://localhost:8080
```

**Benefits:** Built-in to most systems, lightweight.

### Option 3 — Node.js

```bash
# Using npx (no installation needed)
npx serve .

# Or install globally
npm install -g serve
serve .
```

**Benefits:** Fast, production-ready static server.

### Quick Start Commands

```bash
# Clone and run (Python example)
git clone https://github.com/yourusername/priyansh-portfolio.git
cd priyansh-portfolio
python3 -m http.server 8080
# Visit: http://localhost:8080
```

### Customization

Edit these files to personalize:

- **`index.html`** – Update meta tags, content, links
- **`css/components.css`** – Modify styles for hero, cards, sections
- **`js/ui.js`** – Adjust theme toggle, email copy functionality
- **`js/cursor.js`** – Tune cursor sensitivity and magnetic strength

---

## 📁 Project Structure

```
priyansh-portfolio/
├── index.html                  ← Entry point — semantic HTML markup
│
├── css/
│   ├── base.css                ← Design tokens (CSS vars) · Reset · Keyframes
│   ├── cursor.css              ← Magnetic cursor system (dot + ring + states)
│   ├── components.css          ← All UI components (Nav · Hero · Cards · About)
│   ├── LogoLoop.css            ← Logo animation stylesheet
│   └── responsive.css          ← Mobile / tablet breakpoints
│
├── js/
│   ├── main.js                 ← Entry point · boots all modules
│   ├── cursor.js               ← Magnetic cursor: lerp loop · hover states
│   ├── scroll.js               ← Lenis + GSAP sync · nav state · anchor scroll
│   ├── animations.js           ← Preloader · Hero · ScrollTrigger reveals
│   ├── ui.js                   ← Theme toggle · Email copy · Interactions
│   ├── clickspark.js           ← Particle effects on interaction
│   ├── LogoLoop.js             ← Logo animation logic
│   └── more-work.js            ← Additional project showcase logic
│
├── images/                     ← Project screenshots and assets
│   ├── quest-case.webp
│   ├── referral-case.webp
│   └── cool\ priyansh\ favicon.png
│
├── song-coverImages/           ← Preloaded cover art for interactions
│   ├── cover-1\ ajab\ prem.jpg
│   ├── cover-2\ rakhlo\ chupake.png
│   └── cover-3\ 2states.jpg
│
├── README.md                   ← This file
└── LICENSE                     ← MIT License
```

---

## 📚 Documentation

---

### Cursor System (Custom Canvas Cursor)

The portfolio features a **magnetic dot + ring cursor system** that replaces the default browser cursor:

#### How It Works

| Element | Behavior |
|---------|----------|
| `.cursor-dot` | Snaps instantly to mouse position (precision click indicator) |
| `.cursor-ring` | Lerps behind with easing factor — creates floating effect |
| `[data-magnetic]` | Elements pull toward cursor using GSAP spring animation |
| `.pcard` / `.sc-card` | Ring expands to 80px on hover (`cursor-card` state) |
| `a[href^="mailto"]` | Ring turns accent color on email links |
| Buttons / Links | Ring expands, dot hides on interaction |

#### Adding Magnetic Pull to Elements

```html
<!-- Add data-magnetic attribute to any element -->
<button data-magnetic>Click me</button>
<a href="#section" data-magnetic>Scroll to Section</a>
```

#### Tuning Cursor Sensitivity

Edit `CURSOR_CONFIG` in `js/cursor.js`:

```javascript
const CURSOR_CONFIG = {
  ringLerp:         0.10,   // Lower = more lag/float (0-1)
  magneticStrength: 0.38,   // Magnetic pull intensity (0-1)
  magneticRadius:   80,     // Pixel radius for detection
};
```

---

### Lenis + GSAP Sync

**Critical Pattern:** Smooth scroll library (Lenis) synced with animation library (GSAP):

```javascript
// Feed scroll events to ScrollTrigger for accurate trigger points
lenis.on('scroll', ScrollTrigger.update);

// Run Lenis animation loop on GSAP's RAF
gsap.ticker.add((time) => lenis.raf(time * 1000));

// Prevent stutter after tab switch
gsap.ticker.lagSmoothing(0);
```

**Why This Matters:** Without this sync, GSAP animations fire at wrong scroll positions, causing visual glitches.

---

## 🎬 Screenshots & Demo

### Live Demo

Visit the live site: **[priyansh-portfolio.com](https://priyansh-portfolio.com)** *(Replace with your actual URL)*



---

---

## 👤 Author

**Priyansh Soni** — Full Stack Developer

Building practical, high-performance web applications with modern technologies.

- **Portfolio:** [priyansh-portfolio.com](https://priyansh-portfolio.com)
- **GitHub:** [@priyansh](https://github.com/priyansh)
- **LinkedIn:** [priyansh-soni](https://linkedin.com/in/priyansh-soni)
- **Email:** [contact@priyansh.dev](mailto:contact@priyansh.dev)

---


**Made with ❤️ by Priyansh**

---

