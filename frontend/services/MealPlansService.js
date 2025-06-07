import RestClient from '../utils/rest-client.js';
import Constants from '../utils/constants.js';

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
        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = `meal_plans_${userId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached meal plans data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached meal plans data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        RestClient.get(`meal-plans/user/${userId}`, function(response) {
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

    getMealPlansByClientId: function(clientId, callback, errorCallback) {
        RestClient.get('backend/meal-plans/client/' + clientId, callback, errorCallback);
    },

    createMealPlan: function(mealPlan, callback, errorCallback) {
        RestClient.post('backend/meal-plans', mealPlan, callback, errorCallback);
    },

    updateMealPlan: function(id, mealPlan, callback, errorCallback) {
        RestClient.put('backend/meal-plans/' + id, mealPlan, callback, errorCallback);
    }
};

export default MealPlansService; 