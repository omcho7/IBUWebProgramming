import UserService from '../../services/UserService.js';
import AppointmentsService from '../../services/AppointmentsService.js';
import MealPlansService from '../../services/MealPlansService.js';
import HealthGoalsService from '../../services/HealthGoalsService.js';
import Utils from '../../utils/utils.js';

// Initialize dashboard
function initDashboard() {
    console.log('Initializing dashboard');
    
    const tokenData = Utils.getUser();
    console.log('Current token data:', tokenData);
    
    if (!tokenData) {
        console.error('No user found in token');
        toastr.error('You must be logged in to view this page');
        navigate('login');
        return;
    }
    
    // Extract user data from token (token contains user object)
    const user = tokenData.user || tokenData;
    console.log('User data:', user);
    
    if (!user || !user.id) {
        console.error('User ID not found in token');
        toastr.error('Invalid user data');
        navigate('login');
        return;
    }

    // Update welcome message with the client's name from JWT token
    const welcomeMessage = document.querySelector('.clientHero h2');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.username || 'Client'}!`;
    }

    // Reset cache if needed (for example, if the data is stale)
    const cacheTimestamp = localStorage.getItem('dashboard_cache_timestamp');
    if (cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > 5 * 60 * 1000) { // 5 minutes
        console.log('Cache is stale, refreshing data');
        clearDashboardCache();
    }

    // Load initial data
    loadAppointments(user.id);
    loadMealPlans(user.id);
    loadHealthGoals(user.id);

    // Setup event listeners
    setupEventListeners();
}

// Clear dashboard cache
function clearDashboardCache() {
    localStorage.removeItem('cached_appointments');
    localStorage.removeItem('cached_meal_plans');
    localStorage.removeItem('cached_health_goals');
    localStorage.removeItem('dashboard_cache_timestamp');
}

// Make initDashboard available globally
window.initDashboard = initDashboard;

// Load appointments
function loadAppointments(userId) {
    console.log('Loading appointments for user:', userId);
    
    if (!userId) {
        console.error('Cannot load appointments: No user ID provided');
        updateAppointmentsList([]);
        updateAppointmentsCard([]);
        return;
    }
    
    // Check if we have cached data
    const cachedData = localStorage.getItem('cached_appointments');
    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            console.log('Using cached appointments data');
            updateAppointmentsList(parsedData);
            updateAppointmentsCard(parsedData);
            return;
        } catch (e) {
            console.error('Error parsing cached appointments:', e);
        }
    }
    
    AppointmentsService.getByUserId(userId, 
        function(response) {
            console.log('Appointments loaded:', response);
            const appointments = response.data || [];
            
            // Cache the data
            localStorage.setItem('cached_appointments', JSON.stringify(appointments));
            updateDashboardCacheTimestamp();
            
            updateAppointmentsList(appointments);
            updateAppointmentsCard(appointments);
        },
        function(error) {
            console.error('Failed to load appointments:', error);
            toastr.error('Failed to load appointments');
            updateAppointmentsList([]);
            updateAppointmentsCard([]);
        }
    );
}

// Update appointments list
function updateAppointmentsList(appointments) {
    const list = document.getElementById('appointments-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!appointments || appointments.length === 0) {
        list.innerHTML = '<div class="alert alert-info">No appointments found</div>';
        return;
    }

    appointments.forEach(appointment => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div>
                <h5>${appointment.title}</h5>
                <p>${new Date(appointment.appointment_date).toLocaleString()}</p>
            </div>
            <div>
                <button class="btn btn-sm btn-danger" onclick="deleteAppointment(${appointment.id})">Delete</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Update appointments card
function updateAppointmentsCard(appointments) {
    const card = document.querySelector('.clientCards:nth-child(1) .card-text');
    if (!card) return;
    
    if (!appointments || appointments.length === 0) {
        card.textContent = 'No appointments scheduled yet.';
        return;
    }
    
    const upcomingAppointments = appointments.filter(apt => new Date(apt.appointment_date) > new Date());
    card.textContent = `You have ${upcomingAppointments.length} upcoming appointments.`;
}

// Load meal plans
function loadMealPlans(userId) {
    console.log('Loading meal plans for user:', userId);
    
    if (!userId) {
        console.error('Cannot load meal plans: No user ID provided');
        updateMealPlansList([]);
        updateMealPlansCard([]);
        return;
    }
    
    // Check if we have cached data
    const cachedData = localStorage.getItem('cached_meal_plans');
    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            console.log('Using cached meal plans data');
            updateMealPlansList(parsedData);
            updateMealPlansCard(parsedData);
            return;
        } catch (e) {
            console.error('Error parsing cached meal plans:', e);
        }
    }
    
    MealPlansService.getByUserId(userId,
        function(response) {
            console.log('Meal plans loaded:', response);
            const mealPlans = response.data || [];
            
            // Cache the data
            localStorage.setItem('cached_meal_plans', JSON.stringify(mealPlans));
            updateDashboardCacheTimestamp();
            
            updateMealPlansList(mealPlans);
            updateMealPlansCard(mealPlans);
        },
        function(error) {
            console.error('Failed to load meal plans:', error);
            // Don't show error for 404 - just show empty state
            updateMealPlansList([]);
            updateMealPlansCard([]);
        }
    );
}

// Update meal plans list
function updateMealPlansList(mealPlans) {
    const container = document.querySelector('.mealPlan .container');
    if (!container) return;
    
    const mealPlansList = container.querySelector('.meal-plans-list');
    if (!mealPlansList) return;

    mealPlansList.innerHTML = '';
    
    if (!mealPlans || mealPlans.length === 0) {
        mealPlansList.innerHTML = '<div class="alert alert-info">No meal plans found</div>';
        return;
    }

    mealPlans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${plan.title}</h5>
                <p class="card-text">${plan.description}</p>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-outline-success" onclick="viewMealPlan(${plan.id})">View Details</button>
                    <button class="btn btn-success" onclick="updateMealPlan(${plan.id})">Update</button>
                </div>
            </div>
        `;
        mealPlansList.appendChild(card);
    });
}

