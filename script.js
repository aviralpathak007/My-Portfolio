// Initialize Lucide Icons
lucide.createIcons();

// Smooth scrolling for anchor links (if native smooth scroll is not enough)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add fade-in class initially to hide elements
const animateElements = document.querySelectorAll('section, .glass-card, .section-title, .curtain-reveal-container, .timeline-row');
animateElements.forEach((el, index) => {
    if (!el.classList.contains('curtain-reveal-container') && !el.classList.contains('reveal-content')) {
        el.classList.add('fade-in');
    }
    if (el.classList.contains('glass-card') && !el.classList.contains('reveal-content')) {
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
    }
});

// Epic 3D Interactive Cards
document.querySelectorAll('.glass-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.zIndex = '10'; // Bring to front
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = ''; // Fallback to CSS transitions
        card.style.zIndex = '';
    });
});

function initObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        // Use a slightly higher threshold for the curtain to ensure the user scrolls down to it
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Stagger tag animations inside skill categories
                if (entry.target.classList.contains('skill-category')) {
                    const tags = entry.target.querySelectorAll('.tag');
                    tags.forEach((tag, idx) => {
                        setTimeout(() => tag.classList.add('visible'), 200 + (idx * 80));
                    });
                }

                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => observer.observe(el));
}

// Custom Cursor Tracking
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', function (e) {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Interactive hover effect for custom cursor
    document.querySelectorAll('a, button, .glass-card, .tag, .btn-icon, .magnetic').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('cursor-morph');
            cursorOutline.classList.add('hide');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('cursor-morph');
            cursorOutline.classList.remove('hide');
        });
    });
}

// Preloader Logic is now handled by the Epic UX Features block at the bottom of this file.

// Dynamic background parallax effect on scroll
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const bgGrid = document.querySelector('.bg-grid');
    if (bgGrid) {
        bgGrid.style.transform = `translateY(${scrollY * 0.2}px)`;
    }

    // Dynamic Heading background position
    const aboutHeading = document.getElementById('about-heading');
    if (aboutHeading) {
        const rect = aboutHeading.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const scrollPercent = 1 - (rect.top / window.innerHeight);
            aboutHeading.style.backgroundPosition = `${scrollPercent * 300}% center`;
        }
    }
});

// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        // Toggle class on the root element
        const isLight = document.documentElement.classList.toggle('light-theme');

        // Save preference
        if (isLight) {
            localStorage.setItem('portfolio-theme', 'light');
        } else {
            localStorage.setItem('portfolio-theme', 'dark');
        }
    });
}

// Click Ripple Effect
document.addEventListener('click', (e) => {
    // Don't create a ripple if clicking on a button or link (optional, but let's just do it everywhere for fun tech vibe)
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);

    // Remove the ripple element from the DOM after the animation completes
    setTimeout(() => {
        ripple.remove();
    }, 600);
});

