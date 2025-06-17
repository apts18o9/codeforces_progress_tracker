// server/utils/cronJob.js

const cron = require('node-cron');
const Student = require('../models/Student');
const { syncStudentData } = require('../controllers/codeforcesController'); // Assuming this exists
const { checkInactivityAndSendEmail } = require('../controllers/emailController'); // Assuming this exists

// Default cron schedule: Every day at 2 AM
let currentCronSchedule = '0 2 * * *'; // cron format: minute hour dayOfMonth month dayOfWeek
let cronTask;

/**
 * Starts the scheduled cron job for daily Codeforces data sync and inactivity checks.
 * @param {string} schedule - Cron schedule string (e.g., '0 2 * * *' for 2 AM daily).
 */
const startCronJob = (schedule = currentCronSchedule) => {
  // Stop any existing task before starting a new one
  if (cronTask) {
    cronTask.stop();
    console.log('[CRON] Previous cron job stopped.');
  }

  currentCronSchedule = schedule; // Update the current schedule

  // Schedule the task
  cronTask = cron.schedule(currentCronSchedule, async () => {
    console.log(`[CRON] Running daily Codeforces data sync and inactivity check at ${new Date().toLocaleString()} (Scheduled Time: ${currentCronSchedule})`);
    try {
      // 1. Fetch all students
      console.log('[CRON] Fetching all students from database...');
      const students = await Student.find({});
      console.log(`[CRON] Found ${students.length} students to process.`);

      if (students.length === 0) {
        console.log('[CRON] No students found. Skipping sync and inactivity checks.');
        return;
      }

      // 2. Iterate and sync data for each student
      for (const student of students) {
        console.log(`[CRON] Processing student: ${student.name} (${student.codeforcesHandle}). Initiating sync...`);
        const syncSuccess = await syncStudentData(student.id, student.codeforcesHandle); // Pass student ID and handle
        if (syncSuccess) {
          console.log(`[CRON] Sync for ${student.name} completed successfully.`);
        } else {
          console.error(`[CRON] Sync for ${student.name} FAILED.`);
        }
        // Add a small delay to avoid hitting API rate limits for many students
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay slightly
      }
      console.log('[CRON] All student data syncs initiated.');

      // 3. Perform inactivity checks and send emails after all syncs are done
      console.log('[CRON] Starting inactivity checks for all students...');
      for (const student of students) {
        // Fetch the latest student data before checking inactivity in case sync updated it
        const latestStudent = await Student.findById(student.id);
        if (latestStudent) {
            await checkInactivityAndSendEmail(latestStudent.id, latestStudent.name, latestStudent.email);
        } else {
            console.warn(`[CRON] Student ${student.id} not found during inactivity check (might have been deleted during sync).`);
        }
      }
      console.log('[CRON] All inactivity checks completed.');

    } catch (error) {
      console.error('[CRON ERROR] Error during scheduled cron job:', error.message, error.stack);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Set a timezone relevant to Ratlam, India (IST)
  });

  console.log(`[CRON] Cron job scheduled to run with schedule: '${currentCronSchedule}' (Timezone: Asia/Kolkata)`);
  console.log(`[CRON] Next run time is dependent on the configured schedule.`);
};

/**
 * Updates the cron job schedule.
 * @param {string} newSchedule - The new cron schedule string.
 */
const updateCronSchedule = (newSchedule) => {
  console.log(`[CRON] Attempting to update cron schedule from '${currentCronSchedule}' to '${newSchedule}'`);
  startCronJob(newSchedule); // Simply restart with the new schedule
};

/**
 * Gets the currently configured cron schedule.
 * @returns {string} The current cron schedule string.
 */
const getCronSchedule = () => {
  return currentCronSchedule;
};

module.exports = {
  startCronJob,
  updateCronSchedule,
  getCronSchedule,
};

