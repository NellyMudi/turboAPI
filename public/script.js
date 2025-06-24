// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentCourse = null;
let userPayments = [];

// Carousel State
let currentSlide = 0;
let featuredCourses = [];
let autoSlideInterval = null;

// Session management
let sessionHeartbeatInterval = null;

// Auth validation utility
function isTokenValid() {
    if (!authToken) {
        console.log('🔍 No auth token to validate');
        return false;
    }
    
    try {
        // Basic JWT structure check
        const parts = authToken.split('.');
        if (parts.length !== 3) {
            console.log('❌ Invalid JWT structure: expected 3 parts, got', parts.length);
            return false;
        }
        
        // Decode payload (simple check)
        const payload = JSON.parse(atob(parts[1]));
        
        // Only log detailed token info in debug mode or if there's an issue
        if (window.location.search.includes('debug=true') || localStorage.getItem('debugAuth')) {
            console.log('🔍 Token payload:', {
                userId: payload.id || payload._id || 'unknown',
                email: payload.email || 'unknown',
                exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'no expiration',
                iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'no issued time'
            });
        }
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log('❌ Token has expired at:', new Date(payload.exp * 1000).toLocaleString());
            return false;
        }
        
        console.log('✅ Token appears valid');
        return true;
    } catch (error) {
        console.error('❌ Token validation error:', error);
        return false;
    }
}

// Enhanced API call with token validation
async function authenticatedFetch(url, options = {}) {
    if (!authToken) {
        throw new Error('No authentication token');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Handle token expiration
    if (response.status === 401) {
        console.log('401 Unauthorized - token may be expired');
        handleInvalidToken();
        throw new Error('Authentication failed');
    }
    
    return response;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
    // Check authentication status and restore session
    if (authToken) {
        console.log('🔐 Found stored authentication token, validating...');
        
        // Quick token validation before making API calls
        if (isTokenValid()) {
            console.log('✅ Token appears valid, restoring session...');
            restoreUserSession();
        } else {
            console.log('❌ Token appears invalid, clearing session');
            handleInvalidToken();
        }
    } else {
        console.log('👤 No authentication token found, showing guest state');
        updateAuthState();
    }
    
    loadCourses();
    loadFeaturedCourses();
});

// Initialize application
function initializeApp() {
    console.log('🚀 Initializing LearnHub Course Platform');
    console.log('📧 Checking for existing authentication...');
    
    updateAuthState();
    initializeNavigation();
}

// Event Listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('paymentForm').addEventListener('submit', handlePayment);

    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            navigateToSection(target);
        });
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        showLoading(e.target);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            // Load user payments for registration status  
            try {
                const paymentsResponse = await fetch(`${API_BASE_URL}/payments/history`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (paymentsResponse.ok) {
                    const paymentsData = await paymentsResponse.json();
                    userPayments = paymentsData.data || paymentsData.payments || [];
                }
            } catch (error) {
                console.error('Error loading payments during login:', error);
                // Continue with login even if payments fail to load
                userPayments = [];
            }
            
            // Update UI and close modal
            updateAuthState();
            closeModal('loginModal');
            showNotification(`Welcome back, ${currentUser.name}!`, 'success');
            
            // Load user dashboard data
            loadUserDashboard();
            
            // Start session monitoring
            startSessionHeartbeat();
            
            console.log('Login successful for:', currentUser.email);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        hideLoading(e.target);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        showLoading(e.target);
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            // Initialize empty payments for new user
            userPayments = [];
            
            // Update UI and close modal
            updateAuthState();
            closeModal('signupModal');
            showNotification(`Welcome to LearnHub, ${currentUser.name}!`, 'success');
            
            // Load user dashboard data
            loadUserDashboard();
            
            // Start session monitoring
            startSessionHeartbeat();
            
            console.log('Signup successful for:', currentUser.email);
        } else {
            showNotification(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        hideLoading(e.target);
    }
}

// Session restoration for page refresh
async function restoreUserSession() {
    try {
        showAuthLoading(true);
        
        // Use the authenticated fetch utility
        const [profileResponse, paymentsResponse] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/auth/me`),
            authenticatedFetch(`${API_BASE_URL}/payments/history`).catch(error => {
                console.warn('Failed to load payment history during session restoration:', error);
                return null; // Don't fail session restoration if payments fail
            })
        ]);

        if (profileResponse.ok) {
            const data = await profileResponse.json();
            
            // Only log detailed API response in debug mode
            if (window.location.search.includes('debug=true') || localStorage.getItem('debugAuth')) {
                console.log('🔍 Profile API response:', data);
            }
            
            // Handle different API response structures
            const userData = data.user || data.data || data;
            
            if (!userData) {
                console.error('❌ No user data in API response:', data);
                throw new Error('Invalid user data structure');
            }
            
            currentUser = userData;
            console.log('✅ Session restored for:', currentUser.email || currentUser.name || 'user');
            
            // Load user payments for registration status
            if (paymentsResponse && paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                userPayments = paymentsData.data || paymentsData.payments || [];
                if (userPayments.length > 0) {
                    console.log(`💳 Loaded ${userPayments.length} payment records`);
                }
            } else {
                userPayments = [];
                if (window.location.search.includes('debug=true') || localStorage.getItem('debugAuth')) {
                    console.warn('⚠️ Could not load payment history during session restoration');
                }
            }
            
            updateAuthState();
            
            // Show welcome back message only if session was restored
            // (not on every page load for already authenticated users)
            if (currentUser && (currentUser._id || currentUser.id)) {
                const sessionRestoreKey = `session_restored_${currentUser._id || currentUser.id}`;
                const lastRestore = sessionStorage.getItem(sessionRestoreKey);
                const now = Date.now();
                
                // Show welcome message if it's been more than 5 minutes since last restore
                if (!lastRestore || now - parseInt(lastRestore) > 5 * 60 * 1000) {
                    showNotification(`Welcome back, ${currentUser.name || 'User'}!`, 'success');
                    sessionStorage.setItem(sessionRestoreKey, now.toString());
                }
            }
            
            // Success logging handled above
            
            // Start session heartbeat
            startSessionHeartbeat();
        } else {
            // Token is invalid or expired
            console.log('❌ Token validation failed during session restoration, status:', profileResponse.status);
            const errorData = await profileResponse.json().catch(() => ({}));
            console.log('❌ Error response:', errorData);
            throw new Error('Token validation failed');
        }
    } catch (error) {
        console.error('❌ Session restoration error:', error);
        
        // If the error is due to authentication, handle invalid token
        if (error.message === 'Authentication failed' || 
            error.message === 'Token validation failed' ||
            error.message === 'Invalid user data structure') {
            console.log('🔄 Handling authentication error during session restoration');
            handleInvalidToken();
        } else {
            console.log('🌐 Handling network/other error during session restoration');
            handleSessionError();
        }
    } finally {
        showAuthLoading(false);
    }
}

// Load user profile (for fresh logins)
async function loadUserProfile() {
    try {
        const [profileResponse, paymentsResponse] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/auth/me`),
            authenticatedFetch(`${API_BASE_URL}/payments/history`).catch(error => {
                console.warn('⚠️ Failed to load payment history:', error);
                return null;
            })
        ]);

        if (profileResponse.ok) {
            const data = await profileResponse.json();
            console.log('🔍 Profile data loaded:', data);
            
            // Handle different API response structures
            const userData = data.user || data.data || data;
            
            if (!userData) {
                console.error('❌ No user data in profile response:', data);
                throw new Error('Invalid user data structure');
            }
            
            currentUser = userData;
            updateAuthState();

            // Load user payments for registration status
            if (paymentsResponse && paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                userPayments = paymentsData.data || paymentsData.payments || [];
                console.log(`💳 Loaded ${userPayments.length} payment records for user`);
            } else {
                userPayments = [];
                console.warn('⚠️ Could not load payment history for user');
            }
            
            console.log('✅ User profile loaded successfully for:', currentUser.email || 'user');
        } else {
            console.log('❌ Profile load failed, status:', profileResponse.status);
            handleInvalidToken();
        }
    } catch (error) {
        console.error('❌ Profile load error:', error);
        
        if (error.message === 'Authentication failed' || 
            error.message === 'Invalid user data structure') {
            handleInvalidToken();
        } else {
            handleSessionError();
        }
    }
}