// ==========================================
// INTERACTIVE PARTICLE BACKGROUND ENGINE
// ==========================================
(function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    const particleCount = 200; // Number of floating orbs

    // Mouse Interaction Variables
    let mouse = { x: -1000, y: -1000 };
    const interactionRadius = 150; // How close mouse needs to be to repel
    const repelForce = 0.5; // How strongly they get pushed away

    // Theme Colors
    const darkThemeColor = 'rgba(0, 255, 204, 0.4)'; // Neon cyan
    const darkThemeConnection = 'rgba(0, 255, 204, 0.1)';
    const lightThemeColor = 'rgba(0, 80, 65, 0.6)'; // Very deep teal
    const lightThemeConnection = 'rgba(0, 80, 65, 0.25)';

    let particleColor = darkThemeColor;
    let connectionColor = darkThemeConnection;

    function updateThemeColors() {
        if (document.documentElement.classList.contains('light-theme')) {
            particleColor = lightThemeColor;
            connectionColor = lightThemeConnection;
        } else {
            particleColor = darkThemeColor;
            connectionColor = darkThemeConnection;
        }
    }

    // Resize canvas
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();
    updateThemeColors();

    // Watch for theme changes dynamically
    const observer = new MutationObserver(() => updateThemeColors());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 2.5 + 1;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.baseVx = this.vx;
            this.baseVy = this.vy;
        }

        update() {
            // Apply mouse repulsion
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < interactionRadius) {
                // Calculate force based on distance
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const forceMultiplier = (interactionRadius - distance) / interactionRadius;

                this.vx += forceDirectionX * forceMultiplier * repelForce;
                this.vy += forceDirectionY * forceMultiplier * repelForce;
            }

            // Friction to gradually return to base speed
            this.vx += (this.baseVx - this.vx) * 0.05;
            this.vy += (this.baseVy - this.vy) * 0.05;

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls
            if (this.x < 0 || this.x > width) {
                this.vx *= -1;
                this.baseVx *= -1;
                this.x = Math.max(0, Math.min(this.x, width));
            }
            if (this.y < 0 || this.y > height) {
                this.vy *= -1;
                this.baseVy *= -1;
                this.y = Math.max(0, Math.min(this.y, height));
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = particleColor;
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Draw connections between nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = connectionColor;
                    // Make opacity dependent on distance
                    ctx.globalAlpha = 1 - (distance / 150);
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
})();

// ==========================================
// MAGNETIC BUTTONS
// ==========================================
const magneticElements = document.querySelectorAll('.nav-links a, .theme-btn, .btn-primary, .contact-card, .hero-badge');

magneticElements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
        const position = el.getBoundingClientRect();
        const x = e.clientX - position.left - position.width / 2;
        const y = e.clientY - position.top - position.height / 2;

        el.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;

        const icon = el.querySelector('i, svg');
        if (icon) {
            icon.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
            icon.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        }
    });

    el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translate(0px, 0px)';
        const icon = el.querySelector('i, svg');
        if (icon) {
            icon.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            icon.style.transform = 'translate(0px, 0px)';
        }
    });
});

// ==========================================
// MOMENTUM SCROLLING (LENIS)
// ==========================================
if (typeof Lenis !== 'undefined') {
    window.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        window.lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Update existing smooth scroll links to use lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.lenis.scrollTo(targetElement);
                }
            } else if (targetId === '#') {
                window.lenis.scrollTo(0);
            }
        });
    });
}

// ==========================================
// ELITE FEATURES: PARALLAX CURTAIN & SVG CIRCUIT
// ==========================================
const parallaxFooter = document.querySelector('.parallax-footer');
const contentWrapper = document.querySelector('.content-wrapper');

// 1. JS Parallax Footer Logic
const footerContent = document.querySelector('.footer-content');
if (parallaxFooter && footerContent) {
    // Remove the margin-bottom that was previously set by the curtain reveal logic
    if (contentWrapper) {
        contentWrapper.style.marginBottom = '0px';
    }

    const scrollCallback = () => {
        const footerRect = parallaxFooter.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // When footer comes into view
        if (footerRect.top < windowHeight) {
            const progress = (windowHeight - footerRect.top) / footerRect.height;
            const clampedProgress = Math.max(0, Math.min(progress, 1));
            // Move from -150px down to 0, fade from 0 to 1
            const yOffset = -150 + (clampedProgress * 150);
            footerContent.style.transform = `translateY(${yOffset}px)`;
            footerContent.style.opacity = clampedProgress;
        }
    };

    window.addEventListener('scroll', scrollCallback);
    scrollCallback();
}

// 2. Scroll-Driven Circuit SVG Logic
const circuitPath = document.getElementById('circuit-path');
if (circuitPath) {
    const pathLength = circuitPath.getTotalLength();
    circuitPath.style.strokeDasharray = pathLength;
    circuitPath.style.strokeDashoffset = pathLength; // Start completely hidden

    window.addEventListener('scroll', () => {
        // Calculate scroll percentage (0 to 1)
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = scrollTop / (docHeight - winHeight);

        // Draw path based on percentage
        const drawLength = pathLength * scrollPercent;
        circuitPath.style.strokeDashoffset = pathLength - drawLength;
    });
}

