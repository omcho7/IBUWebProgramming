import RegisterService from '../../services/RegisterService.js';

// Initialize health goals form
function initHealthGoalsForm() {
    console.log('Initializing health goals form');
    RegisterService.initHealthGoalsForm();
}

// Make initHealthGoalsForm available globally
window.initHealthGoalsForm = initHealthGoalsForm;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initHealthGoalsForm);

// Export the initHealthGoalsForm function
export { initHealthGoalsForm }; 