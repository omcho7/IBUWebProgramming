import UserService from "../../services/UserService.js";
import AppointmentsService from "../../services/AppointmentsService.js";
import MealPlansService from "../../services/MealPlansService.js";
import HealthGoalsService from "../../services/HealthGoalsService.js";
import Utils from "../../utils/utils.js";
import { default as RestClient } from '../../utils/rest-client.js';
import Constants from '../../utils/constants.js';

// Initialize dashboard
export function initAdminDashboard() {
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
async function loadAllUsers() {
  try {
    const token = localStorage.getItem('user_token');
    console.log("[DEBUG] Token retrieved:", token);
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(Constants.PROJECT_BASE_URL + "users/clients", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("[DEBUG] Clients loaded:", result);
    
    if (result.success && result.data) {
      renderUsersList(result.data);
    } else {
      throw new Error(result.error || 'Failed to load clients');
    }
  } catch (error) {
    console.error("[DEBUG] API Error:", error);
    showError('Failed to load clients: ' + error.message);
  }
}

// Render users list
function renderUsersList(users) {
    const table = document.getElementById("usersTable");
    
    if (!users || users.length === 0) {
        table.innerHTML = '<tr><td colspan="4" class="text-center">No clients found</td></tr>';
        return;
    }

    table.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewClientDetails(${user.id})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteClient(${user.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showError(message) {
    const table = document.getElementById("usersTable");
    table.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${message}</td></tr>`;
    toastr.error(message);
}

function viewClientDetails(userId) {
    // Load client's appointments, meal plans, and health goals
    loadClientAppointments(userId);
    loadClientMealPlans(userId);
    loadClientHealthGoals(userId);
    
    // Switch to the appropriate tab
    const tab = document.querySelector('#appointments-tab');
    if (tab) {
        const tabInstance = new bootstrap.Tab(tab);
        tabInstance.show();
    }
}

async function loadClientAppointments(userId) {
    try {
        const token = localStorage.getItem('user_token');
        const response = await fetch(`${Constants.PROJECT_BASE_URL}appointments/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load appointments');
        
        const appointments = await response.json();
        const table = document.getElementById("appointmentsTable");
        
        if (!appointments || appointments.length === 0) {
            table.innerHTML = '<tr><td colspan="5" class="text-center">No appointments found</td></tr>';
            return;
        }
        
        table.innerHTML = appointments.map(apt => `
            <tr>
                <td>${apt.title || 'Appointment'}</td>
                <td>${new Date(apt.date).toLocaleDateString()}</td>
                <td>${apt.time}</td>
                <td><span class="badge bg-${apt.status === 'Confirmed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'danger'}">${apt.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="updateAppointmentStatus(${apt.id}, 'Confirmed')">
                        <i class="bi bi-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="updateAppointmentStatus(${apt.id}, 'Denied')">
                        <i class="bi bi-x"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading appointments:', error);
        showError('Failed to load appointments');
    }
}

async function loadClientMealPlans(userId) {
    try {
        const token = localStorage.getItem('user_token');
        const response = await fetch(`${Constants.PROJECT_BASE_URL}meal-plans/client/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load meal plans');
        
        const mealPlans = await response.json();
        const table = document.getElementById("mealPlansTable");
        
        if (!mealPlans || mealPlans.length === 0) {
            table.innerHTML = '<tr><td colspan="3" class="text-center">No meal plans found</td></tr>';
            return;
        }
        
        table.innerHTML = mealPlans.map(plan => `
            <tr>
                <td>${plan.title}</td>
                <td>${new Date(plan.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editMealPlan(${plan.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMealPlan(${plan.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading meal plans:', error);
        showError('Failed to load meal plans');
    }
}

async function loadClientHealthGoals(userId) {
    try {
        const token = localStorage.getItem('user_token');
        const response = await fetch(`${Constants.PROJECT_BASE_URL}health-goals/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load health goals');
        
        const goals = await response.json();
        const table = document.getElementById("healthGoalsTable");
        
        if (!goals || goals.length === 0) {
            table.innerHTML = '<tr><td colspan="4" class="text-center">No health goals found</td></tr>';
            return;
        }
        
        table.innerHTML = goals.map(goal => `
            <tr>
                <td>${goal.goal_type}</td>
                <td>Target: ${goal.target_value}, Current: ${goal.current_value}</td>
                <td>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${(goal.current_value / goal.target_value) * 100}%">
                            ${Math.round((goal.current_value / goal.target_value) * 100)}%
                        </div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editHealthGoal(${goal.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHealthGoal(${goal.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading health goals:', error);
        showError('Failed to load health goals');
    }
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