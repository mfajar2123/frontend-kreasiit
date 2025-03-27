// Global variables
const backendUrl = 'https://backendkreasiit-production.up.railway.app';
let jwtToken = localStorage.getItem('token') || '';
let currentUser = null;
let currentBlogId = null;
let allBlogs = [];
let currentPage = 1;
const blogsPerPage = 5;

// Check token on page load
$(document).ready(function() {
    if (!jwtToken) {
        window.location.href = 'login.html';
        return;
    }
    
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    validateTokenAndInitDashboard();
    

    // Toggle sidebar
    $('#sidebarToggle').on('click', function() {
        $('.sidebar').toggleClass('toggled');
        if ($('.sidebar').hasClass('toggled')) {
            $('.sidebar').css('width', '100px');
            $('.main-content').css('margin-left', '100px');
        } else {
            $('.sidebar').css('width', '280px');
            $('.main-content').css('margin-left', '280px');
        }
    });
    
    // Setup event handlers
    setupEventHandlers();
});



// Setup all event handlers
function setupEventHandlers() {
    // Logout button click
    $('#logoutBtn, #dropdownLogout').on('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Sidebar navigation
    $('.sidebar .nav-link').on('click', function(e) {
        e.preventDefault();
        const targetSection = $(this).data('section');
        showSection(targetSection);
        
        // Update active state
        $('.sidebar .nav-link').removeClass('active');
        $(this).addClass('active');
        
        // Jika pindah ke create blog, reset form
        if (targetSection === 'create-blog') {
            resetForm();
            $('#formTitle').text('Create New Blog');
        }
    });
    
    // Blog form submission (Create Blog)
    $('#blogForm').on('submit', function(e) {
        e.preventDefault();
        saveBlog();
    });
    
    // Edit blog form submission (Edit Blog Section)
    $('#editBlogSectionForm').on('submit', function(e) {
        e.preventDefault();
        updateBlogSection();
    });
    
    // Search button click
    $('#searchButton').on('click', function() {
        searchBlogs();
    });
    
    // Press Enter in search field
    $('#searchBlog').on('keyup', function(e) {
        if (e.key === 'Enter') {
            searchBlogs();
        }
    });
    
    // Sort dropdown options
    $('.dropdown-item[data-sort]').on('click', function(e) {
        e.preventDefault();
        const sortType = $(this).data('sort');
        sortBlogs(sortType);
    });
}

// Validate token and initialize dashboard
function validateTokenAndInitDashboard() {
    showLoading();
    
    // Extract username from JWT token (simplified approach)
    try {
        const tokenParts = jwtToken.split('.');
        if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.sub) {
                currentUser = payload.sub; // biasanya 'sub' adalah username
            }
        }
    } catch (e) {
        console.error('Error parsing token:', e);
    }
    $('#currentUser').css('color', 'black');
    
    // Validate token dengan request ke endpoint blogs
    $.ajax({
        url: `${backendUrl}/api/blogs`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function() {
            $('#currentUser').text(currentUser);
            loadDashboardData();
            showSection('dashboard-home');
            
        },
        error: function() {
            showToast('Session expired. Please login again.', 'error');
            logout(false);
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Logout function
function logout(showMessage = true) {
    localStorage.removeItem('token');
    jwtToken = '';
    currentUser = null;
    window.location.href = 'login.html';
}

// Show specific section
function showSection(sectionId) {
    $('.dashboard-section').hide();
    $(`#${sectionId}`).show();
    
    // Add specific actions for each section
    if (sectionId === 'dashboard-home') {
        loadRecentBlogs();
    } else if (sectionId === 'blog-management') {
        loadAllBlogs();
    } else if (sectionId === 'create-blog') {
        resetForm();
        $('#formTitle').text('Create New Blog');
    }
}

// Load dashboard data
function loadDashboardData() {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function(blogs) {
            allBlogs = blogs;
            $('#totalBlogs').text(blogs.length);
            
            // Hitung blog milik user
            const userBlogCount = blogs.filter(blog => blog.authorUsername === currentUser).length;
            $('#userBlogs').text(userBlogCount);
            
            loadRecentBlogs();
        },
        error: function(xhr) {
            console.error('Error loading blogs:', xhr);
            showToast('Failed to load dashboard data', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Load recent blogs for dashboard
function loadRecentBlogs() {
    if (allBlogs.length === 0) return;
    
    // Urutkan berdasarkan tanggal dibuat (terbaru dulu)
    const recentBlogs = [...allBlogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    
    let blogsHtml = '';
    
    if (recentBlogs.length === 0) {
        blogsHtml = '<div class="col-12 text-center"><p>No blog posts found</p></div>';
    } else {
        recentBlogs.forEach(blog => {
            const createdDate = new Date(blog.createdAt).toLocaleDateString('en-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            blogsHtml += `
    <div class="col-md-4 d-flex">
        <div class="card shadow h-100 w-100 d-flex flex-column">
            <div class="card-header py-3">
                <h5 class="m-0 fw-bold text-truncate">${blog.title}</h5>
            </div>
            <div class="card-body d-flex flex-column">
                
                <div class="small text-muted mb-2">
                    <i class="fas fa-user fa-fw"></i> ${blog.authorUsername}
                    <i class="fas fa-calendar-alt fa-fw ms-2"></i> ${createdDate}
                </div>
                <a href="#" class="btn btn-sm btn-primary view-blog mt-auto" data-id="${blog.id}">
                    Lihat Detail
                </a>
            </div>
        </div>
    </div>
`;

        });
    }
    
    $('#recentBlogsList').html(blogsHtml);
    
    // Event listener untuk tombol view blog
    $('.view-blog').on('click', function(e) {
        e.preventDefault();
        const blogId = $(this).data('id');
        viewBlog(blogId);
    });
}

// Load all blogs for blog management
function loadAllBlogs() {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function(blogs) {
            allBlogs = blogs;
            const paginatedBlogs = paginateBlogs(blogs, currentPage, blogsPerPage);
            populateBlogTable(paginatedBlogs);
        },
        error: function(xhr) {
            console.error('Error loading blogs:', xhr);
            showToast('Failed to load blog data', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Populate blog table in blog management section
function populateBlogTable(blogs) {
    let tableHtml = '';
    
    if (blogs.length === 0) {
        tableHtml = `
            <tr>
                <td colspan="6" class="text-center">No blog posts found</td>
            </tr>
        `;
    } else {
        blogs.forEach(blog => {
            const createdAt = new Date(blog.createdAt).toLocaleDateString('en-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            let updatedAt = blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString('en-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';
            
            const truncatedContent = blog.content.length > 100 ?
                blog.content.substring(0, 100) + '...' : blog.content;
            
            tableHtml += `
                <tr>
                    <td>${blog.id}</td>
                    <td>${blog.title}</td>
                    <td class="blog-content">${truncatedContent}</td>
                    <td>${createdAt}</td>
                    <td>${updatedAt}</td>
                    <td>
                    
                        <button class="btn btn-sm btn-info view-blog mb-1" data-id="${blog.id}">
                            <i class="fas fa-eye"></i> Lihat
                        </button>
                        <button class="btn btn-sm btn-info edit-blog mb-1" data-id="${blog.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-blog" data-id="${blog.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>

                    </td>
                </tr>
            `;
        });
    }
    
    $('#blogTableBody').html(tableHtml);
    
    // Event listeners untuk tombol edit dan delete
    $('.edit-blog').on('click', function() {
        const blogId = $(this).data('id');
        editBlog(blogId);
    });
    
    $('.delete-blog').on('click', function() {
        const blogId = $(this).data('id');
        showDeleteConfirmation(blogId);
    });

    $('.view-blog').on('click', function() {
        const blogId = $(this).data('id');
       
        viewBlog(blogId);
    });
}

// Fungsi untuk melihat detail blog (View Blog Section)
function viewBlog(blogId) {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs/${blogId}`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function(blog) {
            // Isi elemen view blog section
            $('#viewBlogTitleSection').text(blog.title);
            $('#viewBlogContentSection').text(blog.content);
            $('#viewBlogAuthorSection').html(`<i class="fas fa-user me-1"></i> ${blog.authorUsername}`);
            const createdDate = new Date(blog.createdAt).toLocaleDateString('en-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            $('#viewBlogDateSection').html(`<i class="fas fa-calendar-alt me-1"></i> ${createdDate}`);
            $('#viewBlogCreatedSection').text(createdDate);
            const updatedDate = blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString('en-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';
            $('#viewBlogUpdatedSection').text(updatedDate);
            
            showSection('view-blog');
        },
        error: function(xhr) {
            console.error('Error fetching blog details:', xhr);
            showToast('Failed to load blog details', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Fungsi untuk mengedit blog (Edit Blog Section)
function editBlog(blogId) {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs/${blogId}`,
        type: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function(blog) {
            currentBlogId = blog.id;
            // Isi form di Edit Blog Section
            $('#editBlogIdSection').val(blog.id);
            $('#editBlogTitleSection').val(blog.title);
            $('#editBlogContentSection').val(blog.content);
            
            showSection('edit-blog');
        },
        error: function(xhr) {
            console.error('Error fetching blog details:', xhr);
            showToast('Failed to load blog details', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Update blog dari Edit Blog Section
function updateBlogSection() {
    const blogTitle = $('#editBlogTitleSection').val().trim();
    const blogContent = $('#editBlogContentSection').val().trim();
    
    // Validasi form
    if (!blogTitle) {
        $('#editBlogTitleSection').addClass('is-invalid');
        return;
    } else {
        $('#editBlogTitleSection').removeClass('is-invalid');
    }
    
    if (!blogContent) {
        $('#editBlogContentSection').addClass('is-invalid');
        return;
    } else {
        $('#editBlogContentSection').removeClass('is-invalid');
    }
    
    const blogData = {
        title: blogTitle,
        content: blogContent
    };
    
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs/${currentBlogId}`,
        type: 'PUT',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(blogData),
        success: function() {
            showToast('Blog updated successfully');
            resetEditSectionForm();
            showSection('blog-management');
            loadAllBlogs();
            loadDashboardData();
        },
        error: function(xhr) {
            console.error('Error updating blog:', xhr);
            showToast('Failed to update blog', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Reset blog form (Create Blog Section)
function resetForm() {
    $('#blogForm')[0].reset();
    $('#blogId').val('');
    currentBlogId = null;
    $('#formTitle').text('Create New Blog');
    $('#saveButton').html('<i class="fas fa-save me-1"></i> Save Blog');
    $('#blogTitle, #blogContent').removeClass('is-invalid');
}

// Reset form di Edit Blog Section
function resetEditSectionForm() {
    $('#editBlogSectionForm')[0].reset();
    $('#editBlogIdSection').val('');
    currentBlogId = null;
    $('#editBlogTitleSection, #editBlogContentSection').removeClass('is-invalid');
}

// Save atau create blog (Create Blog Section)
function saveBlog() {
    const blogTitle = $('#blogTitle').val().trim();
    const blogContent = $('#blogContent').val().trim();
    
    // Validasi form
    if (!blogTitle) {
        $('#blogTitle').addClass('is-invalid');
        return;
    } else {
        $('#blogTitle').removeClass('is-invalid');
    }
    
    if (!blogContent) {
        $('#blogContent').addClass('is-invalid');
        return;
    } else {
        $('#blogContent').removeClass('is-invalid');
    }
    
    const blogData = {
        title: blogTitle,
        content: blogContent
    };
    
    showLoading();
    
    if (currentBlogId) {
        // Update blog yang ada (meskipun pada Edit Section kita menggunakan fungsi tersendiri)
        $.ajax({
            url: `${backendUrl}/api/blogs/${currentBlogId}`,
            type: 'PUT',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(blogData),
            success: function() {
                showToast('Blog updated successfully');
                resetForm();
                showSection('blog-management');
                loadAllBlogs();
                loadDashboardData();
            },
            error: function(xhr) {
                console.error('Error updating blog:', xhr);
                showToast('Failed to update blog', 'error');
            },
            complete: function() {
                hideLoading();
            }
        });
    } else {
        // Create blog baru
        $.ajax({
            url: `${backendUrl}/api/blogs`,
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(blogData),
            success: function() {
                showToast('Blog created successfully');
                resetForm();
                showSection('blog-management');
                loadAllBlogs();
                loadDashboardData();
            },
            error: function(xhr) {
                console.error('Error creating blog:', xhr);
                showToast('Failed to create blog', 'error');
            },
            complete: function() {
                hideLoading();
            }
        });
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(blogId) {
    currentBlogId = blogId;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
    
    // Setup tombol konfirmasi delete
    $('#confirmDeleteBtn').off('click').on('click', function() {
        deleteBlog(currentBlogId);
        modal.hide();
    });
}

// Delete blog
function deleteBlog(blogId) {
    showLoading();
    
    $.ajax({
        url: `${backendUrl}/api/blogs/${blogId}`,
        type: 'DELETE',
        headers: {
            'Authorization': `Bearer ${jwtToken}`
        },
        success: function() {
            showToast('Blog deleted successfully');
            loadAllBlogs();
            loadDashboardData();
        },
        error: function(xhr) {
            console.error('Error deleting blog:', xhr);
            showToast('Failed to delete blog', 'error');
        },
        complete: function() {
            hideLoading();
        }
    });
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    $('#currentTime').text(now.toLocaleDateString('en-ID', options));
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

// Search blogs
function searchBlogs() {
    const query = $('#searchBlog').val().toLowerCase();
    if (!query) {
        loadAllBlogs();
        return;
    }
    
    const filteredBlogs = allBlogs.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query)
    );
    
    currentPage = 1;
    const paginatedBlogs = paginateBlogs(filteredBlogs, currentPage, blogsPerPage);
    populateBlogTable(paginatedBlogs);
}

// Sort blogs
function sortBlogs(sortType) {
    let sortedBlogs = [...allBlogs];
    
    if (sortType === 'newest') {
        sortedBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === 'oldest') {
        sortedBlogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    // Update recent blogs list
    allBlogs = sortedBlogs;
    loadRecentBlogs();
}

// Pagination function
function paginateBlogs(blogs, page = 1, perPage = 5) {
    const totalPages = Math.ceil(blogs.length / perPage);
    const start = (page - 1) * perPage;
    const paginatedBlogs = blogs.slice(start, start + perPage);
    
    generatePagination(totalPages, page);
    return paginatedBlogs;
}

// Generate pagination links
function generatePagination(totalPages, currentPage) {
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" ${currentPage !== 1 ? `onclick="changePage(${currentPage - 1}); return false;"` : ''}>
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" ${currentPage !== totalPages && totalPages !== 0 ? `onclick="changePage(${currentPage + 1}); return false;"` : ''}>
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    $('#blogPagination').html(paginationHtml);
}

// Change page function
function changePage(page) {
    currentPage = page;
    const paginatedBlogs = paginateBlogs(allBlogs, currentPage, blogsPerPage);
    populateBlogTable(paginatedBlogs);
}

$(document).ready(function() {
    $.ajax({
      url: 'https://backendkreasiit-production.up.railway.app/actuator/health',
      type: 'GET',
      success: function(response) {
        // Contoh response: { "status": "UP", "components": {...} }
        if (response.status === 'UP') {
          $('#serverStatus').text('Online');
        } else {
          $('#serverStatus').text('Offline');
        }
      },
      error: function() {
        // Jika error, asumsikan server tidak up
        $('#serverStatus').text('Offline');
      }
    });
  });