#!/usr/bin/env node

/**
 * Build Script for The Sahaj Field Guide to Growth & Impact
 *
 * This script reads Markdown files from the content/ directory
 * and generates data.js for the website.
 *
 * Usage: node build.js
 *
 * No external dependencies required - uses only Node.js built-in modules.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_FILE = path.join(__dirname, 'data.js');

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

// Parse markdown sections for persona files
function parsePersonaSections(body) {
    const sections = {};
    const capabilityMap = {
        'Technical Delivery': 'technical',
        'Consulting': 'consulting',
        'Delivery Excellence': 'delivery',
        'Mentorship & Talent Growth': 'mentorship',
        'Communication & Influence': 'communication'
    };

    // Split by h1 headers (# Header)
    const h1Regex = /^# (.+)$/gm;
    const parts = body.split(h1Regex);

    // First part contains the overview section
    const overviewPart = parts[0];

    // Parse overview (Mindset, Nature of Impact, Success Looks Like, etc.)
    sections.overview = parseOverviewSection(overviewPart);

    // Parse capability sections
    sections.capabilities = {};

    for (let i = 1; i < parts.length; i += 2) {
        const headerName = parts[i]?.trim();
        const content = parts[i + 1];

        if (headerName && content && capabilityMap[headerName]) {
            const capId = capabilityMap[headerName];
            sections.capabilities[capId] = parseCapabilitySection(content);
        }
    }

    return sections;
}

// Parse the overview section of a persona
function parseOverviewSection(content) {
    const overview = {
        mindset: '',
        natureOfImpact: [],
        successLooksLike: [],
        explicitExpectation: []
    };

    // Extract mindset (quoted text after ## Mindset)
    const mindsetMatch = content.match(/## Mindset\s*\n\s*"([^"]+)"/);
    if (mindsetMatch) {
        overview.mindset = mindsetMatch[1];
    }

    // Extract Nature of Impact list
    const natureMatch = content.match(/## Nature of Impact\s*\n([\s\S]*?)(?=\n##|$)/);
    if (natureMatch) {
        overview.natureOfImpact = extractListItems(natureMatch[1]);
    }

    // Extract Success Looks Like list
    const successMatch = content.match(/## Success Looks Like\s*\n([\s\S]*?)(?=\n##|$)/);
    if (successMatch) {
        overview.successLooksLike = extractListItems(successMatch[1]);
    }

    // Extract Explicit Expectation list (for Multiplier and Strategist)
    const explicitMatch = content.match(/## Explicit Expectation\s*\n([\s\S]*?)(?=\n##|$)/);
    if (explicitMatch) {
        overview.explicitExpectation = extractListItems(explicitMatch[1]);
    }

    return overview;
}

// Parse a capability section
function parseCapabilitySection(content) {
    const section = {
        expectations: [],
        selfAssessment: []
    };

    // Extract Expectations list
    const expectationsMatch = content.match(/## Expectations\s*\n([\s\S]*?)(?=\n## Self-Assessment|$)/);
    if (expectationsMatch) {
        section.expectations = extractListItems(expectationsMatch[1]);
    }

    // Extract Self-Assessment list
    const selfAssessmentMatch = content.match(/## Self-Assessment\s*\n([\s\S]*?)(?=\n---|$)/);
    if (selfAssessmentMatch) {
        section.selfAssessment = extractListItems(selfAssessmentMatch[1]);
    }

    return section;
}

// Extract list items from markdown
function extractListItems(content) {
    const items = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            items.push(trimmed.substring(2).trim());
        }
    }

    return items;
}

// Parse capability markdown file
function parseCapabilityFile(content) {
    const { frontmatter, body } = parseFrontmatter(content);

    const capability = {
        ...frontmatter,
        description: '',
        intro: '',
        note: null
    };

    // Extract Description
    const descMatch = body.match(/## Description\s*\n([\s\S]*?)(?=\n##|$)/);
    if (descMatch) {
        capability.description = descMatch[1].trim();
    }

    // Extract Introduction
    const introMatch = body.match(/## Introduction\s*\n([\s\S]*?)(?=\n## Note|$)/);
    if (introMatch) {
        capability.intro = introMatch[1].trim().replace(/\n\n/g, ' ').replace(/\n/g, ' ');
    }

    // Extract Note
    const noteMatch = body.match(/## Note\s*\n([\s\S]*?)$/);
    if (noteMatch) {
        capability.note = noteMatch[1].trim();
    }

    return capability;
}

// Parse home markdown file
function parseHomeFile(content) {
    const { frontmatter, body } = parseFrontmatter(content);
    return {
        ...frontmatter,
        content: body
    };
}

// Main build function
function build() {
    console.log('Building data.js from Markdown files...\n');

    const data = {
        home: null,
        personas: {},
        capabilities: {},
        expectations: {},
        personaOrder: [],
        capabilityOrder: []
    };

    // Read home.md
    const homePath = path.join(CONTENT_DIR, 'home.md');
    if (fs.existsSync(homePath)) {
        const homeContent = fs.readFileSync(homePath, 'utf-8');
        data.home = parseHomeFile(homeContent);
        console.log('  Parsed: home.md');
    }

    // Read persona files
    const personasDir = path.join(CONTENT_DIR, 'personas');
    const personaFiles = fs.readdirSync(personasDir).filter(f => f.endsWith('.md'));

    const personasArray = [];

    for (const file of personaFiles) {
        const filePath = path.join(personasDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);
        const sections = parsePersonaSections(body);

        const persona = {
            id: frontmatter.id,
            name: frontmatter.name,
            years: frontmatter.years,
            tagline: frontmatter.tagline,
            color: frontmatter.color,
            order: frontmatter.order,
            mindset: sections.overview.mindset,
            natureOfImpact: sections.overview.natureOfImpact,
            successLooksLike: sections.overview.successLooksLike,
            explicitExpectation: sections.overview.explicitExpectation
        };

        personasArray.push(persona);
        data.personas[frontmatter.id] = persona;

        // Store expectations for each capability
        for (const [capId, capData] of Object.entries(sections.capabilities)) {
            if (!data.expectations[capId]) {
                data.expectations[capId] = {};
            }
            data.expectations[capId][frontmatter.id] = capData;
        }

        console.log(`  Parsed: personas/${file}`);
    }

    // Sort personas by order and create order array
    personasArray.sort((a, b) => a.order - b.order);
    data.personaOrder = personasArray.map(p => p.id);

    // Read capability files
    const capabilitiesDir = path.join(CONTENT_DIR, 'capabilities');
    const capabilityFiles = fs.readdirSync(capabilitiesDir).filter(f => f.endsWith('.md'));

    const capabilitiesArray = [];

    for (const file of capabilityFiles) {
        const filePath = path.join(capabilitiesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const capability = parseCapabilityFile(content);

        capabilitiesArray.push(capability);
        data.capabilities[capability.id] = capability;

        console.log(`  Parsed: capabilities/${file}`);
    }

    // Sort capabilities by order and create order array
    capabilitiesArray.sort((a, b) => a.order - b.order);
    data.capabilityOrder = capabilitiesArray.map(c => c.id);

    // Generate data.js
    const output = `// The Sahaj Field Guide to Growth & Impact - Generated Data
// This file is auto-generated by build.js. Do not edit directly.
// To update content, edit the Markdown files in the content/ directory and run: node build.js

const PERSONAS = ${JSON.stringify(data.personas, null, 2)};

const CAPABILITIES = ${JSON.stringify(data.capabilities, null, 2)};

const EXPECTATIONS = ${JSON.stringify(data.expectations, null, 2)};

const PERSONA_ORDER = ${JSON.stringify(data.personaOrder)};

const CAPABILITY_ORDER = ${JSON.stringify(data.capabilityOrder)};
`;

    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

    console.log(`\nGenerated: data.js`);
    console.log('\nBuild complete!');
}

// Run build
build();
