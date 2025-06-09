// Immediately expose parseJwt globally
window.parseJwt = function(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
};

let Utils = {
    datatable: function (table_id, columns, data, pageLength=15) {
        if ($.fn.dataTable.isDataTable("#" + table_id)) {
            $("#" + table_id)
                .DataTable()
                .destroy();
        }
        $("#" + table_id).DataTable({
            data: data,
            columns: columns,
            pageLength: pageLength,
            lengthMenu: [2, 5, 10, 15, 25, 50, 100, "All"],
            responsive: true,
            language: {
                emptyTable: "No records available",
                zeroRecords: "No matching records found",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                search: "Search records:"
            },
            createdRow: function(row, data, dataIndex) {
                if (data.status) {
                    switch(data.status.toLowerCase()) {
                        case 'pending':
                            $(row).addClass('table-warning');
                            break;
                        case 'confirmed':
                            $(row).addClass('table-success');
                            break;
                        case 'cancelled':
                            $(row).addClass('table-danger');
                            break;
                    }
                }
                
                if (data.progress) {
                    const progress = parseInt(data.progress);
                    if (progress >= 80) {
                        $(row).addClass('table-success');
                    } else if (progress >= 50) {
                        $(row).addClass('table-warning');
                    } else {
                        $(row).addClass('table-danger');
                    }
                }
            }
        });
    },

    parseJwt: function(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    },

    formatDate: function(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString();
    },

    formatTime: function(timeString) {
        if (!timeString) return '';
        
        if (timeString.includes('T') || timeString.includes('-')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return timeString;
    },

    calculateBMI: function(weight, height) {
        
        if (!weight || !height) return 0;
        return (weight / (height * height)).toFixed(1);
    },

    getBMICategory: function(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    },

    calculateProgress: function(current, target) {
        const currentValue = parseFloat(current) || 0;
        const targetValue = parseFloat(target) || 1;
        
        const percentage = Math.round((currentValue / targetValue) * 100);
        
        return Math.max(0, Math.min(100, percentage));
    },

    getUser: function() {
        // First try to get user data from localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
            try {
                const userData = JSON.parse(storedUserData);
                console.log('Retrieved user data from localStorage:', userData);
                return userData;
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                // Don't clear the data, just log the error
            }
        }

        // Fallback to token if no stored user data or parsing failed
        const token = localStorage.getItem('user_token');
        if (!token) {
            console.error('No token found in localStorage');
            return null;
        }
        
        try {
            const decoded = this.parseJwt(token);
            console.log('Decoded token:', decoded);
            
            if (!decoded) {
                console.error('Failed to decode token');
                return null;
            }

            // The token should have a nested user structure
            if (decoded.user && decoded.user.role) {
                console.log('Found nested user structure:', decoded.user);
                // Store the user data for future use
                localStorage.setItem('user_data', JSON.stringify(decoded.user));
                return decoded.user;
            }
            
            console.error('Token missing required user data structure');
            return null;
        } catch (e) {
            console.error('Error parsing token:', e);
            return null;
        }
    },

    getUserRole: function() {
        const user = this.getUser();
        console.log('Getting role for user:', user);
        if (!user) {
            console.error('No user data available');
            return null;
        }
        return user.role;
    },

    isNutritionist: function() {
        return this.getUserRole() === 'Nutritionist';
    },

    isClient: function() {
        return this.getUserRole() === 'Client';
    },

    isAdmin: function() {
        return this.getUserRole() === 'Admin';
    },

    logout: function() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login.html';
    },

    formatGoalType: function(goalType) {
        if (!goalType) return '';
        
        return goalType
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    },

    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                timeout = null;
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

export default Utils;