// Update meal plans card
function updateMealPlansCard(mealPlans) {
    const card = document.querySelector('.clientCards:nth-child(2) .card-text');
    if (!card) return;
    
    if (!mealPlans || mealPlans.length === 0) {
        card.textContent = 'No meal plans assigned yet.';
        return;
    }
    
    const currentPlan = mealPlans.find(plan => plan.status === 'active') || mealPlans[0];
    card.textContent = currentPlan ? `Current plan: ${currentPlan.title}` : 'No active meal plan';
}

// Load health goals
function loadHealthGoals(userId) {
    console.log('Loading health goals for user:', userId);
    
    if (!userId) {
        console.error('Cannot load health goals: No user ID provided');
        updateHealthGoalsList([]);
        updateHealthGoalsCard([]);
        return;
    }
    
    // Check if we have cached data
    const cachedData = localStorage.getItem('cached_health_goals');
    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            console.log('Using cached health goals data');
            updateHealthGoalsList(parsedData);
            updateHealthGoalsCard(parsedData);
            return;
        } catch (e) {
            console.error('Error parsing cached health goals:', e);
        }
    }
    
    HealthGoalsService.getByUserId(userId,
        function(response) {
            console.log('Health goals loaded:', response);
            const goals = response.data || [];
            
            // Cache the data
            localStorage.setItem('cached_health_goals', JSON.stringify(goals));
            updateDashboardCacheTimestamp();
            
            updateHealthGoalsList(goals);
            updateHealthGoalsCard(goals);
        },
        function(error) {
            console.error('Failed to load health goals:', error);
            // Only show error message for non-404/500 errors (these are expected for new users)
            if (error.status !== 404 && error.status !== 500) {
                toastr.error('Failed to load health goals');
            }
            updateHealthGoalsList([]);
            updateHealthGoalsCard([]);
        }
    );
}

