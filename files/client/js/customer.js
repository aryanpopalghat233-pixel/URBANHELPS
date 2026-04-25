// ============================================
// CUSTOMER PAGE LOGIC
// ============================================

let currentUser = null;
let map = null;
let workerMarker = null;
let customerMarker = null;
let currentBooking = null;

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  currentUser = checkAuth();
  if (!currentUser) return;

  console.log("👤 Customer logged in:", currentUser.name);
  loadServices();
  loadMyBookings();
  initializeMap();
  setupSocketListeners();
});

// ============================================
// LOAD SERVICES
// ============================================
async function loadServices() {
  const data = await apiCall("/workers/available/list");

  if (data.success) {
    const services = await apiCall("/admin/stats");

    // Display services in grid
    const servicesGrid = document.getElementById("servicesGrid");
    const serviceSelect = document.getElementById("serviceSelect");

    // Sample services
    const sampleServices = [
      { id: "1", name: "Home Cleaning", icon: "🧹", price: 499 },
      { id: "2", name: "AC Repair", icon: "❄️", price: 799 },
      { id: "3", name: "Plumbing", icon: "🔧", price: 599 },
      { id: "4", name: "Cooking", icon: "👨‍🍳", price: 999 },
      { id: "5", name: "Electrical", icon: "⚡", price: 599 },
      { id: "6", name: "Carpentry", icon: "🪛", price: 699 }
    ];

    servicesGrid.innerHTML = sampleServices
      .map(
        (service) => `
      <div class="col-md-6" style="cursor:pointer;" onclick="selectService('${service.id}', '${service.name}', ${service.price})">
        <div class="card text-center shadow-sm">
          <div class="card-body">
            <h4>${service.icon}</h4>
            <h6>${service.name}</h6>
            <p class="text-primary fw-bold">₹${service.price}</p>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Populate select dropdown
    serviceSelect.innerHTML = `
      <option value="">-- Select Service --</option>
      ${sampleServices
        .map((s) => `<option value="${s.id}">${s.name} - ₹${s.price}</option>`)
        .join("")}
    `;
  }
}

// Select service
function selectService(serviceId, serviceName, price) {
  document.getElementById("serviceSelect").value = serviceId;
  showTab("services");
}

// ============================================
// LOAD MY BOOKINGS
// ============================================
async function loadMyBookings() {
  const data = await apiCall(`/bookings/customer/${currentUser.id}`);

  if (data.success && data.bookings.length > 0) {
    const bookingsList = document.getElementById("bookingsList");

    bookingsList.innerHTML = data.bookings
      .map(
        (booking) => `
      <div class="col-md-6">
        <div class="booking-card">
          <h5>🔧 Service Booking</h5>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Price:</strong> ₹${booking.price}</p>
          <p>
            <strong>Status:</strong>
            <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
          </p>
          <p><strong>Booked:</strong> ${formatDate(booking.createdAt)}</p>
          
          ${booking.workerId ? `
            <button class="btn btn-primary btn-sm" onclick="trackWorker('${booking.id}', '${booking.workerId}')">
              📍 Track Worker
            </button>
          ` : `
            <p class="text-muted small">Waiting for worker assignment...</p>
          `}
        </div>
      </div>
    `
      )
      .join("");
  } else {
    document.getElementById("bookingsList").innerHTML =
      '<p class="text-muted">No bookings yet. Book a service to get started!</p>';
  }
}

// ============================================
// BOOK SERVICE
// ============================================
document.getElementById("bookingForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const serviceId = document.getElementById("serviceSelect").value;
  const location = document.getElementById("bookingLocation").value;
  const description = document.getElementById("bookingDescription").value;

  if (!serviceId || !location) {
    showNotification("Please fill all required fields", "warning");
    return;
  }

  // Get customer location if available
  let latitude = 28.6139; // Default: Delhi
  let longitude = 77.209;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        submitBooking(serviceId, location, description, latitude, longitude);
      },
      () => {
        // Use default if geolocation fails
        submitBooking(serviceId, location, description, latitude, longitude);
      }
    );
  } else {
    submitBooking(serviceId, location, description, latitude, longitude);
  }

  function submitBooking(serviceId, location, description, lat, lon) {
    apiCall("/bookings/create", "POST", {
      customerId: currentUser.id,
      serviceId,
      location,
      description,
      latitude: lat,
      longitude: lon
    }).then((data) => {
      if (data.success) {
        showNotification("Service booked successfully! 🎉", "success");
        document.getElementById("bookingForm").reset();
        loadMyBookings();
      } else {
        showNotification("Booking failed: " + data.message, "danger");
      }
    });
  }
});

// ============================================
// TRACK WORKER
// ============================================
async function trackWorker(bookingId, workerId) {
  currentBooking = {
    id: bookingId,
    workerId: workerId
  };

  showTab("tracking");

  // Request tracking from socket
  SOCKET.emit("request-tracking", {
    customerId: currentUser.id,
    workerId: workerId,
    bookingId: bookingId
  });

  // Get customer location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      customerMarker?.setLatLng([
        position.coords.latitude,
        position.coords.longitude
      ]);
      map.setView([position.coords.latitude, position.coords.longitude], 15);
    });
  }
}

// ============================================
// INITIALIZE MAP
// ============================================
function initializeMap() {
  // Initialize map centered on India
  map = L.map("map", {
    center: [28.6139, 77.209],
    zoom: 15,
    layers: [L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")]
  });

  // Customer marker
  customerMarker = L.circleMarker([28.6139, 77.209], {
    radius: 8,
    fillColor: "#4285f4",
    color: "#000",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  }).bindPopup("📍 You are here");

  customerMarker.addTo(map);

  // Get customer's actual location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      customerMarker.setLatLng([
        position.coords.latitude,
        position.coords.longitude
      ]);
      map.setView([position.coords.latitude, position.coords.longitude], 15);
    });
  }
}

// ============================================
// SOCKET.IO LISTENERS
// ============================================
function setupSocketListeners() {
  // Receive initial worker location
  SOCKET.on("initial-location", (data) => {
    console.log("📍 Initial worker location:", data);

    if (!workerMarker) {
      workerMarker = L.marker([data.latitude, data.longitude], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34]
        }).bindPopup("👷 Worker Location");
    } else {
      workerMarker.setLatLng([data.latitude, data.longitude]);
    }

    workerMarker.addTo(map);
    map.setView([data.latitude, data.longitude], 15);
  });

  // Receive live worker location updates
  SOCKET.on("worker-location-update", (data) => {
    if (data.workerId === currentBooking?.workerId) {
      console.log("📍 Worker location update:", data);

      // Update marker position
      if (workerMarker) {
        workerMarker.setLatLng([data.latitude, data.longitude]);
      }

      // Calculate ETA
      if (customerMarker) {
        const customerLatLng = customerMarker.getLatLng();
        const distance = calculateDistance(
          customerLatLng.lat,
          customerLatLng.lng,
          data.latitude,
          data.longitude
        );
        const eta = calculateETA(distance);

        // Update info box
        document.getElementById("trackingInfo").innerHTML = `
          <div class="alert alert-info">
            <p><strong>Worker Status:</strong> ${data.status}</p>
            <p><strong>Distance:</strong> ${distance.toFixed(2)} km</p>
            <p><strong>ETA:</strong> ${eta}</p>
          </div>
        `;

        document.getElementById("etaTime").textContent = eta;
        document.getElementById("etaDistance").textContent = distance.toFixed(2);
        document.getElementById("etaInfo").style.display = "block";
      }
    }
  });

  // Receive job status updates
  SOCKET.on("job-status-update", (data) => {
    if (data.bookingId === currentBooking?.id) {
      console.log("✅ Job status updated:", data);
      loadMyBookings();
    }
  });
}