function logout() {
    console.log('Logging out user:', currentUser?.email || 'unknown');
    
    // Clear authentication state
    authToken = null;
    currentUser = null;
    userPayments = [];
    
    // Clear storage
    localStorage.removeItem('authToken');
    sessionStorage.clear(); // Clear session restore timestamps
    
    // Stop session monitoring
    stopSessionHeartbeat();
    
    // Update UI
    updateAuthState();
    navigateToSection('home');
    showNotification('Logged out successfully', 'success');
}

// Session heartbeat to keep session alive and detect server-side logouts
function startSessionHeartbeat() {
    // Clear any existing heartbeat
    stopSessionHeartbeat();
    
    // Check session every 5 minutes
    sessionHeartbeatInterval = setInterval(async () => {
        if (!authToken || !currentUser) {
            stopSessionHeartbeat();
            return;
        }
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
            
            if (!response.ok) {
                console.log('Session heartbeat failed - user may have been logged out');
                handleInvalidToken();
            } else {
                console.log('Session heartbeat successful');
            }
        } catch (error) {
            console.warn('Session heartbeat error:', error);
            // Don't immediately log out on heartbeat failure
            // Could be temporary network issue
        }
    }, 5 * 60 * 1000); // 5 minutes
}

function stopSessionHeartbeat() {
    if (sessionHeartbeatInterval) {
        clearInterval(sessionHeartbeatInterval);
        sessionHeartbeatInterval = null;
    }
}

// Handle invalid/expired token
function handleInvalidToken() {
    console.log('Handling invalid token - clearing session');
    
    // Clear authentication state
    authToken = null;
    currentUser = null;
    userPayments = [];
    localStorage.removeItem('authToken');
    
    // Stop session monitoring
    stopSessionHeartbeat();
    
    updateAuthState();
    
    // Only show notification if user was expecting to be logged in
    if (window.location.hash !== '#home') {
        showNotification('Your session has expired. Please login again.', 'warning');
        navigateToSection('home');
    }
}

// Handle session restoration errors (network issues, etc.)
function handleSessionError() {
    console.log('🌐 Session restoration failed due to network error');
    // Keep the token but show error - user can try again
    updateAuthState(); // This will show login button since currentUser is null
    
    // More helpful error message
    showNotification('Unable to restore your session. Please check your internet connection and refresh the page, or try logging in again.', 'error');
    
    // Add a retry mechanism
    setTimeout(() => {
        if (authToken && !currentUser) {
            console.log('🔄 Attempting automatic session restoration retry...');
            restoreUserSession();
        }
    }, 5000); // Retry after 5 seconds
}

// Show/hide authentication loading state
function showAuthLoading(show) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (show) {
        // Hide both auth buttons and user menu, show loading
        authButtons.style.display = 'none';
        userMenu.style.display = 'none';
        
        // Add loading indicator to header
        let loadingIndicator = document.getElementById('authLoading');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'authLoading';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            loadingIndicator.style.cssText = 'display: flex; align-items: center; color: var(--text-secondary);';
            
            // Insert after the nav element
            const nav = document.getElementById('nav');
            nav.appendChild(loadingIndicator);
        }
        loadingIndicator.style.display = 'flex';
    } else {
        // Hide loading indicator
        const loadingIndicator = document.getElementById('authLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // updateAuthState() will show the appropriate buttons
    }
}

function updateAuthState() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');
    const userName = document.getElementById('userName');

    if (authToken && currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        dashboardLink.style.display = 'block';
        userName.textContent = currentUser.name;
        
        // Show admin link if user is admin
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
            console.log('👑 Admin access granted');
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        dashboardLink.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

// Course Functions
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        const data = await response.json();

        if (response.ok) {
            const courses = data.data || data.courses || [];
            displayCourses(courses);
        } else {
            showNotification('Failed to load courses', 'error');
        }
    } catch (error) {
        console.error('Load courses error:', error);
        showNotification('Network error loading courses', 'error');
    }
}

function displayCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    
    if (courses.length === 0) {
        coursesGrid.innerHTML = '<p class="text-center">No courses available at the moment.</p>';
        return;
    }

    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="showCourseDetails('${course._id || course.id}')">
            <div class="course-card-header">
                <i class="fas fa-book"></i>
            </div>
            <div class="course-card-body">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-card-footer">
                    <span class="course-price">$${course.price}</span>
                    <span class="course-duration">
                        <i class="fas fa-clock"></i> ${course.duration} weeks
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

async function showCourseDetails(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
        const data = await response.json();

        if (response.ok) {
            currentCourse = data.data || data.course;
            displayCourseModal(data.data || data.course);
        } else {
            showNotification('Failed to load course details', 'error');
        }
    } catch (error) {
        console.error('Load course details error:', error);
        showNotification('Network error loading course details', 'error');
    }
}

