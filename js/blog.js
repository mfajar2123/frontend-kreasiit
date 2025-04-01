// Initialize AOS with responsive settings
AOS.init({
  duration: 800,
  once: true,
  disable: 'mobile' // Disable AOS on mobile for better performance
});

$(document).ready(function () {
  // Show/hide loading spinner
  function showSpinner() {
    $("#spinner").show();
  }
  
  function hideSpinner() {
    $("#spinner").hide();
  }

  // Format date (dd/mm/yyyy)
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Truncate text with ellipsis
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  // Load blog posts via AJAX
  function loadBlogs() {
    showSpinner();
    $.ajax({
      url: "https://backendkreasiit-production.up.railway.app/api/blogs",
      method: "GET",
      dataType: "json",
      success: function (data) {
        // Sort by createdAt descending
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestBlogs = data.slice(0, 100);

        // Clear previous content
        $("#blog-list").empty();
        $("#sidebar-blog-titles").empty();

        // Check if we have blogs
        if (latestBlogs.length === 0) {
          $("#blog-list").html(`
            <div class="col-12 text-center">
              <div class="alert alert-info" role="alert">
                Belum ada blog yang tersedia. Silakan kembali lagi nanti.
              </div>
            </div>
          `);
          hideSpinner();
          return;
        }

        $.each(latestBlogs, function (index, blog) {
          const formattedDate = formatDate(blog.createdAt);
          const truncatedContent = truncateText(blog.content, 100);

          // Blog Card (in list)
          const blogCard = `
            <div class="col-xl-4 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${(index % 3) * 100}">
              <div class="card blog-card h-100">
                <img src="./img/blog_template.png" class="card-img-top" alt="${blog.title}">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">${blog.title}</h5>
                  <p class="blog-meta">
                    <i class="fas fa-user"></i> ${blog.authorUsername} 
                    <i class="fas fa-calendar-alt ms-2"></i> ${formattedDate}
                  </p>
                  <p class="card-text flex-grow-1">
                    ${truncatedContent}
                  </p>
                  <button class="btn btn-primary mt-auto view-detail" data-id="${blog.id}">
                    Baca Selengkapnya
                  </button>
                </div>
              </div>
            </div>
          `;

          $("#blog-list").append(blogCard);

          // Sidebar Item
          const sidebarItem = `
            <li class="sidebar-blog-item view-detail mb-2" data-id="${blog.id}">
              <span>${truncateText(blog.title, 40)}</span>
              <small class="d-block text-white-50 mt-1">${formattedDate}</small>
            </li>
          `;

          $("#sidebar-blog-titles").append(sidebarItem);
        });

        hideSpinner();
      },
      error: function (xhr, status, error) {
        $("#blog-list").html(`
          <div class="col-12 text-center">
            <div class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Gagal memuat blog terbaru. Silakan coba lagi nanti.
            </div>
          </div>
        `);
        hideSpinner();
        console.error("Error loading blog data:", error);
      },
    });
  }

  // Show blog detail in main content area
  function showBlogDetail(id) {
    showSpinner();
    $.ajax({
      url: "https://backendkreasiit-production.up.railway.app/api/blogs/" + id,
      method: "GET",
      dataType: "json",
      success: function (blog) {
        // Format blog detail content
        const formattedDate = formatDate(blog.createdAt);
        
        // Process content to add proper paragraph tags
        let formattedContent = blog.content;
        if (!formattedContent.includes('<p>')) {
          formattedContent = formattedContent.split('\n\n')
            .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('');
        }
        
        const detailContent = `
          <div class="blog-header text-center" data-aos="fade-down">
            <h2 style="color: var(--primary-color);">${blog.title}</h2>
            <img src="./img/blog_template.png" alt="Gambar ${blog.title}" class="img-fluid mt-3" style="max-width: 70%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          </div>
          <div class="d-flex justify-content-between align-items-center my-3 p-2 bg-light rounded" data-aos="fade-right">
            <div class="blog-meta">
              <i class="fas fa-user"></i> ${blog.authorUsername}
            </div>
            <div class="blog-meta">
              <i class="fas fa-calendar-alt"></i> ${formattedDate}
            </div>
          </div>
          <hr>
          <div class="blog-content" data-aos="fade-up" style="font-size: 1rem; line-height: 1.6; color: var(--text-color); padding: 1rem; text-align: justify;">
            ${formattedContent}
          </div>
          <div class="mt-4 p-3 bg-light rounded" data-aos="fade-up">
            <h5>Bagikan:</h5>
            <div class="d-flex gap-2">
              <a href="#" class="btn btn-sm" style="background-color: #3b5998; color: white;"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="btn btn-sm" style="background-color: #1da1f2; color: white;"><i class="fab fa-twitter"></i></a>
              <a href="#" class="btn btn-sm" style="background-color: #25D366; color: white;"><i class="fab fa-whatsapp"></i></a>
              <a href="#" class="btn btn-sm" style="background-color: #0077b5; color: white;"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        `;
  
        $("#blog-detail").html(detailContent);
        
        // Tampilkan detail dan sembunyikan list
        $("#blog-list-container").hide();
        
        // Paksa elemen hero benar-benar disembunyikan dengan CSS inline
        $("#hero").attr("style", "display: none !important");
        
        $("#blog-detail-container").show();
        
        // Re-initialize AOS for new content
        AOS.refresh();
        
        // Scroll to top of page
        window.scrollTo(0, 0);
        
        hideSpinner();
        
        // Tambahkan pengecekan ulang setelah jeda waktu singkat
        setTimeout(() => {
          if ($("#hero").is(":visible")) {
            console.log("Hero masih terlihat setelah timeout, memaksa hide lagi");
            $("#hero").attr("style", "display: none !important");
          }
        }, 100);
      },
      error: function () {
        hideSpinner();
        $("#blog-detail").html(`
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Gagal memuat detail blog. Silakan coba lagi nanti.
          </div>
        `);
        $("#blog-detail-container").show();
        $("#blog-list-container").hide();
        
        // Paksa elemen hero benar-benar disembunyikan
        $("#hero").attr("style", "display: none !important");
      },
    });
  }

  // Event delegation untuk klik blog detail
  $(document).on("click", ".view-detail", function () {
    const blogId = $(this).data("id");
    showBlogDetail(blogId);
  });

  // Kembali ke tampilan blog list
  $("#backToList").on("click", function () {
    $("#blog-detail-container").hide();
    $("#blog-list-container").show();
    $("#hero").show();
    
    // Small delay to ensure the hero is visible before scrolling
    setTimeout(() => {
      // Re-initialize AOS
      AOS.refresh();
    }, 100);
  });

  // Handle navbar collapse on mobile after click
  $('.navbar-nav>li>a').on('click', function(){
    $('.navbar-collapse').collapse('hide');
  });

  // Add shadow to navbar on scroll
  $(window).scroll(function() {
    if ($(this).scrollTop() > 50) {
      $('.navbar').addClass('shadow');
    } else {
      $('.navbar').removeClass('shadow');
    }
  });

  // Load blogs saat halaman siap
  loadBlogs();
});