// The Field Guide to Growth & Impact - Main Application

(function() {
    'use strict';

    // ============================================
    // Shared Constants
    // ============================================

    const CAPABILITY_ICONS = {
        technical: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>',
        consulting: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5"/></svg>',
        delivery: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        mentorship: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        communication: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };

    // Large icons for capability cards (32x32)
    const CAPABILITY_ICONS_LARGE = {
        technical: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>',
        consulting: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>',
        delivery: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        mentorship: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        communication: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };

    // ============================================
    // Navigation
    // ============================================

    function populateNavDropdowns() {

        // Populate personas dropdown
        const personasDropdown = document.getElementById('personas-dropdown');
        if (personasDropdown) {
            personasDropdown.innerHTML = PERSONA_ORDER.map(id => {
                const persona = PERSONAS[id];
                return `<li><a href="#persona-${id}" data-page="persona-${id}" class="persona-link">${persona.name}</a></li>`;
            }).join('');
        }

        // Populate capabilities dropdown
        const capabilitiesDropdown = document.getElementById('capabilities-dropdown');
        if (capabilitiesDropdown) {
            capabilitiesDropdown.innerHTML = CAPABILITY_ORDER.map(id => {
                const cap = CAPABILITIES[id];
                return `<li><a href="#capability-${id}" data-page="capability-${id}" class="capability-link"><span class="cap-icon">${CAPABILITY_ICONS[id] || ''}</span>${cap.name}</a></li>`;
            }).join('');
        }
    }

    function initNavigation() {
        // Handle all navigation clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                navigateTo(pageId);
                return;
            }

            // Handle internal hash links (e.g., #home/section-name)
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

        // Handle browser back/forward
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.page) {
                showPage(e.state.page, false);
            }
        });

        // Handle initial page from URL hash (supports #page/section format)
        const hash = window.location.hash.slice(1) || 'home';
        const [pageId, sectionId] = hash.split('/');
        navigateTo(pageId, false, sectionId);

        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
            });

            // Close menu when clicking a link on mobile
            navLinks.addEventListener('click', function(e) {
                if (e.target.closest('a')) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    function navigateTo(pageId, pushState = true, sectionId = null) {
        showPage(pageId, pushState, sectionId);
    }

    function showPage(pageId, pushState = true, sectionId = null) {
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

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            // If it's a page that needs rendering, render it first
            if (pageId === 'home' && targetPage.innerHTML.trim() === '') {
                renderHomePage(targetPage);
            } else if (pageId === 'personas' && targetPage.innerHTML.trim() === '') {
                renderPersonasOverviewPage(targetPage);
            } else if (pageId === 'capabilities' && targetPage.innerHTML.trim() === '') {
                renderCapabilitiesOverviewPage(targetPage);
            } else if (pageId === 'self-assessment' && targetPage.innerHTML.trim() === '') {
                renderMarkdownPage(targetPage, SELF_ASSESSMENT_PAGE, 'self-assessment-page');
            } else if (pageId === 'anti-patterns' && targetPage.innerHTML.trim() === '') {
                renderMarkdownPage(targetPage, ANTI_PATTERNS_PAGE, 'anti-patterns-page');
            } else if (pageId.startsWith('persona-') && targetPage.innerHTML.trim() === '') {
                const personaId = pageId.replace('persona-', '');
                renderPersonaDetailPage(personaId, targetPage);
            } else if (pageId.startsWith('capability-') && targetPage.innerHTML.trim() === '') {
                const capabilityId = pageId.replace('capability-', '');
                renderCapabilityDetailPage(capabilityId, targetPage);
            }

            targetPage.classList.add('active');

            // Scroll to section if specified, otherwise scroll to top
            if (sectionId) {
                const sectionElement = targetPage.querySelector('#' + sectionId) ||
                    targetPage.querySelector('[id="' + sectionId + '"]');
                if (sectionElement) {
                    // Small delay to ensure rendering is complete
                    setTimeout(() => sectionElement.scrollIntoView({ behavior: 'smooth' }), 50);
                } else {
                    window.scrollTo(0, 0);
                }
            } else {
                window.scrollTo(0, 0);
            }

            // Update URL (include section if present)
            if (pushState) {
                const hashUrl = sectionId ? '#' + pageId + '/' + sectionId : '#' + pageId;
                history.pushState({ page: pageId, section: sectionId }, '', hashUrl);
            }
        }

        // Render diagrams if on those pages
        if (pageId === 'personas') {
            renderImpactRings();
        } else if (pageId === 'capabilities') {
            renderCapabilityRadar();
        }
    }

    // ============================================
    // Inline Markdown Parser
    // ============================================

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
            .replace(/\s+/g, '-')           // Replace spaces with hyphens
            .replace(/-+/g, '-')            // Replace multiple hyphens with single
            .trim();
    }

    function parseInlineMarkdown(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    // ============================================
    // Markdown to HTML Parser
    // ============================================

    function parseMarkdownToHtml(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Close list if we're no longer in one
            if (inList && !line.trim().startsWith('- ')) {
                html += '</ul>\n';
                inList = false;
            }

            // Close table if we're no longer in one
            if (inTable && !line.trim().startsWith('|')) {
                html += renderTable(tableRows);
                tableRows = [];
                inTable = false;
            }

            // Headers (with auto-generated IDs for linking)
            if (line.startsWith('##### ')) {
                const text = line.substring(6);
                const id = slugify(text);
                html += `<h5 id="${id}">${parseInlineMarkdown(text)}</h5>\n`;
            } else if (line.startsWith('#### ')) {
                const text = line.substring(5);
                const id = slugify(text);
                html += `<h4 id="${id}">${parseInlineMarkdown(text)}</h4>\n`;
            } else if (line.startsWith('### ')) {
                const text = line.substring(4);
                const id = slugify(text);
                html += `<h3 id="${id}">${parseInlineMarkdown(text)}</h3>\n`;
            } else if (line.startsWith('## ')) {
                const text = line.substring(3);
                const id = slugify(text);
                html += `<h2 id="${id}">${parseInlineMarkdown(text)}</h2>\n`;
            }
            // Blockquotes
            else if (line.startsWith('> ')) {
                html += `<blockquote><p>${parseInlineMarkdown(line.substring(2))}</p></blockquote>\n`;
            }
            // List items
            else if (line.trim().startsWith('- ')) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                html += `<li>${parseInlineMarkdown(line.trim().substring(2))}</li>\n`;
            }
            // Table rows
            else if (line.trim().startsWith('|')) {
                inTable = true;
                tableRows.push(line.trim());
            }
            // Paragraphs (non-empty lines that aren't special)
            else if (line.trim() !== '') {
                html += `<p>${parseInlineMarkdown(line)}</p>\n`;
            }
        }

        // Close any open list
        if (inList) {
            html += '</ul>\n';
        }

        // Close any open table
        if (inTable) {
            html += renderTable(tableRows);
        }

        return html;
    }

    function renderTable(rows) {
        if (rows.length < 2) return '';

        const parseRow = (row) => row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        const headers = parseRow(rows[0]);
        // Skip separator row (row[1])
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
    // Home Page Rendering
    // ============================================

    function renderHomePage(container) {
        const home = HOME;
        if (!home) return;

        let html = `
            <div class="hero">
                <h1>${home.title}</h1>
                <p class="tagline">${home.tagline}</p>
            </div>

            <div class="container">
        `;

        // 1. Intro section (What This Guide Is For)
        if (home.sections.intro) {
            html += `
                <section class="intro-section">
                    <h2>${home.sections.intro.heading}</h2>
                    ${home.sections.intro.paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
                </section>
            `;
        }

        // 2. Usage section (How to Use This Guide)
        if (home.sections.usage) {
            let usageHtml = `
                <section class="usage-section">
                    <h2>${home.sections.usage.heading}</h2>
                    <ul class="usage-list">
                        ${home.sections.usage.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                    </ul>
                    ${home.sections.usage.highlight ? `<p class="highlight-box">${parseInlineMarkdown(home.sections.usage.highlight)}</p>` : ''}
            `;

            // Render subsections with IDs for deep linking
            if (home.sections.usage.subsections) {
                home.sections.usage.subsections.forEach(subsection => {
                    const sectionId = slugify(subsection.heading);
                    const blocksHtml = subsection.blocks.map(block => {
                        if (block.type === 'paragraph') {
                            return `<p>${parseInlineMarkdown(block.content)}</p>`;
                        } else if (block.type === 'list') {
                            return `<ul>${block.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</ul>`;
                        } else if (block.type === 'orderedList') {
                            return `<ol>${block.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</ol>`;
                        } else if (block.type === 'blockquote') {
                            return `<blockquote><p>${parseInlineMarkdown(block.content)}</p></blockquote>`;
                        }
                        return '';
                    }).join('');

                    usageHtml += `
                        <div class="usage-subsection" id="${sectionId}">
                            <h3>${subsection.heading}</h3>
                            ${blocksHtml}
                        </div>
                    `;
                });
            }

            usageHtml += `</section>`;
            html += usageHtml;
        }

        // 3. Who This Guide Is For section
        if (home.sections.whoFor) {
            html += `
                <section class="who-for-section">
                    <h2>${home.sections.whoFor.heading}</h2>
                    ${home.sections.whoFor.paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
                </section>
            `;
        }

        // 4. Values section (What We Value)
        if (home.sections.values) {
            html += `
                <section class="values-section">
                    <h2>${home.sections.values.heading}</h2>
                    <div class="values-grid">
                        ${home.sections.values.cards.map(card => `
                            <div class="value-card">
                                <h3>${card.title}</h3>
                                <p>${parseInlineMarkdown(card.description)}</p>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // 5. Key Truths section
        if (home.sections.keyTruths) {
            html += `
                <section class="key-truths-section">
                    <h2>${home.sections.keyTruths.heading}</h2>
                    <ul class="key-truths-list">
                        ${home.sections.keyTruths.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                    </ul>
                </section>
            `;
        }

        // 6. Explore cards section
        if (home.exploreCards && home.exploreCards.length > 0) {
            html += `
                <section class="explore-section">
                    <h2>Explore the Framework</h2>
                    <div class="explore-grid">
                        ${home.exploreCards.map(card => `
                            <a href="#${card.page}" data-page="${card.page}" class="explore-card">
                                <h3>${card.title}</h3>
                                <p>${card.description}</p>
                                <span class="arrow">→</span>
                            </a>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        html += `</div>`;

        container.innerHTML = html;
    }

    // ============================================
    // Personas Overview Page Rendering
    // ============================================

    function renderPersonasOverviewPage(container) {
        const page = PERSONAS_PAGE || {};
        const introText = page.intro || '';
        let html = `
            <div class="container">
                <h1>${page.title || 'Personas'}</h1>
                ${introText ? `<p class="page-intro">${parseInlineMarkdown(introText)}</p>` : ''}

                <div class="diagram-container">
                    <svg id="impact-rings" viewBox="0 0 580 400" class="impact-rings-svg">
                        <!-- Will be populated by JS -->
                    </svg>
                </div>

                <div class="personas-grid">
        `;

        PERSONA_ORDER.forEach(personaId => {
            const persona = PERSONAS[personaId];
            html += `
                <a href="#persona-${persona.id}" data-page="persona-${persona.id}" class="persona-card persona-${persona.id}">
                    <div class="persona-scope">${persona.scope}</div>
                    <h3>${persona.name}</h3>
                    <p class="persona-tagline">${persona.tagline}</p>
                    <p class="persona-mindset">"${persona.mindset}"</p>
                </a>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // ============================================
    // Capabilities Overview Page Rendering
    // ============================================

    function renderCapabilitiesOverviewPage(container) {
        const page = CAPABILITIES_PAGE || {};
        const introText = page.intro || '';
        let html = `
            <div class="container">
                <h1>${page.title || 'Capability Areas'}</h1>
                ${introText ? `<p class="page-intro">${parseInlineMarkdown(introText)}</p>` : ''}

                <div class="diagram-container">
                    <svg id="capability-radar" viewBox="0 0 500 450" class="radar-svg">
                        <!-- Will be populated by JS -->
                    </svg>
                    ${page.diagramCaption ? `<p class="diagram-caption">${parseInlineMarkdown(page.diagramCaption)}</p>` : ''}
                </div>

                <div class="capabilities-grid">
        `;

        CAPABILITY_ORDER.forEach(capId => {
            const cap = CAPABILITIES[capId];
            html += `
                <a href="#capability-${cap.id}" data-page="capability-${cap.id}" class="capability-card">
                    <div class="capability-icon">${CAPABILITY_ICONS_LARGE[cap.id] || ''}</div>
                    <h3>${cap.name}</h3>
                    <p class="capability-question">${cap.question}</p>
                    <p>${cap.description}</p>
                </a>
            `;
        });

        html += `
                </div>
        `;

        // Balance section (How the Capability Areas Work Together)
        if (page.balance) {
            const balanceContent = page.balance.blocks.map(block => {
                if (block.type === 'paragraph') {
                    return `<p>${parseInlineMarkdown(block.content)}</p>`;
                } else if (block.type === 'list') {
                    return `<ul class="balance-list">${block.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</ul>`;
                } else if (block.type === 'orderedList') {
                    return `<ol class="balance-list">${block.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</ol>`;
                } else if (block.type === 'blockquote') {
                    return `<blockquote><p>${parseInlineMarkdown(block.content)}</p></blockquote>`;
                }
                return '';
            }).join('');

            html += `
                <section class="balance-section">
                    <h2>${page.balance.heading}</h2>
                    ${balanceContent}
                </section>
            `;
        }

        html += `
            </div>
        `;

        container.innerHTML = html;
    }

    // ============================================
    // Generic Markdown Page Rendering
    // ============================================

    function renderMarkdownPage(container, pageData, cssClass) {
        const page = pageData || {};
        container.innerHTML = `
            <div class="container ${cssClass}">
                <h1>${page.title || ''}</h1>
                ${page.content ? parseMarkdownToHtml(page.content) : ''}
            </div>
        `;
    }

    // ============================================
    // Persona Detail Page Rendering
    // ============================================

    function renderPersonaDetailPage(personaId, container) {
        const persona = PERSONAS[personaId];
        if (!persona) return;

        const personaIndex = PERSONA_ORDER.indexOf(personaId);
        const prevPersona = personaIndex > 0 ? PERSONAS[PERSONA_ORDER[personaIndex - 1]] : null;
        const nextPersona = personaIndex < PERSONA_ORDER.length - 1 ? PERSONAS[PERSONA_ORDER[personaIndex + 1]] : null;

        let html = `
            <div class="container">
                <div class="detail-header" style="border-left: 4px solid ${persona.color}; padding-left: var(--space-lg);">
                    <div class="persona-scope">${persona.scope}</div>
                    <h1>${persona.name}</h1>
                    <p class="detail-subtitle">${persona.tagline}</p>
                    <p class="detail-mindset">"${persona.mindset}"</p>
                </div>

                <div class="impact-info">
                    <div class="impact-block">
                        <h4>Nature of Impact</h4>
                        <ul>
                            ${persona.natureOfImpact.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ${persona.successLooksLike.length > 0 ? `
                    <div class="impact-block">
                        <h4>Success Looks Like</h4>
                        <ul>
                            ${persona.successLooksLike.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${persona.explicitExpectation && persona.explicitExpectation.length > 0 ? `
                    <div class="impact-block">
                        <h4>Explicit Expectation</h4>
                        <ul>
                            ${persona.explicitExpectation.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>

                <h2>Expectations by Capability Area</h2>
        `;

        // Add each capability section
        for (const capId of CAPABILITY_ORDER) {
            const capability = CAPABILITIES[capId];
            const expectations = EXPECTATIONS[capId]?.[personaId];

            if (capability && expectations) {
                html += `
                    <div class="capability-section">
                        <h3>${capability.name}</h3>
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

    // ============================================
    // Capability Detail Page Rendering
    // ============================================

    function renderCapabilityDetailPage(capabilityId, container) {
        const capability = CAPABILITIES[capabilityId];
        if (!capability) return;

        const capIndex = CAPABILITY_ORDER.indexOf(capabilityId);
        const prevCap = capIndex > 0 ? CAPABILITIES[CAPABILITY_ORDER[capIndex - 1]] : null;
        const nextCap = capIndex < CAPABILITY_ORDER.length - 1 ? CAPABILITIES[CAPABILITY_ORDER[capIndex + 1]] : null;

        let html = `
            <div class="container">
                <div class="detail-header">
                    <h1>${capability.name}</h1>
                    <p class="detail-subtitle">${capability.question}</p>
                    <p style="color: var(--color-text-secondary);">${capability.intro}</p>
                    ${capability.note ? `
                    <p class="highlight-box" style="margin-top: var(--space-lg);">${capability.note}</p>
                    ` : ''}
                </div>

                <h2>Expectations by Persona</h2>

                <div class="persona-tabs">
                    ${PERSONA_ORDER.map((pId, index) => `
                        <button class="persona-tab ${index === 0 ? 'active' : ''}" data-persona="${pId}">
                            ${PERSONAS[pId].name}
                        </button>
                    `).join('')}
                </div>

                <div class="persona-contents">
        `;

        // Add content for each persona
        for (let i = 0; i < PERSONA_ORDER.length; i++) {
            const pId = PERSONA_ORDER[i];
            const persona = PERSONAS[pId];
            const expectations = EXPECTATIONS[capabilityId]?.[pId];

            if (persona && expectations) {
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" data-persona="${pId}">
                        <div class="capability-section" style="border-left: 4px solid ${persona.color}; margin-left: 0; border-radius: 0 var(--radius-lg) var(--radius-lg) 0;">
                            <div style="display: flex; align-items: baseline; gap: var(--space-md); margin-bottom: var(--space-lg);">
                                <h3 style="border: none; padding: 0; margin: 0;">${persona.name}</h3>
                                <span style="color: var(--color-text-muted); font-size: 0.9rem;">${persona.scope}</span>
                            </div>
                            <p style="font-style: italic; color: var(--color-text-secondary); margin-bottom: var(--space-lg);">"${persona.mindset}"</p>
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

        // Add tab switching functionality
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

    // ============================================
    // SVG Diagrams
    // ============================================

    function renderCapabilityRadar() {
        const svg = document.getElementById('capability-radar');
        if (!svg) return;
        // Check if already rendered (has circle elements)
        if (svg.querySelector('circle')) return;

        const cx = 250;
        const cy = 200;
        const maxRadius = 150;
        const levels = 5;
        const labels = [
            { name: 'Technical Delivery', angle: -90 },
            { name: 'Consulting', angle: -18 },
            { name: 'Delivery Excellence', angle: 54 },
            { name: 'Mentorship &\nTalent Growth', angle: 126 },
            { name: 'Communication\n& Influence', angle: 198 }
        ];

        let html = '';

        // Draw level circles
        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
        }

        // Draw axes and labels
        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const x2 = cx + maxRadius * Math.cos(angleRad);
            const y2 = cy + maxRadius * Math.sin(angleRad);

            // Axis line
            html += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#e0e0e0" stroke-width="1"/>`;

            // Label
            const labelX = cx + (maxRadius + 35) * Math.cos(angleRad);
            const labelY = cy + (maxRadius + 35) * Math.sin(angleRad);

            const lines = label.name.split('\n');
            const lineHeight = 14;
            const startY = labelY - ((lines.length - 1) * lineHeight) / 2;

            lines.forEach((line, lineIndex) => {
                html += `<text x="${labelX}" y="${startY + lineIndex * lineHeight}"
                    text-anchor="middle"
                    font-size="12"
                    fill="#555">${line}</text>`;
            });
        });

        // Draw example data polygon (sample values)
        const sampleValues = [0.7, 0.5, 0.65, 0.4, 0.55];
        let points = '';

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            points += `${x},${y} `;
        });

        html += `<polygon points="${points.trim()}" fill="rgba(44, 62, 80, 0.2)" stroke="#2c3e50" stroke-width="2"/>`;

        // Draw points
        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            html += `<circle cx="${x}" cy="${y}" r="5" fill="#2c3e50"/>`;
        });

        svg.innerHTML = html;
    }

    function renderImpactRings() {
        const svg = document.getElementById('impact-rings');
        if (!svg) return;
        // Check if already rendered (has circle elements)
        if (svg.querySelector('circle')) return;

        const cx = 200;
        const cy = 200;
        const rings = [
            { name: 'Explorer', scope: 'Task-level', radius: 32, color: '#6c5ce7' },
            { name: 'Artisan', scope: 'Feature-level', radius: 56, color: '#00b894' },
            { name: 'Catalyst', scope: 'Project-level', radius: 80, color: '#0984e3' },
            { name: 'Multiplier', scope: 'Team-level', radius: 104, color: '#e17055' },
            { name: 'Strategist', scope: 'Org-level', radius: 128, color: '#2d3436' }
        ];

        let html = '';

        // Title (centered in viewBox)
        html += `<text x="290" y="28" text-anchor="middle" font-size="13" fill="#333" font-weight="600" font-family="Inter, sans-serif">
            SAHAJ LAYERED IMPACT RINGS
        </text>`;
        html += `<text x="290" y="46" text-anchor="middle" font-size="11" fill="#888" font-family="Inter, sans-serif">
            Explorer → Strategist
        </text>`;

        // Draw rings (from outside in so inner rings are on top)
        for (let i = rings.length - 1; i >= 0; i--) {
            const ring = rings[i];
            html += `<circle cx="${cx}" cy="${cy}" r="${ring.radius}"
                fill="${ring.color}"
                fill-opacity="0.12"
                stroke="${ring.color}"
                stroke-width="2.5"/>`;
        }

        // Draw labels with lines pointing to rings - staggered on the right
        const labelYPositions = [85, 135, 185, 235, 285]; // Evenly spaced vertically
        const labelX = 400; // Fixed X position for labels

        rings.forEach((ring, index) => {
            // Point on the ring (right side)
            const ringX = cx + ring.radius;
            const ringY = cy;

            // Label Y position (staggered)
            const labelY = labelYPositions[index];

            // Intermediate point for the line bend
            const bendX = 350;

            // Draw line from ring to label
            html += `<path d="M ${ringX} ${ringY} L ${bendX} ${ringY} L ${bendX} ${labelY} L ${labelX - 8} ${labelY}"
                fill="none"
                stroke="${ring.color}"
                stroke-width="1.5"
                stroke-opacity="0.5"/>`;

            // Small dot at ring intersection
            html += `<circle cx="${ringX}" cy="${ringY}" r="4" fill="${ring.color}"/>`;

            // Small dot at label
            html += `<circle cx="${labelX - 8}" cy="${labelY}" r="3" fill="${ring.color}"/>`;

            // Label text
            html += `<text x="${labelX}" y="${labelY - 5}"
                text-anchor="start"
                font-size="13"
                fill="${ring.color}"
                font-weight="600"
                font-family="Inter, sans-serif">${ring.name}</text>`;
            html += `<text x="${labelX}" y="${labelY + 10}"
                text-anchor="start"
                font-size="10"
                fill="#888"
                font-family="Inter, sans-serif">${ring.scope}</text>`;
        });

        // Footer text (centered in viewBox)
        html += `<text x="290" y="380" text-anchor="middle" font-size="10" fill="#999" font-style="italic" font-family="Inter, sans-serif">
            Growth = expanding reach. Different areas mature at different speeds.
        </text>`;

        svg.innerHTML = html;
    }

    // ============================================
    // Dark Mode
    // ============================================

    function initDarkMode() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (!themeToggle) return;

        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Toggle handler
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', newTheme);
        });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            }
        });
    }

    // ============================================
    // Initialize
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
        populateNavDropdowns();
        initNavigation();
        initDarkMode();

        // Pre-render SVG diagrams
        renderImpactRings();
        renderCapabilityRadar();
    });

})();