function displayCourseModal(course) {
    const modalTitle = document.getElementById('courseModalTitle');
    const modalBody = document.getElementById('courseModalBody');

    modalTitle.textContent = course.title;
    
    const courseId = course._id || course.id;
    // Check if user has made successful payment for this course
    const isRegistered = currentUser && userPayments.some(payment => 
        payment.course === courseId && payment.status === 'completed'
    );

    modalBody.innerHTML = `
        <div class="course-details">
            <div class="course-header">
                <h3>${course.title}</h3>
                <span class="course-price">$${course.price}</span>
            </div>
            <p class="course-description">${course.description}</p>
            <div class="course-meta">
                <div class="course-meta-item">
                    <i class="fas fa-clock"></i>
                    <span>Duration: ${course.duration} weeks</span>
                </div>
                <div class="course-meta-item">
                    <i class="fas fa-user"></i>
                    <span>Instructor: ${course.instructor}</span>
                </div>
                <div class="course-meta-item">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Level: ${course.level}</span>
                </div>
                <div class="course-meta-item">
                    <i class="fas fa-folder"></i>
                    <span>Category: ${course.category}</span>
                </div>
                <div class="course-meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>Access Period: ${course.accessPeriod} months</span>
                </div>
            </div>
            <div class="course-actions">
                ${!authToken ? 
                    '<p class="text-center">Please <a href="#" onclick="showLogin()">login</a> to register for this course.</p>' :
                    isRegistered ? 
                        `<button class="btn btn-primary btn-full" onclick="showCourseMaterials('${courseId}')">
                            <i class="fas fa-book-open"></i> View Materials
                        </button>` :
                        `<button class="btn btn-primary btn-full" onclick="registerForCourse('${courseId}')">
                            <i class="fas fa-plus"></i> Register for Course
                        </button>`
                }
            </div>
        </div>
    `;

    showModal('courseModal');
}

// Featured Courses Functions
async function loadFeaturedCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        const data = await response.json();

        if (response.ok) {
            const courses = data.data || data.courses || [];
            // Get featured courses (first 6 courses for demo)
            featuredCourses = courses.slice(0, 6);
            displayFeaturedCourses(featuredCourses);
            initializeCarousel();
        }
    } catch (error) {
        console.error('Featured courses load error:', error);
        // Show fallback content or hide section
        const carousel = document.getElementById('featuredCoursesCarousel');
        carousel.innerHTML = '<p>Unable to load featured courses at the moment.</p>';
    }
}

