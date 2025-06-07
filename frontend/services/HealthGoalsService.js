import { default as RestClient } from '../utils/rest-client.js';
import Constants from '../utils/constants.js';

class HealthGoalsService {
    async getAllHealthGoals() {
        try {
            const response = await RestClient.get('health-goals');
            return response;
        } catch (error) {
            console.error('Error getting health goals:', error);
            throw error;
        }
    }

    async getHealthGoalById(id) {
        try {
            const response = await RestClient.get(`health-goals/${id}`);
            return response;
        } catch (error) {
            console.error('Error getting health goal:', error);
            throw error;
        }
    }

    async createHealthGoal(data) {
        try {
            const response = await RestClient.post('health-goals', data);
            return response;
        } catch (error) {
            console.error('Error creating health goal:', error);
            throw error;
        }
    }

    async updateHealthGoal(id, data) {
        try {
            const response = await RestClient.put(`health-goals/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating health goal:', error);
            throw error;
        }
    }

    async deleteHealthGoal(id) {
        try {
            const response = await RestClient.delete(`health-goals/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting health goal:', error);
            throw error;
        }
    }

    async getByUserId(userId) {
        try {
            const response = await RestClient.get(`health-goals/user/${userId}`);
            return response;
        } catch (error) {
            console.error('Error getting health goals by user:', error);
            throw error;
        }
    }

    async updateProgress(id, progress) {
        try {
            const response = await RestClient.patch(`health-goals/${id}/progress`, { progress });
            return response;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    }

    async updateDeadline(goalId, deadline) {
        try {
            const response = await RestClient.put(`health-goals/${goalId}/deadline`, { deadline });
            return response;
        } catch (error) {
            console.error('Error updating deadline:', error);
            throw error;
        }
    }
}

export default new HealthGoalsService(); 