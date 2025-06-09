import Constants from './constants.js';
import Utils from './utils.js';

export default {
    get: function(url, token = null) {
        return new Promise((resolve, reject) => {
            const authToken = token || localStorage.getItem('user_token');
            if (!authToken) {
                console.error('No token found in localStorage');
                reject(new Error('Authentication required. Please login again.'));
                return;
            }

            // Parse token to verify it's valid
            try {
                const decodedToken = Utils.parseJwt(authToken);
                console.log('Decoded token:', decodedToken);
                
                if (!decodedToken) {
                    console.error('Failed to decode token');
                    reject(new Error('Invalid token format'));
                    return;
                }

                if (!decodedToken.user || !decodedToken.user.role) {
                    console.error('Invalid token structure:', decodedToken);
                    reject(new Error('Invalid token structure'));
                    return;
                }

                // Store user data if not already stored
                if (!localStorage.getItem('user_data')) {
                    localStorage.setItem('user_data', JSON.stringify(decodedToken.user));
                }

                $.ajax({
                    url: `${Constants.PROJECT_BASE_URL}${url}`,
                    type: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    success: function(response) {
                        if (response.success === false) {
                            reject(new Error(response.error || 'Request failed'));
                            return;
                        }
                        resolve(response);
                    },
                    error: function(xhr, status, error) {
                        console.error('Error:', error);
                        console.error('Status:', status);
                        console.error('Response:', xhr.responseText);
                        
                        let errorMessage = 'An error occurred';
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMessage = response.error || errorMessage;
                        } catch (e) {
                            console.error('Error parsing response:', e);
                        }
                        
                        reject(new Error(errorMessage));
                    }
                });
            } catch (e) {
                console.error('Error validating token:', e);
                reject(new Error('Invalid token'));
            }
        });
    },
    
    post: function(url, data, options = {}) {
        const token = localStorage.getItem('user_token');
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        // Parse token to verify it's valid
        const decodedToken = Utils.parseJwt(token);
        if (!decodedToken || !decodedToken.user) {
            return Promise.reject(new Error('Invalid token structure'));
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
            const responseData = await response.json();
            if (!response.ok || responseData.success === false) {
                throw new Error(responseData.error || 'Request failed');
            }
            return responseData;
        });
    },
    
    put: function(url, data, options = {}) {
        const token = localStorage.getItem('user_token');
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        // Parse token to verify it's valid
        const decodedToken = Utils.parseJwt(token);
        if (!decodedToken || !decodedToken.user) {
            return Promise.reject(new Error('Invalid token structure'));
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
            const responseData = await response.json();
            if (!response.ok || responseData.success === false) {
                throw new Error(responseData.error || 'Request failed');
            }
            return responseData;
        });
    },
    
    delete: function(url, options = {}) {
        const token = localStorage.getItem('user_token');
        if (!token) {
            return Promise.reject(new Error('No authentication token found'));
        }

        // Parse token to verify it's valid
        const decodedToken = Utils.parseJwt(token);
        if (!decodedToken || !decodedToken.user) {
            return Promise.reject(new Error('Invalid token structure'));
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
            const responseData = await response.json();
            if (!response.ok || responseData.success === false) {
                throw new Error(responseData.error || 'Request failed');
            }
            return responseData;
        });
    }
};