function displayFeaturedCourses(courses) {
    const carousel = document.getElementById('featuredCoursesCarousel');
    
    if (courses.length === 0) {
        carousel.innerHTML = '<p>No featured courses available.</p>';
        return;
    }

    carousel.innerHTML = courses.map((course, index) => `
        <div class="featured-course-card ${index === 0 ? 'active' : ''}" data-index="${index}">
            <div class="featured-course-header">
                <i class="fas fa-${getCourseIcon(course.category)}"></i>
            </div>
            <div class="featured-course-body">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-meta">
                    <span class="course-level ${course.level.toLowerCase()}">${course.level}</span>
                    <span class="course-instructor">by ${course.instructor}</span>
                </div>
                <div class="featured-course-footer">
                    <span class="featured-course-price">$${course.price}</span>
                    <button class="btn btn-primary featured-course-btn" onclick="showCourseDetails('${course._id || course.id}')">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    generateCarouselDots(courses.length);
}

function getCourseIcon(category) {
    const icons = {
        'Programming': 'code',
        'Design': 'palette',
        'Marketing': 'bullhorn',
        'Business': 'briefcase',
        'Data Science': 'chart-line',
        'Personal Development': 'user-graduate',
        'Finance': 'dollar-sign',
        'IT & Software': 'server'
    };
    return icons[category] || 'book';
}

function generateCarouselDots(count) {
    const dotsContainer = document.getElementById('carouselDots');
    dotsContainer.innerHTML = Array.from({length: count}, (_, i) => `
        <div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>
    `).join('');
}

function initializeCarousel() {
    if (featuredCourses.length <= 1) return;

    // Start auto-slide
    startAutoSlide();

    // Add touch/swipe support for mobile
    const carousel = document.getElementById('featuredCoursesCarousel');
    let startX = 0;
    let scrollLeft = 0;

    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        stopAutoSlide();
    });

    carousel.addEventListener('touchmove', (e) => {
        if (!startX) return;
        e.preventDefault();
        const x = e.touches[0].pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    });

    carousel.addEventListener('touchend', () => {
        startX = 0;
        startAutoSlide();
    });

    // Pause auto-slide on hover
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
}

function nextSlide() {
    if (featuredCourses.length === 0) return;
    currentSlide = (currentSlide + 1) % featuredCourses.length;
    updateCarousel();
}

function previousSlide() {
    if (featuredCourses.length === 0) return;
    currentSlide = currentSlide === 0 ? featuredCourses.length - 1 : currentSlide - 1;
    updateCarousel();
}

function goToSlide(index) {
    if (featuredCourses.length === 0) return;
    currentSlide = index;
    updateCarousel();
    stopAutoSlide();
    setTimeout(startAutoSlide, 5000); // Restart auto-slide after manual navigation
}

function updateCarousel() {
    const carousel = document.getElementById('featuredCoursesCarousel');
    const cards = carousel.querySelectorAll('.featured-course-card');
    const dots = document.querySelectorAll('.carousel-dot');

    // Update active card
    cards.forEach((card, index) => {
        card.classList.toggle('active', index === currentSlide);
    });

    // Update active dot
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });

    // Scroll to current slide
    const cardWidth = 350 + 32; // card width + gap
    carousel.scrollTo({
        left: currentSlide * cardWidth,
        behavior: 'smooth'
    });
}

function startAutoSlide() {
    if (featuredCourses.length <= 1) return;
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        nextSlide();
    }, 5000); // Change slide every 5 seconds
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

async function registerForCourse(courseId) {
    if (!authToken) {
        showNotification('Please login to register for courses', 'warning');
        return;
    }

    // Show payment modal
    showPaymentModal(currentCourse);
}

// Payment Functions
function showPaymentModal(course) {
    const courseSummary = document.getElementById('courseSummary');
    
    courseSummary.innerHTML = `
        <h4>${course.title}</h4>
        <p>${course.description}</p>
        <div class="price">$${course.price}</div>
    `;

    currentCourse = course;
    showModal('paymentModal');
}

function updatePaymentForm() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentDetails = document.getElementById('paymentDetails');
    const submitBtn = document.getElementById('paymentSubmitBtn');

    if (!paymentMethod) {
        paymentDetails.innerHTML = '';
        paymentDetails.classList.remove('active');
        submitBtn.disabled = true;
        return;
    }

    submitBtn.disabled = false;
    
    let formHTML = '';
    
    switch(paymentMethod) {
        case 'MTN':
        case 'Orange':
            formHTML = `
                <div class="form-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input type="tel" id="phoneNumber" placeholder="+237123456789" required>
                    <small>Enter your ${paymentMethod} Mobile Money phone number</small>
                </div>
            `;
            break;
        case 'Credit Card':
            formHTML = `
                <div class="form-group">
                    <label for="cardNumber">Card Number</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="expiryMonth">Expiry Month</label>
                        <select id="expiryMonth" required>
                            <option value="">MM</option>
                            ${Array.from({length: 12}, (_, i) => {
                                const month = (i + 1).toString().padStart(2, '0');
                                return `<option value="${month}">${month}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expiryYear">Expiry Year</label>
                        <select id="expiryYear" required>
                            <option value="">YYYY</option>
                            ${Array.from({length: 10}, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return `<option value="${year}">${year}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cvv">CVV</label>
                        <input type="text" id="cvv" placeholder="123" maxlength="4" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="cardholderName">Cardholder Name</label>
                    <input type="text" id="cardholderName" placeholder="John Doe" required>
                </div>
            `;
            break;
    }

    paymentDetails.innerHTML = formHTML;
    paymentDetails.classList.add('active');
}

async function handlePayment(e) {
    e.preventDefault();
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    let paymentDetails = {};

    // Collect payment details based on method
    switch(paymentMethod) {
        case 'MTN':
        case 'Orange':
            paymentDetails.phoneNumber = document.getElementById('phoneNumber').value;
            break;
        case 'Credit Card':
            paymentDetails.cardNumber = document.getElementById('cardNumber').value;
            paymentDetails.expiryMonth = document.getElementById('expiryMonth').value;
            paymentDetails.expiryYear = document.getElementById('expiryYear').value;
            paymentDetails.cvv = document.getElementById('cvv').value;
            paymentDetails.cardholderName = document.getElementById('cardholderName').value;
            break;
    }

    try {
        showLoading(e.target);
        const response = await fetch(`${API_BASE_URL}/payments/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                courseId: currentCourse._id || currentCourse.id,
                paymentMethod,
                paymentDetails
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeModal('paymentModal');
            showNotification('Payment successful! You are now registered for the course.', 'success');
            
            // Add payment to local state
            if (data.data && data.data.payment) {
                userPayments.push(data.data.payment);
            }
            
            // Payment already creates registration, no need for separate registration call
            // The payment controller creates both payment and registration records
            
            // Refresh user dashboard
            if (document.getElementById('dashboard').style.display !== 'none') {
                loadUserDashboard();
            }
        } else {
            showNotification(data.message || 'Payment failed', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Network error during payment', 'error');
    } finally {
        hideLoading(e.target);
    }
}

// Debug function to check registration status
async function checkRegistrationStatus(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        console.log('Registration check for course', courseId, ':', data);
        
        if (response.ok) {
            showNotification('✅ You are properly registered for this course!', 'success');
        } else {
            showNotification(`❌ Registration issue: ${data.message}`, 'warning');
        }
    } catch (error) {
        console.error('Registration check error:', error);
        showNotification('Error checking registration status', 'error');
    }
}

// Note: Registration is now handled automatically by the payment controller
// when payment is successful. No separate registration call is needed.

// Dashboard Functions
async function loadUserDashboard() {
    if (document.getElementById('dashboard').style.display === 'none') {
        return;
    }

    try {
        // Load user courses and payment history in parallel
        const [coursesResponse, paymentsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE_URL}/payments/history`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        let courses = [];
        let payments = [];

        if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            courses = coursesData.data || coursesData.courses || [];
        }

        if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            payments = paymentsData.data || paymentsData.payments || [];
            userPayments = payments; // Store globally
            displayPaymentHistory(payments);
        }

        // Display user courses based on successful payments
        displayUserCourses(courses, payments);
    } catch (error) {
        console.error('Dashboard load error:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function displayUserCourses(courses, payments = []) {
    const myCoursesContainer = document.getElementById('myCourses');
    
    // Get course IDs from successful payments
    const paidCourseIds = payments
        .filter(payment => payment.status === 'completed')
        .map(payment => payment.course);

    // Filter courses user has paid for
    const userCourses = courses.filter(course => 
        paidCourseIds.includes(course._id || course.id)
    );

    if (userCourses.length === 0) {
        myCoursesContainer.innerHTML = '<p>You haven\'t registered for any courses yet.</p>';
        return;
    }

    myCoursesContainer.innerHTML = userCourses.map(course => `
        <div class="course-item">
            <div class="course-item-info">
                <h4>${course.title}</h4>
                <p>Enrolled: ${new Date(course.createdAt).toLocaleDateString()}</p>
                <small>Duration: ${course.duration} weeks • ${course.level}</small>
            </div>
            <div class="course-item-actions">
                <button class="btn btn-outline" onclick="showCourseMaterials('${course._id || course.id}')">
                    <i class="fas fa-book-open"></i> Materials
                </button>
                <button class="btn btn-outline" onclick="checkRegistrationStatus('${course._id || course.id}')" title="Debug: Check registration status">
                    <i class="fas fa-info-circle"></i> Check Status
                </button>
            </div>
        </div>
    `).join('');
}

function displayPaymentHistory(payments) {
    const paymentHistoryContainer = document.getElementById('paymentHistory');
    
    if (payments.length === 0) {
        paymentHistoryContainer.innerHTML = '<p>No payment history found.</p>';
        return;
    }

    paymentHistoryContainer.innerHTML = payments.map(payment => `
        <div class="payment-item">
            <div class="payment-info">
                <h4>$${payment.amount}</h4>
                <p>${payment.metadata?.courseName || 'Course Payment'}</p>
                <small>${new Date(payment.createdAt).toLocaleDateString()} • ${payment.paymentMethod}</small>
            </div>
            <span class="payment-status ${payment.status.toLowerCase()}">${payment.status}</span>
        </div>
    `).join('');
}

// Materials Functions
async function showCourseMaterials(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const materials = data.data || data.materials || [];
            const course = data.course || { title: 'Course Materials' };
            displayMaterialsModal(materials, course);
        } else {
            // More specific error handling
            let errorMessage = 'Access denied to course materials';
            if (response.status === 403) {
                errorMessage = data.message || 'You need to complete payment to access course materials. Please contact support if you believe this is an error.';
            } else if (response.status === 404) {
                errorMessage = 'Course not found or no materials available yet.';
            } else {
                errorMessage = data.message || 'Unable to load course materials.';
            }
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Materials load error:', error);
        showNotification('Network error loading course materials. Please try again.', 'error');
    }
}

function displayMaterialsModal(materials, course) {
    const modalTitle = document.getElementById('materialsModalTitle');
    const modalBody = document.getElementById('materialsModalBody');

    modalTitle.textContent = `${course.title} - Course Materials`;

    if (materials.length === 0) {
        modalBody.innerHTML = '<p>No materials available for this course yet.</p>';
    } else {
        const materialIcons = {
            'PDF': '📄',
            'Video': '🎥',
            'HTML': '📝',
            'Link': '🔗',
            'Other': '📁'
        };

        modalBody.innerHTML = `
            <div class="materials-list">
                ${materials.map(material => `
                    <div class="material-item enhanced">
                        <div class="material-icon-large">
                            ${materialIcons[material.type] || '📁'}
                        </div>
                        <div class="material-info">
                            <h4>${material.title}</h4>
                            <p>${material.description}</p>
                            <div class="material-meta">
                                <span class="material-type">${material.type}</span>
                                <span class="material-features">🔒 Secure • 📊 Progress • 📝 Notes</span>
                            </div>
                        </div>
                        <div class="material-actions">
                            <button class="btn btn-primary material-launch-btn" onclick="viewMaterial('${material._id || material.id}')">
                                <i class="fas fa-rocket"></i> Launch Enhanced Viewer
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="materials-footer">
                <div class="materials-info">
                    <h4>✨ Enhanced Viewing Experience</h4>
                    <ul>
                        <li>🔐 <strong>Secure Access:</strong> Content protection with watermarking</li>
                        <li>📊 <strong>Progress Tracking:</strong> Monitor your learning progress</li>
                        <li>📝 <strong>Note Taking:</strong> Add personal notes while studying</li>
                        <li>🔍 <strong>Zoom Controls:</strong> Adjust content for better readability</li>
                        <li>📱 <strong>Mobile Optimized:</strong> Perfect viewing on any device</li>
                        <li>🖥️ <strong>Fullscreen Mode:</strong> Distraction-free learning</li>
                    </ul>
                </div>
            </div>
        `;
    }

    showModal('materialsModal');
}

function getFileIcon(type) {
    const icons = {
        'pdf': 'pdf',
        'video': 'play',
        'document': 'text',
        'presentation': 'file-powerpoint',
        'spreadsheet': 'file-excel'
    };
    return icons[type] || 'file';
}

async function viewMaterial(materialId) {
    if (!materialId || materialId === 'undefined') {
        showNotification('Invalid material ID. Please try refreshing the page.', 'error');
        return;
    }

    // Show loading state
    showNotification('🚀 Launching enhanced viewer...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/materials/view/${materialId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            // Check if response is JSON or HTML
            const contentType = response.headers.get('Content-Type');
            
            if (contentType && contentType.includes('text/html')) {
                // Open enhanced HTML viewer in new window
                const htmlContent = await response.text();
                
                // Create enhanced viewer window with specific features
                const viewerWindow = window.open('', '_blank', 
                    'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
                
                if (viewerWindow) {
                    viewerWindow.document.write(htmlContent);
                    viewerWindow.document.close();
                    
                    // Focus the new window
                    viewerWindow.focus();
                    
                    // Close the materials modal
                    closeModal('materialsModal');
                    
                    showNotification('✨ Enhanced viewer launched successfully!', 'success');
                } else {
                    showNotification('❌ Popup blocked. Please allow popups for the enhanced viewer.', 'warning');
                }
            } else {
                // Handle JSON response (fallback)
                const data = await response.json();
                const material = data.material || data.data || { title: 'Material' };
                
                showNotification(`📖 Material accessed: ${material.title || 'Course Material'}`, 'success');
            }
        } else {
            const data = await response.json();
            let errorMessage = 'Failed to access material';
            
            if (response.status === 403) {
                errorMessage = data.message || '🔒 Access denied. Please ensure you have completed payment for this course.';
            } else if (response.status === 404) {
                errorMessage = '❌ Material not found or has been removed.';
            } else {
                errorMessage = data.message || '⚠️ Unable to access material.';
            }
            
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Material view error:', error);
        showNotification('🌐 Network error accessing material. Please check your connection.', 'error');
    }
}

// UI Helper Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset forms
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
}

function showLogin() {
    showModal('loginModal');
}

function showSignup() {
    showModal('signupModal');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function closeNotification() {
    document.getElementById('notification').classList.remove('show');
}

function showLoading(element) {
    const button = element.querySelector('button[type="submit"]') || element;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
}

function hideLoading(element) {
    const button = element.querySelector('button[type="submit"]') || element;
    button.disabled = false;
    
    // Restore original button text based on context
    if (button.closest('#loginForm')) {
        button.innerHTML = 'Login';
    } else if (button.closest('#signupForm')) {
        button.innerHTML = 'Sign Up';
    } else if (button.closest('#paymentForm')) {
        button.innerHTML = 'Process Payment';
    }
}

// Navigation Functions
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Special handling for home section - also show featured courses
    if (sectionId === 'home') {
        const featuredSection = document.getElementById('featured-courses');
        if (featuredSection) {
            featuredSection.style.display = 'block';
        }
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section-specific data
    if (sectionId === 'dashboard' && authToken) {
        loadUserDashboard();
        stopAutoSlide(); // Stop auto-slide when not on home
    } else if (sectionId === 'courses') {
        loadCourses();
        stopAutoSlide(); // Stop auto-slide when not on home
    } else if (sectionId === 'admin' && authToken && currentUser?.role === 'admin') {
        loadAdminSection();
        stopAutoSlide(); // Stop auto-slide when not on home
    } else if (sectionId === 'home') {
        // Restart auto-slide when returning to home
        startAutoSlide();
    } else {
        stopAutoSlide(); // Stop auto-slide for any other section
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

function initializeNavigation() {
    // Show home section by default (which includes featured courses)
    navigateToSection('home');
}

function toggleMobileMenu() {
    const nav = document.getElementById('nav');
    nav.classList.toggle('active');
}

// Listen for storage changes (multi-tab sync)
window.addEventListener('storage', (e) => {
    if (e.key === 'authToken') {
        if (e.newValue === null && authToken) {
            // User logged out in another tab
            console.log('🔄 User logged out in another tab, syncing...');
            authToken = null;
            currentUser = null;
            userPayments = [];
            stopSessionHeartbeat();
            updateAuthState();
            navigateToSection('home');
            showNotification('You have been logged out', 'info');
        } else if (e.newValue && !authToken) {
            // User logged in in another tab
            console.log('🔄 User logged in in another tab, syncing...');
            authToken = e.newValue;
            restoreUserSession();
        }
    }
});

// Debug function for manual auth status checking
window.debugAuth = function() {
    console.log('🔍 AUTH DEBUG INFORMATION:');
    console.log('📍 Current State:', {
        hasToken: !!authToken,
        tokenLength: authToken ? authToken.length : 0,
        hasCurrentUser: !!currentUser,
        userEmail: currentUser?.email || 'none',
        userName: currentUser?.name || 'none',
        userId: currentUser?._id || currentUser?.id || 'none',
        paymentsCount: userPayments?.length || 0,
        isHeartbeatActive: !!sessionHeartbeatInterval
    });
    
    if (authToken) {
        console.log('🔐 Token Validation:');
        isTokenValid(); // This will log detailed token info
    }
    
    console.log('💾 Storage:');
    console.log('- localStorage authToken:', localStorage.getItem('authToken') ? 'present' : 'missing');
    console.log('- sessionStorage keys:', Object.keys(sessionStorage).filter(k => k.includes('session_restored')));
    
    return {
        authenticated: !!authToken && !!currentUser,
        user: currentUser,
        paymentsCount: userPayments?.length || 0
    };
};

// Manual session restoration for debugging
window.retryAuth = function() {
    console.log('🔄 Manually retrying authentication...');
    
    if (!authToken) {
        console.log('❌ No token found, cannot retry');
        showNotification('No authentication token found. Please login again.', 'warning');
        return false;
    }
    
    console.log('🔍 Attempting session restoration...');
    restoreUserSession();
    return true;
};

// Enable/disable debug mode
window.enableAuthDebug = function() {
    localStorage.setItem('debugAuth', 'true');
    console.log('🔍 Auth debug mode enabled. Refresh the page to see detailed logs.');
};

window.disableAuthDebug = function() {
    localStorage.removeItem('debugAuth');
    console.log('🔕 Auth debug mode disabled.');
};

// Admin Functions
let currentAdminTab = 'courses';
let selectedCourseForMaterials = null;

// Load admin section
function loadAdminSection() {
    console.log('👑 Loading admin section');
    
    // Setup form event listeners
    setupAdminForms();
    
    // Load data for current tab
    if (currentAdminTab === 'courses') {
        loadAdminCourses();
    } else if (currentAdminTab === 'materials') {
        loadCoursesForMaterialManagement();
    } else if (currentAdminTab === 'analytics') {
        loadAnalytics();
    }
}

// Admin tab management
function showAdminTab(tabName) {
    currentAdminTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'courses') {
        loadAdminCourses();
    } else if (tabName === 'materials') {
        loadCoursesForMaterialManagement();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    }
}

// Course Management Functions
function showCreateCourseForm() {
    document.getElementById('createCourseForm').style.display = 'block';
    document.getElementById('courseTitle').focus();
}

function hideCourseForm() {
    document.getElementById('createCourseForm').style.display = 'none';
    document.getElementById('courseForm').reset();
}

async function loadAdminCourses() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/courses`);
        const data = await response.json();
        
        if (response.ok) {
            const courses = data.data || data.courses || [];
            displayAdminCourses(courses);
        } else {
            showNotification('Failed to load courses for admin', 'error');
        }
    } catch (error) {
        console.error('Admin courses load error:', error);
        showNotification('Error loading courses', 'error');
    }
}

function displayAdminCourses(courses) {
    const container = document.getElementById('adminCoursesList');
    
    if (courses.length === 0) {
        container.innerHTML = '<p class="text-center">No courses found. Create your first course!</p>';
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="admin-course-card">
            <div class="admin-course-header">
                <div>
                    <h4>${course.title}</h4>
                    <p style="color: var(--text-secondary); margin: 0;">${course.description}</p>
                </div>
                <div class="admin-course-status">
                    <span class="status-badge active">Active</span>
                </div>
            </div>
            <div class="admin-course-meta">
                <div><strong>Instructor:</strong> ${course.instructor}</div>
                <div><strong>Category:</strong> ${course.category}</div>
                <div><strong>Level:</strong> ${course.level}</div>
                <div><strong>Price:</strong> $${course.price}</div>
                <div><strong>Duration:</strong> ${course.duration} weeks</div>
                <div><strong>Created:</strong> ${new Date(course.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="admin-course-actions">
                <button class="btn btn-outline btn-small" onclick="editCourse('${course._id || course.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline btn-small" onclick="manageCourse('${course._id || course.id}')">
                    <i class="fas fa-cog"></i> Manage
                </button>
                <button class="btn btn-outline btn-small" onclick="viewCourseAnalytics('${course._id || course.id}')">
                    <i class="fas fa-chart-line"></i> Analytics
                </button>
                <button class="btn btn-outline btn-small" onclick="deleteCourse('${course._id || course.id}')" style="color: var(--error-color); border-color: var(--error-color);">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Setup forms when admin section is loaded
function setupAdminForms() {
    // Course form
    const courseForm = document.getElementById('courseForm');
    if (courseForm && !courseForm.hasAttribute('data-handler-added')) {
        courseForm.addEventListener('submit', handleCourseCreation);
        courseForm.setAttribute('data-handler-added', 'true');
    }
    
    // Material form
    const materialForm = document.getElementById('materialForm');
    if (materialForm && !materialForm.hasAttribute('data-handler-added')) {
        materialForm.addEventListener('submit', handleMaterialCreation);
        materialForm.setAttribute('data-handler-added', 'true');
    }
}

async function handleCourseCreation(e) {
    e.preventDefault();
    
    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        price: parseFloat(document.getElementById('coursePrice').value),
        duration: parseInt(document.getElementById('courseDuration').value),
        accessPeriod: parseInt(document.getElementById('courseAccessPeriod').value),
        instructor: document.getElementById('courseInstructor').value,
        category: document.getElementById('courseCategory').value,
        level: document.getElementById('courseLevel').value
    };
    
    const isEditing = editingCourse !== null;
    const url = isEditing ? `${API_BASE_URL}/courses/${editingCourse._id}` : `${API_BASE_URL}/courses`;
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
        showLoading(e.target);
        const response = await authenticatedFetch(url, {
            method: method,
            body: JSON.stringify(courseData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Course ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            hideCourseForm();
            loadAdminCourses(); // Refresh the list
        } else {
            showNotification(data.message || `Failed to ${isEditing ? 'update' : 'create'} course`, 'error');
        }
    } catch (error) {
        console.error(`Course ${isEditing ? 'update' : 'creation'} error:`, error);
        showNotification(`Error ${isEditing ? 'updating' : 'creating'} course`, 'error');
    } finally {
        hideLoading(e.target);
    }
}

// Material Management Functions
function showCreateMaterialForm() {
    document.getElementById('createMaterialForm').style.display = 'block';
    document.getElementById('materialTitle').focus();
}

function hideMaterialForm() {
    document.getElementById('createMaterialForm').style.display = 'none';
    document.getElementById('materialForm').reset();
}

async function loadCoursesForMaterialManagement() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/courses`);
        const data = await response.json();
        
        if (response.ok) {
            const courses = data.data || data.courses || [];
            populateCourseSelect(courses);
        }
    } catch (error) {
        console.error('Error loading courses for materials:', error);
    }
}

function populateCourseSelect(courses) {
    const select = document.getElementById('materialCourseSelect');
    select.innerHTML = '<option value="">Choose a course to manage materials</option>';
    
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course._id || course.id;
        option.textContent = course.title;
        select.appendChild(option);
    });
}

async function loadCourseMaterials(courseId) {
    selectedCourseForMaterials = courseId;
    const createBtn = document.getElementById('createMaterialBtn');
    
    if (!courseId) {
        createBtn.disabled = true;
        document.getElementById('adminMaterialsList').innerHTML = 
            '<p class="text-center">Select a course above to view and manage its materials.</p>';
        return;
    }
    
    createBtn.disabled = false;
    
    try {
        // Use admin-specific materials endpoint that bypasses registration check
        const response = await authenticatedFetch(`${API_BASE_URL}/materials/admin/${courseId}`);
        const data = await response.json();
        
        if (response.ok) {
            const materials = data.data || [];
            displayAdminMaterials(materials);
        } else {
            showNotification('Failed to load materials', 'error');
            document.getElementById('adminMaterialsList').innerHTML = 
                '<p class="text-center">Failed to load materials. Please try again.</p>';
        }
    } catch (error) {
        console.error('Error loading course materials:', error);
        showNotification('Error loading materials', 'error');
        document.getElementById('adminMaterialsList').innerHTML = 
            '<p class="text-center">Error loading materials. Please try again.</p>';
    }
}

function displayAdminMaterials(materials) {
    const container = document.getElementById('adminMaterialsList');
    
    if (materials.length === 0) {
        container.innerHTML = '<p class="text-center">No materials found for this course. Add some materials!</p>';
        return;
    }
    
    container.innerHTML = materials.map(material => `
        <div class="admin-material-card">
            <div class="admin-material-info">
                <h5>${material.title}</h5>
                <p>${material.description}</p>
                <div class="material-meta">
                    <span class="material-type">${material.type}</span>
                    <span>Order: ${material.order || 0}</span>
                    <span>${material.isPublished ? 'Published' : 'Draft'}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">
                        Created: ${new Date(material.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
            <div class="admin-material-actions">
                <button class="btn btn-outline btn-small" onclick="editMaterial('${material._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline btn-small" onclick="deleteMaterial('${material._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}



async function handleMaterialCreation(e) {
    e.preventDefault();
    
    if (!selectedCourseForMaterials && !editingMaterial) {
        showNotification('Please select a course first', 'warning');
        return;
    }
    
    const materialData = {
        title: document.getElementById('materialTitle').value,
        description: document.getElementById('materialDescription').value,
        type: document.getElementById('materialType').value,
        content: document.getElementById('materialContent').value,
        order: parseInt(document.getElementById('materialOrder').value) || 0,
        isPublished: document.getElementById('materialPublished').checked
    };
    
    const isEditing = editingMaterial !== null;
    const url = isEditing 
        ? `${API_BASE_URL}/materials/${editingMaterial._id}` 
        : `${API_BASE_URL}/materials/${selectedCourseForMaterials}`;
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
        showLoading(e.target);
        const response = await authenticatedFetch(url, {
            method: method,
            body: JSON.stringify(materialData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Material ${isEditing ? 'updated' : 'added'} successfully!`, 'success');
            hideMaterialForm();
            loadCourseMaterials(selectedCourseForMaterials); // Refresh the list
        } else {
            showNotification(data.message || `Failed to ${isEditing ? 'update' : 'add'} material`, 'error');
        }
    } catch (error) {
        console.error(`Material ${isEditing ? 'update' : 'creation'} error:`, error);
        showNotification(`Error ${isEditing ? 'updating' : 'adding'} material`, 'error');
    } finally {
        hideLoading(e.target);
    }
}

