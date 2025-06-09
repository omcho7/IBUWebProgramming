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
  loadAllAppointments();
  loadAllMealPlans();
  loadAllHealthGoals();
  setupTabs();
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
    // Show current user info
    const userInfo = document.getElementById('currentUserInfo');
    if (userInfo) {
        userInfo.textContent = `Current user: ${userId}`;
    }
    
    // Load client's appointments, meal plans, and health goals
    loadClientAppointments(userId);
    loadClientMealPlans(userId);
    loadClientHealthGoals(userId);
    
    // Switch to the appointments tab
    const tab = document.querySelector('#appointments-tab');
    if (tab) {
        const tabInstance = new bootstrap.Tab(tab);
        tabInstance.show();
    }
}

async function loadClientAppointments(userId) {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await RestClient.get(`appointments/user/${userId}`);
        const appointments = response.data || [];
        const table = document.getElementById("appointmentsTable");
        
        if (!appointments || appointments.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        No appointments found
                        <button class="btn btn-sm btn-primary ms-2" onclick="addAppointment(${userId})">
                            <i class="bi bi-plus"></i> Add Appointment
                        </button>
                    </td>
                </tr>`;
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
        `).join('') + `
            <tr>
                <td colspan="5" class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="addAppointment(${userId})">
                        <i class="bi bi-plus"></i> Add Appointment
                    </button>
                </td>
            </tr>`;
    } catch (error) {
        console.error('Error loading appointments:', error);
        const table = document.getElementById("appointmentsTable");
        table.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load appointments: ${error.message}</td></tr>`;
    }
}

async function loadClientMealPlans(userId) {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await RestClient.get(`meal-plans/client/${userId}`);
        const mealPlans = response.data || [];
        const table = document.getElementById("mealPlansTable");
        
        if (!mealPlans || mealPlans.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">
                        No meal plans found
                        <button class="btn btn-sm btn-primary ms-2" onclick="addMealPlan(${userId})">
                            <i class="bi bi-plus"></i> Add Meal Plan
                        </button>
                    </td>
                </tr>`;
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
        `).join('') + `
            <tr>
                <td colspan="3" class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="addMealPlan(${userId})">
                        <i class="bi bi-plus"></i> Add Meal Plan
                    </button>
                </td>
            </tr>`;
    } catch (error) {
        console.error('Error loading meal plans:', error);
        const table = document.getElementById("mealPlansTable");
        table.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Failed to load meal plans: ${error.message}</td></tr>`;
    }
}

