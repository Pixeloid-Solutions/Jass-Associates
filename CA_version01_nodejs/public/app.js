/**
 * Application interactions and api logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect & Active States
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Highlight active nav link
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    const overlay = document.getElementById('overlay');

    function toggleMenu() {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.classList.replace('ph-list', 'ph-x');
        } else {
            icon.classList.replace('ph-x', 'ph-list');
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // 3. Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in-up');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            appearOnScroll.unobserve(entry.target);
        });
    }, appearOptions);

    fadeElements.forEach(el => {
        appearOnScroll.observe(el);
    });

    // 4. News Functionality (API Integration)
    const newsFeed = document.getElementById('newsFeed');
    const addNewsBtn = document.getElementById('addNewsBtn');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLoginBtn = document.getElementById('closeLoginBtn');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const adminPasscode = document.getElementById('adminPasscode');

    const closeFormBtn = document.getElementById('closeFormBtn');
    const formContainer = document.getElementById('addNewsFormContainer');
    const newsForm = document.getElementById('newsForm');
    const formTitle = document.getElementById('formTitle');

    // Admin State Management
    // Clear admin state on every page load so a server restart or refresh logs the user out
    sessionStorage.removeItem('adminPasscode');
    let isAdmin = false;

    // Toast helper
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        // Trigger entrance animation
        requestAnimationFrame(() => toast.classList.add('show'));
        // Auto-dismiss after 1.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 1500);
    }

    function updateAdminUI() {
        if (isAdmin) {
            adminLoginBtn.classList.add('hidden');
            adminLogoutBtn.classList.remove('hidden');
            addNewsBtn.classList.remove('hidden');
            document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => btn.style.display = 'inline-block');
        } else {
            adminLoginBtn.classList.remove('hidden');
            adminLogoutBtn.classList.add('hidden');
            addNewsBtn.classList.add('hidden');
            document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => btn.style.display = 'none');
            formContainer.classList.add('hidden');
        }
    }

    // Login Modal Logic
    adminLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
        setTimeout(() => loginModal.classList.add('active'), 10);
        loginError.classList.add('hidden');
        adminPasscode.value = '';
        adminPasscode.focus();
    });

    closeLoginBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
        setTimeout(() => loginModal.style.display = 'none', 300);
    });

    adminLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminPasscode');
        isAdmin = false;
        updateAdminUI();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = adminPasscode.value;
        if (code.trim() === '') return;

        try {
            const response = await fetch('/api/news/verify', {
                method: 'POST',
                headers: {
                    'X-Admin-Passcode': code
                }
            });

            if (response.ok) {
                sessionStorage.setItem('adminPasscode', code);
                isAdmin = true;
                updateAdminUI();
                loginError.classList.add('hidden');
                closeLoginBtn.click();
                showToast('Welcome back, Admin! 👋');
            } else {
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            loginError.textContent = 'Connection error. Please try again.';
            loginError.classList.remove('hidden');
        }
    });

    // Fetch and display news
    async function loadNews() {
        try {
            const response = await fetch('/api/news');
            if (!response.ok) throw new Error('Failed to fetch news');

            const newsItems = await response.json();

            if (newsItems.length === 0) {
                newsFeed.innerHTML = '<p class="loader">No updates available at the moment.</p>';
                return;
            }

            newsFeed.innerHTML = '';

            newsItems.forEach((item, index) => {
                const article = document.createElement('article');
                article.className = 'news-item fade-in-up visible'; // Make visible immediately when loaded dynamically
                article.style.animationDelay = `${index * 0.1}s`;

                article.innerHTML = `
                    <div class="news-controls">
                        <button class="icon-btn edit-btn" data-id="${item.id}" aria-label="Edit news"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete-btn" data-id="${item.id}" aria-label="Delete news"><i class="ph ph-trash"></i></button>
                    </div>
                    <span class="news-date"><i class="ph ph-calendar-blank"></i> ${item.date}</span>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-content">${item.content}</p>
                `;

                newsFeed.appendChild(article);
            });

            attachNewsListeners();
            updateAdminUI(); // Ensure new items have correct button visibility

        } catch (error) {
            console.error('Error:', error);
            newsFeed.innerHTML = '<p class="loader" style="color:red;">Unable to load updates. Please try again later.</p>';
        }
    }

    // Toggle Form
    addNewsBtn.addEventListener('click', () => {
        newsForm.reset();
        document.getElementById('newsId').value = '';
        formTitle.textContent = 'Add New Update';
        formContainer.classList.remove('hidden');
    });

    closeFormBtn.addEventListener('click', () => {
        formContainer.classList.add('hidden');
    });

    // Handle Form Submit (Add/Update)
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('newsId').value;
        const title = document.getElementById('newsTitle').value;
        const content = document.getElementById('newsContent').value;

        const newsData = { title, content };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/news/${id}` : '/api/news';

        try {
            const submitBtn = document.getElementById('submitNewsBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': sessionStorage.getItem('adminPasscode') || ''
                },
                body: JSON.stringify(newsData)
            });

            if (!response.ok) throw new Error('Failed to save');

            formContainer.classList.add('hidden');
            newsForm.reset();
            await loadNews();

        } catch (error) {
            if (error.message === 'Unauthorized') {
                alert('Unauthorized: Incorrect admin passcode.');
                adminLogoutBtn.click(); // force logout
            } else {
                alert('Failed to save news update.');
            }
        } finally {
            const submitBtn = document.getElementById('submitNewsBtn');
            submitBtn.textContent = 'Publish Update';
            submitBtn.disabled = false;
        }
    });

    // Attach Edit/Delete Listeners
    function attachNewsListeners() {
        const editBtns = document.querySelectorAll('.edit-btn');
        const deleteBtns = document.querySelectorAll('.delete-btn');

        editBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                // Normally we'd fetch the single item, but we can extract from DOM for simplicity here
                const article = e.currentTarget.closest('.news-item');
                const title = article.querySelector('.news-title').textContent;
                const content = article.querySelector('.news-content').textContent;

                document.getElementById('newsId').value = id;
                document.getElementById('newsTitle').value = title;
                document.getElementById('newsContent').value = content;

                formTitle.textContent = 'Edit Update';
                formContainer.classList.remove('hidden');
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this update?')) {
                    const id = e.currentTarget.getAttribute('data-id');
                    try {
                        const response = await fetch(`/api/news/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'X-Admin-Passcode': sessionStorage.getItem('adminPasscode') || ''
                            }
                        });

                        if (response.status === 401) {
                            throw new Error('Unauthorized');
                        } else if (response.ok) {
                            loadNews();
                        } else {
                            throw new Error('Delete failed');
                        }
                    } catch (error) {
                        console.error('Delete error:', error);
                        if (error.message === 'Unauthorized') {
                            alert('Unauthorized: Incorrect admin passcode.');
                            adminLogoutBtn.click();
                        } else {
                            alert('Failed to delete news.');
                        }
                    }
                }
            });
        });
    }

    // Initial Load
    loadNews();
});
