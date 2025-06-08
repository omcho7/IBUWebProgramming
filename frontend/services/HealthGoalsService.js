import { default as RestClient } from '../utils/rest-client.js';
import Constants from '../utils/constants.js';

const HealthGoalsService = {
    getAllHealthGoals: function(callback, errorCallback) {
        RestClient.get('health-goals', callback, errorCallback);
    },

    getHealthGoalById: function(id, callback, errorCallback) {
        RestClient.get(`health-goals/${id}`, callback, errorCallback);
    },

    createHealthGoal: function(data, callback, errorCallback) {
        RestClient.post('health-goals', data, callback, errorCallback);
    },

    updateHealthGoal: function(id, data, callback, errorCallback) {
        RestClient.put(`health-goals/${id}`, data, callback, errorCallback);
    },

    deleteHealthGoal: function(id, callback, errorCallback) {
        RestClient.delete(`health-goals/${id}`, callback, errorCallback);
    },

    getByUserId: function(userId, callback, errorCallback) {
        const token = localStorage.getItem('user_token');
        if (!token) {
            errorCallback('No token found');
            return;
        }

        // Parse token to check structure
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            console.log('Token data:', tokenData);
            if (!tokenData.user || !tokenData.user.role) {
                errorCallback('Invalid token structure');
                return;
            }
        } catch (e) {
            console.error('Error parsing token:', e);
            errorCallback('Invalid token format');
            return;
        }

        $.ajax({
            url: `/OmarOsmanovic/IBUWebProgramming/backend/health-goals/user/${userId}`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                if (response.success) {
                    callback(response.data);
                } else {
                    errorCallback(response.error || 'Failed to load health goals');
                }
            },
            error: function(xhr, status, error) {
                console.error('Health goals error:', {
                    status: xhr.status,
                    error: error,
                    response: xhr.responseText
                });
                errorCallback(error || 'Failed to load health goals');
            }
        });
    },

    updateProgress: function(id, progress, callback, errorCallback) {
        RestClient.put(`health-goals/${id}/progress`, { progress }, callback, errorCallback);
    },

    updateDeadline: function(goalId, deadline, callback, errorCallback) {
        RestClient.put(`health-goals/${goalId}/deadline`, { deadline }, callback, errorCallback);
    }
};

export default HealthGoalsService; 