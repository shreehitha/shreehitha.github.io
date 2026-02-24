// Work Modal functionality
function initWorkModal() {
    const viewWorkBtn = document.getElementById('view-work-btn');
    const workModal = document.getElementById('work-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    
    if (!viewWorkBtn || !workModal) return;
    
    function openModal() {
        workModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        workModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    viewWorkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    
    modalClose.addEventListener('click', closeModal);
    
    modalOverlay.addEventListener('click', closeModal);
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && workModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initWorkModal();
});

// Experience Accordion functionality
document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const accordionContent = header.nextElementSibling;
            const accordionIcon = header.querySelector('.accordion-icon');
            
            // Close other accordion items
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    const otherItem = otherHeader.parentElement;
                    const otherContent = otherHeader.nextElementSibling;
                    const otherIcon = otherHeader.querySelector('.accordion-icon');
                    
                    otherItem.classList.remove('active');
                    otherContent.style.maxHeight = '0';
                    if (otherIcon) {
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
            
            // Toggle current accordion item
            if (accordionItem.classList.contains('active')) {
                accordionItem.classList.remove('active');
                accordionContent.style.maxHeight = '0';
                if (accordionIcon) {
                    accordionIcon.style.transform = 'rotate(0deg)';
                }
            } else {
                accordionItem.classList.add('active');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                if (accordionIcon) {
                    accordionIcon.style.transform = 'rotate(180deg)';
                }
            }
        });
    });
});

