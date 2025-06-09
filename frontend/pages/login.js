import Constants from '../utils/constants.js';
import Utils from '../utils/utils.js';

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

    $('#loginForm').on('submit', function(e) {
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
        
        $.ajax({
            url: `${Constants.PROJECT_BASE_URL}auth/login`,
            type: 'POST',
            data: JSON.stringify(entity),
            contentType: 'application/json',
            success: function(result) {
                console.log("Login response:", result);
                if (result.success) {
                    console.log("Login successful, token:", result.data.token);
                    
                    try {
                        // Parse the token first to verify it's valid
                        const decodedToken = Utils.parseJwt(result.data.token);
                        console.log("Decoded token:", decodedToken);
                        
                        if (!decodedToken || !decodedToken.user || !decodedToken.user.role) {
                            console.error("Invalid token structure - missing role");
                            showError('Invalid authentication data');
                            return;
                        }
                        
                        // Store the token
                        localStorage.setItem("user_token", result.data.token);
                        
                        // Store user data from the token to ensure consistency
                        localStorage.setItem("user_data", JSON.stringify(decodedToken.user));
                        
                        // Verify the data was stored correctly
                        const storedToken = localStorage.getItem('user_token');
                        const storedUserData = localStorage.getItem('user_data');
                        
                        if (!storedToken || !storedUserData) {
                            console.error("Failed to store authentication data");
                            showError('Failed to save login data');
                            return;
                        }
                        
                        const redirectPath = decodedToken.user.role === 'Nutritionist' 
                            ? 'admin/Adashboard' 
                            : 'client/Cdashboard';
                        console.log("Redirecting to:", redirectPath);
                        
                        // Use a longer delay to ensure data is stored
                        setTimeout(() => {
                            navigate(redirectPath);
                        }, 500);
                    } catch (error) {
                        console.error("Error processing login data:", error);
                        showError('Error processing login data');
                        // Clear any partial data
                        localStorage.removeItem('user_token');
                        localStorage.removeItem('user_data');
                    }
                } else {
                    showError(result.message || 'Login failed');
                }
            },
            error: function(error) {
                console.error("Full login error:", error);
                showError(error.responseJSON?.message || 'Login failed - please try again');
            }
        });
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
