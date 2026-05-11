import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    query, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// DOM Elements
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const addNewsBtn = document.getElementById('addNewsBtn');
const newsFeed = document.getElementById('newsFeed');

// Login Modal
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');

// News Modal
const newsModal = document.getElementById('newsModal');
const closeNewsModal = document.getElementById('closeNewsModal');
const saveNewsBtn = document.getElementById('saveNewsBtn');
const newsTitleInput = document.getElementById('newsTitleInput');
const newsContentInput = document.getElementById('newsContentInput');
const newsIdInput = document.getElementById('newsId');
const newsModalTitle = document.getElementById('newsModalTitle');

let currentUser = null;

// ========================================
// Authentication Logic
// ========================================

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Logged in
        adminLoginBtn.classList.add('hidden');
        adminLogoutBtn.classList.remove('hidden');
        addNewsBtn.classList.remove('hidden');
    } else {
        // Logged out
        adminLoginBtn.classList.remove('hidden');
        adminLogoutBtn.classList.add('hidden');
        addNewsBtn.classList.add('hidden');
    }
    // Re-render news to show/hide admin controls
    fetchNews();
});

// Open Login Modal
adminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('hidden');
    loginError.classList.add('hidden');
});

// Close Login Modal
closeLoginModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
});

// Handle Login
loginSubmitBtn.addEventListener('click', async () => {
    const email = adminEmail.value;
    const password = adminPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.add('hidden');
        adminEmail.value = '';
        adminPassword.value = '';
    } catch (error) {
        loginError.textContent = "Login failed: Invalid email or password.";
        loginError.classList.remove('hidden');
    }
});

// Handle Logout
adminLogoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth);
});


// ========================================
// News Logic (Firestore)
// ========================================

// Open Add News Modal
addNewsBtn.addEventListener('click', () => {
    newsIdInput.value = '';
    newsTitleInput.value = '';
    newsContentInput.value = '';
    newsModalTitle.textContent = "Add News";
    newsModal.classList.remove('hidden');
});

// Close News Modal
closeNewsModal.addEventListener('click', () => {
    newsModal.classList.add('hidden');
});

// Save News (Add or Update)
saveNewsBtn.addEventListener('click', async () => {
    if (!currentUser) return;

    const title = newsTitleInput.value.trim();
    const content = newsContentInput.value.trim();
    const id = newsIdInput.value;

    if (!title || !content) {
        alert("Please fill in both title and content.");
        return;
    }

    saveNewsBtn.disabled = true;
    saveNewsBtn.textContent = "Saving...";

    try {
        if (id) {
            // Update existing
            const newsRef = doc(db, "news", id);
            await updateDoc(newsRef, {
                title: title,
                content: content
            });
        } else {
            // Add new
            await addDoc(collection(db, "news"), {
                title: title,
                content: content,
                createdAt: serverTimestamp()
            });
        }
        newsModal.classList.add('hidden');
        fetchNews();
    } catch (error) {
        console.error("Error saving news: ", error);
        alert("Error saving news. Please try again.");
    } finally {
        saveNewsBtn.disabled = false;
        saveNewsBtn.textContent = "Save News";
    }
});

// Fetch and Render News
async function fetchNews() {
    try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        newsFeed.innerHTML = ''; // Clear loader
        
        if (querySnapshot.empty) {
            newsFeed.innerHTML = '<p style="text-align:center; color: var(--clr-gray-500);">No news updates available at the moment.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Format Date safely
            let dateStr = "Recently";
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }

            const newsItem = document.createElement('div');
            newsItem.className = 'news-item fade-in-up visible'; // visible so it shows immediately since it might be loaded after scroll
            
            let adminControls = '';
            if (currentUser) {
                adminControls = `
                    <div class="news-controls">
                        <button class="icon-btn edit-btn" data-id="${id}" data-title="${data.title}" data-content="${data.content}"><i class="ph ph-pencil-simple"></i></button>
                        <button class="icon-btn delete-btn" data-id="${id}"><i class="ph ph-trash"></i></button>
                    </div>
                `;
            }

            newsItem.innerHTML = `
                ${adminControls}
                <span class="news-date">${dateStr}</span>
                <h3 class="news-title">${data.title}</h3>
                <div class="news-content">${data.content}</div>
            `;
            
            newsFeed.appendChild(newsItem);
        });

        // Add event listeners to newly created edit/delete buttons
        if (currentUser) {
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const btnEl = e.currentTarget;
                    newsIdInput.value = btnEl.dataset.id;
                    newsTitleInput.value = btnEl.dataset.title;
                    newsContentInput.value = btnEl.dataset.content;
                    newsModalTitle.textContent = "Edit News";
                    newsModal.classList.remove('hidden');
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if (confirm("Are you sure you want to delete this news item?")) {
                        try {
                            await deleteDoc(doc(db, "news", id));
                            fetchNews();
                        } catch (error) {
                            console.error("Error deleting news:", error);
                            alert("Failed to delete news.");
                        }
                    }
                });
            });
        }

    } catch (error) {
        console.error("Error fetching news: ", error);
        newsFeed.innerHTML = '<p class="error-text">Failed to load news. Please check your connection or Firebase config.</p>';
    }
}