// Mobile menu toggle functionality
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const socialLinks = document.querySelector('.nav-right .social-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Also toggle social links visibility on mobile
        if (socialLinks) {
            if (window.innerWidth <= 768) {
                socialLinks.classList.toggle('mobile-active');
            }
        }

        // Animate hamburger icon
        const spans = menuToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translateY(10px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking nav links
document.querySelectorAll('.nav-links a').forEach(anchor => {
    anchor.addEventListener('click', function () {
        // Close mobile menu after clicking
        if (navLinks) {
            navLinks.classList.remove('active');
            if (socialLinks) {
                socialLinks.classList.remove('mobile-active');
            }
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
});

// Contact form handling
const contactForm = document.getElementById('contactForm') || document.querySelector('.contact-form');
if (contactForm) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const charCount = document.querySelector('.char-count');
    const formMessage = document.getElementById('formMessage');

    // Character counter
    if (messageInput && charCount) {
        messageInput.addEventListener('input', (e) => {
            const count = e.target.value.length;
            charCount.textContent = `${count}/500`;
            charCount.style.color = count > 400 ? 'var(--highlight)' : 'var(--text-light)';
        });
    }

    // Input validation styling
    const inputs = [nameInput, emailInput, subjectInput, messageInput].filter(Boolean);
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        input.addEventListener('input', () => {
            if (input.value) {
                input.parentElement.classList.add('filled');
            } else {
                input.parentElement.classList.remove('filled');
            }
        });
    });

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic validation
        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();
        const subject = subjectInput?.value.trim();
        const message = messageInput?.value.trim();

        if (!name || !email || !subject || !message) {
            showFormMessage('Please fill in all fields', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showFormMessage('Please enter a valid email address', 'error');
            return;
        }

        // Show success message
        showFormMessage('✓ Thank you for your message! I will get back to you soon.', 'success');

        // Clear form with animation
        setTimeout(() => {
            contactForm.reset();
            inputs.forEach(input => {
                input.parentElement.classList.remove('filled', 'focused');
            });
            if (charCount) charCount.textContent = '0/500';
        }, 300);

        // Remove message after 6 seconds
        setTimeout(() => {
            if (formMessage) {
                formMessage.style.animation = 'slideUp 0.3s ease';
                setTimeout(() => {
                    formMessage.textContent = '';
                    formMessage.className = 'form-message';
                }, 300);
            }
        }, 6000);
    });

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showFormMessage(message, type) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.animation = 'slideDown 0.3s ease';
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Scroll animations for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe work cards
document.querySelectorAll('.work-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Observe expertise cards
document.querySelectorAll('.expertise-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Observe gallery items
document.querySelectorAll('.gallery-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Photography Lightbox Functionality
window.initLightbox = function () {
    const lightbox = document.getElementById('lightbox');

    if (lightbox) {
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const closeBtn = document.querySelector('.close-btn');
        let currentImageIndex = 0;
        let allImages = [];

        const getTitle = (rawTitle = '') => {
            const trimmed = rawTitle.trim();
            if (!trimmed) return '';
            if (/^(img|dsc|cogni)[\s_-]*\d+/i.test(trimmed)) return '';
            return trimmed;
        };

        // Get all images
        function getAllImages() {
            allImages = [];
            const galleryItems = document.querySelectorAll('.gallery-item');
            const viewButtons = document.querySelectorAll('.view-btn');

            if (galleryItems.length) {
                galleryItems.forEach((item, index) => {
                    const img = item.querySelector('img');
                    const src = item.getAttribute('data-image') || (img ? img.getAttribute('src') : '');
                    const title = item.getAttribute('data-title') || (img ? img.getAttribute('alt') : '');
                    allImages.push({
                        src,
                        title: getTitle(title),
                        index
                    });
                });
            } else {
                viewButtons.forEach((btn, index) => {
                    allImages.push({
                        src: btn.getAttribute('data-image'),
                        title: getTitle(btn.getAttribute('data-title')),
                        index
                    });
                });
            }
        }

        getAllImages();

        // Open lightbox
        // Remove existing listeners first to prevent duplicates if re-initialized
        const galleryItems = document.querySelectorAll('.gallery-item');
        const viewButtons = document.querySelectorAll('.view-btn');

        if (galleryItems.length) {
            galleryItems.forEach((item, index) => {
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);

                newItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = index;
                    openLightbox(index);
                });
            });
        } else {
            viewButtons.forEach((btn, index) => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = index;
                    openLightbox(index);
                });
            });
        }

        // Re-select buttons after replacement (optional, but good for reference)
        // const refreshedButtons = document.querySelectorAll('.view-btn');

        function openLightbox(index) {
            const image = allImages[index];
            if (!image) return;

            const fullPath = image.src.startsWith('http') || image.src.startsWith('../')
                ? image.src
                : '../images/' + image.src;
            // Preload image to prevent lag
            const img = new Image();
            img.onload = () => {
                lightboxImage.src = fullPath;
                lightboxTitle.textContent = image.title;
                lightbox.style.display = 'flex';
                // Small timeout to allow display:flex to apply before transition
                setTimeout(() => {
                    lightbox.classList.add('active');
                }, 10);
                document.body.style.overflow = 'hidden';
            };
            img.src = fullPath;
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.style.display = 'none';
                lightboxImage.src = ''; // Clear source
            }, 300); // Match transition duration
            document.body.style.overflow = 'auto';
        }

        // Close button
        if (closeBtn) {
            // Remove old listener if exists (cloning approach avoids this but for singlular elements like closeBtn we need care)
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', closeLightbox);
        }

        // Close when clicking outside image
        // Use a persistent listener check or just add it once (it's safe to add multiple identical listeners if same function ref, but new anon func = new listener)
        // Simplest to just leave it on lightbox container since we don't destroy lightbox container
        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        };

        // Close with Escape key
        document.onkeydown = (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        };

        // Navigation buttons
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (prevBtn) {
            // Clean listeners
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

            newPrevBtn.addEventListener('click', () => {
                if (!allImages.length) return;
                currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
                openLightbox(currentImageIndex);
            });
        }

        if (nextBtn) {
            // Clean listeners
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

            newNextBtn.addEventListener('click', () => {
                if (!allImages.length) return;
                currentImageIndex = (currentImageIndex + 1) % allImages.length;
                openLightbox(currentImageIndex);
            });
        }
    }

    // Animate new items
    if (typeof observer !== 'undefined') {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(item);
        });
    }
};

// Auto-run on load for static pages or initial load
// initLightbox(); // Don't call immediately here if we expect dynamic loading to call it. 
// Actually, for other pages we might need it. Let's call it at the end of file for backward compat.
// But mostly we prefer calling it explicitly when we know DOM is ready.
// Let's standard listener:
document.addEventListener('DOMContentLoaded', () => {
    // Only run if NOT on photography page to avoid race condition/double init?
    // Or just let photography page call it.
    // Providing it on window is enough.
    if (!document.querySelector('.gallery-grid')) {
        window.initLightbox();
    }
});

// Photography gallery rendering (uses gallery_data.js)
document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid || typeof galleryImages === 'undefined') return;

    galleryGrid.innerHTML = galleryImages.map((image, index) => {
        return `
            <div class="gallery-item" data-image="${image.filename}" data-title="${image.title}" data-index="${index}">
                <div class="gallery-image">
                    <img src="../images/${image.filename}" alt="${image.title}" loading="lazy">
                </div>
            </div>
        `;
    }).join('');

    if (typeof window.initLightbox === 'function') {
        window.initLightbox();
    }
});