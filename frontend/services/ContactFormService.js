import RestClient from '../utils/rest-client.js';
import Utils from '../utils/utils.js';

var ContactFormService = {
    getAll: function(callback, error_callback) {
        RestClient.get('/contact-forms', callback, error_callback);
    },

    getById: function(id, callback, error_callback) {
        RestClient.get(`/contact-forms/${id}`, callback, error_callback);
    },

    create: function(data, callback, error_callback) {
        RestClient.post('/contact-forms', data, callback, error_callback);
    },

    update: function(id, data, callback, error_callback) {
        RestClient.patch(`/contact-forms/${id}`, data, callback, error_callback);
    },

    delete: function(id, callback, error_callback) {
        RestClient.delete(`/contact-forms/${id}`, callback, error_callback);
    },

    // Additional methods specific to contact forms
    getByUserId: function(userId, callback, error_callback) {
        RestClient.get(`/contact-forms/user/${userId}`, callback, error_callback);
    },

    updateStatus: function(id, status, callback, error_callback) {
        RestClient.patch(`/contact-forms/${id}/status`, { status }, callback, error_callback);
    }
};

export default ContactFormService; 