// ==========================================
// SCROLL PROGRESS BAR
// ==========================================
window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    const progressBar = document.querySelector('.progress');
    if (progressBar) progressBar.style.width = `${scrollPercent * 100}%`;
});

// ==========================================
// HACKER SCRAMBLE HOVER EFFECT
// ==========================================
const heroName = document.querySelector('.name-bold');
if (heroName) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let scrambleInterval = null;

    heroName.addEventListener('mouseover', (e) => {
        let iteration = 0;
        clearInterval(scrambleInterval);

        scrambleInterval = setInterval(() => {
            // Play decoding tick sound
            if (window.playTick) window.playTick();

            e.target.innerText = e.target.innerText
                .split("")
                .map((letter, index) => {
                    // Skip spaces so they don't scramble into letters
                    if (e.target.dataset.text[index] === ' ') return ' ';

                    if (index < iteration) {
                        return e.target.dataset.text[index];
                    }
                    return letters[Math.floor(Math.random() * 26)];
                })
                .join("");

            if (iteration >= e.target.dataset.text.length) {
                clearInterval(scrambleInterval);
            }
            iteration += 1 / 3;
        }, 30);
    });
}

// ==========================================
// 3D MAGNETIC HOVER PHYSICS (TILT CARDS)
// ==========================================
const tiltElements = document.querySelectorAll('.project-card, .skill-category, .glass-card');

tiltElements.forEach(card => {
    // Inject glare element
    const glare = document.createElement('div');
    glare.classList.add('tilt-glare');
    card.appendChild(glare);
    card.classList.add('tilt-card');

    card.addEventListener('mousemove', (e) => {
        // Remove bounce-back transition while tracking mouse
        card.classList.remove('leave');

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate tilt amounts (max 15 degrees)
        const tiltX = ((y - centerY) / centerY) * -15;
        const tiltY = ((x - centerX) / centerX) * 15;

        // Apply 3D transform
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Move the glare opposite to the mouse
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 60%)`;
    });

    card.addEventListener('mouseleave', () => {
        card.classList.add('leave');
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)`;
    });
});

// ==========================================
// TERMINAL DECRYPTION REVEAL
// ==========================================
const terminalSandbox = document.getElementById('terminal-sandbox');
const terminalBody = document.getElementById('terminal-body');
const skillsData = document.getElementById('skills-data');