async function loadClientHealthGoals(userId) {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await RestClient.get(`health-goals/user/${userId}`);
        const goals = response.data || [];
        const table = document.getElementById("healthGoalsTable");
        
        if (!goals || goals.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        No health goals found
                       
                    </td>
                </tr>`;
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
        `).join('') + `
            <tr>
                <td colspan="4" class="text-center">
                    
                </td>
            </tr>`;
    } catch (error) {
        console.error('Error loading health goals:', error);
        const table = document.getElementById("healthGoalsTable");
        table.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load health goals: ${error.message}</td></tr>`;
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
window.viewClientDetails = viewClientDetails;
window.deleteClient = async function(userId) {
    if (!confirm('Are you sure you want to delete this client?')) {
        return;
    }

    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${Constants.PROJECT_BASE_URL}users/delete/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete client');
        }

        const result = await response.json();
        if (result.success) {
            toastr.success(result.message);
            loadAllUsers();
        } else {
            throw new Error(result.message || 'Failed to delete client');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        toastr.error(error.message);
    }
};

// Add new functions for adding items
window.addAppointment = async function() {
    const modal = new bootstrap.Modal(document.getElementById('addAppointmentModal'));
    modal.show();
};

window.addMealPlan = function(userId) {
    document.getElementById('mealPlanUserId').value = userId;
    const mealsContainer = document.getElementById('addMealsContainer');
    mealsContainer.innerHTML = ''; // Clear existing fields
    addMealField(); // Add initial meal field
    const modal = new bootstrap.Modal(document.getElementById('addMealPlanModal'));
    modal.show();
};

window.addHealthGoal = async function() {
    const modal = new bootstrap.Modal(document.getElementById('addHealthGoalModal'));
    modal.show();
};

// Add meal field to meal plan form
window.addMealField = function(value = '', type = '') {
    const container = document.getElementById('addMealsContainer');
    const newField = document.createElement('div');
    newField.className = 'meal-entry mb-2';
    newField.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control" name="meal_type[]" placeholder="Meal type (e.g., Breakfast)" value="${type}" required>
            <input type="text" class="form-control" name="meal_value[]" placeholder="Meal description" value="${value}" required>
            <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newField);
};

// Submit functions
window.submitAppointment = async function() {
    try {
        const form = document.getElementById('addAppointmentForm');
        const formData = new FormData(form);
        
        const data = {
            user_id: formData.get('user_id'),
            nutritionist_id: Utils.getUser().id,
            date: formData.get('date'),
            time: formData.get('time')
        };

        const response = await RestClient.post('appointments', data);
        
        if (response.success) {
            toastr.success('Appointment created successfully');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal'));
            modal.hide();
            form.reset();
            loadAllAppointments();
        } else {
            throw new Error(response.error || 'Failed to create appointment');
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        toastr.error(error.message || 'Failed to create appointment');
    }
};

window.submitMealPlan = async function() {
    try {
        const form = document.getElementById('addMealPlanForm');
        const formData = new FormData(form);
        
        // Get user data from token
        const userData = Utils.getUser();
        if (!userData || !userData.id) {
            throw new Error('No authentication data available');
        }
        
        // Convert meal fields to object
        const mealTypes = formData.getAll('meal_type[]');
        const mealValues = formData.getAll('meal_value[]');
        const meals = {};
        
        mealTypes.forEach((type, index) => {
            if (type.trim() && mealValues[index].trim()) {
                meals[type.trim()] = mealValues[index].trim();
            }
        });
        
        const data = {
            user_id: formData.get('user_id'),
            nutritionist_id: userData.id,
            title: formData.get('title'),
            description: formData.get('description'),
            meals: meals
        };

        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        $.ajax({
            url: `${Constants.PROJECT_BASE_URL}meal-plans`,
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    toastr.success('Meal plan created successfully');
                    bootstrap.Modal.getInstance(document.getElementById('addMealPlanModal')).hide();
                    loadAllMealPlans();
                } else {
                    throw new Error(response.error || 'Failed to create meal plan');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                
                let errorMessage = 'An error occurred';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.error || errorMessage;
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
                
                throw new Error(errorMessage);
            }
        });
    } catch (error) {
        console.error('Error creating meal plan:', error);
        toastr.error(error.message);
    }
};

window.submitHealthGoal = async function() {
    try {
        const formData = new FormData(document.getElementById('addHealthGoalForm'));
        const data = {
            user_id: formData.get('user_id'),
            goal_type: formData.get('goal_type'),
            target_value: formData.get('target_value'),
            current_value: formData.get('current_value'),
            deadline: formData.get('deadline')
        };

        const response = await HealthGoalsService.createHealthGoal(data);
        if (!response.success) {
            throw new Error(response.error || 'Failed to add health goal');
        }

        toastr.success('Health goal added successfully');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addHealthGoalModal'));
        modal.hide();

        // Reload the health goals list
        loadAllHealthGoals();
    } catch (error) {
        console.error('Error adding health goal:', error);
        toastr.error('Failed to add health goal: ' + error.message);
    }
};

window.updateAppointmentStatus = async function(id, status) {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${Constants.PROJECT_BASE_URL}appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update appointment status');
        }

        const result = await response.json();
        if (result.success) {
            toastr.success(result.message);
            loadAllAppointments();
        } else {
            throw new Error(result.error || 'Failed to update appointment status');
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        toastr.error(error.message);
    }
};

window.deleteAppointment = async function(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }

    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${Constants.PROJECT_BASE_URL}appointments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete appointment');
        }

        const result = await response.json();
        if (result.success) {
            toastr.success(result.message);
            loadAllAppointments();
        } else {
            throw new Error(result.error || 'Failed to delete appointment');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        toastr.error(error.message);
    }
};

async function loadAllAppointments() {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(Constants.PROJECT_BASE_URL + "appointments", {
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
        console.log("[DEBUG] Appointments loaded:", result);
        
        if (result.success && result.data) {
            const appointments = result.data;
            const table = document.getElementById("appointmentsTable");
            
            if (!appointments || appointments.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            No appointments found
                            <button class="btn btn-sm btn-primary ms-2" onclick="addAppointment()">
                                <i class="bi bi-plus"></i> Add Appointment
                            </button>
                        </td>
                    </tr>`;
                return;
            }
            
            table.innerHTML = appointments.map(apt => `
                <tr>
                    <td>${apt.title || 'Appointment'}</td>
                    <td>${apt.username || 'N/A'}</td>
                    <td>${new Date(apt.date).toLocaleDateString()}</td>
                    <td>${apt.time}</td>
                    <td><span class="badge bg-${apt.status === 'Confirmed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'danger'}">${apt.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="updateAppointmentStatus(${apt.id}, 'Confirmed')" ${apt.status === 'Confirmed' ? 'disabled' : ''}>
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="updateAppointmentStatus(${apt.id}, 'Denied')" ${apt.status === 'Denied' ? 'disabled' : ''}>
                            <i class="bi bi-x"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAppointment(${apt.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') + `
                <tr>
                    <td colspan="7" class="text-center">
                        <button class="btn btn-sm btn-primary" onclick="addAppointment()">
                            <i class="bi bi-plus"></i> Add Appointment
                        </button>
                    </td>
                </tr>`;
        } else {
            throw new Error(result.error || 'Failed to load appointments');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        const table = document.getElementById("appointmentsTable");
        table.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load appointments: ${error.message}</td></tr>`;
    }
}

