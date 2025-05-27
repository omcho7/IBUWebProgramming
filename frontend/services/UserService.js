import RestClient from '../utils/rest-client.js';
import Utils from '../utils/utils.js';
import Constants from '../utils/constants.js';

const UserService = {
    init: function() {
        var token = localStorage.getItem("user_token");
        if (token && token !== undefined) {
            navigate('client/Cdashboard');
        }
        
        $("#loginForm").validate({
            submitHandler: function(form) {
                var entity = Object.fromEntries(new FormData(form).entries());
                UserService.login(entity);
            }
        });

        $("#loginForm").on('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted');
            const entity = {
                email: $('#email').val(),
                password: $('#password').val()
            };
            UserService.login(entity);
        });
    },

    login: function(entity) {
        console.log('Attempting login with:', entity);
        
        // Use regular AJAX to avoid content-type issues
        $.ajax({
            url: Constants.PROJECT_BASE_URL + "auth/login",
            type: "POST",
            data: entity,
            success: function(result) {
                console.log('Login response:', result);
                if (result.success) {
                    localStorage.setItem("user_token", result.data.token);
                    const user = Utils.parseJwt(result.data.token);
                    console.log('Parsed user data:', user);
                    
                    // Extract user role from token
                    const role = user.role || (user.user && user.user.role);
                    console.log('User role:', role);
                    
                    switch(role) {
                        case 'Client':
                            navigate('client/Cdashboard');
                            break;
                        case 'Nutritionist':
                            navigate('admin/Adashboard');
                            break;
                        default:
                            navigate('client/Cdashboard');
                    }
                } else {
                    toastr.error(result.message || 'Login failed');
                }
            },
            error: function(error) {
                console.error('Login error:', error);
                console.error('Response text:', error.responseText);
                toastr.error(error.responseJSON?.message || 'Login failed');
            }
        });
    },

    logout: function() {
        console.log('Logout called');
        localStorage.clear();
        toastr.success('You have been logged out.');
        if (typeof window.navigate === 'function') {
            window.navigate('home');
        } else {
            window.location.href = '/';
        }
    },

    generateMenuItems: function() {
        const token = localStorage.getItem("user_token");
        if (!token) {
            window.location.replace("../pages/login.html");
            return;
        }

        const user = Utils.parseJwt(token);
        if (!user || !user.role) {
            window.location.replace("../pages/login.html");
            return;
        }
        
        let nav = "";
        let main = "";
        
        switch(user.role) {
            case 'Client':
                nav = '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#dashboard">Dashboard</a>' +
                      '</li>' +
                      '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#meal-plans">Meal Plans</a>' +
                      '</li>' +
                      '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#health-goals">Health Goals</a>' +
                      '</li>' +
                      '<li>' +
                      '<button class="btn btn-primary" onclick="UserService.logout()">Logout</button>' +
                      '</li>';
                    
                    main = '<section id="dashboard"></section>' +
                           '<section id="meal-plans"></section>' +
                           '<section id="health-goals"></section>';
                    break;

            case 'Nutritionist':
                nav = '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#dashboard">Dashboard</a>' +
                      '</li>' +
                      '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#clients">Clients</a>' +
                      '</li>' +
                      '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#appointments">Appointments</a>' +
                      '</li>' +
                      '<li class="nav-item mx-0 mx-lg-1">' +
                      '<a class="nav-link py-3 px-0 px-lg-3 rounded" href="#meal-plans">Meal Plans</a>' +
                      '</li>' +
                      '<li>' +
                      '<button class="btn btn-primary" onclick="UserService.logout()">Logout</button>' +
                      '</li>';
                    
                    main = '<section id="dashboard"></section>' +
                           '<section id="clients"></section>' +
                           '<section id="appointments"></section>' +
                           '<section id="meal-plans"></section>';
                    break;

            default:
                window.location.replace("../pages/login.html");
                return;
        }
        
        $("#tabs").html(nav);
        $("#spapp").html(main);
    },

    // Get all users - for admin/nutritionist use
    getAllUsers: function(callback, errorCallback) {
        const token = localStorage.getItem("user_token");
        if (!token) {
            errorCallback({ status: 401, responseText: 'No authentication token found' });
            return;
        }

        // Try to get from localStorage cache first (if cache isn't expired)
        const cacheKey = 'all_users';
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const cache = JSON.parse(cachedData);
                // Check if cache is still valid (5 minutes)
                if (cache.timestamp && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
                    console.log('Using cached users data');
                    callback(cache.data);
                    return;
                } else {
                    // Cache expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error('Error parsing cached users data:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        RestClient.get('users', 
            { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } 
            },
            function(response) {
                // Cache the response for 5 minutes
                if (response && response.success) {
                    const cacheData = {
                        timestamp: Date.now(),
                        data: response
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                }
                
                if (callback) callback(response);
            }, 
            errorCallback
        );
    },
    
    // Get user by ID
    getUserById: function(id, callback, errorCallback) {
        RestClient.get(`users/${id}`, callback, errorCallback);
    },
    
    // Get current user profile
    getCurrentUser: function(callback, errorCallback) {
        RestClient.get('auth/me', callback, errorCallback);
    },
    
    // Update user profile
    updateProfile: function(id, data, callback, errorCallback) {
        RestClient.put(`users/${id}`, data, function(response) {
            // Clear user cache
            localStorage.removeItem('all_users');
            
            if (callback) callback(response);
        }, errorCallback);
    }
};

export default UserService; 