if (terminalSandbox && terminalBody && skillsData) {
    const rawSkills = Array.from(skillsData.children);
    let currentSequenceId = 0;

    // Hacker characters for decryption
    const chars = '!<>-_\\\\/[]{}—=+*^?#________';

    async function typeLine(text, sequenceId, className = '') {
        if (sequenceId !== currentSequenceId) return null;

        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        terminalBody.appendChild(line);

        const textSpan = document.createElement('span');
        line.appendChild(textSpan);

        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        line.appendChild(cursor);

        for (let i = 0; i < text.length; i++) {
            if (sequenceId !== currentSequenceId) return null;
            textSpan.textContent += text[i];
            if (window.playTick) window.playTick();
            await new Promise(r => setTimeout(r, Math.random() * 20 + 10)); // Typing speed
        }

        cursor.remove();
        return line;
    }

    async function decryptTags(sequenceId) {
        if (sequenceId !== currentSequenceId) return;

        const line = document.createElement('div');
        line.className = 'terminal-line';
        terminalBody.appendChild(line);

        const promises = rawSkills.map(async (skillNode, index) => {
            await new Promise(r => setTimeout(r, index * 60)); // Stagger start
            if (sequenceId !== currentSequenceId) return;

            // Prepare final HTML by injecting the decrypted-tag class
            let finalHtml = skillNode.outerHTML;
            if (finalHtml.includes('class="')) {
                finalHtml = finalHtml.replace('class="', 'class="decrypted-tag ');
            } else {
                finalHtml = finalHtml.replace('>', ' class="decrypted-tag">');
            }

            const targetText = skillNode.textContent;

            const tagContainer = document.createElement('span');
            tagContainer.style.display = 'inline-block';
            tagContainer.style.margin = '4px';
            tagContainer.style.fontFamily = 'var(--font-mono)';
            tagContainer.style.color = 'var(--text-secondary)';
            line.appendChild(tagContainer);

            let iterations = 0;

            return new Promise(resolve => {
                const interval = setInterval(() => {
                    if (sequenceId !== currentSequenceId) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }

                    tagContainer.textContent = targetText.split('')
                        .map((char, i) => {
                            if (i < iterations) return targetText[i];
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join('');

                    if (iterations >= targetText.length) {
                        clearInterval(interval);
                        tagContainer.outerHTML = finalHtml;
                        resolve();
                    }
                    iterations += 1 / 3;
                }, 30);
            });
        });

        await Promise.all(promises);
        if (sequenceId !== currentSequenceId) return;

        const finalLine = document.createElement('div');
        finalLine.className = 'terminal-line';
        finalLine.innerHTML = `<span style="color: var(--accent-primary)">></span> <span class="cursor-blink"></span>`;
        terminalBody.appendChild(finalLine);
    }

    async function runTerminalSequence() {
        currentSequenceId++;
        const sequenceId = currentSequenceId;

        terminalBody.innerHTML = '';

        const l1 = await typeLine('> boot_sequence --init', sequenceId);
        if (!l1) return;
        await new Promise(r => setTimeout(r, 150));

        const loading = await typeLine('[+] Loading core modules...', sequenceId);
        if (!loading) return;
        await new Promise(r => setTimeout(r, 300));
        if (sequenceId !== currentSequenceId) return;
        loading.innerHTML = `<span>[+] Core modules loaded 100%</span>`;

        const l2 = await typeLine('> DECRYPTING_SKILLS.sh', sequenceId);
        if (!l2) return;
        await new Promise(r => setTimeout(r, 100));

        await decryptTags(sequenceId);
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            runTerminalSequence();
        } else {
            // Cancel sequence if out of view
            currentSequenceId++;
        }
    }, { threshold: 0.4 });

    observer.observe(terminalSandbox);
}

// ==========================================
// EPIC UX FEATURES
// ==========================================

// 1 & 2. Preloader & AudioContext
const preloader = document.getElementById('preloader');
const bootText = document.getElementById('boot-text');
const enterBtn = document.getElementById('enter-btn');
const progressBar = document.getElementById('progress-bar');
const loaderText = document.getElementById('loader-text');

let audioCtx;
window.isAudioEnabled = false; // globally accessible

// Initialize Preloader Sequence
setTimeout(() => {
    if (progressBar) progressBar.style.display = 'none';
    if (loaderText) loaderText.style.display = 'none';
    if (bootText) bootText.style.display = 'block';

    setTimeout(() => {
        if (enterBtn) enterBtn.style.display = 'block';
    }, 500);
}, 1000);

if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        // Initialize Audio Context on user gesture
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        window.isAudioEnabled = true;
        document.getElementById('sound-icon-on').style.display = 'block';
        document.getElementById('sound-icon-off').style.display = 'none';

        playThock(); // Feedback sound

        // Hide preloader
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            preloader.style.display = 'none';
            document.body.classList.remove('loading');
            if (typeof initObserver === 'function') initObserver(); // Start fade animations
        }, 500);
    });
}

