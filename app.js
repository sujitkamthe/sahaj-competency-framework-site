// The Field Guide to Growth & Impact - Main Application

(function() {
    'use strict';

    // ============================================
    // Navigation
    // ============================================

    function initNavigation() {
        // Handle all navigation clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                navigateTo(pageId);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.page) {
                showPage(e.state.page, false);
            }
        });

        // Handle initial page from URL hash
        const hash = window.location.hash.slice(1) || 'home';
        navigateTo(hash, false);

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

    function navigateTo(pageId, pushState = true) {
        showPage(pageId, pushState);
    }

    function showPage(pageId, pushState = true) {
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
            // If it's a detail page that needs rendering, render it first
            if (pageId === 'home' && targetPage.innerHTML.trim() === '') {
                renderHomePage(targetPage);
            } else if (pageId.startsWith('persona-') && targetPage.innerHTML.trim() === '') {
                const personaId = pageId.replace('persona-', '');
                renderPersonaDetailPage(personaId, targetPage);
            } else if (pageId.startsWith('capability-') && targetPage.innerHTML.trim() === '') {
                const capabilityId = pageId.replace('capability-', '');
                renderCapabilityDetailPage(capabilityId, targetPage);
            }

            targetPage.classList.add('active');

            // Scroll to top
            window.scrollTo(0, 0);

            // Update URL
            if (pushState) {
                history.pushState({ page: pageId }, '', '#' + pageId);
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

    function parseInlineMarkdown(text) {
        return text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
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

        // Intro section
        if (home.sections.intro) {
            html += `
                <section class="intro-section">
                    <h2>${home.sections.intro.heading}</h2>
                    ${home.sections.intro.paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
                </section>
            `;
        }

        // Values section
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

        // Usage section
        if (home.sections.usage) {
            html += `
                <section class="usage-section">
                    <h2>${home.sections.usage.heading}</h2>
                    <ul class="usage-list">
                        ${home.sections.usage.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                    </ul>
                    ${home.sections.usage.highlight ? `<p class="highlight-box">${parseInlineMarkdown(home.sections.usage.highlight)}</p>` : ''}
                </section>
            `;
        }

        // Balance section (How the Capability Areas Work Together)
        if (home.sections.balance) {
            const balanceContent = home.sections.balance.blocks.map(block => {
                if (block.type === 'paragraph') {
                    return `<p>${parseInlineMarkdown(block.content)}</p>`;
                } else if (block.type === 'list') {
                    return `<ul class="balance-list">${block.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</ul>`;
                }
                return '';
            }).join('');

            html += `
                <section class="balance-section">
                    <h2>${home.sections.balance.heading}</h2>
                    ${balanceContent}
                </section>
            `;
        }

        // Key Truths section
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

        // Who This Guide Is For section
        if (home.sections.whoFor) {
            html += `
                <section class="who-for-section">
                    <h2>${home.sections.whoFor.heading}</h2>
                    ${home.sections.whoFor.paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
                </section>
            `;
        }

        // Self-Assess section
        if (home.sections.selfAssess) {
            html += `
                <section class="self-assess-section">
                    <h2>${home.sections.selfAssess.heading}</h2>
                    <ul class="self-assess-list">
                        ${home.sections.selfAssess.items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                    </ul>
                </section>
            `;
        }

        // Growth Principle section
        if (home.sections.growthPrinciple) {
            html += `
                <section class="growth-principle-section">
                    <h2>${home.sections.growthPrinciple.heading}</h2>
                    ${home.sections.growthPrinciple.paragraphs.map(p => `<p class="highlight-box">${parseInlineMarkdown(p)}</p>`).join('')}
                </section>
            `;
        }

        // Explore cards section
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
        initNavigation();
        initDarkMode();

        // Pre-render SVG diagrams
        renderImpactRings();
        renderCapabilityRadar();
    });

})();
