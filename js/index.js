$(document).ready(function() {
  // Function to format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Function to truncate text
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
  
  // Load blog posts via AJAX
  $.ajax({
    url: 'https://backendkreasiit-production.up.railway.app/api/blogs',
    method: 'GET',
    dataType: 'json',
    success: function(data) {
      // Sort data berdasarkan createdAt secara descending (terbaru dulu)
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // Ambil hanya 3 data blog terbaru
      const latestBlogs = data.slice(0, 3);
      
      // Clear loading spinner atau kontainer blog
      $('#blog-container').empty();
      
      // Loop melalui 3 blog terbaru dan buat card
      $.each(latestBlogs, function(index, blog) {
        // Format tanggal
        const formattedDate = formatDate(blog.createdAt);
        // Truncate content untuk preview
        const previewContent = truncateText(blog.content, 100);
        
        // Buat blog card dengan delay animasi berdasarkan index
        const blogCard = `
          <div class="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
            <div class="card blog-card h-100 shadow-sm">
              <img src="./img/blog_template.png" class="card-img-top" alt="${blog.title}">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${blog.title}</h5>
                <div class="blog-meta mb-2">
                  <i class="fas fa-user"></i>
                  <span>${blog.authorUsername}</span>
                  <i class="fas fa-calendar-alt ms-3"></i>
                  <span>${formattedDate}</span>
                </div>
                <p class="card-text flex-grow-1">${previewContent}</p>
                <!-- <a href="/blog.html/${blog.id}" class="btn btn-primary mt-auto">Baca Selengkapnya</a> -->
                 <a href="/blog.html" class="btn btn-primary mt-auto">Baca Selengkapnya</a>
              </div>
            </div>
          </div>
        `;
        
        // Append blog card ke container
        $('#blog-container').append(blogCard);
      });
      
      // Re-initialize AOS animations jika diperlukan
      if (typeof AOS !== 'undefined') {
        AOS.refresh();
      }
    },
    error: function(xhr, status, error) {
      $('#blog-container').html(`
        <div class="col-12 text-center">
          <div class="alert alert-danger" role="alert">
            Gagal memuat blog terbaru. Silakan coba lagi nanti.
          </div>
        </div>
      `);
      console.error('Error loading blog data:', error);
    }
  });
});

document.querySelector("form").addEventListener("submit", function(event) {
  event.preventDefault(); // Mencegah form melakukan submit default

  // Ambil nilai dari input form
  let nama = document.getElementById("nama").value.trim();
  let email = document.getElementById("email").value.trim();
  let pesan = document.getElementById("pesan").value.trim();

  // Cek apakah input kosong
  if (!nama || !email || !pesan) {
    alert("Harap isi semua kolom sebelum mengirim pesan.");
    return;
  }

  // Buat template pesan WhatsApp
  let whatsappMessage = `Halo Kak,
Nama Saya: *${nama}*
Email: ${email}

${pesan}`;

  // Encode pesan agar sesuai format URL
  let encodedMessage = encodeURIComponent(whatsappMessage);

  // Nomor WhatsApp tujuan
  let whatsappNumber = "6282143863319";

  // Redirect ke WhatsApp
  window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
});
