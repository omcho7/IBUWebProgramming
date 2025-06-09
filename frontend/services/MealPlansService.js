import RestClient from '../utils/rest-client.js';
import Constants from '../utils/constants.js';
import Utils from '../utils/utils.js';

const MealPlansService = {
    // Get all meal plans
    getAll: function(callback, errorCallback) {
        RestClient.get('meal-plans', callback, errorCallback);
    },
    
    // Get meal plan by ID
    getById: function(id, callback, errorCallback) {
        RestClient.get(`meal-plans/${id}`, callback, errorCallback);
    },
    
    // Get meal plans by user ID
    getByUserId: function(userId, callback, errorCallback) {
        // Get token and user data
        const token = localStorage.getItem('user_token');
        const userDataString = localStorage.getItem('user_data');
        
        if (!token) {
            errorCallback('No token found');
            return;
        }

        // First try to get user data from localStorage
        let userData = null;
        if (userDataString) {
            try {
                userData = JSON.parse(userDataString);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        // If no user data in localStorage, try to get it from token
        if (!userData) {
            try {
                const decodedToken = Utils.parseJwt(token);
                if (decodedToken && decodedToken.user) {
                    userData = decodedToken.user;
                    // Store user data in localStorage for future use
                    localStorage.setItem('user_data', JSON.stringify(userData));
                }
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }

        // Verify user data and role
        if (!userData || !userData.role) {
            errorCallback('Invalid user data or missing role');
            return;
        }

        // Use RestClient instead of direct AJAX call
        RestClient.get(`meal-plans/client/${userId}`, function(response) {
            if (response.success) {
                callback(response.data);
            } else {
                errorCallback(response.error || 'Failed to load meal plans');
            }
        }, function(error) {
            console.error('Meal plans error:', error);
            errorCallback(error || 'Failed to load meal plans');
        });
    },
    
    // Get meal plans by nutritionist ID
    getByNutritionistId: function(nutritionistId, callback, errorCallback) {
        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = `meal_plans_nutritionist_${nutritionistId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached nutritionist meal plans data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached nutritionist meal plans data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        RestClient.get(`meal-plans/nutritionist/${nutritionistId}`, function(response) {
            // Cache the response for 5 minutes
            if (response && response.success) {
                const cacheData = {
                    timestamp: Date.now(),
                    data: response
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
            
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Create a new meal plan
    create: function(data, callback, errorCallback) {
        RestClient.post('meal-plans', data, function(response) {
            // Clear related caches
            if (data.user_id) {
                localStorage.removeItem(`meal_plans_${data.user_id}`);
            }
            if (data.nutritionist_id) {
                localStorage.removeItem(`meal_plans_nutritionist_${data.nutritionist_id}`);
            }
            
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Update an existing meal plan
    update: function(id, data, callback, errorCallback) {
        RestClient.put(`meal-plans/${id}`, data, function(response) {
            // Clear all meal plan related caches as we don't know which user or nutritionist
            const cacheKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('meal_plans_')
            );
            cacheKeys.forEach(key => localStorage.removeItem(key));
            
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Delete a meal plan
    delete: function(id, callback, errorCallback) {
        RestClient.delete(`meal-plans/${id}`, {}, function(response) {
            // Clear all meal plan related caches
            const cacheKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('meal_plans_')
            );
            cacheKeys.forEach(key => localStorage.removeItem(key));
            
            if (callback) callback(response);
        }, errorCallback);
    },

    createMealPlan: function(mealPlan, callback, errorCallback) {
        RestClient.post('backend/meal-plans', mealPlan, callback, errorCallback);
    },

    updateMealPlan: function(id, mealPlan, callback, errorCallback) {
        RestClient.put('backend/meal-plans/' + id, mealPlan, callback, errorCallback);
    }
};

export default MealPlansService; 