import RestClient from '../utils/rest-client.js';
import Constants from '../utils/constants.js';

const AppointmentsService = {
    // Get all appointments
    getAll: function(callback, errorCallback) {
        RestClient.get('appointments', callback, errorCallback);
    },
    
    // Get appointment by ID
    getById: function(id, callback, errorCallback) {
        RestClient.get(`appointments/${id}`, callback, errorCallback);
    },
    
    // Get appointments by user ID
    getByUserId: function(userId, callback, errorCallback) {
        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = `appointments_${userId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached appointments data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached appointments data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        RestClient.get(`appointments/user/${userId}`, function(response) {
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
    
    // Get appointments by nutritionist ID
    getByNutritionistId: function(nutritionistId, callback, errorCallback) {
        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = `appointments_nutritionist_${nutritionistId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached nutritionist appointments data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached nutritionist appointments data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        RestClient.get(`appointments/nutritionist/${nutritionistId}`, function(response) {
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
    
    // Create a new appointment
    create: function(data, callback, errorCallback) {
        RestClient.post('appointments', data, function(response) {
            // Clear related caches
            if (data.user_id) {
                localStorage.removeItem(`appointments_${data.user_id}`);
            }
            if (data.nutritionist_id) {
                localStorage.removeItem(`appointments_nutritionist_${data.nutritionist_id}`);
            }
            
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Update an existing appointment
    update: function(id, data, callback, errorCallback) {
        RestClient.put(`appointments/${id}`, data, function(response) {
            // Clear all appointment-related caches as we don't know which user or nutritionist
            const cacheKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('appointments_')
            );
            cacheKeys.forEach(key => localStorage.removeItem(key));
            
            if (callback) callback(response);
        }, errorCallback);
    },
    
    // Delete an appointment
    delete: function(id, callback, errorCallback) {
        RestClient.delete(`appointments/${id}`, {}, function(response) {
            // Clear all appointment-related caches
            const cacheKeys = Object.keys(localStorage).filter(key => 
                key.startsWith('appointments_')
            );
            cacheKeys.forEach(key => localStorage.removeItem(key));
            
            if (callback) callback(response);
        }, errorCallback);
    },

    updateStatus: function(id, status, callback, error_callback) {
        RestClient.patch(`appointments/${id}/status`, { status }, callback, error_callback);
    }
};

export default AppointmentsService; 