// Analytics Functions
async function loadAnalytics() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/payments/stats`);
        const data = await response.json();
        
        if (response.ok) {
            displayAnalytics(data.data || {});
        } else {
            // Mock analytics data for demo
            const mockAnalytics = {
                totalPayments: 156,
                totalRevenue: 15670.50,
                totalCourses: 12,
                totalUsers: 89,
                successRate: 94.2
            };
            displayAnalytics(mockAnalytics);
        }
    } catch (error) {
        console.error('Analytics load error:', error);
        // Show mock data on error
        const mockAnalytics = {
            totalPayments: 156,
            totalRevenue: 15670.50,
            totalCourses: 12,
            totalUsers: 89,
            successRate: 94.2
        };
        displayAnalytics(mockAnalytics);
    }
}

function displayAnalytics(stats) {
    const container = document.getElementById('analyticsGrid');
    
    container.innerHTML = `
        <div class="analytics-card">
            <h3><i class="fas fa-dollar-sign"></i> Total Revenue</h3>
            <div class="analytics-number">$${(stats.totalRevenue || 0).toLocaleString()}</div>
            <div class="analytics-label">All time earnings</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> 12.5% this month
            </div>
        </div>
        
        <div class="analytics-card">
            <h3><i class="fas fa-credit-card"></i> Total Payments</h3>
            <div class="analytics-number">${(stats.totalPayments || 0).toLocaleString()}</div>
            <div class="analytics-label">Successful transactions</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> 8.3% this month
            </div>
        </div>
        
        <div class="analytics-card">
            <h3><i class="fas fa-graduation-cap"></i> Total Courses</h3>
            <div class="analytics-number">${stats.totalCourses || 0}</div>
            <div class="analytics-label">Active courses</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> 2 new this month
            </div>
        </div>
        
        <div class="analytics-card">
            <h3><i class="fas fa-users"></i> Total Students</h3>
            <div class="analytics-number">${stats.totalUsers || 0}</div>
            <div class="analytics-label">Registered users</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> 15.7% this month
            </div>
        </div>
        
        <div class="analytics-card">
            <h3><i class="fas fa-check-circle"></i> Success Rate</h3>
            <div class="analytics-number">${(stats.successRate || 0).toFixed(1)}%</div>
            <div class="analytics-label">Payment success rate</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> 2.1% improvement
            </div>
        </div>
        
        <div class="analytics-card">
            <h3><i class="fas fa-chart-line"></i> Growth Rate</h3>
            <div class="analytics-number">23.4%</div>
            <div class="analytics-label">Monthly growth</div>
            <div class="analytics-trend up">
                <i class="fas fa-arrow-up"></i> Trending up
            </div>
        </div>
    `;
}

// Course editing functionality
let editingCourse = null;

function editCourse(courseId) {
    // Find the course data
    const courseCard = document.querySelector(`[onclick="editCourse('${courseId}')"]`).closest('.admin-course-card');
    const courseTitle = courseCard.querySelector('h4').textContent;
    const courseDescription = courseCard.querySelector('p').textContent;
    
    // Load course data from API
    loadCourseForEdit(courseId);
}

async function loadCourseForEdit(courseId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/courses/${courseId}`);
        const data = await response.json();
        
        if (response.ok) {
            const course = data.data;
            editingCourse = course;
            
            // Populate the form with course data
            document.getElementById('courseTitle').value = course.title;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('coursePrice').value = course.price;
            document.getElementById('courseDuration').value = course.duration;
            document.getElementById('courseAccessPeriod').value = course.accessPeriod;
            document.getElementById('courseInstructor').value = course.instructor;
            document.getElementById('courseCategory').value = course.category;
            document.getElementById('courseLevel').value = course.level;
            
            // Update form title and button
            document.querySelector('#createCourseForm h3').innerHTML = '<i class="fas fa-edit"></i> Edit Course';
            document.querySelector('#courseForm button[type="submit"]').textContent = 'Update Course';
            
            // Show the form
            showCreateCourseForm();
        } else {
            showNotification('Failed to load course data', 'error');
        }
    } catch (error) {
        console.error('Error loading course for edit:', error);
        showNotification('Error loading course data', 'error');
    }
}

