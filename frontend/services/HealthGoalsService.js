import RestClient from '../utils/rest-client.js';
import Constants from '../utils/constants.js';

const HealthGoalsService = {
    // Get all health goals
    getAll: function(callback, errorCallback) {
        RestClient.get('health-goals', callback, errorCallback);
    },
    
    // Get health goal by ID
    getById: function(id, callback, errorCallback) {
        RestClient.get(`health-goals/${id}`, callback, errorCallback);
    },
    
    // Get health goals by user ID
    getByUserId: function(userId, callback, errorCallback) {
        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = `health_goals_${userId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached health goals data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached health goals data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        // For development/testing purposes, use the debug endpoint
        // In production, use the regular endpoint with proper authentication
        RestClient.get(`debug/health-goals/user/${userId}`, function(response) {
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
    
    // Create a new health goal
    create: function(data, callback, errorCallback) {
        RestClient.post('health-goals', data, function(response) {
            // Clear the cache for this user's health goals
            localStorage.removeItem(`health_goals_${data.user_id}`);
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Update an existing health goal
    update: function(id, data, callback, errorCallback) {
        // For development/testing purposes, use the debug endpoint if current_value is the only field to update
        if (Object.keys(data).length === 1 && data.current_value !== undefined) {
            RestClient.get(`debug/update-healthgoal/${id}/${data.current_value}`, function(response) {
                // Clear any cached health goals data for this user
                const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('health_goals_'));
                cacheKeys.forEach(key => localStorage.removeItem(key));
                
                if (callback) callback(response);
            }, errorCallback);
        } else {
            // Use regular endpoint for full updates
            RestClient.put(`health-goals/${id}`, data, function(response) {
                // Clear any cached health goals data for this user
                const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('health_goals_'));
                cacheKeys.forEach(key => localStorage.removeItem(key));
                
                if (callback) callback(response);
            }, errorCallback);
        }
    },
    
    // Delete a health goal
    delete: function(id, callback, errorCallback) {
        RestClient.delete(`health-goals/${id}`, {}, function(response) {
            // Clear any cached health goals data
            const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('health_goals_'));
            cacheKeys.forEach(key => localStorage.removeItem(key));
            
            if (callback) callback(response);
        }, errorCallback);
    },

    updateProgress: function(id, progress, callback, error_callback) {
        RestClient.patch(`backend/health-goals/${id}/progress`, { progress }, callback, error_callback);
    },

    getHealthGoalsByUserId: function(userId) {
        return RestClient.get('backend/health-goals/user/' + userId);
    },

    updateHealthGoalCurrentValue: function(goalId, currentValue) {
        return RestClient.put('backend/health-goals/' + goalId + '/current-value', { current_value: currentValue });
    },

    updateHealthGoalDeadline: function(goalId, deadline) {
        return RestClient.put('backend/health-goals/' + goalId + '/deadline', { deadline: deadline });
    }
};

export default HealthGoalsService; 