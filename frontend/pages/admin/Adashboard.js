import UserService from "../../services/UserService.js";
import AppointmentsService from "../../services/AppointmentsService.js";
import MealPlansService from "../../services/MealPlansService.js";
import HealthGoalsService from "../../services/HealthGoalsService.js";
import Utils from "../../utils/utils.js";
import { default as RestClient } from '../../utils/rest-client.js';
import Constants from '../../utils/constants.js';

// Initialize dashboard
function initAdminDashboard() {
  console.log("Initializing admin dashboard");
  
  const tokenData = Utils.getUser();
  if (!tokenData) {
    toastr.error("You must be logged in to view this page");
    navigate("login");
    return;
  }

  const user = tokenData.user || tokenData;
  if (user?.role !== "Nutritionist") {
    toastr.error("Access denied: Nutritionist role required");
    navigate("login");
    return;
  }

  document.querySelector(".dashboard-header").textContent = `Welcome, ${user.username || "Nutritionist"}!`;
  loadAllUsers();
}

// Setup dashboard tabs
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-link");
  tabs.forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("show", "active"));
      this.classList.add("active");
      const target = this.getAttribute("data-bs-target");
      document.querySelector(target).classList.add("show", "active");
    });
  });
}

// Load all users
function loadAllUsers() {
  const token = localStorage.getItem("user_token");
  console.log("[DEBUG] Token retrieved:", token);

  const table = document.getElementById("usersTable");
  table.innerHTML = 
    '<tr><td colspan="4" class="text-center"><div class="spinner-border" role="status"></div></td></tr>';

  if (!token) {
    toastr.error("No authentication token found");
    return;
  }

  console.log("[DEBUG] Making request to /users/clients with token:", token);

  RestClient.get('users/clients', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log("[DEBUG] API Response:", response);
    const users = Array.isArray(response) ? response : (response.data || []);
    renderUsersList(users);
  })
  .catch(error => {
    console.error("[DEBUG] API Error:", error);
    let errorMessage = "Failed to load clients";
    if (error.status === 403) {
      errorMessage = "Access denied: Nutritionist role required";
    } else if (error.message.includes("Failed to fetch")) {
      errorMessage = "Network error - please check your connection";
    }
    toastr.error(errorMessage);
    table.innerHTML = 
      '<tr><td colspan="4" class="text-center text-danger">' + errorMessage + '</td></tr>';
  });
}

// Render users list
function renderUsersList(users) {
  const table = document.getElementById("usersTable");
  table.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>
        <button class="btn btn-primary btn-sm" 
                onclick="window.viewUserDetails(${user.id})">
          View Details
        </button>
      </td>
    </tr>
  `).join('');
}

// View user details
window.viewUserDetails = function(userId) {
  console.log("Viewing user:", userId);
  // Implement your view logic here
};

// Setup event listeners
function setupEventListeners() {
  // [Keep all existing event listener setup code...]
}

// Make functions available globally
//window.updateAppointmentStatus = updateAppointmentStatus;
//window.editAppointment = function (id) { /* Implement later */ };
//window.deleteAppointment = deleteAppointment;
//window.editMealPlan = editMealPlan;
//window.viewMealPlan = function (id) { /* Implement later */ };
//window.deleteMealPlan = deleteMealPlan;
//window.editHealthGoal = editHealthGoal;
//window.deleteHealthGoal = deleteHealthGoal;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  if (typeof initAdminDashboard === 'function') {
    initAdminDashboard();
  }
});

// Expose to window for global access
window.Adashboard = {
  init: initAdminDashboard
};
window.initAdminDashboard = initAdminDashboard;