// Audio Synthesizer Functions
function playSound(type, frequency, duration, vol, pitchSweep = false) {
    if (!window.isAudioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    if (pitchSweep) {
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playThock() { playSound('triangle', 300, 0.1, 0.2, true); }
window.playTick = function () { playSound('square', 1000, 0.03, 0.05, false); }
function playClick() { playSound('sine', 800, 0.05, 0.2, true); }

// Audio Toggle Button
const audioToggle = document.getElementById('audio-toggle');
if (audioToggle) {
    audioToggle.addEventListener('click', () => {
        window.isAudioEnabled = !window.isAudioEnabled;
        if (window.isAudioEnabled && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        document.getElementById('sound-icon-on').style.display = window.isAudioEnabled ? 'block' : 'none';
        document.getElementById('sound-icon-off').style.display = window.isAudioEnabled ? 'none' : 'block';
    });
}

// Magnetic Button Sound
document.querySelectorAll('.magnetic, a, button').forEach(btn => {
    btn.addEventListener('mouseenter', playThock);
    btn.addEventListener('mousedown', playClick);
});

// 3. Split-Text Animation
document.querySelectorAll('.split-text').forEach(el => {
    const text = el.innerText;
    el.innerHTML = '';
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.innerText = char === ' ' ? '\u00A0' : char; // preserve spaces
        span.style.transitionDelay = `${i * 0.03}s`;
        // Highlighting logic: if we stripped the .highlight span, we should ideally keep it, 
        // but for simplicity we will just style them all uniformly unless it's a space.
        el.appendChild(span);
    });
});

const splitTextObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.split-text').forEach(el => splitTextObserver.observe(el));

// 4. Horizontal Scroll Timeline & Progress Bar
const rolesWrapper = document.getElementById('roles');
const experienceTrack = document.querySelector('.experience-track');
const rolesProgressBar = document.getElementById('roles-progress');

if (rolesWrapper && experienceTrack) {
    window.addEventListener('scroll', () => {
        const rect = rolesWrapper.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
            const scrollPercent = Math.abs(rect.top) / (rect.height - window.innerHeight);
            const maxScroll = experienceTrack.scrollWidth - window.innerWidth + 100;
            experienceTrack.style.transform = `translateX(-${scrollPercent * maxScroll}px)`;
            
            if (rolesProgressBar) {
                rolesProgressBar.style.width = `${scrollPercent * 100}%`;
            }
        } else if (rect.top > 0) {
            experienceTrack.style.transform = `translateX(0px)`;
            if (rolesProgressBar) rolesProgressBar.style.width = `0%`;
        } else if (rect.bottom < window.innerHeight) {
            if (rolesProgressBar) rolesProgressBar.style.width = `100%`;
        }
    });
}

// 5. Full-Screen Glass Menu
const menuToggle = document.getElementById('menu-toggle');
const glassMenu = document.getElementById('glass-menu');

if (menuToggle && glassMenu) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        if (glassMenu.classList.contains('hide')) {
            glassMenu.classList.remove('hide');
            glassMenu.classList.add('active');
            if (window.lenis) window.lenis.stop();
        } else {
            glassMenu.classList.add('hide');
            glassMenu.classList.remove('active');
            if (window.lenis) window.lenis.start();
        }
    });

    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            glassMenu.classList.add('hide');
            glassMenu.classList.remove('active');
            if (window.lenis) window.lenis.start();
        });
    });
}

// 6. Hacker Easter Egg
const easterEgg = document.getElementById('easter-egg');
const eeInput = document.getElementById('ee-input');

document.addEventListener('keydown', (e) => {
    if (e.key === '`') {
        e.preventDefault();
        if (easterEgg.classList.contains('hide')) {
            easterEgg.classList.remove('hide');
            eeInput.focus();
        } else {
            easterEgg.classList.add('hide');
            eeInput.value = '';
            eeInput.blur();
        }
    }
});

if (eeInput) {
    eeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = eeInput.value.toLowerCase().trim();

            // Clear existing mode themes first
            document.body.classList.remove('matrix-mode', 'blood-mode', 'poison-mode');

            if (val === 'master') {
                // Already cleared themes above. Also close tech modal if open.
                document.getElementById('tech-modal').classList.add('hide');
                if (typeof stopNeuralAnimation === 'function') stopNeuralAnimation();
            } else if (val === 'matrix') {
                document.body.classList.add('matrix-mode');
            } else if (val === 'blood') {
                document.body.classList.add('blood-mode');
            } else if (val === 'poison') {
                document.body.classList.add('poison-mode');
            } else if (val === 'love') {
                spawnHearts();
            } else if (val === 'tech') {
                document.getElementById('tech-modal').classList.remove('hide');
                startNeuralAnimation();
            }

            eeInput.value = '';
        }
    });
}