// Update health goals list
function updateHealthGoalsList(goals) {
    console.log('Updating health goals list with:', goals);
    
    const container = document.querySelector('.healthGoals.container, .healthGoals .container');
    if (!container) {
        console.error('Health goals container not found');
        console.log('Available containers:', document.querySelectorAll('.container').length);
        return;
    }
    
    console.log('Health goals container found:', container);
    
    // Try different selectors for the goals list
    let goalsList = container.querySelector('.goals-list');
    if (!goalsList) {
        console.warn('Goals list not found with .goals-list selector, trying alternatives');
        // Try creating it if it doesn't exist
        goalsList = document.createElement('div');
        goalsList.className = 'goals-list row';
        container.appendChild(goalsList);
        console.log('Created new goals-list element');
    }

    goalsList.innerHTML = '';
    console.log('Cleared goals list');
    
    if (!goals || goals.length === 0) {
        console.log('No goals to display');
        
        // Create a simple empty state without the demo button
        const emptyState = document.createElement('div');
        emptyState.className = 'col-12 text-center my-5';
        emptyState.innerHTML = `
            <div class="empty-state-container p-4">
                <div class="display-4 mb-3">🎯</div>
                <h3 class="mb-3">No Health Goals Found</h3>
                <p class="text-muted mb-4">You don't have any health goals set up yet. Check back after your nutritionist assigns some goals to track your progress!</p>
            </div>
        `;
        
        goalsList.appendChild(emptyState);
        return;
    }
    
    console.log('Rendering', goals.length, 'goals');

    // Get goal type icons for better visualization
    const goalIcons = {
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
    
    // Format goal type to be more readable
    const formatGoalType = (type) => {
        return type.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };
    
    goals.forEach((goal, index) => {
        console.log(`Processing goal ${index + 1}:`, goal);
        try {
            // Calculate progress percentage safely
            const current = parseFloat(goal.current_value) || 0;
            const target = parseFloat(goal.target_value) || 1; // Avoid division by zero
            const progress = Math.min(Math.round((current / target) * 100), 100);
            const isCompleted = progress >= 100;
            
            // Create a column for each goal
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            
            // Create the goal card with nice formatting
            const card = document.createElement('div');
            card.className = `card ${isCompleted ? 'border-success' : ''}`;
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <span class="goal-icon me-2 fs-3">${goalIcons[goal.goal_type] || '🎯'}</span>
                        <h5 class="card-title mb-0">${formatGoalType(goal.goal_type)}</h5>
                    </div>
                    
                    <div class="goal-details mb-3">
                        <p class="card-text">Target: <strong>${goal.target_value}</strong></p>
                        <p class="card-text">Current: <strong>${goal.current_value}</strong></p>
                        <p class="card-text text-muted">Deadline: ${new Date(goal.deadline).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="progress mb-2" style="height: 20px;">
                        <div class="progress-bar ${isCompleted ? 'bg-success' : ''}" 
                             role="progressbar" 
                             style="width: ${progress}%"
                             aria-valuenow="${progress}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${progress}%
                        </div>
                    </div>
                    
                    ${isCompleted ? 
                        '<div class="text-success text-center mt-2"><i class="bi bi-check-circle-fill"></i> Goal achieved!</div>' : 
                        `<div class="text-center mt-2">${100 - progress}% remaining</div>`
                    }
                    
                    <div class="d-flex justify-content-center mt-3">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="updateGoalProgress(${goal.id}, ${goal.current_value})">
                            Update Progress
                        </button>
                    </div>
                </div>
            `;
            col.appendChild(card);
            goalsList.appendChild(col);
            console.log(`Added goal ${index + 1} to the list`);
        } catch (e) {
            console.error(`Error processing goal ${index + 1}:`, e);
        }
    });
}

// Update health goals card
function updateHealthGoalsCard(goals) {
    const card = document.querySelector('.clientCards:nth-child(3) .card-text');
    if (!card) return;
    
    if (!goals || goals.length === 0) {
        card.textContent = 'No health goals set yet.';
        return;
    }
    
    // Calculate goal statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => parseInt(goal.current_value) >= parseInt(goal.target_value)).length;
    const inProgressGoals = totalGoals - completedGoals;
    
    // Calculate overall progress percentage across all goals
    const totalProgress = goals.reduce((sum, goal) => {
        const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
        return sum + progress;
    }, 0);
    const averageProgress = Math.round(totalProgress / totalGoals);
    
    // Format the display text
    const goalText = `
        <div class="goal-stats">
            <div class="d-flex justify-content-between mb-2">
                <span>Completed: <strong>${completedGoals}</strong></span>
                <span>In Progress: <strong>${inProgressGoals}</strong></span>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${averageProgress}%" 
                    aria-valuenow="${averageProgress}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="text-center mt-1">
                <small>Overall Progress: ${averageProgress}%</small>
            </div>
        </div>
    `;
    
    card.innerHTML = goalText;
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Debug health goals tab
    const healthGoalsTab = document.getElementById('contact-tab');
    if (healthGoalsTab) {
        console.log('Found health goals tab:', healthGoalsTab);
        healthGoalsTab.addEventListener('click', function() {
            console.log('Health goals tab clicked');
            const tabPane = document.getElementById('contact-tab-pane');
            console.log('Health goals tab pane visible:', tabPane.classList.contains('show'));
            
            // Force visibility of health goals content
            setTimeout(() => {
                const container = document.querySelector('.healthGoals.container, .healthGoals .container');
                if (container) {
                    console.log('Health goals container after tab click:', container);
                    // Force refresh health goals
                    const user = Utils.getUser();
                    if (user) {
                        loadHealthGoals(user.id || (user.user && user.user.id));
                    }
                } else {
                    console.error('Health goals container still not found after tab click');
                }
            }, 100);
        });
    } else {
        console.error('Health goals tab not found');
    }

    // Appointment form submission
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('appointment-title').value;
            const date = document.getElementById('appointment-date').value;
            
            const user = Utils.getUser();
            AppointmentsService.create({
                user_id: user.id,
                title: title,
                appointment_date: date
            },
            function(response) {
                toastr.success('Appointment created successfully');
                loadAppointments(user.id);
                appointmentForm.reset();
            },
            function(error) {
                toastr.error('Failed to create appointment');
            });
        });
    }

    // Logout button - UPDATED with event delegation
    document.body.addEventListener('click', function(e) {
        const logoutButton = e.target.closest('.btn-danger a, a[onclick*="navigate(\'home\')"]');
        if (logoutButton) {
            e.preventDefault();
            console.log('Logout button clicked');
            UserService.logout();
        }
    });
}

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', initDashboard);

// Export functions for use in HTML
window.deleteAppointment = function(id) {
    const user = Utils.getUser();
    AppointmentsService.delete(id,
        function(response) {
            toastr.success('Appointment deleted successfully');
            loadAppointments(user.id);
        },
        function(error) {
            toastr.error('Failed to delete appointment');
        }
    );
};

window.logoutUser = function() {
    console.log('Logout function called');
    UserService.logout();
};

window.viewMealPlan = function(id) {
    MealPlansService.getById(id,
        function(response) {
            // Show meal plan details in modal
            const modal = new bootstrap.Modal(document.getElementById('mealPlanModal'));
            const modalBody = document.querySelector('#mealPlanModal .modal-body');
            modalBody.innerHTML = `
                <h5>${response.data.title}</h5>
                <p>${response.data.description}</p>
                <h6>Meals:</h6>
                <ul>
                    ${response.data.meals.map(meal => `<li>${meal}</li>`).join('')}
                </ul>
            `;
            modal.show();
        },
        function(error) {
            toastr.error('Failed to load meal plan details');
        }
    );
};

window.updateMealPlan = function(id) {
    // Implement meal plan update logic
    toastr.info('Update meal plan functionality coming soon');
};

// Update a health goal's progress
function updateGoalProgress(goalId, currentValue) {
    // Show a prompt to get the new progress value
    const newValue = prompt("Update your current progress:", currentValue);
    
    // Check if the user cancelled or entered an invalid value
    if (newValue === null || isNaN(newValue) || newValue < 0) {
        return;
    }
    
    // Get the authentication token
    const token = localStorage.getItem("user_token");
    if (!token) {
        toastr.error('You must be logged in to update health goals');
        return;
    }
    
    // Use our debug endpoint to update the goal
    $.ajax({
        url: `http://localhost/OmarOsmanovic/IBUWebProgramming/debug/update-healthgoal/${goalId}/${newValue}`,
        type: 'GET',
        beforeSend: function(xhr) {
            // Add the Authorization header with the token
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        },
        success: function(response) {
            console.log('Goal progress updated successfully:', response);
            toastr.success('Progress updated successfully!');
            
            // Clear the cache to force a refresh
            localStorage.removeItem('cached_health_goals');
            
            // Reload health goals to reflect the changes
            const user = Utils.getUser();
            if (user && user.user) {
                loadHealthGoals(user.user.id);
            } else if (user) {
                loadHealthGoals(user.id);
            }
        },
        error: function(error) {
            console.error('Failed to update goal progress:', error);
            toastr.error('Failed to update progress: ' + (error.responseJSON?.error || 'Unknown error'));
        }
    });
}

// Make the function available globally
window.updateGoalProgress = updateGoalProgress;

// Update dashboard cache timestamp
function updateDashboardCacheTimestamp() {
    localStorage.setItem('dashboard_cache_timestamp', Date.now().toString());
}

// Export the initDashboard function
export { initDashboard }; 