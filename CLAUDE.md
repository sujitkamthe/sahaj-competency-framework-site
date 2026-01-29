# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static single-page website for "The Sahaj Field Guide to Growth & Impact" - an engineering competency framework. The site presents personas (Explorer → Strategist) and capability areas (Technical Delivery, Consulting, Delivery Excellence, Mentorship, Communication) with self-assessment guidance.

## Build Command

```bash
node build.js
```

This reads Markdown files from `content/` and generates `data.js`. No external dependencies required.

## Development Workflow

1. Edit Markdown files in `content/` (personas, capabilities, or home)
2. Run `node build.js` to regenerate `data.js`
3. Open `index.html` in a browser (no server required)

### Dev Server (watch + live reload)

```bash
npm run dev
```

This watches `content/*.md` for changes, rebuilds `data.js` automatically, and serves the site at `http://localhost:8080` with live reload.

## Architecture

**Content Pipeline:**
- `content/*.md` → `build.js` → `data.js` → rendered by `app.js`

**Key Files:**
- `build.js` - Node.js script that parses Markdown with YAML frontmatter, extracts structured data (personas, capabilities, expectations), and outputs `data.js`
- `data.js` - Generated file containing `PERSONAS`, `CAPABILITIES`, `EXPECTATIONS`, `PERSONA_ORDER`, `CAPABILITY_ORDER` constants (do not edit directly)
- `app.js` - Client-side SPA logic: hash-based routing, dynamic page rendering for persona/capability detail views, SVG diagram generation (impact rings, capability radar), dark mode toggle
- `index.html` - Contains all static page shells; detail pages (`persona-*`, `capability-*`) are rendered dynamically by `app.js`
- `styles.css` - Styling with CSS custom properties, dark mode via `[data-theme="dark"]`

**Content Structure:**
- Persona files (`content/personas/*.md`): frontmatter (id, name, years, tagline, color, order) + sections (Mindset, Nature of Impact, Success Looks Like) + capability expectations per persona
- Capability files (`content/capabilities/*.md`): frontmatter + Description, Introduction, Note sections

**Routing:**
- Hash-based SPA routing (e.g., `#home`, `#persona-explorer`, `#capability-technical`)
- Detail pages are lazily rendered on first navigation

## Task Management

Tasks are managed using `bd` (command-line tool).

### Field Conventions

| Field | Meaning | Scale |
|-------|---------|-------|
| `priority` | **Value** (not urgency) | P0 = highest value, P4 = lowest |
| `estimate` | **Effort** in minutes | e.g., 30, 60, 120 |

This differs from typical usage where priority = urgency. Here, priority = business value.

### Key Commands

```bash
bd ready                    # List tasks with no blockers
bd show <id>                # View task details
bd update <id> -p P1 -e 30  # Set value (P1) and effort (30 min)
bd create -t task -p P2 -e 60 "Title"  # Create with value/effort
```

### When Asked "What to Pick Up Next"

1. Run `bd ready` to get available tasks
2. For each task, check `priority` (value) and `estimate` (effort)
3. Recommend based on **highest value / lowest effort ratio**:
   - P0 + low estimate = do first
   - P1 + low estimate > P0 + high estimate
   - Skip tasks labeled `blocked-on-user`
4. Note `foundational` tasks that unlock others (check BLOCKS in `bd show`)

### When Creating or Updating Tasks

Always set both `priority` (value) and `estimate` (effort):
```bash
bd create -t task -p P2 -e 60 "Task title"
bd update <id> -p P1 -e 30
```