// Tech Modal Close Button
const closeTechModal = document.getElementById('close-tech-modal');
if (closeTechModal) {
    closeTechModal.addEventListener('click', () => {
        document.getElementById('tech-modal').classList.add('hide');
        stopNeuralAnimation();
    });
}

// Easter Egg Expansion Functions
function spawnHearts() {
    const container = document.getElementById('hearts-container');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.classList.add('heart');
            heart.innerText = '❤';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDuration = (Math.random() * 2 + 2) + 's';
            heart.style.fontSize = (Math.random() * 20 + 20) + 'px';
            container.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 5000);
        }, Math.random() * 2000);
    }
}

let neuralReqId = null;
function startNeuralAnimation() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc';
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw connections
            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        neuralReqId = requestAnimationFrame(animate);
    }
    animate();
}

function stopNeuralAnimation() {
    if (neuralReqId) {
        cancelAnimationFrame(neuralReqId);
        neuralReqId = null;
    }
}

// ==========================================
// 2D SCROLL-DRIVEN CIRCUIT BRAIN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('circuit-brain');
    const section = document.getElementById('neural-core-section');
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    let nodes = [];
    let edges = [];
    let maxDepth = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        generateCircuit();
        draw(getScrollProgress());
    }

    function isBrain(x, y) {
        const hw = Math.min(width * 0.15, 150); // Hemisphere width
        const hh = Math.min(height * 0.25, 200); // Hemisphere height

        const taper = 1.0 + (y / hh) * 0.25; // Narrower at top (y < 0)

        // Left
        const dxL = (x + hw * 0.5) / (hw * taper);
        const dyL = y / hh;
        const inLeft = (dxL * dxL + dyL * dyL <= 1) && x < -5;

        // Right
        const dxR = (x - hw * 0.5) / (hw * taper);
        const dyR = y / hh;
        const inRight = (dxR * dxR + dyR * dyR <= 1) && x > 5;

        return inLeft || inRight;
    }

    function generateCircuit() {
        nodes = [];
        edges = [];
        const spacing = 18;

        // 1. Generate Brain Nodes
        const brainNodes = [];
        for (let x = -width / 2; x <= width / 2; x += spacing) {
            for (let y = -height / 2; y <= height / 2; y += spacing) {
                if (isBrain(x, y)) {
                    // Slight jitter for organic circuit look
                    const jx = x + (Math.random() - 0.5) * spacing * 0.4;
                    const jy = y + (Math.random() - 0.5) * spacing * 0.4;
                    const node = { x: jx, y: jy, depth: Infinity, adj: [], id: nodes.length, isEdge: false };
                    nodes.push(node);
                    brainNodes.push(node);
                }
            }
        }

        // 2. Generate Boundary Nodes (The Sources)
        const boundaryNodes = [];
        const numBounds = 20;
        for (let i = 0; i < numBounds; i++) {
            // Randomly place along left, right, top, bottom
            let bx, by;
            if (Math.random() > 0.5) {
                bx = Math.random() > 0.5 ? -width / 2 : width / 2;
                by = (Math.random() - 0.5) * height;
            } else {
                bx = (Math.random() - 0.5) * width;
                by = Math.random() > 0.5 ? -height / 2 : height / 2;
            }
            const node = { x: bx, y: by, depth: 0, adj: [], id: nodes.length, isEdge: true };
            nodes.push(node);
            boundaryNodes.push(node);
        }

        // 3. Connect brain nodes to nearest neighbors
        for (let i = 0; i < brainNodes.length; i++) {
            for (let j = i + 1; j < brainNodes.length; j++) {
                const n1 = brainNodes[i];
                const n2 = brainNodes[j];
                const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                if (dist < spacing * 1.6) { // allow horiz, vert, and diagonal
                    n1.adj.push(n2);
                    n2.adj.push(n1);
                }
            }
        }

        // 4. Connect Boundary nodes to outer brain nodes
        boundaryNodes.forEach(bNode => {
            // Find closest brain node
            let closest = null;
            let minDist = Infinity;
            brainNodes.forEach(brNode => {
                const d = Math.hypot(bNode.x - brNode.x, bNode.y - brNode.y);
                if (d < minDist) { minDist = d; closest = brNode; }
            });
            if (closest) {
                bNode.adj.push(closest);
                closest.adj.push(bNode);
            }
        });

        // 5. BFS to assign depths
        let queue = [...boundaryNodes];
        while (queue.length > 0) {
            const curr = queue.shift();
            curr.adj.forEach(neighbor => {
                const dist = Math.hypot(curr.x - neighbor.x, curr.y - neighbor.y);
                // Assign depth based on physical distance traveled
                if (curr.depth + dist < neighbor.depth) {
                    neighbor.depth = curr.depth + dist;
                    queue.push(neighbor);
                }
            });
        }

        maxDepth = Math.max(...nodes.filter(n => n.depth !== Infinity).map(n => n.depth));

        // 6. Create Edges array for drawing
        const edgeSet = new Set();
        nodes.forEach(n1 => {
            n1.adj.forEach(n2 => {
                const id1 = Math.min(n1.id, n2.id);
                const id2 = Math.max(n1.id, n2.id);
                const hash = `${id1}-${id2}`;
                if (!edgeSet.has(hash) && n1.depth !== Infinity && n2.depth !== Infinity) {
                    edgeSet.add(hash);
                    const startNode = n1.depth < n2.depth ? n1 : n2;
                    const endNode = n1.depth < n2.depth ? n2 : n1;
                    edges.push({
                        n1: startNode,
                        n2: endNode,
                        startNorm: startNode.depth / maxDepth,
                        endNorm: endNode.depth / maxDepth
                    });
                }
            });
        });
    }

    function getScrollProgress() {
        const rect = section.getBoundingClientRect();
        const scrollTotal = rect.height - window.innerHeight;
        let progress = -rect.top / scrollTotal;
        return Math.max(0, Math.min(1, progress));
    }

    function interpolateColor(color1, color2, factor) {
        const result = color1.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
        }
        return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
    }

    function draw(progress) {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2); // Center origin

        ctx.lineCap = 'round';

        // Colors
        const cyan = [0, 255, 204];
        const purple = [204, 0, 255];

        edges.forEach(edge => {
            if (progress < edge.startNorm) return; // Not reached yet

            let edgeProg = (progress - edge.startNorm) / (edge.endNorm - edge.startNorm);
            edgeProg = Math.max(0, Math.min(1, edgeProg));

            // Fade out the incoming boundary strings right after they finish connecting to the brain
            let alpha = 1;
            if (edge.n1.isEdge || edge.n2.isEdge) {
                if (progress > edge.endNorm) {
                    // Fades from 1 to 0 over the next 15% of scroll
                    alpha = 1 - ((progress - edge.endNorm) / 0.15);
                    alpha = Math.max(0, alpha);
                }
            }
            if (alpha <= 0) return;

            ctx.globalAlpha = alpha;

            const currX = edge.n1.x + (edge.n2.x - edge.n1.x) * edgeProg;
            const currY = edge.n1.y + (edge.n2.y - edge.n1.y) * edgeProg;

            // Determine color based on X position for gradient
            const mixRatio = (edge.n1.x + width / 4) / (width / 2);
            const clampMix = Math.max(0, Math.min(1, mixRatio));
            const strokeColor = interpolateColor(cyan, purple, clampMix);

            ctx.beginPath();
            ctx.moveTo(edge.n1.x, edge.n1.y);
            ctx.lineTo(currX, currY);

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = strokeColor;
            ctx.stroke();

            // Draw glowing node at the tip if it's currently drawing
            if (edgeProg > 0 && edgeProg < 1) {
                ctx.beginPath();
                ctx.arc(currX, currY, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 15;
                ctx.shadowColor = strokeColor;
                ctx.fill();
            }

            // Draw end node if fully drawn (and not a boundary node)
            if (edgeProg === 1 && !edge.n2.isEdge) {
                ctx.beginPath();
                ctx.arc(edge.n2.x, edge.n2.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = strokeColor;
                ctx.shadowBlur = 5;
                ctx.fill();
            }
        });

        ctx.restore();
    }

    let lastProgress = -1;
    let isDrawing = false;

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => {
        if (!isDrawing) {
            requestAnimationFrame(() => {
                const progress = getScrollProgress();
                // Performance Optimization: Only draw if progress changed AND we are actively inside or just leaving the section boundaries
                if (progress !== lastProgress && (progress > 0 || lastProgress > 0) && (progress < 1 || lastProgress < 1)) {
                    draw(progress);
                    lastProgress = progress;
                }
                isDrawing = false;
            });
            isDrawing = true;
        }
    });

    // Init
    resize();
});

