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

// Parse values section (h3 subsections as cards)
function parseValuesSection(content) {
    const cards = [];
    const h3Regex = /^### (.+)$/gm;
    const parts = content.split(h3Regex);

    // parts[0] is content before first h3 (usually empty or heading context)
    // parts[1] is first h3 title, parts[2] is its content, etc.
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i]?.trim();
        const body = parts[i + 1]?.trim();
        if (title && body) {
            cards.push({ title, description: body });
        }
    }
    return cards;
}

// Parse usage section (list items + final paragraph as highlight + subsections)
function parseUsageSection(content) {
    const result = {
        items: [],
        highlight: '',
        subsections: []
    };

    // Split by h3 headers to extract subsections
    const h3Regex = /^### (.+)$/gm;
    const parts = content.split(h3Regex);

    // First part is the main content (before any ### headers)
    const mainContent = parts[0];
    const lines = mainContent.split('\n');
    let lastNonEmptyLine = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            result.items.push(trimmed.substring(2).trim());
        } else if (trimmed && !trimmed.startsWith('#')) {
            lastNonEmptyLine = trimmed;
        }
    }

    // The last non-list paragraph is the highlight
    if (lastNonEmptyLine && !lastNonEmptyLine.startsWith('- ')) {
        result.highlight = lastNonEmptyLine;
    }

    // Parse subsections (### headers and their content)
    for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i]?.trim();
        const sectionContent = parts[i + 1]?.trim();
        if (heading && sectionContent) {
            result.subsections.push({
                heading: heading,
                blocks: parseMixedSection(sectionContent)
            });
        }
    }

    return result;
}

// Parse a section with list items
function parseListSection(content) {
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

// Parse a section with paragraphs
function parseParagraphSection(content) {
    const paragraphs = [];
    const lines = content.split('\n');
    let currentParagraph = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
            if (currentParagraph) {
                paragraphs.push(currentParagraph);
                currentParagraph = '';
            }
        } else if (!trimmed.startsWith('#')) {
            currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
        }
    }
    if (currentParagraph) {
        paragraphs.push(currentParagraph);
    }
    return paragraphs;
}

// Parse a section with mixed content (paragraphs, lists, blockquotes, ordered lists)
function parseMixedSection(content) {
    const blocks = [];
    const lines = content.split('\n');
    let currentParagraph = '';
    let currentList = [];
    let currentOrderedList = [];
    let currentListType = null; // 'unordered' or 'ordered'

    function flushParagraph() {
        if (currentParagraph) {
            blocks.push({ type: 'paragraph', content: currentParagraph });
            currentParagraph = '';
        }
    }

    function flushList() {
        if (currentList.length > 0) {
            blocks.push({ type: 'list', items: currentList });
            currentList = [];
        }
        if (currentOrderedList.length > 0) {
            blocks.push({ type: 'orderedList', items: currentOrderedList });
            currentOrderedList = [];
        }
        currentListType = null;
    }

    for (const line of lines) {
        const trimmed = line.trim();
        // Check for ordered list (1. 2. etc.)
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

        if (trimmed === '') {
            flushParagraph();
            flushList();
        } else if (trimmed.startsWith('> ')) {
            // Blockquote
            flushParagraph();
            flushList();
            blocks.push({ type: 'blockquote', content: trimmed.substring(2).trim() });
        } else if (trimmed.startsWith('- ')) {
            // Unordered list
            flushParagraph();
            if (currentListType === 'ordered') flushList();
            currentListType = 'unordered';
            currentList.push(trimmed.substring(2).trim());
        } else if (orderedMatch) {
            // Ordered list
            flushParagraph();
            if (currentListType === 'unordered') flushList();
            currentListType = 'ordered';
            currentOrderedList.push(orderedMatch[2].trim());
        } else if (!trimmed.startsWith('#')) {
            flushList();
            currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
        }
    }
    flushParagraph();
    flushList();

    return blocks;
}

// Parse home markdown file into structured data
function parseHomeFile(content) {
    const { frontmatter, body } = parseFrontmatter(content);

    const home = {
        title: frontmatter.title,
        tagline: frontmatter.tagline,
        sections: {},
        exploreCards: [
            { title: 'Personas', description: 'Understand how impact evolves from Explorer to Strategist', page: 'personas' },
            { title: 'Capability Areas', description: 'Explore the five dimensions of engineering impact', page: 'capabilities' }
        ]
    };

    // Split body by h2 headers
    const h2Regex = /^## (.+)$/gm;
    const parts = body.split(h2Regex);

    // Build a map of section name -> content
    const sectionMap = {};
    for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i]?.trim();
        const sectionContent = parts[i + 1];
        if (heading && sectionContent) {
            sectionMap[heading] = sectionContent;
        }
    }

    // Parse each section into structured data
    if (sectionMap['What This Guide Is For']) {
        home.sections.intro = {
            heading: 'What This Guide Is For',
            paragraphs: parseParagraphSection(sectionMap['What This Guide Is For'])
        };
    }

    if (sectionMap['Growth Is Self-Directed']) {
        home.sections.selfDirected = {
            heading: 'Growth Is Self-Directed',
            paragraphs: parseParagraphSection(sectionMap['Growth Is Self-Directed'])
        };
    }

    if (sectionMap['How to Use This Guide']) {
        const usage = parseUsageSection(sectionMap['How to Use This Guide']);
        home.sections.usage = {
            heading: 'How to Use This Guide',
            items: usage.items,
            highlight: usage.highlight,
            subsections: usage.subsections
        };
    }

    if (sectionMap['Who This Guide Is For']) {
        home.sections.whoFor = {
            heading: 'Who This Guide Is For',
            paragraphs: parseParagraphSection(sectionMap['Who This Guide Is For'])
        };
    }

    if (sectionMap['What We Value']) {
        home.sections.values = {
            heading: 'What We Value',
            cards: parseValuesSection(sectionMap['What We Value'])
        };
    }

    if (sectionMap['Key Truths']) {
        home.sections.keyTruths = {
            heading: 'Key Truths',
            items: parseListSection(sectionMap['Key Truths'])
        };
    }

    return home;
}

