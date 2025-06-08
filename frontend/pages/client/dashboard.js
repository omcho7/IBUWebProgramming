import UserService from '../../services/UserService.js';
import AppointmentsService from '../../services/AppointmentsService.js';
import MealPlansService from '../../services/MealPlansService.js';
import HealthGoalsService from '../../services/HealthGoalsService.js';
import Utils from '../../utils/utils.js';
import { default as RestClient } from '../../utils/rest-client.js';
import Constants from '../../utils/constants.js';

// Initialize dashboard
export function initDashboard() {
    console.log("Initializing client dashboard");
    
    // Use Utils to get user data consistently
    const tokenData = Utils.getUser();
    if (!tokenData) {
        toastr.error("You must be logged in to view this page");
        window.location.href = '/OmarOsmanovic/IBUWebProgramming/frontend/pages/login.html';
        return;
    }

    const user = tokenData.user || tokenData;
    
    // Verify user role
    if (user.role !== "Client") {
        toastr.error("Access denied: Client role required");
        window.location.href = '/OmarOsmanovic/IBUWebProgramming/frontend/pages/login.html';
        return;
    }
    
    // Set welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.username || "Client"}!`;
    }
    
    // Load client data
    loadClientData(user.id);
}

async function loadClientData(userId) {
    try {
        console.log("Loading data for user ID:", userId);
        
        // Load appointments
        const appointmentsResponse = await RestClient.get(`appointments/user/${userId}`);
        console.log("Appointments response:", appointmentsResponse);
        if (appointmentsResponse.success) {
            updateAppointmentsCard(appointmentsResponse.data);
        }

        // Load meal plans
        const mealPlansResponse = await RestClient.get(`meal-plans/client/${userId}`);
        console.log("Meal plans response:", mealPlansResponse);
        if (mealPlansResponse.success) {
            updateMealPlansCard(mealPlansResponse.data);
        }

        // Load health goals
        const healthGoalsResponse = await RestClient.get(`health-goals/user/${userId}`);
        console.log("Health goals response:", healthGoalsResponse);
        if (healthGoalsResponse.success) {
            updateHealthGoalsCard(healthGoalsResponse.data);
        }

    } catch (error) {
        console.error('Error loading client data:', error);
        if (error.response?.status === 401) {
            // Just show the error message without clearing the token
            try {
                const response = JSON.parse(error.response.responseText);
                toastr.error('Authorization error: ' + (response.error || 'Unknown error'));
            } catch (e) {
                toastr.error('Authorization error: ' + (error.message || 'Unknown error'));
            }
        } else {
            toastr.error('Failed to load dashboard data: ' + (error.message || 'Unknown error'));
        }
    }
}

// Update appointments card
function updateAppointmentsCard(appointments) {
    const card = document.querySelector('.clientCards:nth-child(1) .card-text');
    if (!card) {
        console.error('Appointments card not found');
        return;
    }
    
    if (!appointments || appointments.length === 0) {
        card.textContent = 'No appointments scheduled yet.';
        return;
    }
    
    const upcomingAppointments = appointments.filter(apt => new Date(apt.date) > new Date());
    const pendingAppointments = appointments.filter(apt => apt.status === 'Pending');
    
    card.innerHTML = `
        <div class="appointment-stats">
            <div class="d-flex justify-content-between mb-2">
                <span>Upcoming: <strong>${upcomingAppointments.length}</strong></span>
                <span>Pending: <strong>${pendingAppointments.length}</strong></span>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-primary" role="progressbar" 
                    style="width: ${(upcomingAppointments.length / appointments.length) * 100}%" 
                    aria-valuenow="${upcomingAppointments.length}" 
                    aria-valuemin="0" 
                    aria-valuemax="${appointments.length}">
                </div>
            </div>
            <div class="text-center mt-1">
                <small>Total Appointments: ${appointments.length}</small>
            </div>
        </div>
    `;
}

// Update meal plans card
function updateMealPlansCard(mealPlans) {
    const card = document.querySelector('.clientCards:nth-child(2) .card-text');
    if (!card) {
        console.error('Meal plans card not found');
        return;
    }
    
    if (!mealPlans || mealPlans.length === 0) {
        card.textContent = 'No meal plans assigned yet.';
        return;
    }
    
    const currentPlan = mealPlans[0]; // Get the most recent plan
    const meals = typeof currentPlan.meals === 'string' ? JSON.parse(currentPlan.meals) : currentPlan.meals;
    
    card.innerHTML = `
        <div class="meal-plan-stats">
            <div class="current-plan mb-2">
                <strong>Current Plan:</strong> ${currentPlan.title}
            </div>
            <div class="meals-preview">
                <small>
                    <div>🍳 ${meals.Breakfast || 'Not set'}</div>
                    <div>🍽️ ${meals.Lunch || 'Not set'}</div>
                    <div>🌙 ${meals.Dinner || 'Not set'}</div>
                </small>
            </div>
            <div class="text-center mt-2">
                <small>Total Plans: ${mealPlans.length}</small>
            </div>
        </div>
    `;
}

// Update health goals card
function updateHealthGoalsCard(goals) {
    const card = document.querySelector('.clientCards:nth-child(3) .card-text');
    if (!card) {
        console.error('Health goals card not found');
        return;
    }
    
    if (!goals || goals.length === 0) {
        card.textContent = 'No health goals set yet.';
        return;
    }
    
    const completedGoals = goals.filter(goal => parseInt(goal.current_value) >= parseInt(goal.target_value)).length;
    const inProgressGoals = goals.length - completedGoals;
    
    const totalProgress = goals.reduce((sum, goal) => {
        const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
        return sum + progress;
    }, 0);
    const averageProgress = Math.round(totalProgress / goals.length);
    
    card.innerHTML = `
        <div class="goal-stats">
            <div class="d-flex justify-content-between mb-2">
                <span>Completed: <strong>${completedGoals}</strong></span>
                <span>In Progress: <strong>${inProgressGoals}</strong></span>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-success" role="progressbar" 
                    style="width: ${averageProgress}%" 
                    aria-valuenow="${averageProgress}" 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                </div>
            </div>
            <div class="text-center mt-1">
                <small>Overall Progress: ${averageProgress}%</small>
            </div>
        </div>
    `;
}

// Logout function
export function logout() {
    // Clear both token and user data
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    window.location.href = '/OmarOsmanovic/IBUWebProgramming/frontend/pages/login.html';
}

// Make functions available globally
window.logout = logout;

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', initDashboard);