// ==========================================
// ROLE & PROJECT MODAL SYSTEM (UNIFIED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const roleCards = document.querySelectorAll('.role-card');
    const roleModal = document.getElementById('role-modal');
    const closeRoleModalBtn = document.getElementById('close-role-modal');
    
    const modalImg = document.getElementById('role-modal-img');
    const modalTitle = document.getElementById('role-modal-title');
    const modalSubtitle = document.getElementById('role-modal-subtitle');
    const modalDesc = document.getElementById('role-modal-desc');
    const modalTechStack = document.getElementById('role-modal-techstack');
    const modalTechStackContainer = document.getElementById('role-modal-techstack-container');

    if (roleModal && closeRoleModalBtn) {
        roleCards.forEach(card => {
            card.addEventListener('click', () => {
                const title = card.getAttribute('data-title');
                const subtitle = card.getAttribute('data-subtitle');
                const descElement = card.querySelector('.role-desc');
                const desc = card.getAttribute('data-desc') || (descElement ? descElement.innerText : '');
                const imagePath = card.getAttribute('data-image');
                const techStack = card.getAttribute('data-techstack');

                modalTitle.innerText = title;
                modalSubtitle.innerText = subtitle;
                modalDesc.innerText = desc;
                
                if (techStack) {
                    modalTechStack.innerText = techStack;
                    modalTechStackContainer.style.display = 'block';
                } else {
                    modalTechStackContainer.style.display = 'none';
                }
                
                // Fallback to placeholder if image fails to load
                modalImg.src = imagePath;
                modalImg.onerror = () => {
                    modalImg.src = 'https://via.placeholder.com/800x300/1a1a2e/00ffcc?text=' + encodeURIComponent(title);
                };

                roleModal.classList.remove('hide');
                // Trigger reflow
                void roleModal.offsetWidth;
                roleModal.classList.add('active');
                
                // Disable scroll to fix background scrolling bug
                if (window.lenis) {
                    window.lenis.stop();
                } else {
                    document.body.style.overflow = 'hidden';
                }
                
                // Play click sound if audio ctx is alive
                if (window.audioCtx && window.audioCtx.state === 'running') {
                    window.playClickSound();
                }
            });
        });

        const closeRoleModal = () => {
            roleModal.classList.remove('active');
            
            // Enable scroll back
            if (window.lenis) {
                window.lenis.start();
            } else {
                document.body.style.overflow = '';
            }

            setTimeout(() => {
                roleModal.classList.add('hide');
            }, 400); // match CSS transition
            if (window.audioCtx && window.audioCtx.state === 'running') {
                window.playClickSound();
            }
        };

        closeRoleModalBtn.addEventListener('click', closeRoleModal);
        
        // Close on clicking backdrop
        roleModal.addEventListener('click', (e) => {
            if (e.target === roleModal) {
                closeRoleModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && roleModal.classList.contains('active')) {
                closeRoleModal();
            }
        });
    }
});

