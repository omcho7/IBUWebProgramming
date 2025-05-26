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
        const token = localStorage.getItem('user_token');
        if (!token) {
            return null;
        }
        
        try {
            const decoded = this.parseJwt(token);
            if (decoded.user) {
                return decoded.user;
            } else if (decoded.role) {
                return decoded;
            } else {
                console.warn('JWT token does not contain user data in expected format');
                return decoded;
            }
        } catch (e) {
            console.error('Error getting user from token:', e);
            return null;
        }
    },

    getUserRole: function() {
        const user = this.getUser();
        return user ? user.role : null;
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
