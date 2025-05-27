import RestClient from '../utils/rest-client.js';
import Utils from '../utils/utils.js';
import Constants from '../utils/constants.js';

const RegisterService = {
    // Store user data during registration process
    userData: {
        username: '',
        email: '',
        password: '',
        role: 'Client',
        healthGoals: []
    },

    // Initialize registration form validation
    initSignupForm: function() {
        console.log('Initializing signup form');
        
        // Check if jQuery validation plugin is available
        if (typeof $.fn.validate === 'function') {
            // Form validation
            $("#signupForm").validate({
                rules: {
                    username: "required",
                    email: {
                        required: true,
                        email: true
                    },
                    password: {
                        required: true,
                        minlength: 6
                    },
                    confirmPassword: {
                        required: true,
                        equalTo: "#password"
                    }
                },
                messages: {
                    username: "Please enter your username",
                    email: {
                        required: "Please enter your email",
                        email: "Please enter a valid email address"
                    },
                    password: {
                        required: "Please enter a password",
                        minlength: "Password must be at least 6 characters"
                    },
                    confirmPassword: {
                        required: "Please confirm your password",
                        equalTo: "Passwords do not match"
                    }
                },
                submitHandler: function(form) {
                    // Prevent default form submission
                    event.preventDefault();
                    
                    // Get form data
                    const formData = {
                        username: $('#username').val(),
                        email: $('#email').val(),
                        password: $('#password').val(),
                        role: 'Client'
                    };
                    
                    // Store user data for later steps
                    RegisterService.userData.username = formData.username;
                    RegisterService.userData.email = formData.email;
                    RegisterService.userData.password = formData.password;
                    
                    // Navigate to next step
                    navigate('client/Cform');
                }
            });
        } else {
            console.warn('jQuery Validation plugin not found, using basic validation');
            
            // Basic form validation without the plugin
            $("#signupForm").on('submit', function(e) {
                e.preventDefault();
                
                // Basic validation
                let isValid = true;
                const username = $('#username').val();
                const email = $('#email').val();
                const password = $('#password').val();
                const confirmPassword = $('#confirmPassword').val();
                
                // Clear previous error messages
                $('.error-message').remove();
                
                // Validate username
                if (!username) {
                    $('#username').after('<span class="error-message text-danger">Please enter your username</span>');
                    isValid = false;
                }
                
                // Validate email
                if (!email) {
                    $('#email').after('<span class="error-message text-danger">Please enter your email</span>');
                    isValid = false;
                } else if (!/\S+@\S+\.\S+/.test(email)) {
                    $('#email').after('<span class="error-message text-danger">Please enter a valid email address</span>');
                    isValid = false;
                }
                
                // Validate password
                if (!password) {
                    $('#password').after('<span class="error-message text-danger">Please enter a password</span>');
                    isValid = false;
                } else if (password.length < 6) {
                    $('#password').after('<span class="error-message text-danger">Password must be at least 6 characters</span>');
                    isValid = false;
                }
                
                // Validate confirm password
                if (!confirmPassword) {
                    $('#confirmPassword').after('<span class="error-message text-danger">Please confirm your password</span>');
                    isValid = false;
                } else if (password !== confirmPassword) {
                    $('#confirmPassword').after('<span class="error-message text-danger">Passwords do not match</span>');
                    isValid = false;
                }
                
                if (isValid) {
                    // Get form data
                    const formData = {
                        username: username,
                        email: email,
                        password: password,
                        role: 'Client'
                    };
                    
                    // Store user data for later steps
                    RegisterService.userData.username = formData.username;
                    RegisterService.userData.email = formData.email;
                    RegisterService.userData.password = formData.password;
                    
                    // Navigate to next step
                    navigate('client/Cform');
                }
            });
        }
    },
    
    // Initialize health goals form
    initHealthGoalsForm: function() {
        console.log('Initializing health goals form');
        
        // Form submission
        $(".goalsForm").on('submit', function(e) {
            e.preventDefault();
            
            // Get selected health goals
            const selectedGoals = [];
            $('input[type="checkbox"]:checked').each(function() {
                selectedGoals.push($(this).val());
            });
            
            // Store health goals
            RegisterService.userData.healthGoals = selectedGoals;
            
            // Navigate to next step
            navigate('client/Cform2');
        });
    },
    
    // Finalize registration
    finalizeRegistration: function() {
        console.log('Finalizing registration with data:', RegisterService.userData);
        
        // Validate required fields
        if (!RegisterService.userData.username || !RegisterService.userData.email || !RegisterService.userData.password) {
            console.error('Missing required user data for registration');
            toastr.error('Registration failed: Missing required information');
            setTimeout(function() {
                navigate('signup');
            }, 1000);
            return;
        }
        
        // Prepare user data for registration (exclude healthGoals)
        const userData = {
            username: RegisterService.userData.username,
            email: RegisterService.userData.email,
            password: RegisterService.userData.password,
            role: RegisterService.userData.role
        };
        
        console.log('Sending registration data:', userData);
        
        // Use regular AJAX instead of RestClient for more control
        $.ajax({
            url: Constants.PROJECT_BASE_URL + "auth/register",
            type: "POST",
            data: userData,
            success: function(response) {
                console.log('Registration response:', response);
                if (response && response.success) {
                    console.log('User registered successfully:', response);
                    
                    // Store the user's health goals
                    if (RegisterService.userData.healthGoals && RegisterService.userData.healthGoals.length > 0) {
                        RegisterService.saveHealthGoals(response.data.id);
                    } else {
                        // If no health goals, just log in the user
                        RegisterService.loginAfterRegistration();
                    }
                } else {
                    console.error('Registration failed:', response);
                    toastr.error(response.message || 'Registration failed');
                    setTimeout(function() {
                        navigate('signup');
                    }, 1000);
                }
            },
            error: function(error) {
                console.error('Registration error:', error);
                toastr.error(error.responseJSON?.message || 'Registration failed');
                setTimeout(function() {
                    navigate('signup');
                }, 1000);
            }
        });
    },
    
    // Save health goals
    saveHealthGoals: function(userId) {
        console.log('Saving health goals for user:', userId);
        
        if (!RegisterService.userData.healthGoals || RegisterService.userData.healthGoals.length === 0) {
            console.log('No health goals to save');
            RegisterService.loginAfterRegistration();
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        let totalGoals = RegisterService.userData.healthGoals.length;
        
        // Process each goal sequentially instead of using Promise.all
        const processGoal = function(index) {
            if (index >= RegisterService.userData.healthGoals.length) {
                console.log(`Completed saving health goals: ${successCount} succeeded, ${failCount} failed`);
                // Proceed to login regardless of success/failure
                RegisterService.loginAfterRegistration();
                return;
            }
            
            const goal = RegisterService.userData.healthGoals[index];
            
            // Check if the goal type is valid for the database
            // The database column is defined as a SET with specific values
            const validGoalTypes = ['LoseWeight', 'BuildMuscle', 'ImproveStamina', 'EatHealthier', 
                                   'ReduceStress', 'ImproveSleep', 'IncreaseEnergy', 'MentalClarity', 'BoostImmunity'];
            
            // Skip invalid goal types
            if (!validGoalTypes.includes(goal)) {
                console.error(`Invalid goal type: ${goal}, skipping`);
                failCount++;
                processGoal(index + 1);
                return;
            }
            
            // Prepare data
            const deadline = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0];
            
            console.log('Submitting health goal with data:', {
                user_id: userId,
                goal_type: goal,
                target_value: '100',
                current_value: '0',
                deadline: deadline
            });
            
            // Use direct AJAX call instead of form submission
            $.ajax({
                url: Constants.PROJECT_BASE_URL + "health-goals",
                type: "POST",
                contentType: "application/x-www-form-urlencoded",
                data: {
                    user_id: userId,
                    goal_type: goal,
                    target_value: '100',
                    current_value: '0',
                    deadline: deadline
                },
                success: function(response) {
                    console.log('Health goal created successfully:', response);
                    successCount++;
                    processGoal(index + 1);
                },
                error: function(error) {
                    console.error('Failed to create health goal:', error);
                    console.error('Response text:', error.responseText);
                    
                    // Try to parse the error response for more information
                    try {
                        const errorResponse = JSON.parse(error.responseText);
                        console.error('Error details:', errorResponse);
                    } catch (e) {
                        console.error('Could not parse error response');
                    }
                    
                    failCount++;
                    processGoal(index + 1);
                }
            });
        };
        
        // Start processing the first goal
        processGoal(0);
    },
    
    // Login after registration
    loginAfterRegistration: function() {
        const loginData = {
            email: RegisterService.userData.email,
            password: RegisterService.userData.password
        };
        
        console.log('Logging in after registration with:', loginData);
        
        // Use regular AJAX to avoid content-type issues
        $.ajax({
            url: Constants.PROJECT_BASE_URL + "auth/login",
            type: "POST",
            data: loginData,
            success: function(result) {
                console.log('Login response:', result);
                if (result && result.success) {
                    localStorage.setItem("user_token", result.data.token);
                    toastr.success('Registration successful!');
                    // Use a small delay to ensure token is saved before navigation
                    setTimeout(function() {
                        navigate('client/Cdashboard');
                    }, 100);
                } else {
                    console.error('Login failed:', result);
                    toastr.error(result.message || 'Login failed after registration');
                    setTimeout(function() {
                        navigate('login');
                    }, 1000);
                }
            },
            error: function(error) {
                console.error('Login error after registration:', error);
                console.error('Response text:', error.responseText);
                toastr.error(error.responseJSON?.message || 'Login failed after registration');
                setTimeout(function() {
                    navigate('login');
                }, 1000);
            }
        });
    }
};

export default RegisterService; 