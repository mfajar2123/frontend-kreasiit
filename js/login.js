// Global variables
const backendUrl = 'https://backendkreasiit-production.up.railway.app';
let jwtToken = localStorage.getItem('token') || '';

// Check token on page load
$(document).ready(function() {
    // Check if token exists
    if (jwtToken) {
        validateTokenAndRedirect();
    }
    
    // Toggle password visibility
    $('.toggle-password').on('click', function() {
        const passwordInput = $('#password');
        const icon = $(this).find('i');
        
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordInput.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    
    // Login form submission
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        login();
    });
});

// Login function
function login() {
    const username = $('#username').val();
    const password = $('#password').val();
    
    if (!username || !password) {
        showToast('Please enter both username and password', 'error');
        return;
    }
    
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/auth/login`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            password: password
        }),
        success: function(response) {
            if (response && response.token) {
                jwtToken = response.token;
                localStorage.setItem('token', jwtToken);
                window.location.href = 'dashboard.html';
            } else {
                showToast('Invalid response from server', 'error');
            }
        },
        error: function(xhr) {
            console.error('Login error:', xhr);
            let errorMessage = 'Username atau password salah';
            
            showToast(errorMessage, 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Validate token and redirect to dashboard if valid
function validateTokenAndRedirect() {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function() {
            window.location.href = 'dashboard.html';
        },
        error: function() {
            localStorage.removeItem('token');
            jwtToken = '';
            hideLoading();
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Show loading spinner
function showLoading() {
    $('#loadingSpinner').fadeIn(300);
}

// Hide loading spinner
function hideLoading() {
    $('#loadingSpinner').fadeOut(300);
}

// Show notification toast
function showToast(message, type = 'success') {
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icon} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    $('#toast-container').append(toastHtml);
    const toastElement = new bootstrap.Toast(document.getElementById(toastId), { delay: 3000 });
    toastElement.show();
    
    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
        $(this).remove();
    });
}