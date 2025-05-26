import RegisterService from '../../services/RegisterService.js';

// Initialize allergies form
function initAllergiesForm() {
    console.log('Initializing allergies form');
    
    // Handle form submission
    $("#allergiesForm").on('submit', function(e) {
        e.preventDefault();
        console.log('Allergies form submitted');
        RegisterService.finalizeRegistration();
    });
}

// Make initAllergiesForm available globally
window.initAllergiesForm = initAllergiesForm;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initAllergiesForm);

// Export the initAllergiesForm function
export { initAllergiesForm }; 