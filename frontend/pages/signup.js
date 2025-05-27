import RegisterService from '../services/RegisterService.js';

// Initialize signup form
function initSignup() {
    console.log('Initializing signup page');
    RegisterService.initSignupForm();
}

// Make initSignup available globally
window.initSignup = initSignup;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initSignup);

// Export the initSignup function
export { initSignup }; 