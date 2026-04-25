// ============================================
// ADMIN PAGE LOGIC
// ============================================

let currentUser = null;
let adminMap = null;
let workerMarkers = new Map();

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  currentUser = checkAuth();
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "/";
    return;
  }

  console.log("⚙️ Admin logged in:", currentUser.name);
  loadDashboardStats();
  loadAllBookings();
  loadAllWorkers();
  initializeAdminMap();
  setupAdminSocketListeners();
});

// ============================================
// LOAD DASHBOARD STATS
// ============================================
async function loadDashboardStats() {
  const data = await apiCall("/admin/stats");

  if (data.success) {
    const { stats } = data;
    document.getElementById("totalWorkers").textContent = stats.totalWorkers;
    document.getElementById("totalCustomers").textContent = stats.totalCustomers;
    document.getElementById("totalBookings").textContent = stats.totalBookings;
    document.getElementById("completedBookings").textContent = stats.completedBookings;
  }
}

// ============================================
// LOAD ALL BOOKINGS
// ============================================
async function loadAllBookings() {
  const data = await apiCall("/admin/bookings");

  if (data.success) {
    const bookingsTable = document.getElementById("bookingsTable");

    bookingsTable.innerHTML = data.bookings
      .map(
        (booking) => `
      <tr>
        <td><small>${booking.id.substring(0, 8)}...</small></td>
        <td>${booking.customerName}</td>
        <td>${booking.serviceName}</td>
        <td>${booking.workerName}</td>
        <td>
          <span class="badge bg-${
            booking.status === "completed"
              ? "success"
              : booking.status === "pending"
              ? "warning"
              : "info"
          }">
            ${booking.status.toUpperCase()}
          </span>
        </td>
        <td>₹${booking.price}</td>
        <td>
          <select class="form-select form-select-sm" onchange="assignWorkerToBooking('${booking.id}', this.value)">
            <option value="">-- Assign Worker --</option>
            <!-- Workers will be populated dynamically -->
          </select>
        </td>
      </tr>
    `
      )
      .join("");
  }
}

// ============================================
// LOAD ALL WORKERS
// ============================================
async function loadAllWorkers() {
  const data = await apiCall("/admin/workers-stats");

  if (data.success) {
    const workersTable = document.getElementById("workersTable");

    workersTable.innerHTML = data.workers
      .map(
        (worker) => `
      <tr>
        <td><small>${worker.id}</small></td>
        <td>${worker.name}</td>
        <td>${worker.phone}</td>
        <td>⭐ ${worker.rating || "N/A"}</td>
        <td>${worker.totalJobs}</td>
        <td>
          <span class="badge bg-primary">${worker.activeJobs}</span>
        </td>
        <td>
          <span class="badge ${worker.verified ? "bg-success" : "bg-danger"}">
            ${worker.verified ? "✅ Verified" : "❌ Unverified"}
          </span>
        </td>
      </tr>
    `
      )
      .join("");
  }
}

// ============================================
// ASSIGN WORKER TO BOOKING
// ============================================
async function assignWorkerToBooking(bookingId, workerId) {
  if (!workerId) return;

  const response = await apiCall("/bookings/assign", "POST", {
    bookingId,
    workerId
  });

  if (response.success) {
    showNotification("Worker assigned successfully! ✅", "success");
    loadAllBookings();
    loadAllWorkers();
  } else {
    showNotification("Error assigning worker", "danger");
  }
}

// ============================================
// INITIALIZE ADMIN MAP
// ============================================
function initializeAdminMap() {
  // Initialize map centered on India
  adminMap = L.map("adminMap", {
    center: [28.6139, 77.209],
    zoom: 12,
    layers: [L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")]
  });

  loadWorkerLocationsOnMap();
}

// ============================================
// LOAD WORKER LOCATIONS ON MAP
// ============================================
async function loadWorkerLocationsOnMap() {
  const data = await apiCall("/workers/all");

  if (data.success) {
    data.workers.forEach((worker) => {
      // Create marker for each worker
      const marker = L.circleMarker([28.6139, 77.209], {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      })
        .bindPopup(`
          <div>
            <strong>${worker.name}</strong><br>
            Phone: ${worker.phone}<br>
            Rating: ⭐ ${worker.rating || "N/A"}<br>
            Active Jobs: ${worker.activeBookings}
          </div>
        `)
        .addTo(adminMap);

      workerMarkers.set(worker.id, marker);
    });
  }
}

// ============================================
// SOCKET.IO LISTENERS FOR ADMIN
// ============================================
function setupAdminSocketListeners() {
  // Receive all worker location updates
  SOCKET.on("worker-location-update", (data) => {
    console.log("📍 Admin received worker location:", data);

    // Update marker on map
    if (workerMarkers.has(data.workerId)) {
      const marker = workerMarkers.get(data.workerId);
      marker.setLatLng([data.latitude, data.longitude]);
    } else {
      // Create new marker if not exists
      const marker = L.circleMarker([data.latitude, data.longitude], {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      })
        .bindPopup(`Worker: ${data.workerId}<br>Status: ${data.status}`)
        .addTo(adminMap);

      workerMarkers.set(data.workerId, marker);
    }
  });

  // Receive job status updates
  SOCKET.on("job-status-update", (data) => {
    console.log("✅ Admin received status update:", data);
    loadAllBookings();
    loadAllWorkers();
  });
}