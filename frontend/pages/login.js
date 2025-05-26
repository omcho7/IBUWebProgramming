import UserService from '../services/UserService.js';
import Constants from '../utils/constants.js';
import Utils from '../utils/utils.js';

// Expose Utils globally for debugging
window.Utils = Utils;

// Initialize login form
function initLogin() {
    console.log('Initializing login page');
    
    // Initialize toastr if available
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            positionClass: "toast-top-center",
            timeOut: 3000,
            extendedTimeOut: 1000
        };
    }

    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = $('#email').val();
        const password = $('#password').val();
        
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }
        
        const entity = {
            email: email,
            password: password
        };

        console.log('Sending login request to:', `${Constants.PROJECT_BASE_URL}auth/login`);
        console.log('Request payload:', entity);

        try {
            const response = await fetch(`${Constants.PROJECT_BASE_URL}auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entity)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const result = await response.json();
            console.log("Parsed result:", result);

            if (result.success) {
                console.log("Login successful, token:", result.data.token);
                localStorage.setItem("user_token", result.data.token);
                
                const user = Utils.parseJwt(result.data.token);
                console.log("Decoded user:", user);
                
                const redirectPath = user.role === 'Nutritionist' 
                    ? 'pages/admin/Adashboard.html' 
                    : 'pages/client/Cdashboard.html';
                console.log("Attempting redirect to:", redirectPath);
                window.location.href = redirectPath;
            } else {
                showError(result.message || 'Login failed');
            }
        } catch (error) {
            console.error("Full login error:", error);
            showError(error.message || 'Login failed - please try again');
        }
    });
}

function showError(message) {
    if (typeof toastr !== 'undefined') {
        toastr.error(message);
    } else {
        alert(message);
    }
}

// Make initLogin available globally
window.initLogin = initLogin;

// Initialize when document is ready
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    initLogin();
});

// Export the initLogin function
export { initLogin };
