// client/src/utils/api.js

import axios from 'axios';

// The base URL for your backend API.
// In development, this will be proxied by Create React App (see client/package.json "proxy" field).
// In production, this should be the actual deployed backend URL.
const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// You might add an interceptor here for handling tokens or common errors
api.interceptors.request.use(
    (config) => {
        // In a real app, you would get the JWT token from localStorage or context
        // const token = localStorage.getItem('token');
        const token = 'MOCK_JWT_TOKEN'; // For demonstration, assume a token exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors, e.g., redirect to login on 401
        if (error.response && error.response.status === 401) {
            console.error('Unauthorized request. Redirecting to login (simulated).');
            // window.location.href = '/login'; // In a real app
        }
        return Promise.reject(error);
    }
);


// --- Student API Calls ---
export const getStudents = () => api.get('/students');
export const createStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`); // <-- Added this function
export const getStudentProfile = (id) => api.get(`/students/${id}`);
export const getContestHistory = (id, filter) => api.get(`/students/${id}/contest-history`, { params: { filter } });
export const getProblemData = (id, filter) => api.get(`/students/${id}/problem-data`, { params: { filter } });
export const downloadStudentsCSV = () => api.get('/students/download-csv', { responseType: 'blob' }); // <-- Added this function
export const triggerCodeforcesSync = (id) => api.post(`/students/${id}/sync-codeforces`);
export const getReminderStatus = (id) => api.get(`/students/${id}/reminder-status`);

// --- Sync Configuration API Calls (Example if you had backend routes for this) ---
// export const updateCronSchedule = (schedule) => api.post('/sync/cron-config', { schedule });
// export const getCronSchedule = () => api.get('/sync/cron-config');

