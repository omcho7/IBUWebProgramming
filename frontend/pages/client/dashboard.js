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

    console.log('All appointments:', appointments);
    
    // Show all appointments, sorted by date
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });

    console.log('Sorted appointments:', sortedAppointments);
    
    const pendingAppointments = appointments.filter(apt => apt.status === 'Pending');
    
    // Format date and time for display
    const formatDateTime = (date, time) => {
        const appointmentDate = new Date(date + 'T' + time);
        return appointmentDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'confirmed': return 'bg-success';
            case 'pending': return 'bg-warning';
            case 'denied': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };
    
    card.innerHTML = `
        <div class="appointment-stats">
            <div class="d-flex justify-content-between mb-2">
                <span>Total: <strong>${appointments.length}</strong></span>
                <span>Pending: <strong>${pendingAppointments.length}</strong></span>
            </div>
            <div class="progress mb-3" style="height: 10px;">
                <div class="progress-bar bg-primary" role="progressbar" 
                    style="width: ${(pendingAppointments.length / appointments.length) * 100}%" 
                    aria-valuenow="${pendingAppointments.length}" 
                    aria-valuemin="0" 
                    aria-valuemax="${appointments.length}">
                </div>
            </div>
            <div class="appointments-list">
                ${sortedAppointments.map(apt => `
                    <div class="appointment-item mb-2 p-2 border-bottom">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold">${formatDateTime(apt.date, apt.time)}</div>
                                <small class="text-muted">Nutritionist ID: ${apt.nutritionist_id}</small>
                            </div>
                            <span class="badge ${getStatusBadgeClass(apt.status)}">
                                ${apt.status}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Update meal plans card
function updateMealPlansCard(mealPlans) {
    const card = document.querySelector('.col-md-4:nth-child(2) .card-text');
    if (!card) {
        console.error('Meal plans card not found');
        return;
    }
    
    if (!mealPlans || mealPlans.length === 0) {
        card.textContent = 'No meal plans assigned yet.';
        return;
    }
    
    try {
        const currentPlan = mealPlans[0]; // Get the most recent plan
        if (!currentPlan) {
            card.textContent = 'No meal plans assigned yet.';
            return;
        }

        // Handle meals data - it could be a string (JSON) or already an object
        let meals = currentPlan.meals;
        if (typeof meals === 'string') {
            try {
                meals = JSON.parse(meals);
            } catch (e) {
                console.error('Error parsing meals JSON:', e);
                meals = {};
            }
        }
        
        // Ensure meals is an object with default values
        meals = meals || {};
        
        card.innerHTML = `
            <div class="meal-plan-stats">
                <div class="current-plan mb-2">
                    <strong>Current Plan:</strong> ${currentPlan.title || 'Untitled Plan'}
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
    } catch (error) {
        console.error('Error updating meal plans card:', error);
        card.textContent = 'Error loading meal plans.';
    }
}

// Update health goals card
function updateHealthGoalsCard(goals) {
    const card = document.querySelector('.col-md-4:nth-child(3) .card-text');
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
    
    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
        const current = parseFloat(goal.current_value);
        const target = parseFloat(goal.target_value);
        const progress = Math.min((current / target) * 100, 100);
        return {
            ...goal,
            progress: Math.round(progress)
        };
    });

    // Sort goals by deadline
    const sortedGoals = [...goalsWithProgress].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get goal icon based on type
    const getGoalIcon = (goalType) => {
        const icons = {
            'LoseWeight': '⚖️',
            'BuildMuscle': '💪',
            'ImproveStamina': '🏃',
            'EatHealthier': '🥗',
            'ReduceStress': '🧘',
            'ImproveSleep': '😴',
            'IncreaseEnergy': '⚡',
            'MentalClarity': '🧠',
            'BoostImmunity': '🛡️'
        };
        return icons[goalType] || '🎯';
    };

    // Get progress bar color based on progress
    const getProgressColor = (progress) => {
        if (progress >= 100) return 'bg-success';
        if (progress >= 70) return 'bg-info';
        if (progress >= 40) return 'bg-warning';
        return 'bg-danger';
    };
    
    card.innerHTML = `
        <div class="goal-stats">
            <div class="d-flex justify-content-between mb-2">
                <span>Completed: <strong>${completedGoals}</strong></span>
                <span>In Progress: <strong>${inProgressGoals}</strong></span>
            </div>
            <div class="progress mb-3" style="height: 10px;">
                <div class="progress-bar bg-success" role="progressbar" 
                    style="width: ${(completedGoals / goals.length) * 100}%" 
                    aria-valuenow="${completedGoals}" 
                    aria-valuemin="0" 
                    aria-valuemax="${goals.length}">
                </div>
            </div>
            <div class="goals-list">
                ${sortedGoals.map(goal => `
                    <div class="goal-item mb-2 p-2 border-bottom">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <div class="fw-bold">
                                    ${getGoalIcon(goal.goal_type)} ${goal.goal_type.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div class="small text-muted">
                                    Current: ${goal.current_value} | Target: ${goal.target_value}
                                </div>
                                <div class="small text-muted">
                                    Deadline: ${formatDate(goal.deadline)}
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="progress" style="width: 60px; height: 6px;">
                                    <div class="progress-bar ${getProgressColor(goal.progress)}" 
                                        role="progressbar" 
                                        style="width: ${goal.progress}%" 
                                        aria-valuenow="${goal.progress}" 
                                        aria-valuemin="0" 
                                        aria-valuemax="100">
                                    </div>
                                </div>
                                <small class="text-muted">${goal.progress}%</small>
                            </div>
                        </div>
                    </div>
                `).join('')}
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