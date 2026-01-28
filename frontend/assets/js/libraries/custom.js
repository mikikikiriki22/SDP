/**
 * AromaVerse - Main Application JavaScript
 * 
 * Single Page Application using jQuery.spapp for routing
 * Handles all page views, navigation, and user interactions
 */

$(document).ready(function () {
  var app = $.spapp({ pageNotFound: "error_404" });

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================
  function updateNavActive() {
    const hash = window.location.hash || "#homepage";
    const view = hash.split("?")[0];
    // Update active state for navbar buttons
    $("#homepage-btn, #find-btn, #about-btn, #profile-btn, #adminpage-btn").each(function () {
      const $btn = $(this);
      const href = $btn.attr("href") || "";
      if (href === view) {
        $btn.addClass("active").attr("aria-current", "page");
      } else {
        $btn.removeClass("active").removeAttr("aria-current");
      }
    });
  }

  /** Render fragrances on homepage grid. Filters by query (name or brand), shows no-results message when empty. */
  function renderHomepageFragrances(fragrances, query) {
    var list = fragrances || [];
    var q = (query || "").trim().toLowerCase();
    var filtered = q ? list.filter(function (f) {
      var name = (f.name || "").toLowerCase();
      var brand = (f.brand_name || "").toLowerCase();
      return name.indexOf(q) !== -1 || brand.indexOf(q) !== -1;
    }) : list;
    var $grid = $("#homepage-fragrance-grid");
    var $noResults = $("#homepage-no-results");

    if (filtered.length === 0) {
      $grid.addClass("d-none").empty();
      $noResults.removeClass("d-none").find("p").text(q ? "No fragrances found matching your search." : "No fragrances in the catalogue yet.");
      return;
    }
    $noResults.addClass("d-none");
    $grid.removeClass("d-none");
    var cardsHtml = "";
    filtered.forEach(function (frag) {
      cardsHtml +=
        '<div class="col mb-5">' +
        '<a href="#item?id=' + frag.id + '" class="text-decoration-none d-block fragrance-card" data-id="' + frag.id + '">' +
        '<div class="card position-relative overflow-hidden" style="height: 400px;">' +
        '<img class="card-img h-100 w-100" src="' + (frag.image_url || "assets/images/default.jpg") + '" alt="Fragrance" style="object-fit: scale-down; display: block; border-radius: 10px;">' +
        '<div class="card-img-overlay d-flex flex-column align-items-center justify-content-end p-3">' +
        '<h5 class="fw-bolder mb-2" style="color: #8C6A5D;">' + (frag.name || "") + '</h5>' +
        '<p class="mb-0" style="color: #3E3232;"><span>' + (frag.brand_name || "") + '</span></p>' +
        '</div></div></a></div>';
    });
    $grid.html(cardsHtml);
  }

  /** Attach share-review click handlers. Call after rendering reviews list (initial load or after submit). */
  function attachShareReviewHandlers(fragranceId) {
    $(document).off('click', '.share-review-btn').on('click', '.share-review-btn', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var reviewCard = $(this).closest('.card');
      var ownerId = reviewCard.attr('data-review-owner-id') || '';
      var currentUser = null;
      try { currentUser = JSON.parse(localStorage.getItem('user')); } catch (err) { }
      var currentUserId = currentUser && currentUser.id ? String(currentUser.id) : null;
      if (!currentUserId || currentUserId !== ownerId) {
        if (typeof toastr !== 'undefined') toastr.warning('Only the review author can share this review.');
        else alert('Only the review author can share this review.');
        $(this).closest('.dropdown').removeClass('show');
        $(this).closest('.dropdown-menu').removeClass('show');
        return;
      }
      var platform = $(this).data('platform');
      var reviewId = $(this).data('review-id');
      var reviewerName = reviewCard.find('.card-title').text().trim();
      var ratingText = reviewCard.find('.card-text small').text().trim();
      var comment = reviewCard.find('.card-text').last().text().trim();
      var m = ratingText && ratingText.match(/Rating: (\d+)/);
      var rating = m ? m[1] : 'N/A';
      var frag = window.currentFragrance;
      var fragName = frag ? frag.name : 'Fragrance';
      var fragId = frag ? frag.id : fragranceId;
      var imgPath = (frag && frag.image_url) ? frag.image_url : 'assets/images/default.jpg';
      var base = (typeof Constants !== 'undefined' && Constants.FRONTEND_BASE_URL) ? Constants.FRONTEND_BASE_URL : (window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/'));
      var imageUrl = imgPath.indexOf('http') === 0 ? imgPath : (base.replace(/\/$/, '') + '/' + imgPath.replace(/^\//, ''));
      var reviewData = { review_id: reviewId, fragrance_name: fragName, reviewer_name: reviewerName, rating: rating, comment: comment, parfume_id: fragId, image_url: imageUrl };
      $(this).closest('.dropdown').removeClass('show');
      $(this).closest('.dropdown-menu').removeClass('show');
      if (typeof Utils !== 'undefined' && Utils.shareReview) Utils.shareReview(platform, reviewData);
      else alert('Sharing functionality not loaded. Please refresh the page.');
    });
  }

  function updateNavigationButtons() {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (e) { }

    // Always show homepage, find, and about buttons
    $("#homepage-btn").show();
    $("#find-btn").show();
    $("#about-btn").show();

    if (user && user.id) {
      // ===== USER IS LOGGED IN =====
      // Auth buttons: show logout, hide login and register
      $("#logout-btn").show().removeClass("force-hide");
      $("#login-btn").hide().addClass("force-hide");
      $("#register-btn").hide().addClass("force-hide");
      
      // Navigation: show profile button with icon (remove force-hide)
      $("#profile-btn").show().removeClass("force-hide");
      $("#profile-icon-link").show();
      
      // Admin panel: show only if admin (remove force-hide when showing)
      if (user.role === Constants.ADMIN_ROLE) {
        $("#adminpage-btn").show().removeClass("force-hide");
      } else {
        $("#adminpage-btn").hide().addClass("force-hide");
      }
      
      // Fetch user profile to get image_url for navbar icon
      RestClient.get(`users/${user.id}`, function (profile) {
        var container = $("#profile-icon-container");
        if (profile && profile.image_url) {
          container.html(`<img src="${profile.image_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;" />`);
        } else {
          container.html('<i class="bi bi-person-circle" style="font-size: 14px; color: #8C6A5D;"></i>');
        }
      }, function () {
        // On error, keep default icon
        $("#profile-icon-container").html('<i class="bi bi-person-circle" style="font-size: 14px; color: #8C6A5D;"></i>');
      });
    } else {
      // ===== USER IS NOT LOGGED IN =====
      // Auth buttons: show login and register, hide logout
      $("#login-btn").show().removeClass("force-hide");
      $("#register-btn").show().removeClass("force-hide");
      $("#logout-btn").hide().addClass("force-hide");
      
      // Navigation: hide profile button and icon (with force-hide)
      $("#profile-btn").hide().addClass("force-hide");
      $("#profile-icon-link").hide();
      
      // Admin panel: hide (with force-hide)
      $("#adminpage-btn").hide().addClass("force-hide");
    }
  }

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------
  app.route({
    view: "login",
    onCreate: function () { },
    onReady: function () {
      // If user is already logged in, redirect to homepage
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) { }
      if (user && user.id) {
        window.location.hash = "#homepage";
        toastr.info("You are already logged in.", "", { positionClass: "toast-top-right" });
        return;
      }
      
      // Hide all other sections and show only login
      $("#homepage, #find, #about").css("display", "none");
      $("#profile").css("display", "none");
      $("#admin").css("display", "none");
      $("#register").css("display", "none");
      $("#adminpage").css("display", "none");
      $("#item").css("display", "none");
      $("#error_404").css("display", "none");
      $("#login").css("display", "block");
      $("body").removeClass("bg-light").addClass("bg-dark");
      $("footer").hide();
      // Update navigation buttons (show login/register, hide logout)
      updateNavigationButtons();
      if (typeof AuthService !== "undefined" && AuthService.init) {
        AuthService.init();
      }
    },
  });

  app.route({
    view: "homepage",
    onCreate: function () { },
    onReady: function () {
      // Hide all other sections and show only homepage
      $("#item").html("");
      $("#homepage").css("display", "block");
      $("#find, #about, #profile, #admin, #register, #adminpage, #login, #error_404").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      // Update navigation buttons
      updateNavigationButtons();
      // Search: update results as user types
      $(document).off("input", "#homepage-search").on("input", "#homepage-search", function () {
        var q = $(this).val();
        if (window.homepageFragrances) renderHomepageFragrances(window.homepageFragrances, q);
      });
      // Load fragrances and render
      RestClient.get("parfumes", function (fragrances) {
        window.homepageFragrances = fragrances || [];
        var q = $("#homepage-search").val() || "";
        renderHomepageFragrances(window.homepageFragrances, q);
      });
    },
  });

  app.route({
    view: "find",
    onCreate: function () { },
    onReady: function () {
      $("#item").html("");
      $("#find").css("display", "block");
      $("#homepage, #about, #profile, #admin, #register, #adminpage, #item, #login, #error_404").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      updateNavigationButtons();

      // Load notes for preferences (checkboxes)
      RestClient.get("notes", function (notes) {
        const $container = $("#find-notes");
        $container.empty();
        if (notes && notes.length) {
          const $row = $("<div></div>").addClass("row g-2");
          notes.forEach(function (n) {
            const name = (n.name || n).toString().trim();
            const id = "find-note-" + name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
            const $col = $("<div></div>").addClass("col-6 col-md-4 col-lg-3");
            $col.append(
              $("<div></div>").addClass("form-check").append(
                $("<input>").attr({ type: "checkbox", name: "find-notes", id: id, value: name }).addClass("form-check-input"),
                $("<label>").attr("for", id).addClass("form-check-label").text(name)
              )
            );
            $row.append($col);
          });
          $container.append($row);
        } else {
          $container.html('<p class="text-muted small mb-0">No notes in database.</p>');
        }
      }, function () {
        $("#find-notes").html('<p class="text-danger small mb-0">Failed to load notes.</p>');
      });

      $("#find-results-wrapper").addClass("d-none");
      $("#find-empty").addClass("d-none");

      $(document).off("submit", "#find-fragrance-form").on("submit", "#find-fragrance-form", function (e) {
        e.preventDefault();
        const userSeasons = $('input[name="find-seasons"]:checked').map(function () { return this.value; }).get();
        const userNotes = $('input[name="find-notes"]:checked').map(function () { return this.value; }).get();
        const hasSeasons = userSeasons.length > 0;
        const hasNotes = userNotes.length > 0;
        if (!hasSeasons && !hasNotes) {
          $("#find-results-wrapper").addClass("d-none");
          $("#find-empty").removeClass("d-none").find(".lead").text("Select at least one season or note, then click \"Get recommendations\".");
          return;
        }
        $("#find-empty").addClass("d-none");
        $("#find-results").html('<div class="col-12 text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Finding your fragrances...</p></div>');
        $("#find-results-wrapper").removeClass("d-none");
        $("#find-results-intro").text("");

        RestClient.get("parfumes", function (fragrances) {
          function overlap(a, b, caseInsensitive) {
            const set = new Set((b || []).map(function (x) { return caseInsensitive ? String(x).toLowerCase() : String(x); }));
            return (a || []).filter(function (x) { return set.has(caseInsensitive ? String(x).toLowerCase() : String(x)); }).length;
          }
          const scored = fragrances.map(function (frag) {
            const fragSeasons = (frag.seasons || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
            const fragNotes = (frag.notes || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
            let seasonScore = 0, notesScore = 0;
            if (hasSeasons) seasonScore = userSeasons.length ? overlap(userSeasons, fragSeasons, false) / userSeasons.length : 0;
            if (hasNotes) notesScore = userNotes.length ? overlap(userNotes, fragNotes, true) / userNotes.length : 0;
            let total = 0;
            if (hasSeasons && hasNotes) total = ((seasonScore + notesScore) / 2) * 100;
            else if (hasSeasons) total = seasonScore * 100;
            else total = notesScore * 100;
            return { frag: frag, score: Math.round(total * 10) / 10 };
          });
          scored.sort(function (a, b) { return b.score - a.score; });

          const intro = scored.length ? "Sorted by match score (0–100%). Higher is better." : "No fragrances in the database yet.";
          $("#find-results-intro").text(intro);

          if (!scored.length) {
            $("#find-results").html('<div class="col-12 text-center py-4 text-muted">No fragrances to recommend.</div>');
            return;
          }
          let cardsHtml = "";
          scored.forEach(function (item) {
            const f = item.frag;
            cardsHtml += `
              <div class="col mb-4">
                <div class="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                  <a href="#item?id=${f.id}" class="text-decoration-none d-block">
                    <img class="card-img-top" src="${f.image_url || 'assets/images/default.jpg'}" alt="${(f.name || '').replace(/"/g, '&quot;')}" style="height: 220px; object-fit: cover;" />
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold mb-0" style="color: #8C6A5D;">${(f.name || '').replace(/</g, '&lt;')}</h5>
                        <span class="badge rounded-pill" style="background-color: #8C6A5D;">${item.score}% match</span>
                      </div>
                      <p class="card-text text-muted small mb-0">${(f.brand_name || '').replace(/</g, '&lt;')}</p>
                      ${f.notes ? '<p class="card-text small mt-1 text-secondary">' + (f.notes || '').replace(/</g, '&lt;') + '</p>' : ''}
                    </div>
                  </a>
                </div>
              </div>
            `;
          });
          $("#find-results").html(cardsHtml);
        }, function () {
          $("#find-results-intro").text("");
          $("#find-results").html('<div class="col-12 text-center py-4 text-danger">Failed to load fragrances. Please try again.</div>');
        });
      });
    },
  });

  app.route({
    view: "about",
    load: "about.html",
    onCreate: function () { },
    onReady: function () {
      // Hide all other sections
      $("#item").html("");
      $("#homepage, #find, #profile, #admin, #register, #adminpage, #item, #login, #error_404").css("display", "none");
      // Show about section (jQuery.spapp loads content via load property)
      $("#about").css("display", "block");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      updateNavigationButtons();
      updateNavActive();
    },
  });

  app.route({
    view: "profile",
    onCreate: function () { },
    onReady: function () {
      // Always show profile, hide others, and clear content at the start
      $("#profile").css("display", "block").html('<div class="text-center py-5">Loading profile...</div>');
      $("#homepage, #find, #about, #admin, #register, #adminpage, #item, #login, #error_404").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      // Update navigation buttons
      updateNavigationButtons();
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) { }
      if (!user || !user.id) {
        $("#profile").html(`
          <div class="container px-4 px-lg-5 my-5">
            <div class="alert alert-warning text-center">
              <h4 class="alert-heading">Profile Access Restricted</h4>
              <p>You must be logged in to view your profile.</p>
              <hr>
              <p class="mb-0">
                <a href="#login" class="btn btn-primary">Log in</a> or 
                <a href="#register" class="btn btn-outline-primary">Register</a>
              </p>
            </div>
          </div>
        `);
        // Double guarantee
        $("#profile").css("display", "block");
        $("#homepage, #find, #admin, #register, #adminpage, #item").css("display", "none");
        return;
      }
      RestClient.get(`users/${user.id}`, function (profile) {
        $("#profile").html(`
          <div class="container px-4 px-lg-5 my-5">
            <div class="row gx-4 gx-lg-5 align-items-center">
              <div class="col-md-5 text-center">
                <div id="profile-picture-block" class="mb-4">
                  <div style="width: 180px; height: 180px; margin: 0 auto; border-radius: 50%; background: #f5f5f5; border: 2px solid #8C6A5D; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${profile.image_url ? `<img id="profile-avatar-img" src="${profile.image_url}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />` : `<svg id="profile-avatar-placeholder" width='80' height='80' fill='#8C6A5D' viewBox='0 0 16 16'><path d='M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/><path fill-rule='evenodd' d='M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37c.69-1.19 2.065-2.37 5.468-2.37 3.403 0 4.778 1.18 5.468 2.37A7 7 0 0 0 8 1z'/></svg>`}
                  </div>
                  <input type="file" id="profile-picture-input" accept=".jpg,.jpeg,.png,.gif,.webp" class="d-none">
                  <div class="mt-3 d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <label for="profile-picture-input" class="btn btn-outline-primary btn-sm mb-0">Upload / Change picture</label>
                    ${profile.image_url ? '<button type="button" class="btn btn-outline-secondary btn-sm profile-picture-remove">Remove picture</button>' : ''}
                  </div>
                </div>
                <h2 class="fw-bolder mb-1" style="color: #8C6A5D;">${profile.username}</h2>
                <div class="fs-5 mb-3">
                  <span class="text-secondary">${profile.email}</span>
                </div>
              </div>
              <div class="col-md-1"></div>
              <div class="col-md-6">
                <h4 class="fw-bold mb-3" style="color: #8C6A5D;">Profile Description</h4>
                <p class="lead">${profile.about ? profile.about : '<span class="text-muted">No description provided.</span>'}</p>
                <button class="btn btn-outline-primary mt-4" id="edit-profile-btn">Edit Profile</button>
              </div>
            </div>
          </div>
        `);

        $("#editProfileModal").remove();
        $("body").append(`
          <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="editProfileModalLabel">Edit Profile</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="edit-profile-form">
                  <div class="modal-body">
                    <div class="mb-3">
                      <label for="edit-username" class="form-label">Username</label>
                      <input type="text" class="form-control" id="edit-username" value="${profile.username}" required>
                      </div>
                    <div class="mb-3">
                      <label for="edit-email" class="form-label">Email</label>
                      <input type="email" class="form-control" id="edit-email" value="${profile.email}" required>
                    </div>
                    <div class="mb-3">
                      <label for="edit-about" class="form-label">About</label>
                      <textarea class="form-control" id="edit-about" rows="3">${profile.about ? profile.about : ''}</textarea>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        `);
        $(document).off('click', '#edit-profile-btn').on('click', '#edit-profile-btn', function () {
          const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
          modal.show();
        });
        $(document).off('submit', '#edit-profile-form').on('submit', '#edit-profile-form', function (e) {
          e.preventDefault();
          const updatedData = {
            username: $('#edit-username').val(),
            email: $('#edit-email').val(),
            about: $('#edit-about').val()
          };
          RestClient.put(`users/${user.id}`, updatedData, function (response) {
            $('#editProfileModal').modal('hide');
            toastr.success('Profile updated successfully');
            location.reload();
          }, function (xhr) {
            const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
            toastr.error('Failed to update profile: ' + errorMsg);
          });
        });

        $(document).off('change', '#profile-picture-input').on('change', '#profile-picture-input', function () {
          var file = this.files && this.files[0];
          if (!file) return;
          var formData = new FormData();
          formData.append('image', file);
          $.ajax({
            url: Constants.PROJECT_BASE_URL + 'upload/image',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function (xhr) { xhr.setRequestHeader('Authentication', localStorage.getItem('user_token')); },
            success: function (res) {
              var url = res && res.image_url;
              if (!url) { toastr.error('Upload failed: no image URL'); return; }
              RestClient.put('users/' + user.id, { image_url: url }, function () {
                toastr.success('Profile picture updated');
                location.reload();
              }, function (xhr) {
                toastr.error(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to update profile picture');
              });
            },
            error: function (xhr) {
              var msg = (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : (xhr.responseText || 'Upload failed');
              toastr.error(msg);
            }
          });
          $(this).val('');
        });

        $(document).off('click', '.profile-picture-remove').on('click', '.profile-picture-remove', function () {
          RestClient.put('users/' + user.id, { image_url: null }, function () {
            toastr.success('Profile picture removed');
            location.reload();
          }, function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : (xhr.responseText || 'Failed to remove picture');
            toastr.error(msg);
          });
        });

        // After profile info, show user's reviews
        $("#profile").append(`
          <div class="container px-4 px-lg-5 my-5" id="user-reviews-section">
            <div class="row gx-4 gx-lg-5 align-items-center mt-5">
              <div class="col-12">
                <h3 class="fw-bold text-uppercase mb-4" style="color: #8C6A5D">My Reviews</h3>
                <div id="user-reviews-list"><p class='text-center'>Loading your reviews...</p></div>
              </div>
            </div>
          </div>
        `);
        RestClient.get(`reviews/user/${user.id}`, function (reviews) {
          let reviewsHtml = '';
          if (reviews && reviews.length > 0) {
            reviews.forEach(function (review) {
              reviewsHtml += `
                <div class="card mb-3" data-review-id="${review.id}">
                  <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h5 class="card-title">${review.fragrance_name || 'Fragrance'}</h5>
                      <p class="card-text">${review.comment || ''}</p>
                      <p class="card-text"><small class="text-muted">Rating: ${review.rating || 'N/A'}</small></p>
                    </div>
                    <button class="btn btn-outline-danger btn-sm delete-review-btn" data-review-id="${review.id}">Delete</button>
                  </div>
                </div>
              `;
            });
          } else {
            reviewsHtml = '<p class="text-center">You have not left any reviews yet.</p>';
          }
          $("#user-reviews-list").html(reviewsHtml);
        }, function () {
          $("#user-reviews-list").html('<p class="text-center text-danger">Failed to load your reviews.</p>');
        });

        // Handle review delete
        $(document).off('click', '.delete-review-btn').on('click', '.delete-review-btn', function () {
          const reviewId = $(this).data('review-id');
          const reviewCard = $(`.card[data-review-id='${reviewId}']`);
          if (confirm('Are you sure you want to delete this review?')) {
            RestClient.delete(`reviews/${reviewId}`, function (response) {
              // Check if response indicates success
              if (response && (response.success !== false)) {
                reviewCard.fadeOut(300, function () {
                  $(this).remove();
                  // Reload reviews to update the list
                  RestClient.get(`reviews/user/${user.id}`, function (reviews) {
                    let reviewsHtml = '';
                    if (reviews && reviews.length > 0) {
                      reviews.forEach(function (review) {
                        reviewsHtml += `
                          <div class="card mb-3" data-review-id="${review.id}">
                            <div class="card-body d-flex justify-content-between align-items-center">
                              <div>
                                <h5 class="card-title">${review.fragrance_name || 'Fragrance'}</h5>
                                <p class="card-text">${review.comment || ''}</p>
                                <p class="card-text"><small class="text-muted">Rating: ${review.rating || 'N/A'}</small></p>
                              </div>
                              <button class="btn btn-outline-danger btn-sm delete-review-btn" data-review-id="${review.id}">Delete</button>
                            </div>
                          </div>
                        `;
                      });
                    } else {
                      reviewsHtml = '<p class="text-center">You have not left any reviews yet.</p>';
                    }
                    $("#user-reviews-list").html(reviewsHtml);
                  });
                });
                toastr.success('Review deleted successfully');
              } else {
                toastr.error(response?.message || 'Failed to delete review');
              }
            }, function (xhr) {
              const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
              toastr.error('Failed to delete review: ' + errorMsg);
            });
          }
        });

        // Double guarantee at the end
        $("#profile").css("display", "block");
        $("#homepage, #find, #admin, #register, #adminpage, #item").css("display", "none");
      }, function () {
        $("#profile").html('<div class="alert alert-danger text-center">Failed to load profile data.</div>');
        // Double guarantee
        $("#profile").css("display", "block");
        $("#homepage, #find, #admin, #register, #adminpage, #item").css("display", "none");
      });
    },
  });

  app.route({
    view: "adminpage",
    onCreate: function () { },
    onReady: function () {
      // Admin-only: redirect non-admins (including direct #adminpage access)
      let user = null;
      try { user = JSON.parse(localStorage.getItem("user")); } catch (e) { }
      if (!user || !user.id || user.role !== Constants.ADMIN_ROLE) {
        if (typeof toastr !== "undefined") toastr.error("Access denied. Admin only.");
        window.location.hash = "#homepage";
        return;
      }

      $("#item").html("");
      $("#adminpage").css("display", "block");
      $("#homepage, #find, #about, #profile, #register, #admin, #login, #error_404").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      // Update navigation buttons
      updateNavigationButtons();

      // USERS CRUD
      function loadAdminUsers() {
        RestClient.get("users", function (users) {
          let usersHtml = users.map(user => `
            <tr data-user-id="${user.id}">
              <th scope="row">${user.id}</th>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td>
                ${user.image_url ? `<img src='${user.image_url}' alt='User Image' style='width:40px;height:40px;border-radius:50%;object-fit:cover;' />` : `<svg width='32' height='32' fill='#8C6A5D' viewBox='0 0 16 16'><path d='M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/><path fill-rule='evenodd' d='M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37c.69-1.19 2.065-2.37 5.468-2.37 3.403 0 4.778 1.18 5.468 2.37A7 7 0 0 0 8 1z'/></svg>`}
              </td>
              <td>
                <button class="btn btn-primary view-user-btn">View</button>
                <button class="btn btn-danger delete-user-btn">Delete</button>
              </td>
            </tr>
          `).join("");
          $("#admin-users-table tbody").html(usersHtml);
        });
      }
      loadAdminUsers();
      // View user details in modal
      $(document).off('click', '.view-user-btn').on('click', '.view-user-btn', function () {
        const row = $(this).closest('tr');
        const userId = row.data('user-id');
        RestClient.get(`users/${userId}`, function (user) {
          $("body").append(`
            <div class="modal fade" id="viewUserModal" tabindex="-1" aria-labelledby="viewUserModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="viewUserModalLabel">User Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>About:</strong> ${user.about || ''}</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
          `);
          const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
          modal.show();
          $('#viewUserModal').on('hidden.bs.modal', function () { $(this).remove(); });
        });
      });
      // Delete user
      $(document).off('click', '.delete-user-btn').on('click', '.delete-user-btn', function () {
        const row = $(this).closest('tr');
        const userId = row.data('user-id');
        if (confirm('Are you sure you want to delete this user?')) {
          RestClient.delete(`users/${userId}`, function (response) {
            if (response && (response.success !== false)) {
              row.fadeOut(300, function () {
                $(this).remove();
              });
              toastr.success('User deleted successfully');
            } else {
              toastr.error(response?.message || 'Failed to delete user');
            }
          }, function (xhr) {
            const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
            toastr.error('Failed to delete user: ' + errorMsg);
          });
        }
      });

      // FRAGRANCES CRUD
      function loadFragrances() {
        RestClient.get("parfumes", function (fragrances) {
          let fragHtml = fragrances.map(frag => `
            <tr data-frag-id="${frag.id}">
              <th scope="row">${frag.id}</th>
              <td>${frag.brand_name}</td>
              <td>${frag.name}</td>
              <td>${frag.notes || ''}</td>
              <td>${frag.category || 'EDP'}</td>
              <td>${frag.image_url || ''}</td>
              <td class="text-nowrap">
                <div class="d-flex gap-1">
                  <button class="btn btn-primary edit-frag-btn" data-bs-toggle="modal" data-bs-target="#addFragranceModal">Edit</button>
                  <button class="btn btn-danger delete-frag-btn">Delete</button>
                </div>
              </td>
            </tr>
          `).join("");
          $("#admin-frag-table tbody").html(fragHtml);
        });
      }
      loadFragrances();
      $(document).off('click', '.delete-frag-btn').on('click', '.delete-frag-btn', function () {
        const row = $(this).closest('tr');
        const fragId = row.data('frag-id');
        if (confirm('Are you sure you want to delete this fragrance?')) {
          RestClient.delete(`parfumes/${fragId}`, function (response) {
            if (response && (response.success !== false) && !response.error) {
              row.fadeOut(300, function () {
                $(this).remove();
              });
              toastr.success(response?.message || 'Fragrance deleted successfully');
            } else {
              toastr.error(response?.error || response?.message || 'Failed to delete fragrance');
            }
          }, function (xhr) {
            const errorMsg = xhr.responseJSON?.error || xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
            toastr.error('Failed to delete fragrance: ' + errorMsg);
          });
        }
      });
      // Add fragrance
      $(document).off('click', '[data-bs-target="#addFragranceModal"]:not(.edit-frag-btn)').on('click', '[data-bs-target="#addFragranceModal"]:not(.edit-frag-btn)', function () {
        $('#addFragranceModalLabel').text('Add New Fragrance');
        $('#addFragranceModal form')[0].reset();
        $('#submitFragranceBtn').text('Add Fragrance').data('edit-id', '').removeAttr('data-edit-id');
        $('#imagePreview').hide();
        $('#fragranceImage').val('');
      });

      // Prevent form submission
      $(document).off('submit', '#addFragranceModal form').on('submit', '#addFragranceModal form', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });

      // Image preview
      $(document).off('change', '#fragranceImage').on('change', '#fragranceImage', function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            $('#previewImg').attr('src', e.target.result);
            $('#imagePreview').show();
          };
          reader.readAsDataURL(file);
        } else {
          $('#imagePreview').hide();
        }
      });
      // Edit fragrance
      $(document).off('click', '.edit-frag-btn').on('click', '.edit-frag-btn', function () {
        const row = $(this).closest('tr');
        const fragId = row.data('frag-id');
        RestClient.get(`parfumes/${fragId}`, function (frag) {
          $('#addFragranceModalLabel').text('Edit Fragrance');
          $('#fragranceName').val(frag.name);
          $('#brandName').val(frag.brand_name || '');
          $('#brandCountry').val(frag.brand_country || '');
          $('#description').val(frag.description || '');
          // Store existing image URL for reference (can't set file input value)
          $('#fragranceImage').data('existing-url', frag.image_url || '');
          // Clear file input and show existing image in preview
          $('#fragranceImage').val('');
          if (frag.image_url) {
            $('#previewImg').attr('src', frag.image_url);
            $('#imagePreview').show();
          } else {
            $('#imagePreview').hide();
          }
          $('#notes').val(frag.notes || '');
          $('#seasons').val(frag.seasons ? frag.seasons.split(', ') : []);
          $('#submitFragranceBtn').text('Save Changes').data('edit-id', fragId);
        });
      });
      // Submit add/edit fragrance
      $(document).off('click', '#submitFragranceBtn').on('click', '#submitFragranceBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const fragId = $(this).data('edit-id');

        // Validate required fields
        const fragranceName = $('#fragranceName').val().trim();
        const brandName = $('#brandName').val().trim();
        const brandCountry = $('#brandCountry').val().trim();

        if (!fragranceName) {
          toastr.error('Fragrance name is required');
          return;
        }

        if (!brandName) {
          toastr.error('Brand name is required');
          return;
        }

        if (!brandCountry) {
          toastr.error('Brand country is required');
          return;
        }

        // Function to save fragrance after image upload
        const saveFragrance = function (imageUrl) {
          const data = {
            name: fragranceName,
            brand_name: brandName,
            brand_country: brandCountry,
            description: $('#description').val().trim() || '',
            image_url: imageUrl || '',
            notes: $('#notes').val().trim() || '',
            seasons: $('#seasons').val() ? $('#seasons').val().join(', ') : ''
          };

          if (fragId) {
            RestClient.put(`parfumes/${fragId}`, data, function (response) {
              $('#addFragranceModal').modal('hide');
              loadFragrances();
              if ($("#homepage").css("display") !== "none") {
                RestClient.get("parfumes", function (fragrances) {
                  window.homepageFragrances = fragrances || [];
                  renderHomepageFragrances(window.homepageFragrances, $("#homepage-search").val() || "");
                });
              }
              toastr.success('Fragrance updated successfully');
            }, function (xhr) {
              const errorMsg = xhr.responseJSON?.error || xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
              toastr.error('Failed to update fragrance: ' + errorMsg);
            });
          } else {
            RestClient.post('parfumes', data, function (response) {
              $('#addFragranceModal').modal('hide');
              // Reset form
              $('#addFragranceModal form')[0].reset();
              $('#imagePreview').hide();
              loadFragrances();
              if ($("#homepage").css("display") !== "none") {
                RestClient.get("parfumes", function (fragrances) {
                  window.homepageFragrances = fragrances || [];
                  renderHomepageFragrances(window.homepageFragrances, $("#homepage-search").val() || "");
                });
              }
              toastr.success('Fragrance added successfully');
            }, function (xhr) {
              const errorMsg = xhr.responseJSON?.error || xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
              toastr.error('Failed to add fragrance: ' + errorMsg);
            });
          }
        };

        // Check if a file is selected
        const imageFileInput = document.getElementById('fragranceImage');
        const imageFile = imageFileInput && imageFileInput.files && imageFileInput.files.length > 0 ? imageFileInput.files[0] : null;

        if (imageFile) {
          // Show loading message
          toastr.info('Uploading image...', '', { timeOut: 2000 });

          // Upload image first
          const formData = new FormData();
          formData.append('image', imageFile);

          const uploadUrl = Constants.PROJECT_BASE_URL + 'upload/image';

          $.ajax({
            url: uploadUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            beforeSend: function (xhr) {
              const token = localStorage.getItem('user_token');
              if (token) {
                xhr.setRequestHeader('Authentication', token);
              }
            },
            success: function (response) {
              // Handle both JSON string and object responses
              let responseData = response;
              if (typeof response === 'string') {
                try {
                  responseData = JSON.parse(response);
                } catch (e) {
                }
              }

              if (responseData && responseData.success && responseData.image_url) {
                toastr.success('Image uploaded successfully');
                saveFragrance(responseData.image_url);
              } else {
                const errorMsg = responseData?.error || responseData?.message || 'Unknown error';
                toastr.error('Failed to upload image: ' + errorMsg);
              }
            },
            error: function (xhr) {
              let errorMsg = 'Unknown error';
              let errorDetails = '';
              try {
                if (xhr.responseJSON) {
                  errorMsg = xhr.responseJSON.error || xhr.responseJSON.message || 'Upload failed';
                  errorDetails = xhr.responseJSON.details || '';
                } else if (xhr.responseText) {
                  try {
                    const parsed = JSON.parse(xhr.responseText);
                    errorMsg = parsed.error || parsed.message || 'Upload failed';
                    errorDetails = parsed.details || '';
                  } catch (e) {
                    errorMsg = xhr.responseText || 'Upload failed';
                  }
                }
              } catch (e) {
                errorMsg = xhr.responseText || xhr.statusText || 'Upload failed';
              }

              const fullError = errorDetails ? errorMsg + ' (' + errorDetails + ')' : errorMsg;
              toastr.error('Failed to upload image: ' + fullError);
            }
          });
        } else {
          // No file selected, save fragrance without image or with existing image URL
          // For edit mode, keep existing image_url if no new file is uploaded
          if (fragId) {
            // When editing, if no new file, keep the existing image_url
            saveFragrance($('#fragranceImage').data('existing-url') || '');
          } else {
            // When adding new, save without image
            saveFragrance('');
          }
        }
      });

      // REVIEWS CRUD
      function loadReviews() {
        RestClient.get("reviews", function (reviews) {
          let reviewsHtml = reviews.map(review => `
            <tr data-review-id="${review.id}">
              <td>${review.reviewer_name || ''}</td>
              <td>${review.fragrance_name || ''}</td>
              <td>${review.comment || ''}</td>
              <td>${review.rating || ''}</td>
              <td><button class="btn btn-danger delete-review-btn">Delete</button></td>
            </tr>
          `).join("");
          $("#admin-reviews-table tbody").html(reviewsHtml);
        });
      }
      loadReviews();
      $(document).off('click', '.delete-review-btn').on('click', '.delete-review-btn', function () {
        const row = $(this).closest('tr');
        const reviewId = row.data('review-id');
        if (confirm('Are you sure you want to delete this review?')) {
          RestClient.delete(`reviews/${reviewId}`, function (response) {
            if (response && (response.success !== false)) {
              row.fadeOut(300, function () {
                $(this).remove();
                loadReviews(); // Reload reviews table
              });
              toastr.success('Review deleted successfully');
            } else {
              toastr.error(response?.message || 'Failed to delete review');
            }
          }, function (xhr) {
            const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
            toastr.error('Failed to delete review: ' + errorMsg);
          });
        }
      });
    },
  });

  app.route({
    view: "register",
    onCreate: function () { },
    onReady: function () {
      // If user is already logged in, redirect to homepage
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) { }
      if (user && user.id) {
        window.location.hash = "#homepage";
        toastr.info("You are already logged in.", "", { positionClass: "toast-top-right" });
        return;
      }
      
      // Hide all other sections and show only register
      $("#item").html("");
      $("#homepage, #find, #about, #profile, #admin, #adminpage, #item, #login, #error_404").css("display", "none");
      $("#register").css("display", "block");
      $("body").removeClass("bg-light").addClass("bg-dark");
      $("footer").hide();
      // Update navigation buttons
      updateNavigationButtons();
      if (typeof AuthService !== 'undefined' && AuthService.initRegister) {
        AuthService.initRegister();
      }
    },
  });

  app.route({
    view: "item",
    onCreate: function () { },
    onReady: function () {
      $("#item").css("display", "block");
      $("#homepage, #find, #about, #profile, #admin, #register, #adminpage, #login, #error_404").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      const itemSection = document.getElementById("item");
      if (!itemSection) {
        alert("#item section not found in DOM!");
        return;
      }

      // Update navigation buttons
      updateNavigationButtons();

      $("#item").html('<div class="alert alert-info">Loading fragrance details...</div>');
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const id = params.get('id');
      if (!id) {
        $("#item").html('<div class="alert alert-danger">No fragrance selected.</div>');
        return;
      }
      RestClient.get(`parfumes/${id}`, function (frag) {
        if (!frag || !frag.name) {
          $("#item").html('<div class="alert alert-danger">Fragrance not found or error loading data.</div>');
          return;
        }
        // Store fragrance data for sharing
        window.currentFragrance = frag;
        $("#item").html(`
          <div class="container py-5">
            <div class="row gx-4 gx-lg-5 align-items-center">
              <div class="col-md-5">
                <img class="card-img-top mb-5 mb-md-0 w-100" src="${frag.image_url || 'assets/images/default.jpg'}" alt="Fragrance" style="object-fit: scale-down; border-radius: 10px; max-height: 400px;" />
                <div class="container py-4">
                  <div class="row text-center mb-4">
                    <div class="col">
                      <h5 class="fw-bold text-uppercase" style="color: #8C6A5D">Best for Seasons</h5>
                      <p class="fs-5 text-secondary">${frag.seasons || 'N/A'}</p>
                    </div>
                  </div>
                  <div class="row text-center">
                    <div class="col">
                      <h5 class="fw-bold text-uppercase" style="color: #8C6A5D">Key Notes</h5>
                      <p class="fs-5 text-secondary">${frag.notes || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-1"></div>
              <div class="col-md-6">
                <h1 class="display-5 fw-bolder" style="color: #8C6A5D">${frag.name}</h1>
                <div class="fs-5 mb-4">
                  <span style="color: #3E3232; font-size: 1.2rem;">${frag.brand_name || ''}</span>
                </div>
                <p class="lead">${frag.description || ''}</p>
                
                <!-- Product Summary -->
                <div id="product-summary" class="mt-4 mb-4">
                  <div id="summary-content">
                    <p class="text-muted small">Loading...</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="row mt-5">
              <div class="col-12">
                <h3 class="fw-bold text-uppercase" style="color: #8C6A5D">Reviews</h3>
                <div id="reviews-list" class="mt-3"></div>
                <div id="review-form-wrapper" class="mt-4"></div>
              </div>
            </div>
          </div>
        `);

        // Fetch reviews for this fragrance
        RestClient.get(`reviews/fragrance/${id}`, function (reviews) {
          // Calculate average rating and summary
          let averageRating = 0;
          let totalReviews = reviews ? reviews.length : 0;
          let ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

          if (reviews && reviews.length > 0) {
            let totalRating = 0;
            reviews.forEach(function (review) {
              const rating = parseFloat(review.rating) || 0;
              totalRating += rating;
              if (rating >= 1 && rating <= 5) {
                ratingBreakdown[Math.round(rating)]++;
              }
            });
            averageRating = (totalRating / totalReviews).toFixed(1);
          }

          // Display product summary
          const stars = '⭐'.repeat(Math.floor(averageRating));
          const emptyStars = '☆'.repeat(5 - Math.floor(averageRating));
          let summaryHtml = '';

          if (totalReviews > 0) {
            summaryHtml = `
              <div class="border-top pt-3">
                <div class="d-flex align-items-center mb-3">
                  <span class="fs-4 fw-bold me-2" style="color: #8C6A5D">${averageRating}</span>
                  <span class="fs-5 me-2">${stars}${emptyStars}</span>
                  <span class="text-muted small">(${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})</span>
                </div>
                <div class="rating-breakdown">
                  ${[5, 4, 3, 2, 1].map(rating => {
              const count = ratingBreakdown[rating] || 0;
              const percentage = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(0) : 0;
              const starsDisplay = '⭐'.repeat(rating);
              return `
                      <div class="d-flex align-items-center mb-2">
                        <div style="width: 120px; flex-shrink: 0; margin-right: 120px;">
                          <span class="text-muted small">${starsDisplay}</span>
                        </div>
                        <div style="width: 200px; flex-shrink: 0; padding-right: 15px;">
                          <div class="progress" style="height: 12px;">
                            <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: #8C6A5D;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                          </div>
                        </div>
                        <div style="width: 45px; flex-shrink: 0; text-align: right;">
                          <span class="text-muted" style="font-size: 0.75rem;">${count}</span>
                        </div>
                      </div>
                    `;
            }).join('')}
                </div>
              </div>
            `;
          } else {
            summaryHtml = `
              <div class="border-top pt-3">
                <p class="text-muted small mb-0">No reviews yet. Be the first to review this fragrance!</p>
              </div>
            `;
          }

          $("#summary-content").html(summaryHtml);
          let currentUser = null;
          try { currentUser = JSON.parse(localStorage.getItem("user")); } catch (e) { }
          const currentUserId = currentUser && currentUser.id ? String(currentUser.id) : null;
          let reviewsHtml = "";
          if (reviews && reviews.length > 0) {
            reviews.forEach(function (review) {
              const stars = '⭐'.repeat(Math.floor(review.rating || 0));
              const reviewId = review.id || '';
              const ownerId = review.user_id != null ? String(review.user_id) : '';
              const isOwner = !!currentUserId && currentUserId === ownerId;
              const shareDropdown = isOwner ? `
                      <div class=\"dropdown\">
                        <button class=\"btn btn-sm btn-outline-secondary\" type=\"button\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">
                          <i class=\"bi bi-share\"></i> Share
                        </button>
                        <ul class=\"dropdown-menu dropdown-menu-end\">
                          <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"facebook\" data-review-id=\"${reviewId}\"><i class=\"bi bi-facebook text-primary\"></i> Facebook</a></li>
                          <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"twitter\" data-review-id=\"${reviewId}\"><i class=\"bi bi-twitter text-info\"></i> Twitter</a></li>
                          <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"whatsapp\" data-review-id=\"${reviewId}\"><i class=\"bi bi-whatsapp text-success\"></i> WhatsApp</a></li>
                          <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"instagram\" data-review-id=\"${reviewId}\"><i class=\"bi bi-instagram text-danger\"></i> Instagram</a></li>
                          <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"tiktok\" data-review-id=\"${reviewId}\"><i class=\"bi bi-tiktok\"></i> TikTok</a></li>
                        </ul>
                      </div>` : '';
              reviewsHtml += `
                <div class=\"card mb-3\" data-review-id=\"${reviewId}\" data-review-owner-id=\"${ownerId}\">
                  <div class=\"card-body\">
                    <div class=\"d-flex justify-content-between align-items-start mb-2\">
                      <div>
                        <h5 class=\"card-title mb-1\">${review.reviewer_name || 'Anonymous'}</h5>
                        <p class=\"card-text mb-1\"><small class=\"text-muted\">${stars} Rating: ${review.rating || 'N/A'}/5</small></p>
                      </div>
                      ${shareDropdown}
                    </div>
                    <p class=\"card-text\">${review.comment || ''}</p>
                  </div>
                </div>
              `;
            });
          } else {
            reviewsHtml = '<p class=\"text-center\">No reviews yet.</p>';
          }
          $("#reviews-list").html(reviewsHtml);
          attachShareReviewHandlers(id);
        }, function () {
          $("#reviews-list").html('<p class="text-center text-danger">Failed to load reviews.</p>');
        });

        // Add review form below reviews, in the same col
        let reviewFormHtml = '';
        let user = null;
        try {
          user = JSON.parse(localStorage.getItem("user"));
        } catch (e) { }
        if (user && user.id) {
          reviewFormHtml = `
            <div class="card shadow-sm border-0">
              <div class="card-body p-4">
                <h4 class="card-title mb-3 fw-bold" style="color: #8C6A5D;">Leave a Review</h4>
                <form id="review-form">
                  <div class="mb-3">
                    <label for="review-rating" class="form-label">Rating</label>
                    <select class="form-select" id="review-rating" required>
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="review-comment" class="form-label">Comment</label>
                    <textarea class="form-control" id="review-comment" rows="3" maxlength="500" required placeholder="Share your experience..."></textarea>
                  </div>
                  <div class="d-grid">
                    <button type="submit" class="btn btn-success btn-lg">Submit Review</button>
                  </div>
                </form>
              </div>
            </div>
          `;
        } else {
          reviewFormHtml = `
            <div class="card shadow-sm border-0">
              <div class="card-body p-4">
                <h4 class="card-title mb-3 fw-bold" style="color: #8C6A5D;">Leave a Review</h4>
                <div class="alert alert-info">
                  <p class="mb-2">You must be logged in to leave a review or rating.</p>
                  <div class="d-flex gap-2">
                    <a href="#login" class="btn btn-primary">Log in</a>
                    <a href="#register" class="btn btn-outline-primary">Register</a>
                  </div>
                </div>
                <div style="opacity: 0.5; pointer-events: none;">
                  <div class="mb-3">
                    <label for="review-rating-disabled" class="form-label">Rating</label>
                    <select class="form-select" id="review-rating-disabled" disabled>
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="review-comment-disabled" class="form-label">Comment</label>
                    <textarea class="form-control" id="review-comment-disabled" rows="3" disabled placeholder="Please log in to leave a review..."></textarea>
                  </div>
                  <div class="d-grid">
                    <button type="button" class="btn btn-secondary btn-lg" disabled>Submit Review</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        $("#review-form-wrapper").html(reviewFormHtml);

        // Handle review form submission
        $(document).off('submit', '#review-form').on('submit', '#review-form', function (e) {
          e.preventDefault();
          const rating = $("#review-rating").val();
          const comment = $("#review-comment").val();
          if (!rating || !comment) {
            alert('Please provide both a rating and a comment.');
            return;
          }
          const reviewData = {
            parfume_id: id,
            rating: rating,
            comment: comment
          };
          RestClient.post('reviews', reviewData, function (response) {
            toastr.success('Review submitted successfully');
            // Clear form
            $("#review-rating").val('');
            $("#review-comment").val('');
            // Reload reviews after successful submission and update summary
            RestClient.get(`reviews/fragrance/${id}`, function (reviews) {
              // Recalculate average rating and summary
              let averageRating = 0;
              let totalReviews = reviews ? reviews.length : 0;
              let ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

              if (reviews && reviews.length > 0) {
                let totalRating = 0;
                reviews.forEach(function (review) {
                  const rating = parseFloat(review.rating) || 0;
                  totalRating += rating;
                  if (rating >= 1 && rating <= 5) {
                    ratingBreakdown[Math.round(rating)]++;
                  }
                });
                averageRating = (totalRating / totalReviews).toFixed(1);
              }

              // Update product summary
              const stars = '⭐'.repeat(Math.floor(averageRating));
              const emptyStars = '☆'.repeat(5 - Math.floor(averageRating));
              let summaryHtml = '';

              if (totalReviews > 0) {
                summaryHtml = `
                  <div class="border-top pt-3">
                    <div class="d-flex align-items-center mb-3">
                      <span class="fs-4 fw-bold me-2" style="color: #8C6A5D">${averageRating}</span>
                      <span class="fs-5 me-2">${stars}${emptyStars}</span>
                      <span class="text-muted small">(${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                    <div class="rating-breakdown">
                      ${[5, 4, 3, 2, 1].map(rating => {
                  const count = ratingBreakdown[rating] || 0;
                  const percentage = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(0) : 0;
                  const starsDisplay = '⭐'.repeat(rating);
                  return `
                          <div class="d-flex align-items-center mb-2">
                            <div style="width: 120px; flex-shrink: 0; margin-right: 120px;">
                              <span class="text-muted small">${starsDisplay}</span>
                            </div>
                            <div style="width: 200px; flex-shrink: 0; padding-right: 15px;">
                              <div class="progress" style="height: 12px;">
                                <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: #8C6A5D;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                              </div>
                            </div>
                            <div style="width: 45px; flex-shrink: 0; text-align: right;">
                              <span class="text-muted" style="font-size: 0.75rem;">${count}</span>
                            </div>
                          </div>
                        `;
                }).join('')}
                    </div>
                  </div>
                `;
              } else {
                summaryHtml = `
                  <div class="border-top pt-3">
                    <p class="text-muted small mb-0">No reviews yet. Be the first to review this fragrance!</p>
                  </div>
                `;
              }

              $("#summary-content").html(summaryHtml);

              // Update reviews list
              const currentUserId = user && user.id ? String(user.id) : null;
              let reviewsHtml = "";
              if (reviews && reviews.length > 0) {
                reviews.forEach(function (review) {
                  const stars = '⭐'.repeat(Math.floor(review.rating || 0));
                  const reviewId = review.id || '';
                  const ownerId = review.user_id != null ? String(review.user_id) : '';
                  const isOwner = !!currentUserId && currentUserId === ownerId;
                  const shareDropdown = isOwner ? `
                          <div class=\"dropdown\">
                            <button class=\"btn btn-sm btn-outline-secondary\" type=\"button\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">
                              <i class=\"bi bi-share\"></i> Share
                            </button>
                            <ul class=\"dropdown-menu dropdown-menu-end\">
                              <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"facebook\" data-review-id=\"${reviewId}\"><i class=\"bi bi-facebook text-primary\"></i> Facebook</a></li>
                              <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"twitter\" data-review-id=\"${reviewId}\"><i class=\"bi bi-twitter text-info\"></i> Twitter</a></li>
                              <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"whatsapp\" data-review-id=\"${reviewId}\"><i class=\"bi bi-whatsapp text-success\"></i> WhatsApp</a></li>
                              <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"instagram\" data-review-id=\"${reviewId}\"><i class=\"bi bi-instagram text-danger\"></i> Instagram</a></li>
                              <li><a class=\"dropdown-item share-review-btn\" href=\"#\" data-platform=\"tiktok\" data-review-id=\"${reviewId}\"><i class=\"bi bi-tiktok\"></i> TikTok</a></li>
                            </ul>
                          </div>` : '';
                  reviewsHtml += `
                    <div class=\"card mb-3\" data-review-id=\"${reviewId}\" data-review-owner-id=\"${ownerId}\">
                      <div class=\"card-body\">
                        <div class=\"d-flex justify-content-between align-items-start mb-2\">
                          <div>
                            <h5 class=\"card-title mb-1\">${review.reviewer_name || 'Anonymous'}</h5>
                            <p class=\"card-text mb-1\"><small class=\"text-muted\">${stars} Rating: ${review.rating || 'N/A'}/5</small></p>
                          </div>
                          ${shareDropdown}
                        </div>
                        <p class=\"card-text\">${review.comment || ''}</p>
                      </div>
                    </div>
                  `;
                });
              } else {
                reviewsHtml = '<p class=\"text-center\">No reviews yet.</p>';
              }
              $("#reviews-list").html(reviewsHtml);
              attachShareReviewHandlers(id);
            });
            $("#review-form")[0].reset();
          }, function (xhr) {
            const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Unknown error';
            toastr.error('Failed to submit review: ' + errorMsg);
          });
        });
      }, function () {
        $("#item").html('<div class="alert alert-danger">Failed to load fragrance data from server.</div>');
      });
    },
  });

  // Error 404 route handler
  app.route({
    view: "error_404",
    onCreate: function () { },
    onReady: function () {
      $("#error_404").css("display", "block");
      $("#homepage, #find, #about, #profile, #admin, #register, #adminpage, #item, #login").css("display", "none");
      $("body").removeClass("bg-dark").addClass("bg-light");
      $("footer").show();
      updateNavigationButtons();
    },
  });

  // ---------------------------------------------------------------------------
  // Already logged in: never go to login page – stay on current or switch to homepage, toast top-right
  // ---------------------------------------------------------------------------
  function blockLoginWhenLoggedIn() {
    if (!localStorage.getItem("user_token")) return;
    var h = window.location.hash || "";
    if (h !== "#login" && h.indexOf("#login") !== 0) return;
    window.location.hash = "#homepage";
    if (typeof toastr !== "undefined") toastr.info("You are already logged in.", "", { positionClass: "toast-top-right" });
  }
  blockLoginWhenLoggedIn();
  window.addEventListener("hashchange", blockLoginWhenLoggedIn);
  $(document).on("click", "a[href='#login']", function (e) {
    if (localStorage.getItem("user_token")) {
      e.preventDefault();
      e.stopPropagation();
      toastr.info("You are already logged in.", "", { positionClass: "toast-top-right" });
      return false;
    }
  });

  // ---------------------------------------------------------------------------
  // Bootstrap: initial nav, hide unused sections, run router, hashchange
  // ---------------------------------------------------------------------------
  updateNavigationButtons();
  var user = null;
  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  
  // Hide login page if user is already logged in
  try { 
    user = JSON.parse(localStorage.getItem("user")); 
  } catch (e) { }
  if (user && user.id) {
    $("#login").css("display", "none");
  }
  
  // Hide error page if not on error route
  if (window.location.hash !== "#error_404") {
    $("#error_404").css("display", "none");
  }

  // Start the SPA application
  app.run();
  updateNavActive();
  window.addEventListener("hashchange", updateNavActive);
});
