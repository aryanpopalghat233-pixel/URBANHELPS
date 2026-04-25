// ============================================
// COMMON FUNCTIONS FOR ALL PAGES
// ============================================

const API_BASE_URL = "http://localhost:5000/api";
const SOCKET = io();

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/";
    return null;
  }

  return JSON.parse(user);
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Get auth token
function getToken() {
  return localStorage.getItem("token");
}

// Make API call with authentication
async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "API Error" };
  }
}

// Show tab function
function showTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => (tab.style.display = "none"));

  // Show selected tab
  const selectedTab = document.getElementById(tabName + "Tab");
  if (selectedTab) {
    selectedTab.style.display = "block";
  }
}

// Format date
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };
  return new Date(dateString).toLocaleDateString("en-IN", options);
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA
function calculateETA(distance) {
  const avgSpeed = 40; // km/h
  const hours = distance / avgSpeed;
  const minutes = Math.round(hours * 60);
  return `${minutes} mins`;
}

// Show notification
function showNotification(message, type = "info") {
  const alertClass = `alert-${type}`;
  const alertHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  const alertContainer = document.createElement("div");
  alertContainer.className = "position-fixed top-0 start-50 translate-middle-x mt-3";
  alertContainer.style.zIndex = "9999";
  alertContainer.innerHTML = alertHTML;

  document.body.appendChild(alertContainer);

  setTimeout(() => {
    alertContainer.remove();
  }, 4000);
}

// Initialize page on load
window.addEventListener("DOMContentLoaded", () => {
  const user = checkAuth();
  if (user) {
    console.log("✅ User authenticated:", user.name);
  }
});