async function loadAllMealPlans() {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(Constants.PROJECT_BASE_URL + "meal-plans", {
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
        console.log("[DEBUG] Meal plans loaded:", result);
        
        if (result.success && result.data) {
            const mealPlans = result.data;
            const table = document.getElementById("mealPlansTable");
            
            if (!mealPlans || mealPlans.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            No meal plans found
                            <button class="btn btn-sm btn-primary ms-2" onclick="addMealPlan()">
                                <i class="bi bi-plus"></i> Add Meal Plan
                            </button>
                        </td>
                    </tr>`;
                return;
            }
            
            table.innerHTML = mealPlans.map(plan => `
                <tr>
                    <td>${plan.title}</td>
                    <td>${plan.username || 'N/A'}</td>
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
            `).join('') + `
                <tr>
                    <td colspan="4" class="text-center">
                        <button class="btn btn-sm btn-primary" onclick="addMealPlan()">
                            <i class="bi bi-plus"></i> Add Meal Plan
                        </button>
                    </td>
                </tr>`;
        } else {
            throw new Error(result.error || 'Failed to load meal plans');
        }
    } catch (error) {
        console.error('Error loading meal plans:', error);
        const table = document.getElementById("mealPlansTable");
        table.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load meal plans: ${error.message}</td></tr>`;
    }
}

async function loadAllHealthGoals() {
    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(Constants.PROJECT_BASE_URL + "health-goals", {
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
        console.log("[DEBUG] Health goals loaded:", result);
        
        if (result.success && result.data) {
            const goals = result.data;
            const table = document.getElementById("healthGoalsTable");
            
            if (!goals || goals.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            No health goals found
                            <button class="btn btn-sm btn-primary ms-2" onclick="addHealthGoal()">
                                <i class="bi bi-plus"></i> Add Health Goal
                            </button>
                        </td>
                    </tr>`;
                return;
            }
            
            table.innerHTML = goals.map(goal => `
                <tr>
                    <td>${goal.goal_type}</td>
                    <td>${goal.username || 'N/A'}</td>
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
            `).join('') + `
                <tr>
                    <td colspan="5" class="text-center">
                        <button class="btn btn-sm btn-primary" onclick="addHealthGoal()">
                            <i class="bi bi-plus"></i> Add Health Goal
                        </button>
                    </td>
                </tr>`;
        } else {
            throw new Error(result.error || 'Failed to load health goals');
        }
    } catch (error) {
        console.error('Error loading health goals:', error);
        const table = document.getElementById("healthGoalsTable");
        table.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load health goals: ${error.message}</td></tr>`;
    }
}

// Meal Plan CRUD operations
window.editMealPlan = async function(id) {
    try {
        const response = await fetch(`${Constants.PROJECT_BASE_URL}meal-plans/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load meal plan');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load meal plan');
        }

        const mealPlan = result.data;
        console.log('Loaded meal plan:', mealPlan); // Debug log
        console.log('Meals type:', typeof mealPlan.meals); // Debug log
        console.log('Meals value:', mealPlan.meals); // Debug log
        
        // Fill the form with meal plan data
        document.getElementById('editMealPlanId').value = mealPlan.id;
        document.getElementById('editMealPlanTitle').value = mealPlan.title;
        document.getElementById('editMealPlanDescription').value = mealPlan.description;
        
        // Clear and refill meals
        const mealsContainer = document.getElementById('editMealsContainer');
        mealsContainer.innerHTML = '';
        
        // Add initial meal field if no meals exist
        if (!mealPlan.meals || typeof mealPlan.meals !== 'object') {
            console.log('Adding initial meal field - no meals or invalid format'); // Debug log
            addEditMealField();
        } else {
            console.log('Adding meal fields from object'); // Debug log
            // Add a field for each meal type
            Object.entries(mealPlan.meals).forEach(([type, meal]) => {
                console.log('Adding meal:', type, meal); // Debug log
                addEditMealField(meal, type);
            });
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editMealPlanModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading meal plan:', error);
        toastr.error(error.message);
    }
};

window.addEditMealField = function(value = '', type = '') {
    const container = document.getElementById('editMealsContainer');
    const newField = document.createElement('div');
    newField.className = 'meal-entry mb-2';
    newField.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control" name="meal_type[]" placeholder="Meal type (e.g., Breakfast)" value="${type}" required>
            <input type="text" class="form-control" name="meal_value[]" placeholder="Meal description" value="${value}" required>
            <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newField);
};

window.updateMealPlan = async function() {
    try {
        const form = document.getElementById('editMealPlanForm');
        const formData = new FormData(form);
        const id = formData.get('id');
        
        if (!id) {
            throw new Error('Meal plan ID is missing');
        }
        
        // Convert meal fields to object
        const mealTypes = formData.getAll('meal_type[]');
        const mealValues = formData.getAll('meal_value[]');
        const meals = {};
        
        mealTypes.forEach((type, index) => {
            if (type.trim() && mealValues[index].trim()) {
                meals[type.trim()] = mealValues[index].trim();
            }
        });
        
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            meals: meals
        };

        console.log('Updating meal plan with data:', data); // Debug log

        const response = await fetch(`${Constants.PROJECT_BASE_URL}meal-plans/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update meal plan');
        }

        const result = await response.json();
        if (result.success) {
            toastr.success(result.message);
            bootstrap.Modal.getInstance(document.getElementById('editMealPlanModal')).hide();
            loadAllMealPlans();
        } else {
            throw new Error(result.error || 'Failed to update meal plan');
        }
    } catch (error) {
        console.error('Error updating meal plan:', error);
        toastr.error(error.message);
    }
};

window.deleteMealPlan = async function(id) {
    if (!confirm('Are you sure you want to delete this meal plan?')) {
        return;
    }

    try {
        const response = await fetch(`${Constants.PROJECT_BASE_URL}meal-plans/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('user_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete meal plan');
        }

        const result = await response.json();
        if (result.success) {
            toastr.success(result.message);
            loadAllMealPlans();
        } else {
            throw new Error(result.error || 'Failed to delete meal plan');
        }
    } catch (error) {
        console.error('Error deleting meal plan:', error);
        toastr.error(error.message);
    }
};

// Health Goal CRUD operations
window.editHealthGoal = async function(id) {
    try {
        const response = await HealthGoalsService.getHealthGoalById(id);
        if (!response.success) {
            throw new Error(response.error || 'Failed to load health goal');
        }

        const goal = response.data;
        console.log('Loaded health goal:', goal);

        // Populate the form
        document.getElementById('editHealthGoalId').value = goal.id;
        document.getElementById('editGoalType').value = goal.goal_type;
        document.getElementById('editTargetValue').value = goal.target_value;
        document.getElementById('editCurrentValue').value = goal.current_value;
        document.getElementById('editDeadline').value = goal.deadline.split('T')[0]; // Format date for input

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editHealthGoalModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading health goal:', error);
        toastr.error('Failed to load health goal: ' + error.message);
    }
};

window.updateHealthGoal = async function() {
    try {
        const formData = new FormData(document.getElementById('editHealthGoalForm'));
        const id = formData.get('id');
        
        if (!id) {
            throw new Error('Health goal ID is missing');
        }

        const data = {
            goal_type: formData.get('goal_type'),
            target_value: formData.get('target_value'),
            current_value: formData.get('current_value'),
            deadline: formData.get('deadline')
        };

        const response = await HealthGoalsService.updateHealthGoal(id, data);
        if (!response.success) {
            throw new Error(response.error || 'Failed to update health goal');
        }

        toastr.success('Health goal updated successfully');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editHealthGoalModal'));
        modal.hide();

        // Reload the health goals list
        loadAllHealthGoals();
    } catch (error) {
        console.error('Error updating health goal:', error);
        toastr.error('Failed to update health goal: ' + error.message);
    }
};

window.deleteHealthGoal = async function(id) {
    if (!confirm('Are you sure you want to delete this health goal?')) {
        return;
    }

    try {
        const token = localStorage.getItem('user_token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        const response = await RestClient.delete(`health-goals/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.success) {
            toastr.success(response.message || 'Health goal deleted successfully');
            loadAllHealthGoals();
        } else {
            throw new Error(response.error || 'Failed to delete health goal');
        }
    } catch (error) {
        console.error('Error deleting health goal:', error);
        toastr.error(error.message);
        if (error.message.includes('No authentication token found')) {
            // Redirect to login if token is missing
            window.location.href = 'login.html';
        }
    }
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  if (typeof initAdminDashboard === 'function') {
    initAdminDashboard();
  }
});