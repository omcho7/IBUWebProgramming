import Constants from './constants.js';

export default {
    get: function(url, options = {}) {
        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        })
        .then(async response => {
            if (!response.ok) {
                const error = new Error(await response.text());
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    post: function(url, data, options = {}) {
        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(data)
        })
        .then(async response => {
            if (!response.ok) {
                const error = new Error(await response.text());
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    put: function(url, data, options = {}) {
        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(data)
        })
        .then(async response => {
            if (!response.ok) {
                const error = new Error(await response.text());
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    },
    
    delete: function(url, options = {}) {
        return fetch(`${Constants.PROJECT_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        })
        .then(async response => {
            if (!response.ok) {
                const error = new Error(await response.text());
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
    }
};