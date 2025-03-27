
      // Initialize AOS
      AOS.init();

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

        // Load blog posts via AJAX
        function loadBlogs() {
          showSpinner();
          $.ajax({
            url: "https://backendkreasiit-production.up.railway.app/api/blogs",
            method: "GET",
            dataType: "json",
            success: function (data) {
              // Sort by createdAt descending
              data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );
              const latestBlogs = data.slice(0, 100);

              // Clear previous content
              $("#blog-list").empty();
              $("#sidebar-blog-titles").empty();

              $.each(latestBlogs, function (index, blog) {
                const formattedDate = formatDate(blog.createdAt);

                // Blog Card (in list)
                const blogCard = `
                <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="${
                  (index + 1) * 100
                }">
                  <div class="card blog-card h-100">
                    <img src="./img/blog_template.png" class="card-img-top" alt="${
                      blog.title
                    }">
                    <div class="card-body d-flex flex-column">
                      <h5 class="card-title">${blog.title}</h5>
                      <p class="blog-meta">
                        <i class="fas fa-user"></i> ${blog.authorUsername} 
                        <i class="fas fa-calendar-alt ms-2"></i> ${formattedDate}
                      </p>
                      <p class="card-text" style="flex-grow:1; overflow:hidden; text-overflow:ellipsis; white-space:normal;">
                        ${blog.content.substring(0, 100)}...
                      </p>
                      <button class="btn btn-primary mt-auto view-detail" data-id="${
                        blog.id
                      }">
                        Baca Selengkapnya
                      </button>
                    </div>
                  </div>
                </div>
              `;
                $("#blog-list").append(blogCard);

                // Sidebar Item
                const sidebarItem = `
                <li class="sidebar-blog-item view-detail" data-id="${blog.id}">
                  ${blog.title}
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
                  Gagal memuat blog terbaru. Silakan coba lagi nanti.
                </div>
              </div>
            `);
              hideSpinner();
              console.error("Error loading blog data:", error);
            },
          });
        }

        // Show blog detail in main content area (tanpa modal)
        function showBlogDetail(id) {
          showSpinner();
          $.ajax({
            url: "https://backendkreasiit-production.up.railway.app/api/blogs/" + id,
            method: "GET",
            dataType: "json",
            success: function (blog) {
              // Format blog detail content
              const formattedDate = formatDate(blog.createdAt);
              const detailContent = `
                      <div data-aos="fade-down" class="blog-header text-center">
                        <h2 style="color: var(--primary-color);">${blog.title}</h2>
                        <img src="./img/blog_template.png" alt="Gambar ${blog.title}" class="img-thumbnail mt-2" style="max-width: 50%; height: auto;">
                      </div>
                      <p data-aos="fade-right" class="blog-meta">
                        <i class="fas fa-user"></i> ${blog.authorUsername} 
                        <i class="fas fa-calendar-alt ms-2"></i> ${formattedDate}
                      </p>
                      <hr>
                      <div data-aos="fade-up" style="font-size: 1rem; line-height: 1.6; color: var(--text-color); padding: 1rem; text-align: justify;">
                        ${blog.content}
                      </div>
            `;
              $("#blog-detail").html(detailContent);
              // Tampilkan detail dan sembunyikan list
              $("#blog-list-container").hide();
              $("#hero").hide();
              $("#blog-detail-container").show();
              hideSpinner();
            },
            error: function () {
              hideSpinner();
              alert("Gagal memuat detail blog.");
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
        });

        // Load blogs saat halaman siap
        loadBlogs();
      });
    