function hideCourseForm() {
    document.getElementById('createCourseForm').style.display = 'none';
    document.getElementById('courseForm').reset();
    
    // Reset form to create mode
    editingCourse = null;
    document.querySelector('#createCourseForm h3').innerHTML = '<i class="fas fa-plus-circle"></i> Create New Course';
    document.querySelector('#courseForm button[type="submit"]').textContent = 'Create Course';
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone and will remove all associated materials and registrations.')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Course deleted successfully!', 'success');
            loadAdminCourses(); // Refresh the list
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to delete course', 'error');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showNotification('Error deleting course', 'error');
    }
}

function manageCourse(courseId) {
    showNotification('Advanced course management functionality coming soon!', 'info');
}

function viewCourseAnalytics(courseId) {
    showNotification('Course-specific analytics coming soon!', 'info');
}

// Material editing functionality
let editingMaterial = null;

async function editMaterial(materialId) {
    try {
        // For now, we'll find the material from the displayed list
        // In a real implementation, you might want to fetch the material data from API
        const materialCards = document.querySelectorAll('.admin-material-card');
        let materialData = null;
        
        // Find the material in the current list
        materialCards.forEach(card => {
            const editBtn = card.querySelector(`[onclick="editMaterial('${materialId}')"]`);
            if (editBtn) {
                materialData = {
                    _id: materialId,
                    title: card.querySelector('h5').textContent,
                    description: card.querySelector('p').textContent,
                    type: card.querySelector('.material-type').textContent,
                    // We'll need to get the actual content from API or store it
                    content: 'Content will be loaded from API',
                    order: parseInt(card.querySelector('.material-meta span:nth-child(2)').textContent.replace('Order: ', '')) || 0,
                    isPublished: card.querySelector('.material-meta span:nth-child(3)').textContent === 'Published'
                };
            }
        });
        
        if (materialData) {
            editingMaterial = materialData;
            
            // Populate the form
            document.getElementById('materialTitle').value = materialData.title;
            document.getElementById('materialDescription').value = materialData.description;
            document.getElementById('materialType').value = materialData.type;
            document.getElementById('materialContent').value = materialData.content;
            document.getElementById('materialOrder').value = materialData.order;
            document.getElementById('materialPublished').checked = materialData.isPublished;
            
            // Update form title and button
            document.querySelector('#createMaterialForm h3').innerHTML = '<i class="fas fa-edit"></i> Edit Material';
            document.querySelector('#materialForm button[type="submit"]').textContent = 'Update Material';
            
            // Show the form
            showCreateMaterialForm();
        } else {
            showNotification('Could not find material data', 'error');
        }
    } catch (error) {
        console.error('Error loading material for edit:', error);
        showNotification('Error loading material data', 'error');
    }
}

function hideMaterialForm() {
    document.getElementById('createMaterialForm').style.display = 'none';
    document.getElementById('materialForm').reset();
    
    // Reset form to create mode
    editingMaterial = null;
    document.querySelector('#createMaterialForm h3').innerHTML = '<i class="fas fa-plus-circle"></i> Add Course Material';
    document.querySelector('#materialForm button[type="submit"]').textContent = 'Add Material';
}

async function deleteMaterial(materialId) {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/materials/${materialId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Material deleted successfully!', 'success');
            // Refresh the materials list
            if (selectedCourseForMaterials) {
                loadCourseMaterials(selectedCourseForMaterials);
            }
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to delete material', 'error');
        }
    } catch (error) {
        console.error('Error deleting material:', error);
        showNotification('Error deleting material', 'error');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoSlide();
    stopSessionHeartbeat();
}); 