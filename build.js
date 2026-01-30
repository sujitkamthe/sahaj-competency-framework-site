#!/usr/bin/env node

/**
 * Build Script for The Sahaj Field Guide to Growth & Impact
 *
 * This script scans Markdown files from the content/ directory
 * and generates manifest.json with file paths and frontmatter metadata.
 *
 * The actual content parsing happens at runtime in the browser.
 *
 * Usage: node build.js
 *
 * No external dependencies required - uses only Node.js built-in modules.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_FILE = path.join(__dirname, 'manifest.json');

// Simple YAML frontmatter parser (handles basic key: value pairs)
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterStr = match[1];
    const body = match[2];
    const frontmatter = {};

    frontmatterStr.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Parse numbers
            if (!isNaN(value) && value !== '') {
                value = Number(value);
            }

            frontmatter[key] = value;
        }
    });

    return { frontmatter, body };
}

// Scan a directory for markdown files
function scanMarkdownFiles(dir, relativeTo = CONTENT_DIR) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip icons directory
            if (entry.name !== 'icons') {
                files.push(...scanMarkdownFiles(fullPath, relativeTo));
            }
        } else if (entry.name.endsWith('.md')) {
            files.push(path.relative(relativeTo, fullPath));
        }
    }

    return files;
}

// Main build function
function build() {
    console.log('Building manifest.json from Markdown files...\n');

    const manifest = {
        pages: {},
        personas: [],
        capabilities: []
    };

    // Scan all markdown files
    const mdFiles = scanMarkdownFiles(CONTENT_DIR);

    const personaEntries = [];
    const capabilityEntries = [];

    for (const relativePath of mdFiles) {
        const fullPath = path.join(CONTENT_DIR, relativePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { frontmatter } = parseFrontmatter(content);

        // Determine page ID from file path and layout
        let pageId;
        const layout = frontmatter.layout;

        if (relativePath === 'home.md') {
            pageId = 'home';
        } else if (relativePath === 'personas.md') {
            pageId = 'personas';
        } else if (relativePath === 'capabilities.md') {
            pageId = 'capabilities';
        } else if (relativePath === 'self-assessment.md') {
            pageId = 'self-assessment';
        } else if (relativePath === 'anti-patterns.md') {
            pageId = 'anti-patterns';
        } else if (relativePath.startsWith('personas/')) {
            pageId = `persona-${frontmatter.id}`;
            personaEntries.push({ id: frontmatter.id, order: frontmatter.order });
        } else if (relativePath.startsWith('capabilities/')) {
            pageId = `capability-${frontmatter.id}`;
            capabilityEntries.push({ id: frontmatter.id, order: frontmatter.order });
        } else {
            // Unknown file, skip
            console.log(`  Skipped: ${relativePath} (unknown type)`);
            continue;
        }

        // Build page entry
        manifest.pages[pageId] = {
            file: `content/${relativePath}`,
            ...frontmatter
        };

        console.log(`  Indexed: ${relativePath} -> ${pageId}`);
    }

    // Sort and extract ordered lists
    personaEntries.sort((a, b) => a.order - b.order);
    capabilityEntries.sort((a, b) => a.order - b.order);

    manifest.personas = personaEntries.map(p => p.id);
    manifest.capabilities = capabilityEntries.map(c => c.id);

    // Write manifest.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`\nGenerated: manifest.json`);
    console.log(`  ${Object.keys(manifest.pages).length} pages indexed`);
    console.log(`  ${manifest.personas.length} personas: ${manifest.personas.join(', ')}`);
    console.log(`  ${manifest.capabilities.length} capabilities: ${manifest.capabilities.join(', ')}`);
    console.log('\nBuild complete!');
}

// Run build
build();
