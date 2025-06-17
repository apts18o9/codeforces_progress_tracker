// server/routes/studentRoutes.js

const express = require('express');
const {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  getContestHistory,
  getProblemData,
  downloadCsv,
  getReminderStatus // Assuming this is also a specific route
} = require('../controllers/studentController');
const { triggerManualSync } = require('../controllers/codeforcesController'); // For manual sync


const router = express.Router();

// Middleware for "authentication" (mock for now)
const protect = (req, res, next) => {
  // In a real app, you'd verify JWT token here
  // For this example, we'll just log and proceed
  console.log('Authentication middleware: User assumed authenticated.');
  req.user = { id: 'mockUserId', name: 'Mock User' }; // Attach a mock user
  next();
};

// Apply protect middleware to all routes (or selectively)
router.use(protect);

// IMPORTANT: Define more specific routes BEFORE dynamic ID routes

// Utility routes (must come before /:id)
router.get('/download-csv', downloadCsv); // Route for downloading CSV
// If you had a cron-config endpoint that wasn't tied to a student ID, it would also go here
// router.post('/cron-config', syncController.updateCronConfig); // Example

// Student management routes (general, dynamic ID routes come after specific ones)
router.route('/').get(getAllStudents).post(createStudent);

// Student data routes that target a specific student ID
router.route('/:id')
  .get(getStudentProfile) // This will now only match actual IDs, not 'download-csv'
  .put(updateStudent)
  .delete(deleteStudent);

// More specific routes related to a student ID but with a sub-path
router.get('/:id/contest-history', getContestHistory);
router.get('/:id/problem-data', getProblemData);
router.get('/:id/reminder-status', getReminderStatus); // Get reminder status
router.post('/:id/sync-codeforces', triggerManualSync); // Manual sync endpoint for a student


module.exports = router;

