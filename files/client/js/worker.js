// ============================================
// WORKER PAGE LOGIC
// ============================================

let currentUser = null;
let isTrackingActive = false;
let locationInterval = null;
let currentBookingId = null;

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  currentUser = checkAuth();
  if (!currentUser || currentUser.role !== "worker") {
    window.location.href = "/";
    return;
  }

  console.log("👷 Worker logged in:", currentUser.name);
  loadAvailableJobs();
  loadMyJobs();
  setupSocketListeners();
});

// ============================================
// LOAD AVAILABLE JOBS
// ============================================
async function loadAvailableJobs() {
  const data = await apiCall("/bookings/all");

  if (data.success) {
    const availableJobs = data.bookings.filter(
      (b) => b.status === "pending" || (b.status === "assigned" && !b.workerId)
    );

    const jobsList = document.getElementById("jobsList");

    if (availableJobs.length > 0) {
      jobsList.innerHTML = availableJobs
        .map(
          (job) => `
        <div class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">🔧 ${job.id}</h5>
              <p><strong>Customer Location:</strong> ${job.location}</p>
              <p><strong>Description:</strong> ${job.description || "No description"}</p>
              <p><strong>Price:</strong> ₹${job.price}</p>
              <p><strong>Status:</strong> <span class="badge bg-warning">${job.status}</span></p>
              <button class="btn btn-success btn-sm" onclick="acceptJob('${job.id}')">
                ✅ Accept Job
              </button>
              <button class="btn btn-danger btn-sm" onclick="rejectJob('${job.id}')">
                ❌ Reject Job
              </button>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    } else {
      jobsList.innerHTML =
        '<div class="col-12"><p class="text-muted">No available jobs right now</p></div>';
    }
  }
}

// ============================================
// ACCEPT JOB
// ============================================
async function acceptJob(bookingId) {
  const response = await apiCall("/bookings/assign", "POST", {
    bookingId,
    workerId: currentUser.id
  });

  if (response.success) {
    showNotification("Job accepted! 🎉 Start sharing your location.", "success");
    currentBookingId = bookingId;
    loadMyJobs();
    loadAvailableJobs();

    // Show location permission modal
    new bootstrap.Modal(document.getElementById("permissionModal")).show();
  } else {
    showNotification("Error accepting job", "danger");
  }
}

// ============================================
// REJECT JOB
// ============================================
async function rejectJob(bookingId) {
  // Optional: Update job status to available for other workers
  showNotification("Job rejected", "info");
  loadAvailableJobs();
}

// ============================================
// LOAD MY JOBS
// ============================================
async function loadMyJobs() {
  const data = await apiCall(`/workers/${currentUser.id}/bookings`);

  if (data.success && data.bookings.length > 0) {
    const myJobsList = document.getElementById("myJobsList");

    const activeJobs = data.bookings.filter((b) => b.status !== "completed");

    if (activeJobs.length > 0) {
      myJobsList.innerHTML = activeJobs
        .map(
          (job) => `
        <div class="col-md-6">
          <div class="card border-danger">
            <div class="card-body">
              <h5 class="card-title">⏳ ${job.id}</h5>
              <p><strong>Customer Location:</strong> ${job.location}</p>
              <p><strong>Description:</strong> ${job.description || "No description"}</p>
              <p><strong>Price:</strong> ₹${job.price}</p>
              <p>
                <strong>Status:</strong>
                <span class="badge bg-primary">${job.status}</span>
              </p>
              
              <select class="form-select form-select-sm mb-2" onchange="updateJobStatus('${job.id}', this.value)">
                <option value="assigned">-- Update Status --</option>
                <option value="assigned">📍 Accepted</option>
                <option value="on-the-way">🚗 On the Way</option>
                <option value="completed">✅ Completed</option>
              </select>
              
              ${isTrackingActive && currentBookingId === job.id ? `
                <span class="badge bg-success pulse">🔴 Sharing Location</span>
              ` : `
                <button class="btn btn-info btn-sm" onclick="startTracking('${job.id}')">
                  📍 Share Location
                </button>
              `}
            </div>
          </div>
        </div>
      `
        )
        .join("");
    } else {
      myJobsList.innerHTML =
        '<div class="col-12"><p class="text-muted">No active jobs</p></div>';
    }
  } else {
    document.getElementById("myJobsList").innerHTML =
      '<div class="col-12"><p class="text-muted">No active jobs</p></div>';
  }
}

// ============================================
// UPDATE JOB STATUS
// ============================================
async function updateJobStatus(bookingId, status) {
  if (status === "-- Update Status --") return;

  const response = await apiCall("/bookings/update-status", "POST", {
    bookingId,
    status
  });

  if (response.success) {
    showNotification("Job status updated! ✅", "success");
    loadMyJobs();

    // Broadcast to socket
    SOCKET.emit("update-status", {
      workerId: currentUser.id,
      bookingId,
      status
    });
  }
}

// ============================================
// START TRACKING
// ============================================
function requestLocationPermission() {
  startTracking();
  bootstrap.Modal.getInstance(document.getElementById("permissionModal")).hide();
}

function toggleTracking() {
  if (isTrackingActive) {
    stopTracking();
  } else {
    startTracking();
  }
}

function startTracking(bookingId = null) {
  if (bookingId) {
    currentBookingId = bookingId;
  }

  if (!navigator.geolocation) {
    showNotification("Geolocation not supported", "danger");
    return;
  }

  isTrackingActive = true;
  document.getElementById("trackingToggle").textContent = "🟢 Stop Tracking";
  document.getElementById("trackingToggle").classList.add("text-success");

  showNotification("Started sharing location 📍", "success");

  // Send location every 5 seconds
  locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Send to server via Socket.io
        SOCKET.emit("share-location", {
          workerId: currentUser.id,
          latitude,
          longitude,
          status: "on-the-way"
        });

        console.log(`📍 Location sent: ${latitude}, ${longitude}`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        showNotification("Location access denied", "danger");
        stopTracking();
      }
    );
  }, 5000);

  loadMyJobs();
}

function stopTracking() {
  isTrackingActive = false;
  clearInterval(locationInterval);

  document.getElementById("trackingToggle").textContent = "🔴 Start Tracking";
  document.getElementById("trackingToggle").classList.remove("text-success");

  showNotification("Stopped sharing location ⛔", "info");
  loadMyJobs();
}

// ============================================
// SOCKET.IO LISTENERS
// ============================================
function setupSocketListeners() {
  SOCKET.on("connect", () => {
    console.log("🔌 Connected to server");
  });

  SOCKET.on("job-assignment", (data) => {
    console.log("📩 New job assigned:", data);
    loadAvailableJobs();
    loadMyJobs();
  });

  SOCKET.on("disconnect", () => {
    console.log("🔌 Disconnected from server");
  });
}