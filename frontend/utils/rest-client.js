import Constants from './constants.js';

export default {
    get: function(url, options = {}) {
        const token = localStorage.getItem('user_token');
        console.log("[DEBUG] Making GET request to:", url);
        console.log("[DEBUG] Token:", token ? "Present" : "Missing");
        
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            }
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[DEBUG] API Error:", {
                    status: response.status,
                    url: url,
                    error: errorText
                });
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    post: function(url, data, options = {}) {
        const token = localStorage.getItem('user_token');
        console.log("[DEBUG] Making POST request to:", url);
        console.log("[DEBUG] Token:", token ? "Present" : "Missing");
        
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            },
            body: JSON.stringify(data)
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[DEBUG] API Error:", {
                    status: response.status,
                    url: url,
                    error: errorText
                });
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    put: function(url, data, options = {}) {
        const token = localStorage.getItem('user_token');
        console.log("[DEBUG] Making PUT request to:", url);
        console.log("[DEBUG] Token:", token ? "Present" : "Missing");
        
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            },
            body: JSON.stringify(data)
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[DEBUG] API Error:", {
                    status: response.status,
                    url: url,
                    error: errorText
                });
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    delete: function(url, options = {}) {
        const token = localStorage.getItem('user_token');
        console.log("[DEBUG] Making DELETE request to:", url);
        console.log("[DEBUG] Token:", token ? "Present" : "Missing");
        
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {})
            }
        })
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[DEBUG] API Error:", {
                    status: response.status,
                    url: url,
                    error: errorText
                });
                const error = new Error(errorText);
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    }
};