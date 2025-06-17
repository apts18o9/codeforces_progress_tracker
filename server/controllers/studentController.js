// server/controllers/studentController.js

const Student = require('../models/Student');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const { syncStudentData } = require('./codeforcesController');
const { checkInactivityAndSendEmail } = require('./emailController');
// Re-using getDaysAgo from emailController utils for consistency
const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};


/**
 * @desc Get all students
 * @route GET /api/students
 * @access Private (or Public if no auth)
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({});
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching all students:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Create a new student
 * @route POST /api/students
 * @access Private
 */
const createStudent = async (req, res) => {
  const { name, email, phoneNumber, codeforcesHandle } = req.body;

  // Basic validation
  if (!name || !email || !codeforcesHandle) {
    return res.status(400).json({ message: 'Please enter all required fields: name, email, codeforces handle.' });
  }

  try {
    // Check if student with same email or handle already exists
    const existingStudent = await Student.findOne({ $or: [{ email }, { codeforcesHandle }] });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email or Codeforces handle already exists.' });
    }

    const student = await Student.create({
      name,
      email,
      phoneNumber,
      codeforcesHandle,
      // Default values for ratings and sync date handled by schema (will be 0)
    });
    console.log(`[API] New student created in DB with ID: ${student._id}. Initial ratings: ${student.currentRating}`);


    if (student) {
      // Trigger immediate Codeforces data sync for the new student
      // This is an awaited call, so it should complete before the response is sent
      console.log(`[API] Triggering initial Codeforces sync for new student ${student.name} (${student.codeforcesHandle})...`);
      const syncSuccess = await syncStudentData(student._id, student.codeforcesHandle);
      console.log(`[API] Initial sync for ${student.name} completed. Success: ${syncSuccess}`);

      if (!syncSuccess) {
        console.warn(`[API] Initial sync failed for new student ${student.name}. Returning partial data.`);
        // Even if sync failed, we should still try to return the latest state
        const failedSyncStudent = await Student.findById(student._id);
        return res.status(201).json({
          message: 'Student added but Codeforces data sync failed. Please try syncing manually later.',
          student: failedSyncStudent, // Return the student object, which might still have 0 ratings
        });
      }
      
      // Fetch the student again to ensure we get the updated ratings and sync date
      const updatedStudent = await Student.findById(student._id); 
      console.log(`[API] Fetched updated student after sync for ${student.name}: CurrentRating=${updatedStudent.currentRating}`);

      res.status(201).json({
        message: 'Student added and Codeforces data synced successfully!',
        student: updatedStudent, // Send back the fully updated student object
      });
    } else {
      res.status(400).json({ message: 'Invalid student data received.' });
    }
  } catch (error) {
    console.error('[API ERROR] Error creating student:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Update student details
 * @route PUT /api/students/:id
 * @access Private
 */
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, codeforcesHandle, disableEmailReminders } = req.body;

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const oldCodeforcesHandle = student.codeforcesHandle;
    const oldDisableEmailReminders = student.disableEmailReminders; // Capture old state

    student.name = name || student.name;
    student.email = email || student.email;
    student.phoneNumber = phoneNumber !== undefined ? phoneNumber : student.phoneNumber; // Allow empty string for phone
    student.codeforcesHandle = codeforcesHandle || student.codeforcesHandle;
    student.disableEmailReminders = disableEmailReminders !== undefined ? disableEmailReminders : student.disableEmailReminders;


    // If email or handle changed, check for duplicates before saving
    if (email && email !== student.email) {
      const emailExists = await Student.findOne({ email });
      if (emailExists && String(emailExists._id) !== id) {
        return res.status(400).json({ message: 'Email already exists for another student.' });
      }
    }
    if (codeforcesHandle && codeforcesHandle !== student.codeforcesHandle) {
      const handleExists = await Student.findOne({ codeforcesHandle });
      if (handleExists && String(handleExists._id) !== id) {
        return res.status(400).json({ message: 'Codeforces handle already exists for another student.' });
      }
    }


    await student.save();
    console.log(`[API] Student ${student.name} updated in DB.`);


    // ALWAYS trigger Codeforces data sync after any student update
    // This acts as a manual "refresh" or "sync now" on every edit operation.
    console.log(`[API] Triggering immediate Codeforces sync for updated student ${student.name} (${student.codeforcesHandle}).`);
    const syncSuccess = await syncStudentData(student._id, student.codeforcesHandle);
    if (!syncSuccess) {
      console.warn(`[API] Manual sync triggered by update for ${student.name} FAILED.`);
    }


    // If email reminders were just re-enabled, check for inactivity
    // Make sure 'disableEmailReminders' was actually changed to false AND it was previously true
    if (student.disableEmailReminders === false && oldDisableEmailReminders === true) {
        console.log(`[API] Email reminders re-enabled for ${student.name}. Checking for inactivity.`);
        await checkInactivityAndSendEmail(student._id, student.name, student.email);
    }

    // Always fetch the latest state of the student to ensure frontend has accurate data
    // This is important because syncStudentData might have updated ratings etc.
    const updatedStudent = await Student.findById(id);

    res.status(200).json({
      message: 'Student updated successfully!',
      student: updatedStudent, // Send back the fully updated student object
    });
  } catch (error) {
    console.error('[API ERROR] Error updating student:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


/**
 * @desc Delete a student
 * @route DELETE /api/students/:id
 * @access Private
 */
const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Delete associated contest history and submissions
    console.log(`[API] Deleting associated contests and submissions for student ID: ${id}`);
    await Contest.deleteMany({ student: id });
    await Submission.deleteMany({ student: id });
    console.log(`[API] Associated data deleted.`);


    await student.deleteOne(); // Use deleteOne() or deleteMany() instead of remove()
    console.log(`[API] Student ${id} deleted.`);

    res.status(200).json({ message: 'Student and all associated data deleted successfully.' });
  } catch (error) {
    console.error('[API ERROR] Error deleting student:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Get a single student's profile
 * @route GET /api/students/:id
 * @access Private
 */
const getStudentProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('[API ERROR] Error fetching student profile:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Get contest history for a student with optional filter
 * @route GET /api/students/:id/contest-history
 * @access Private
 */
const getContestHistory = async (req, res) => {
  const { id } = req.params; // studentId
  const { filter } = req.query; // '30d', '90d', '365d'

  let cutoffDate;
  if (filter === '30d') cutoffDate = getDaysAgo(30);
  else if (filter === '90d') cutoffDate = getDaysAgo(90);
  else if (filter === '365d') cutoffDate = getDaysAgo(365);

  const queryConditions = { student: id };
  if (cutoffDate) {
    queryConditions.submissionTime = { $gte: cutoffDate };
  }

  try {
    const contests = await Contest.find(queryConditions).sort({ submissionTime: 1 }); // Sort chronologically
    res.status(200).json(contests);
  } catch (error) {
    console.error('[API ERROR] Error fetching contest history:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Get problem solving data for a student with optional filter
 * @route GET /api/students/:id/problem-data
 * @access Private
 */
const getProblemData = async (req, res) => {
  const { id } = req.params; // studentId
  const { filter } = req.query; // '7d', '30d', '90d'

  let cutoffDate;
  if (filter === '7d') cutoffDate = getDaysAgo(7);
  else if (filter === '30d') cutoffDate = getDaysAgo(30);
  else if (filter === '90d') cutoffDate = getDaysAgo(90);

  const queryConditions = {
    student: id,
    verdict: 'OK', // Only successful submissions
  };
  if (cutoffDate) {
    queryConditions.submissionTime = { $gte: cutoffDate };
  }

  try {
    const submissions = await Submission.find(queryConditions);

    let mostDifficultProblem = 'N/A';
    let maxRating = 0;
    let totalRatingSum = 0;
    const problemIds = new Set();
    const dailyProblemCounts = {};
    const ratingBuckets = {
        '800-1000': 0, '1000-1200': 0, '1200-1400': 0, '1400-1600': 0,
        '1600-1800': 0, '1800-2000': 0, '2000+': 0
    };

    submissions.forEach(sub => {
      // Most difficult problem
      if (sub.problemRating > maxRating) {
        maxRating = sub.problemRating;
        mostDifficultProblem = `${sub.problemName} (${sub.problemRating})`;
      }
      // Total problems solved & Average rating
      totalRatingSum += sub.problemRating;
      problemIds.add(sub.problemId);

      // Daily problem counts for heatmap
      const submissionDate = sub.submissionTime.toISOString().split('T')[0];
      dailyProblemCounts[submissionDate] = (dailyProblemCounts[submissionDate] || 0) + 1;

      // Rating bucket data
      const r = sub.problemRating;
      if (r >= 800 && r < 1000) ratingBuckets['800-1000']++;
      else if (r >= 1000 && r < 1200) ratingBuckets['1000-1200']++;
      else if (r >= 1200 && r < 1400) ratingBuckets['1200-1400']++;
      else if (r >= 1400 && r < 1600) ratingBuckets['1400-1600']++;
      else if (r >= 1600 && r < 1800) ratingBuckets['1600-1800']++;
      else if (r >= 1800 && r < 2000) ratingBuckets['1800-2000']++;
      else if (r >= 2000) ratingBuckets['2000+']++;
    });

    const totalProblemsSolved = problemIds.size;
    const averageRating = totalProblemsSolved > 0 ? (totalRatingSum / totalProblemsSolved).toFixed(2) : 0;

    const daysInFilter = (new Date().getTime() - (cutoffDate ? cutoffDate.getTime() : new Date(0).getTime())) / (1000 * 60 * 60 * 24);
    const averageProblemsPerDay = totalProblemsSolved > 0 && daysInFilter > 0 ? (totalProblemsSolved / daysInFilter).toFixed(2) : 0;

    // Generate heatmap data for the last 90 days
    const numDaysForHeatmap = 90;
    const heatmapData = {};
    for (let i = 0; i < numDaysForHeatmap; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        heatmapData[dateStr] = dailyProblemCounts[dateStr] || 0;
    }


    res.status(200).json({
      metrics: {
        mostDifficultProblem,
        totalProblemsSolved,
        averageRating,
        averageProblemsPerDay,
      },
      ratingBuckets,
      heatmapData,
      submissions // Raw submissions (for debugging or further client-side processing if needed)
    });

  } catch (error) {
    console.error('[API ERROR] Error fetching problem data:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


/**
 * @desc Download all student data as CSV
 * @route GET /api/students/download-csv
 * @access Private
 */
const downloadCsv = async (req, res) => {
  try {
    const students = await Student.find({});

    let csvContent = "Name,Email,Phone Number,Codeforces Handle,Current Rating,Max Rating,Last Synced,Reminder Emails Sent,Email Reminders Disabled\n";

    if (students.length > 0) {
        students.forEach(s => {
            // Ensure values are properly quoted for CSV, especially strings that might contain commas
            const name = `"${s.name.replace(/"/g, '""')}"`;
            const email = `"${s.email.replace(/"/g, '""')}"`;
            const phoneNumber = `"${(s.phoneNumber || 'N/A').replace(/"/g, '""')}"`;
            const codeforcesHandle = `"${s.codeforcesHandle.replace(/"/g, '""')}"`;
            // Ensure ratings are correctly handled for CSV: if null/undefined, use 'N/A'
            const currentRating = s.currentRating !== undefined && s.currentRating !== null ? s.currentRating : 'N/A';
            const maxRating = s.maxRating !== undefined && s.maxRating !== null ? s.maxRating : 'N/A';
            const lastSync = s.lastSyncDate ? `"${s.lastSyncDate.toLocaleString().replace(/"/g, '""')}"` : '"N/A"';
            const reminderEmailsSent = s.reminderEmailsSent !== undefined && s.reminderEmailsSent !== null ? s.reminderEmailsSent : '0';
            const disableEmailReminders = s.disableEmailReminders ? 'Yes' : 'No';

            csvContent += `${name},${email},${phoneNumber},${codeforcesHandle},${currentRating},${maxRating},${lastSync},${reminderEmailsSent},"${disableEmailReminders}"\n`;
        });
    }

    res.header('Content-Type', 'text/csv');
    res.attachment('students_data.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('[API ERROR] Error downloading CSV:', error.message, error.stack);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc Get reminder email status for a student
 * @route GET /api/students/:id/reminder-status
 * @access Private
 */
const getReminderStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await Student.findById(id).select('reminderEmailsSent disableEmailReminders');
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.status(200).json({
            reminderEmailsSent: student.reminderEmailsSent,
            disableEmailReminders: student.disableEmailReminders
        });
    } catch (error) {
        console.error('[API ERROR] Error fetching reminder status:', error.message, error.stack);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  getContestHistory,
  getProblemData,
  downloadCsv,
  getReminderStatus
};

