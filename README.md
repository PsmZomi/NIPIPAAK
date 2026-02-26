# Inkwell — Blog / Magazine Website

A fully responsive React + Vite blog/magazine website with 5 pages, built with Tailwind CSS and React Router.

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — build tool & dev server
- **React Router v6** — client-side routing
- **Tailwind CSS v3** — utility-first styling
- **Google Fonts** — Playfair Display + DM Sans

## Pages

| Route | Page |
|-------|------|
| `/` | **Home** — hero, featured posts, categories, newsletter |
| `/blog` | **Blog** — filterable post listing with search |
| `/blog/:slug` | **Article** — full post view with related posts |
| `/about` | **About** — mission, values, timeline |
| `/team` | **Team** — writer profiles with linked articles |
| `/contact` | **Contact** — form, FAQ accordion, newsletter |

## Project Structure

```
inkwell/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx          # Entry point
    ├── App.jsx           # Routes
    ├── index.css         # Global styles + Tailwind
    ├── data/
    │   └── content.js    # Mock posts & team data
    ├── components/
    │   ├── Header.jsx    # Sticky header + mobile menu
    │   ├── Footer.jsx    # Multi-column footer
    │   ├── PostCard.jsx  # Reusable post card (2 sizes)
    │   └── useReveal.js  # Scroll reveal hook
    └── pages/
        ├── Home.jsx
        ├── Blog.jsx
        ├── Article.jsx
        ├── About.jsx
        ├── Team.jsx
        ├── Contact.jsx
        └── NotFound.jsx
```

## Getting Started

```bash
# 1. Enter the project folder
cd inkwell

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
# → http://localhost:5173
```

## Build for Production

```bash
npm run build
npm run preview   # preview the build locally
```

## Features

- ✅ Fully responsive — mobile-first, works on all screen sizes
- ✅ Sticky header with scroll shadow + mobile hamburger menu
- ✅ Animated scroll reveal on all sections
- ✅ Hero ticker tape with live-scrolling headlines
- ✅ Blog page with category filter + search
- ✅ Individual article pages with drop-cap and related posts
- ✅ FAQ accordion on Contact page
- ✅ Contact form with success state
- ✅ Newsletter signup in footer and multiple pages
- ✅ 404 Not Found page
- ✅ Smooth page transitions (scroll to top on route change)
