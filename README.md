# Sahaj Engineering Competency Framework Website

A minimalistic, single-page website for the Sahaj Engineering Competency Framework.

## Quick Start

Simply open `index.html` in any web browser. No server required.

## Updating Content

Content is stored in Markdown files in the `content/` directory:

```
content/
├── home.md                    # Home page content
├── personas/
│   ├── explorer.md
│   ├── artisan.md
│   ├── catalyst.md
│   ├── multiplier.md
│   └── strategist.md
└── capabilities/
    ├── technical-delivery.md
    ├── consulting.md
    ├── delivery-excellence.md
    ├── mentorship.md
    └── communication.md
```

### To update content:

1. Edit the relevant `.md` file in the `content/` directory
2. Run the build script to regenerate `data.js`:

```bash
node build.js
```

3. Refresh the browser to see changes

### Markdown File Format

Each persona file has this structure:

```markdown
---
id: explorer
name: Explorer
years: 0-1 Years
tagline: Learning the terrain
color: "#6c5ce7"
order: 1
---

## Mindset

"Quote here"

## Nature of Impact

- Item 1
- Item 2

## Success Looks Like

- Item 1
- Item 2

---

# Technical Delivery

## Expectations

- Expectation 1
- Expectation 2

## Self-Assessment

- Question 1?
- Question 2?

---

# Consulting
...
```

## File Structure

```
website/
├── index.html      # Main HTML file
├── styles.css      # Styling (minimalistic theme)
├── data.js         # Generated data (don't edit directly)
├── app.js          # Application logic
├── build.js        # Build script
├── content/        # Editable Markdown content
└── README.md       # This file
```

## Hosting

To host this website:

1. Copy the entire `website/` folder to your web server
2. Or use any static hosting service (GitHub Pages, Netlify, etc.)
3. Or simply share the folder - users can open `index.html` directly

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
