// The Field Guide to Growth & Impact - Main Application
// Content-driven architecture with runtime markdown parsing

(function() {
    'use strict';

    // ============================================
    // State
    // ============================================

    let manifest = null;
    const contentCache = {};
    const iconCache = {};

    // ============================================
    // Initialization
    // ============================================

    async function init() {
        try {
            // Load manifest
            const response = await fetch('manifest.json');
            manifest = await response.json();

            // Initialize UI
            populateNavDropdowns();
            initNavigation();
            initDarkMode();

            // Handle initial page from URL hash
            const hash = window.location.hash.slice(1) || 'home';
            const [pageId, sectionId] = hash.split('/');
            await navigateTo(pageId, false, sectionId);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            document.body.innerHTML = '<div class="container"><h1>Error</h1><p>Failed to load application. Please refresh.</p></div>';
        }
    }

    // ============================================
    // Content Loading
    // ============================================

    async function loadContent(pageId) {
        if (contentCache[pageId]) {
            return contentCache[pageId];
        }

        const pageInfo = manifest.pages[pageId];
        if (!pageInfo) {
            return null;
        }

        const response = await fetch(pageInfo.file);
        const markdown = await response.text();
        const parsed = parseMarkdownFile(markdown);

        contentCache[pageId] = {
            ...pageInfo,
            ...parsed
        };

        return contentCache[pageId];
    }

    async function loadIcon(iconPath) {
        if (iconCache[iconPath]) {
            return iconCache[iconPath];
        }

        try {
            const response = await fetch('content/' + iconPath);
            const svg = await response.text();
            iconCache[iconPath] = svg;
            return svg;
        } catch (e) {
            return '';
        }
    }

    // ============================================
    // Markdown Parsing
    // ============================================

    function parseMarkdownFile(content) {
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

                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }

                frontmatter[key] = value;
            }
        });

        return { frontmatter, body };
    }

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    function parseInlineMarkdown(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function renderHeading(level, text, id) {
        return `<h${level} id="${id}">${parseInlineMarkdown(text)}<a href="#${id}" class="anchor-link" aria-label="Link to this section">#</a></h${level}>\n`;
    }

    function parseMarkdownToHtml(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let inOrderedList = false;
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Close list if we're no longer in one
            if (inList && !line.trim().startsWith('- ')) {
                html += '</ul>\n';
                inList = false;
            }

            // Close ordered list if we're no longer in one
            if (inOrderedList && !line.trim().match(/^\d+\.\s/)) {
                html += '</ol>\n';
                inOrderedList = false;
            }

            // Close table if we're no longer in one
            if (inTable && !line.trim().startsWith('|')) {
                html += renderTable(tableRows);
                tableRows = [];
                inTable = false;
            }

            // Skip annotation comments (we handle these separately)
            if (line.trim().startsWith('<!--') && line.trim().endsWith('-->')) {
                continue;
            }

            // Headers (with auto-generated IDs and anchor links)
            if (line.startsWith('##### ')) {
                const text = line.substring(6);
                const id = slugify(text);
                html += renderHeading(5, text, id);
            } else if (line.startsWith('#### ')) {
                const text = line.substring(5);
                const id = slugify(text);
                html += renderHeading(4, text, id);
            } else if (line.startsWith('### ')) {
                const text = line.substring(4);
                const id = slugify(text);
                html += renderHeading(3, text, id);
            } else if (line.startsWith('## ')) {
                const text = line.substring(3);
                const id = slugify(text);
                html += renderHeading(2, text, id);
            } else if (line.startsWith('# ')) {
                const text = line.substring(2);
                const id = slugify(text);
                html += renderHeading(1, text, id);
            }
            // Horizontal rule
            else if (line.trim() === '---') {
                // Skip (used as section divider in markdown)
            }
            // Blockquotes
            else if (line.startsWith('> ')) {
                html += `<blockquote><p>${parseInlineMarkdown(line.substring(2))}</p></blockquote>\n`;
            }
            // Unordered list items
            else if (line.trim().startsWith('- ')) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                html += `<li>${parseInlineMarkdown(line.trim().substring(2))}</li>\n`;
            }
            // Ordered list items
            else if (line.trim().match(/^\d+\.\s/)) {
                if (!inOrderedList) {
                    html += '<ol>\n';
                    inOrderedList = true;
                }
                const text = line.trim().replace(/^\d+\.\s/, '');
                html += `<li>${parseInlineMarkdown(text)}</li>\n`;
            }
            // Table rows
            else if (line.trim().startsWith('|')) {
                inTable = true;
                tableRows.push(line.trim());
            }
            // Paragraphs
            else if (line.trim() !== '') {
                html += `<p>${parseInlineMarkdown(line)}</p>\n`;
            }
        }

        // Close any open elements
        if (inList) html += '</ul>\n';
        if (inOrderedList) html += '</ol>\n';
        if (inTable) html += renderTable(tableRows);

        return html;
    }

    function renderTable(rows) {
        if (rows.length < 2) return '';

        const parseRow = (row) => row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        const headers = parseRow(rows[0]);
        const dataRows = rows.slice(2).map(parseRow);

        let html = '<table>\n<thead>\n<tr>\n';
        headers.forEach(h => html += `<th>${parseInlineMarkdown(h)}</th>\n`);
        html += '</tr>\n</thead>\n<tbody>\n';
        dataRows.forEach(row => {
            html += '<tr>\n';
            row.forEach(cell => html += `<td>${parseInlineMarkdown(cell)}</td>\n`);
            html += '</tr>\n';
        });
        html += '</tbody>\n</table>\n';
        return html;
    }

    // ============================================
    // Annotation Processing
    // ============================================

    function extractAnnotations(body) {
        const annotations = [];
        const annotationRegex = /<!--\s*([\w-]+)(?::\s*([^\s]+))?\s*-->/g;
        let match;

        while ((match = annotationRegex.exec(body)) !== null) {
            annotations.push({
                type: match[1],
                value: match[2] || null,
                index: match.index
            });
        }

        return annotations;
    }

    // ============================================
    // Navigation
    // ============================================

    function populateNavDropdowns() {
        const personasDropdown = document.getElementById('personas-dropdown');
        if (personasDropdown) {
            personasDropdown.innerHTML = manifest.personas.map(id => {
                const page = manifest.pages[`persona-${id}`];
                return `<li><a href="#persona-${id}" data-page="persona-${id}" class="persona-link">${page.name}</a></li>`;
            }).join('');
        }

        const capabilitiesDropdown = document.getElementById('capabilities-dropdown');
        if (capabilitiesDropdown) {
            capabilitiesDropdown.innerHTML = manifest.capabilities.map(id => {
                const page = manifest.pages[`capability-${id}`];
                return `<li><a href="#capability-${id}" data-page="capability-${id}" class="capability-link">${page.name}</a></li>`;
            }).join('');
        }
    }

    function initNavigation() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                navigateTo(pageId);
                return;
            }

            const anchor = e.target.closest('a[href^="#"]');
            if (anchor && !anchor.hasAttribute('data-page')) {
                const href = anchor.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const hash = href.slice(1);
                    const [pageId, sectionId] = hash.split('/');
                    navigateTo(pageId, true, sectionId || null);
                }
            }
        });

        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.page) {
                showPage(e.state.page, false);
            }
        });

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
            });

            navLinks.addEventListener('click', function(e) {
                if (e.target.closest('a')) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    async function navigateTo(pageId, pushState = true, sectionId = null) {
        await showPage(pageId, pushState, sectionId);
    }

    async function showPage(pageId, pushState = true, sectionId = null) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Update nav links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });

        // Get or create page container
        let targetPage = document.getElementById(pageId);
        if (!targetPage) {
            targetPage = document.createElement('section');
            targetPage.id = pageId;
            targetPage.className = 'page';
            document.getElementById('app').appendChild(targetPage);
        }

        // Render content if not already done
        if (targetPage.innerHTML.trim() === '') {
            await renderPage(pageId, targetPage);
        }

        targetPage.classList.add('active');

        // Scroll handling
        if (sectionId) {
            const sectionElement = targetPage.querySelector('#' + sectionId) ||
                targetPage.querySelector('[id="' + sectionId + '"]');
            if (sectionElement) {
                setTimeout(() => sectionElement.scrollIntoView({ behavior: 'smooth' }), 50);
            } else {
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }

        // Update URL
        if (pushState) {
            const hashUrl = sectionId ? '#' + pageId + '/' + sectionId : '#' + pageId;
            history.pushState({ page: pageId, section: sectionId }, '', hashUrl);
        }
    }

    // ============================================
    // Layout Renderers
    // ============================================

    async function renderPage(pageId, container) {
        const content = await loadContent(pageId);
        if (!content) {
            container.innerHTML = '<div class="container"><h1>Page Not Found</h1></div>';
            return;
        }

        const layout = content.layout;

        switch (layout) {
            case 'home':
                await renderHomeLayout(content, container);
                break;
            case 'personas-overview':
                await renderPersonasOverviewLayout(content, container);
                break;
            case 'capabilities-overview':
                await renderCapabilitiesOverviewLayout(content, container);
                break;
            case 'persona-detail':
                await renderPersonaDetailLayout(content, container);
                break;
            case 'capability-detail':
                await renderCapabilityDetailLayout(content, container);
                break;
            case 'markdown-page':
                await renderMarkdownPageLayout(content, container);
                break;
            default:
                container.innerHTML = '<div class="container"><h1>Unknown Layout</h1></div>';
        }
    }

    async function renderHomeLayout(content, container) {
        const annotations = extractAnnotations(content.body);

        let html = `
            <div class="hero">
                <h1>${content.title}</h1>
                <p class="tagline">${content.tagline}</p>
            </div>
            <div class="container">
        `;

        // Parse sections from body
        const sections = parseSections(content.body);

        for (const section of sections) {
            // Check for cards annotation in this section
            const isCards = section.content.includes('<!-- cards -->');

            if (section.title === 'What We Value' || isCards) {
                // Parse h3 subsections as cards
                const cards = parseCardsFromSection(section.content);
                html += `
                    <section class="values-section">
                        <h2>${section.title}</h2>
                        <div class="values-grid">
                            ${cards.map(card => `
                                <div class="value-card">
                                    <h3>${card.title}</h3>
                                    <p>${parseInlineMarkdown(card.description)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `;
            } else if (section.title === 'Key Truths') {
                const items = parseListItems(section.content);
                html += `
                    <section class="key-truths-section">
                        <h2>${section.title}</h2>
                        <ul class="key-truths-list">
                            ${items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                        </ul>
                    </section>
                `;
            } else if (section.title === 'How to Use This Guide') {
                html += renderUsageSection(section);
            } else {
                // Generic section - paragraphs
                const paragraphs = parseParagraphs(section.content);
                const sectionClass = slugify(section.title) + '-section';
                html += `
                    <section class="${sectionClass}">
                        <h2>${section.title}</h2>
                        ${paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
                    </section>
                `;
            }
        }

        // Check for explore-cards annotation
        if (content.body.includes('<!-- explore-cards -->')) {
            html += `
                <section class="explore-section">
                    <h2>Explore the Framework</h2>
                    <div class="explore-grid">
                        <a href="#personas" data-page="personas" class="explore-card">
                            <h3>Personas</h3>
                            <p>Understand how impact evolves from Explorer to Strategist</p>
                            <span class="arrow">→</span>
                        </a>
                        <a href="#capabilities" data-page="capabilities" class="explore-card">
                            <h3>Capability Areas</h3>
                            <p>Explore the five dimensions of engineering impact</p>
                            <span class="arrow">→</span>
                        </a>
                    </div>
                </section>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    async function renderPersonasOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${parseInlineMarkdown(getIntroText(content.body))}</p>
        `;

        // Check for diagram annotation
        if (content.body.includes('<!-- diagram: impact-rings -->')) {
            html += `
                <div class="diagram-container">
                    <svg id="impact-rings" viewBox="0 0 580 400" class="impact-rings-svg"></svg>
                </div>
            `;
        }

        // Check for persona-cards annotation
        if (content.body.includes('<!-- persona-cards -->')) {
            html += `<div class="personas-grid">`;

            for (const personaId of manifest.personas) {
                const persona = manifest.pages[`persona-${personaId}`];
                // Load full persona content to get mindset
                const personaContent = await loadContent(`persona-${personaId}`);
                const mindset = extractMindset(personaContent.body);

                html += `
                    <a href="#persona-${persona.id}" data-page="persona-${persona.id}" class="persona-card persona-${persona.id}">
                        <div class="persona-scope">${persona.scope}</div>
                        <h3>${persona.name}</h3>
                        <p class="persona-tagline">${persona.tagline}</p>
                        <p class="persona-mindset">"${mindset}"</p>
                    </a>
                `;
            }

            html += `</div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Render diagram
        if (content.body.includes('<!-- diagram: impact-rings -->')) {
            renderImpactRings();
        }
    }

    async function renderCapabilitiesOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${parseInlineMarkdown(getIntroText(content.body))}</p>
        `;

        // Check for diagram annotation
        if (content.body.includes('<!-- diagram: capability-radar -->')) {
            html += `
                <div class="diagram-container">
                    <svg id="capability-radar" viewBox="0 0 500 450" class="radar-svg"></svg>
                </div>
            `;

            // Get diagram caption (text right after diagram annotation)
            const captionMatch = content.body.match(/<!-- diagram: capability-radar -->\s*\n\n([^\n#<]+)/);
            if (captionMatch) {
                html += `<p class="diagram-caption">${parseInlineMarkdown(captionMatch[1].trim())}</p>`;
            }
        }

        // Check for capability-cards annotation
        if (content.body.includes('<!-- capability-cards -->')) {
            html += `<div class="capabilities-grid">`;

            for (const capId of manifest.capabilities) {
                const cap = manifest.pages[`capability-${capId}`];
                // Load full capability content to get description
                const capContent = await loadContent(`capability-${capId}`);
                const description = extractDescription(capContent.body);
                const icon = cap.icon ? await loadIcon(cap.icon) : '';

                html += `
                    <a href="#capability-${cap.id}" data-page="capability-${cap.id}" class="capability-card">
                        <div class="capability-icon">${icon ? icon.replace(/width="\d+"/, 'width="32"').replace(/height="\d+"/, 'height="32"') : ''}</div>
                        <h3>${cap.name}</h3>
                        <p class="capability-question">${cap.question}</p>
                        <p>${description}</p>
                    </a>
                `;
            }

            html += `</div>`;
        }

        // Check for balance section
        const balanceSection = extractSection(content.body, 'How the Capability Areas Work Together');
        if (balanceSection) {
            html += `
                <section class="balance-section">
                    <h2>How the Capability Areas Work Together</h2>
                    ${parseMarkdownToHtml(balanceSection)}
                </section>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Render diagram
        if (content.body.includes('<!-- diagram: capability-radar -->')) {
            renderCapabilityRadar();
        }
    }

    async function renderPersonaDetailLayout(content, container) {
        const personaId = content.id;
        const personaIndex = manifest.personas.indexOf(personaId);
        const prevPersonaId = personaIndex > 0 ? manifest.personas[personaIndex - 1] : null;
        const nextPersonaId = personaIndex < manifest.personas.length - 1 ? manifest.personas[personaIndex + 1] : null;
        const prevPersona = prevPersonaId ? manifest.pages[`persona-${prevPersonaId}`] : null;
        const nextPersona = nextPersonaId ? manifest.pages[`persona-${nextPersonaId}`] : null;

        const mindset = extractMindset(content.body);
        const trustedQuestion = extractTrustedQuestion(content.body);
        const natureOfImpact = extractListSection(content.body, 'Nature of Impact');
        const successLooksLike = extractListSection(content.body, 'Success Looks Like');
        const explicitExpectation = extractListSection(content.body, 'Explicit Expectation');

        let html = `
            <div class="container">
                <div class="detail-header" style="border-left: 4px solid ${content.color}; padding-left: var(--space-lg);">
                    <div class="persona-scope">${content.scope}</div>
                    <h1>${content.name}</h1>
                    <p class="detail-subtitle">${content.tagline}</p>
                    <p class="detail-mindset">"${mindset}"</p>
                    ${trustedQuestion ? `<p class="detail-trusted-question"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                </div>

                <div class="impact-info">
                    <div class="impact-block">
                        <h4>Nature of Impact</h4>
                        <ul>
                            ${natureOfImpact.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ${successLooksLike.length > 0 ? `
                    <div class="impact-block">
                        <h4>Success Looks Like</h4>
                        <ul>
                            ${successLooksLike.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${explicitExpectation.length > 0 ? `
                    <div class="impact-block">
                        <h4>Explicit Expectation</h4>
                        <ul>
                            ${explicitExpectation.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>

                <h2>Expectations by Capability Area</h2>
        `;

        // Extract capability sections
        const capabilitySections = extractCapabilitySections(content.body);

        for (const capId of manifest.capabilities) {
            const cap = manifest.pages[`capability-${capId}`];
            const capSection = capabilitySections[cap.name];

            if (cap && capSection) {
                html += `
                    <div class="capability-section">
                        <h3>${cap.name}</h3>
                        <ul class="expectations-list">
                            ${capSection.expectations.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                        ${capSection.selfAssessment.length > 0 ? `
                        <div class="self-assessment">
                            <h4>Self-Assessment Prompts</h4>
                            <ul>
                                ${capSection.selfAssessment.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                `;
            }
        }

        // Navigation links
        html += `
                <div class="nav-links-bottom">
                    ${prevPersona ? `
                    <a href="#persona-${prevPersona.id}" data-page="persona-${prevPersona.id}" class="nav-link-prev">
                        <span class="nav-link-label">Previous</span>
                        <span class="nav-link-title">${prevPersona.name}</span>
                    </a>
                    ` : '<div></div>'}
                    ${nextPersona ? `
                    <a href="#persona-${nextPersona.id}" data-page="persona-${nextPersona.id}" class="nav-link-next">
                        <span class="nav-link-label">Next</span>
                        <span class="nav-link-title">${nextPersona.name}</span>
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    async function renderCapabilityDetailLayout(content, container) {
        const capId = content.id;
        const capIndex = manifest.capabilities.indexOf(capId);
        const prevCapId = capIndex > 0 ? manifest.capabilities[capIndex - 1] : null;
        const nextCapId = capIndex < manifest.capabilities.length - 1 ? manifest.capabilities[capIndex + 1] : null;
        const prevCap = prevCapId ? manifest.pages[`capability-${prevCapId}`] : null;
        const nextCap = nextCapId ? manifest.pages[`capability-${nextCapId}`] : null;

        const intro = extractIntroduction(content.body);
        const note = extractNote(content.body);

        let html = `
            <div class="container">
                <div class="detail-header">
                    <h1>${content.name}</h1>
                    <p class="detail-subtitle">${content.question}</p>
                    <p style="color: var(--color-text-secondary);">${intro}</p>
                    ${note ? `<p class="highlight-box" style="margin-top: var(--space-lg);">${note}</p>` : ''}
                </div>

                <h2>Expectations by Persona</h2>

                <div class="persona-tabs">
                    ${manifest.personas.map((pId, index) => {
                        const persona = manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        // Load all persona content to get their expectations for this capability
        for (let i = 0; i < manifest.personas.length; i++) {
            const pId = manifest.personas[i];
            const persona = manifest.pages[`persona-${pId}`];
            const personaContent = await loadContent(`persona-${pId}`);

            const capabilitySections = extractCapabilitySections(personaContent.body);
            const expectations = capabilitySections[content.name];
            const mindset = extractMindset(personaContent.body);
            const trustedQuestion = extractTrustedQuestion(personaContent.body);

            if (persona && expectations) {
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" data-persona="${pId}">
                        <div class="capability-section" style="border-left: 4px solid ${persona.color}; margin-left: 0; border-radius: 0 var(--radius-lg) var(--radius-lg) 0;">
                            <div style="display: flex; align-items: baseline; gap: var(--space-md); margin-bottom: var(--space-lg);">
                                <h3 style="border: none; padding: 0; margin: 0;">${persona.name}</h3>
                                <span style="color: var(--color-text-muted); font-size: 0.9rem;">${persona.scope}</span>
                            </div>
                            <p style="font-style: italic; color: var(--color-text-secondary); margin-bottom: ${trustedQuestion ? 'var(--space-sm)' : 'var(--space-lg)'};">"${mindset}"</p>
                            ${trustedQuestion ? `<p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg); font-size: 0.9rem;"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                            <ul class="expectations-list">
                                ${expectations.expectations.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            ${expectations.selfAssessment.length > 0 ? `
                            <div class="self-assessment">
                                <h4>Self-Assessment Prompts</h4>
                                <ul>
                                    ${expectations.selfAssessment.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        }

        html += `
                </div>

                <div class="nav-links-bottom">
                    ${prevCap ? `
                    <a href="#capability-${prevCap.id}" data-page="capability-${prevCap.id}" class="nav-link-prev">
                        <span class="nav-link-label">Previous</span>
                        <span class="nav-link-title">${prevCap.name}</span>
                    </a>
                    ` : '<div></div>'}
                    ${nextCap ? `
                    <a href="#capability-${nextCap.id}" data-page="capability-${nextCap.id}" class="nav-link-next">
                        <span class="nav-link-label">Next</span>
                        <span class="nav-link-title">${nextCap.name}</span>
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add tab switching
        const tabs = container.querySelectorAll('.persona-tab');
        const contents = container.querySelectorAll('.persona-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetPersona = this.getAttribute('data-persona');

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                this.classList.add('active');
                container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
            });
        });
    }

    async function renderMarkdownPageLayout(content, container) {
        const cssClass = slugify(content.title) + '-page';
        container.innerHTML = `
            <div class="container ${cssClass}">
                <h1>${content.title}</h1>
                ${parseMarkdownToHtml(content.body)}
            </div>
        `;
    }

    // ============================================
    // Content Extraction Helpers
    // ============================================

    function parseSections(body) {
        const sections = [];
        const h2Regex = /^## (.+)$/gm;
        const parts = body.split(h2Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const content = parts[i + 1];
            if (title && content) {
                sections.push({ title, content });
            }
        }

        return sections;
    }

    function parseCardsFromSection(content) {
        const cards = [];
        const h3Regex = /^### (.+)$/gm;
        const parts = content.split(h3Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const body = parts[i + 1]?.trim();
            if (title && body) {
                // Get first paragraph only
                const firstPara = body.split('\n\n')[0].replace(/\n/g, ' ').trim();
                cards.push({ title, description: firstPara });
            }
        }
        return cards;
    }

    function parseListItems(content) {
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

    function parseParagraphs(content) {
        const paragraphs = [];
        let current = '';

        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
                if (current) {
                    paragraphs.push(current);
                    current = '';
                }
            } else if (!trimmed.startsWith('- ')) {
                current += (current ? ' ' : '') + trimmed;
            }
        }
        if (current) paragraphs.push(current);

        return paragraphs;
    }

    function renderUsageSection(section) {
        const items = parseListItems(section.content);

        // Find highlight (paragraph after list, before subsections)
        let highlight = '';
        const lines = section.content.split('\n');
        let inList = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                inList = true;
            } else if (inList && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
                highlight = trimmed;
                break;
            }
        }

        // Parse subsections
        const h3Regex = /^### (.+)$/gm;
        const parts = section.content.split(h3Regex);
        const subsections = [];

        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const content = parts[i + 1]?.trim();
            if (heading && content) {
                subsections.push({ heading, content });
            }
        }

        let html = `
            <section class="usage-section">
                <h2>${section.title}</h2>
                <ul class="usage-list">
                    ${items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                </ul>
                ${highlight ? `<p class="highlight-box">${parseInlineMarkdown(highlight)}</p>` : ''}
        `;

        for (const sub of subsections) {
            const sectionId = slugify(sub.heading);
            html += `
                <div class="usage-subsection" id="${sectionId}">
                    <h3>${sub.heading}</h3>
                    ${parseMarkdownToHtml(sub.content)}
                </div>
            `;
        }

        html += `</section>`;
        return html;
    }

    function getIntroText(body) {
        // Get text before first ## or annotation
        const lines = body.split('\n');
        const introLines = [];
        for (const line of lines) {
            if (line.startsWith('##') || line.startsWith('<!--')) break;
            if (line.trim()) introLines.push(line.trim());
        }
        return introLines.join(' ');
    }

    function extractMindset(body) {
        const match = body.match(/## Mindset\s*\n\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    function extractTrustedQuestion(body) {
        const match = body.match(/\*\*The question you're trusted to answer:\*\*\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    function extractDescription(body) {
        const match = body.match(/## Description\s*\n\s*([^\n#]+)/);
        return match ? match[1].trim() : '';
    }

    function extractIntroduction(body) {
        const match = body.match(/## Introduction\s*\n([\s\S]*?)(?=\n## |$)/);
        if (!match) return '';
        return match[1].trim().replace(/\n\n/g, ' ').replace(/\n/g, ' ');
    }

    function extractNote(body) {
        const match = body.match(/## Note\s*\n([\s\S]*?)(?=\n## |$)/);
        return match ? match[1].trim() : '';
    }

    function extractSection(body, heading) {
        const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`);
        const match = body.match(regex);
        return match ? match[1].trim() : null;
    }

    function extractListSection(body, heading) {
        const section = extractSection(body, heading);
        if (!section) return [];
        return parseListItems(section);
    }

    function extractCapabilitySections(body) {
        const sections = {};
        const h1Regex = /^# (.+)$/gm;
        const parts = body.split(h1Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const capName = parts[i]?.trim();
            const content = parts[i + 1];

            if (capName && content) {
                const expectations = [];
                const selfAssessment = [];

                // Extract Expectations
                const expMatch = content.match(/## Expectations\s*\n([\s\S]*?)(?=\n## |$)/);
                if (expMatch) {
                    const lines = expMatch[1].split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('- ')) {
                            expectations.push(line.trim().substring(2));
                        }
                    }
                }

                // Extract Self-Assessment
                const selfMatch = content.match(/## Self-Assessment\s*\n([\s\S]*?)(?=\n---|$)/);
                if (selfMatch) {
                    const lines = selfMatch[1].split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('- ')) {
                            selfAssessment.push(line.trim().substring(2));
                        }
                    }
                }

                sections[capName] = { expectations, selfAssessment };
            }
        }

        return sections;
    }

    // ============================================
    // SVG Diagrams (Data-Driven)
    // ============================================

    // Get theme-aware colors for SVG rendering
    function getSvgColors() {
        const styles = getComputedStyle(document.documentElement);
        return {
            text: styles.getPropertyValue('--color-text').trim(),
            textSecondary: styles.getPropertyValue('--color-text-secondary').trim(),
            textMuted: styles.getPropertyValue('--color-text-muted').trim(),
            border: styles.getPropertyValue('--color-border').trim(),
            accent: styles.getPropertyValue('--color-accent').trim(),
            // Persona colors (these change in dark mode)
            explorer: styles.getPropertyValue('--color-explorer').trim(),
            artisan: styles.getPropertyValue('--color-artisan').trim(),
            catalyst: styles.getPropertyValue('--color-catalyst').trim(),
            multiplier: styles.getPropertyValue('--color-multiplier').trim(),
            strategist: styles.getPropertyValue('--color-strategist').trim()
        };
    }

    function getPersonaColor(personaId) {
        const colors = getSvgColors();
        return colors[personaId] || '#888';
    }

    function renderCapabilityRadar() {
        const svg = document.getElementById('capability-radar');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 250;
        const cy = 200;
        const maxRadius = 150;
        const levels = 5;

        // Build labels from manifest
        const capabilities = manifest.capabilities.map(id => manifest.pages[`capability-${id}`]);
        const angleStep = 360 / capabilities.length;

        const labels = capabilities.map((cap, i) => ({
            name: cap.name.replace(' & ', '\n& ').replace('Mentorship & Talent Growth', 'Mentorship &\nTalent Growth'),
            angle: -90 + (i * angleStep)
        }));

        let html = '';

        // Draw level circles
        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="1"/>`;
        }

        // Draw axes and labels
        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const x2 = cx + maxRadius * Math.cos(angleRad);
            const y2 = cy + maxRadius * Math.sin(angleRad);

            html += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${colors.border}" stroke-width="1"/>`;

            const labelX = cx + (maxRadius + 35) * Math.cos(angleRad);
            const labelY = cy + (maxRadius + 35) * Math.sin(angleRad);

            const lines = label.name.split('\n');
            const lineHeight = 14;
            const startY = labelY - ((lines.length - 1) * lineHeight) / 2;

            lines.forEach((line, lineIndex) => {
                html += `<text x="${labelX}" y="${startY + lineIndex * lineHeight}"
                    text-anchor="middle" font-size="12" fill="${colors.textSecondary}">${line}</text>`;
            });
        });

        // Sample polygon
        const sampleValues = [0.7, 0.5, 0.65, 0.4, 0.55];
        let points = '';

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            points += `${x},${y} `;
        });

        html += `<polygon points="${points.trim()}" fill="${colors.accent}" fill-opacity="0.15" stroke="${colors.accent}" stroke-width="2"/>`;

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            html += `<circle cx="${x}" cy="${y}" r="5" fill="${colors.accent}"/>`;
        });

        svg.innerHTML = html;
    }

    function renderImpactRings() {
        const svg = document.getElementById('impact-rings');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 200;
        const cy = 200;

        // Build rings from manifest using theme-aware colors
        const personas = manifest.personas.map(id => manifest.pages[`persona-${id}`]);
        const baseRadius = 32;
        const radiusStep = 24;

        const rings = personas.map((p, i) => ({
            name: p.name,
            scope: p.scope.replace(' impact', ''),
            radius: baseRadius + (i * radiusStep),
            color: getPersonaColor(p.id)
        }));

        let html = '';

        // Title
        html += `<text x="290" y="28" text-anchor="middle" font-size="13" fill="${colors.text}" font-weight="600" font-family="Inter, sans-serif">
            SAHAJ LAYERED IMPACT RINGS
        </text>`;
        html += `<text x="290" y="46" text-anchor="middle" font-size="11" fill="${colors.textMuted}" font-family="Inter, sans-serif">
            Explorer → Strategist
        </text>`;

        // Draw rings (outside in)
        for (let i = rings.length - 1; i >= 0; i--) {
            const ring = rings[i];
            html += `<circle cx="${cx}" cy="${cy}" r="${ring.radius}"
                fill="${ring.color}" fill-opacity="0.12"
                stroke="${ring.color}" stroke-width="2.5"/>`;
        }

        // Labels
        const labelYPositions = [85, 135, 185, 235, 285];
        const labelX = 400;

        rings.forEach((ring, index) => {
            const ringX = cx + ring.radius;
            const ringY = cy;
            const labelY = labelYPositions[index];
            const bendX = 350;

            html += `<path d="M ${ringX} ${ringY} L ${bendX} ${ringY} L ${bendX} ${labelY} L ${labelX - 8} ${labelY}"
                fill="none" stroke="${ring.color}" stroke-width="1.5" stroke-opacity="0.5"/>`;
            html += `<circle cx="${ringX}" cy="${ringY}" r="4" fill="${ring.color}"/>`;
            html += `<circle cx="${labelX - 8}" cy="${labelY}" r="3" fill="${ring.color}"/>`;
            html += `<text x="${labelX}" y="${labelY - 5}"
                text-anchor="start" font-size="13" fill="${ring.color}" font-weight="600" font-family="Inter, sans-serif">${ring.name}</text>`;
            html += `<text x="${labelX}" y="${labelY + 10}"
                text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">${ring.scope}</text>`;
        });

        // Footer
        html += `<text x="290" y="380" text-anchor="middle" font-size="10" fill="${colors.textMuted}" font-style="italic" font-family="Inter, sans-serif">
            Growth = expanding reach. Different areas mature at different speeds.
        </text>`;

        svg.innerHTML = html;
    }

    function refreshSvgDiagrams() {
        // Clear and re-render SVG diagrams to pick up new theme colors
        const radar = document.getElementById('capability-radar');
        if (radar) {
            radar.innerHTML = '';
            renderCapabilityRadar();
        }

        const rings = document.getElementById('impact-rings');
        if (rings) {
            rings.innerHTML = '';
            renderImpactRings();
        }
    }

    // ============================================
    // Dark Mode
    // ============================================

    function initDarkMode() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (!themeToggle) return;

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', newTheme);

            // Re-render SVG diagrams with new theme colors
            refreshSvgDiagrams();
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                // Re-render SVG diagrams with new theme colors
                refreshSvgDiagrams();
            }
        });
    }

    // ============================================
    // Initialize
    // ============================================

    document.addEventListener('DOMContentLoaded', init);

})();