// Parse a simple page markdown file (title + intro paragraph)
function parseSimplePage(content) {
    const { frontmatter, body } = parseFrontmatter(content);

    // Get the intro (content before first ## heading)
    const firstHeadingMatch = body.match(/^##\s/m);
    let intro = '';
    if (firstHeadingMatch) {
        intro = body.substring(0, firstHeadingMatch.index).trim();
    } else {
        intro = body.trim();
    }

    return {
        title: frontmatter.title,
        intro: intro
    };
}

// Parse capabilities overview page
function parseCapabilitiesPage(content) {
    const { frontmatter, body } = parseFrontmatter(content);

    const page = {
        title: frontmatter.title,
        intro: '',
        diagramCaption: ''
    };

    // Split by ## headers
    const h2Regex = /^## (.+)$/gm;
    const parts = body.split(h2Regex);

    // First part is intro
    page.intro = parts[0].trim();

    // Look for Diagram Caption section
    for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i]?.trim();
        const sectionContent = parts[i + 1]?.trim();
        if (heading === 'Diagram Caption' && sectionContent) {
            page.diagramCaption = sectionContent;
        } else if (heading === 'How the Capability Areas Work Together' && sectionContent) {
            page.balance = {
                heading: heading,
                blocks: parseMixedSection(sectionContent)
            };
        }
    }

    return page;
}

// Parse markdown content into HTML-friendly structure
function parseMarkdownPage(content) {
    const { frontmatter, body } = parseFrontmatter(content);

    return {
        title: frontmatter.title,
        content: body.trim()
    };
}

// Main build function
function build() {
    console.log('Building data.js from Markdown files...\n');

    const data = {
        home: null,
        personasPage: null,
        capabilitiesPage: null,
        selfAssessmentPage: null,
        antiPatternsPage: null,
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

    // Read personas.md (overview page)
    const personasPagePath = path.join(CONTENT_DIR, 'personas.md');
    if (fs.existsSync(personasPagePath)) {
        const personasPageContent = fs.readFileSync(personasPagePath, 'utf-8');
        data.personasPage = parseSimplePage(personasPageContent);
        console.log('  Parsed: personas.md');
    }

    // Read capabilities.md (overview page)
    const capabilitiesPagePath = path.join(CONTENT_DIR, 'capabilities.md');
    if (fs.existsSync(capabilitiesPagePath)) {
        const capabilitiesPageContent = fs.readFileSync(capabilitiesPagePath, 'utf-8');
        data.capabilitiesPage = parseCapabilitiesPage(capabilitiesPageContent);
        console.log('  Parsed: capabilities.md');
    }

    // Read self-assessment.md
    const selfAssessmentPath = path.join(CONTENT_DIR, 'self-assessment.md');
    if (fs.existsSync(selfAssessmentPath)) {
        const selfAssessmentContent = fs.readFileSync(selfAssessmentPath, 'utf-8');
        data.selfAssessmentPage = parseMarkdownPage(selfAssessmentContent);
        console.log('  Parsed: self-assessment.md');
    }

    // Read anti-patterns.md
    const antiPatternsPath = path.join(CONTENT_DIR, 'anti-patterns.md');
    if (fs.existsSync(antiPatternsPath)) {
        const antiPatternsContent = fs.readFileSync(antiPatternsPath, 'utf-8');
        data.antiPatternsPage = parseMarkdownPage(antiPatternsContent);
        console.log('  Parsed: anti-patterns.md');
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
            scope: frontmatter.scope,
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
    const output = `// The Field Guide to Growth & Impact - Generated Data
// This file is auto-generated by build.js. Do not edit directly.
// To update content, edit the Markdown files in the content/ directory and run: node build.js

const HOME = ${JSON.stringify(data.home, null, 2)};

const PERSONAS_PAGE = ${JSON.stringify(data.personasPage, null, 2)};

const CAPABILITIES_PAGE = ${JSON.stringify(data.capabilitiesPage, null, 2)};

const SELF_ASSESSMENT_PAGE = ${JSON.stringify(data.selfAssessmentPage, null, 2)};

const ANTI_PATTERNS_PAGE = ${JSON.stringify(data.antiPatternsPage, null, 2)};

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
