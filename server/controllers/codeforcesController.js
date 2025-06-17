// server/controllers/codeforcesController.js

const Student = require('../models/Student');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const { fetchUserInfo, fetchUserRatingHistory, fetchUserSubmissions } = require('../utils/codeforcesApi');
const { checkInactivityAndSendEmail } = require('./emailController'); // Import for chaining

/**
 * Syncs Codeforces data for a given student handle.
 * This function is designed to be called internally (e.g., from controllers or cron).
 * @param {string} studentId - The ID of the student in your database.
 * @param {string} handle - The Codeforces handle of the student.
 * @returns {Promise<boolean>} True if sync was successful, false otherwise.
 */
const syncStudentData = async (studentId, handle) => {
  console.log(`[SYNC] Initiating Codeforces data sync for student ID: ${studentId}, handle: ${handle}`);
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      console.error(`[SYNC] Student with ID ${studentId} not found.`);
      return false;
    }

    // 1. Fetch User Info (Rating)
    console.log(`[SYNC] Fetching user info from Codeforces for ${handle}...`);
    const userInfo = await fetchUserInfo(handle);
    console.log(`[SYNC] Raw userInfo for ${handle}:`, JSON.stringify(userInfo)); // Log raw response for debugging

    if (userInfo) {
      // Check if rating exists and is a number, otherwise default to 0
      student.currentRating = typeof userInfo.rating === 'number' ? userInfo.rating : 0;
      student.maxRating = typeof userInfo.maxRating === 'number' ? userInfo.maxRating : 0;
      console.log(`[SYNC] Assigned ratings for ${handle}: Current=${student.currentRating}, Max=${student.maxRating}`);
    } else {
      console.warn(`[SYNC] Could not get user info for ${handle}. Ratings will default to 0.`);
      student.currentRating = 0; // Explicitly set to 0 if userInfo is null/undefined
      student.maxRating = 0;
    }

    // 2. Fetch Contest History
    console.log(`[SYNC] Fetching contest history for ${handle}...`);
    const ratingHistory = await fetchUserRatingHistory(handle);
    console.log(`[SYNC] Fetched ${ratingHistory.length} contest entries for ${handle}.`);

    if (ratingHistory.length > 0) {
      const existingContestIds = (await Contest.find({ student: studentId }).select('contestId')).map(c => c.contestId);
      const newContests = ratingHistory.filter(cfContest => !existingContestIds.includes(cfContest.contestId));

      for (const cfContest of newContests) {
        await Contest.create({
          student: studentId,
          contestId: cfContest.contestId,
          contestName: cfContest.contestName,
          ratingChange: cfContest.newRating - cfContest.oldRating,
          rank: cfContest.rank,
          oldRating: cfContest.oldRating,
          newRating: cfContest.newRating,
          submissionTime: new Date(cfContest.ratingUpdateTimeSeconds * 1000),
          unsolvedProblemsCount: 0, // Placeholder as explained in model
        });
      }
      console.log(`[SYNC] Added ${newContests.length} new contests for ${handle}.`);
    } else {
      console.log(`[SYNC] No new contest history for ${handle}.`);
    }

    // 3. Fetch Submissions
    console.log(`[SYNC] Fetching submissions for ${handle}...`);
    const submissions = await fetchUserSubmissions(handle); // Fetches up to 1000 latest
    console.log(`[SYNC] Fetched ${submissions.length} submissions for ${handle}.`);

    if (submissions.length > 0) {
      const existingSubmissionIds = (await Submission.find({ student: studentId }).select('submissionId')).map(s => s.submissionId);
      const newSubmissions = submissions.filter(cfSubmission => !existingSubmissionIds.includes(cfSubmission.id));

      for (const cfSubmission of newSubmissions) {
        await Submission.create({
          student: studentId,
          submissionId: cfSubmission.id,
          problemId: cfSubmission.problem.contestId ? `${cfSubmission.problem.contestId}-${cfSubmission.problem.index}` : cfSubmission.problem.name,
          problemName: cfSubmission.problem.name,
          problemRating: cfSubmission.problem.rating || 0,
          verdict: cfSubmission.verdict,
          submissionTime: new Date(cfSubmission.creationTimeSeconds * 1000),
        });
      }
      console.log(`[SYNC] Added ${newSubmissions.length} new submissions for ${handle}.`);
    } else {
      console.log(`[SYNC] No new submissions for ${handle}.`);
    }

    // Update last sync date and save the student document
    student.lastSyncDate = new Date();
    console.log(`[SYNC] Attempting to save student ${handle} with currentRating=${student.currentRating}, maxRating=${student.maxRating}, lastSyncDate=${student.lastSyncDate}`);
    await student.save(); // This is crucial for persisting rating updates
    console.log(`[SYNC] Student ${handle} saved successfully with updated ratings and sync date.`);
    return true;

  } catch (error) {
    console.error(`[SYNC ERROR] Error during Codeforces sync for ${handle}:`, error.message, error.stack); // Log stack for more details
    return false;
  }
};

/**
 * Middleware/Controller function to manually trigger Codeforces sync for a student.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const triggerManualSync = async (req, res) => {
  const { id } = req.params; // Student ID from URL
  console.log(`[API] Manual sync triggered for student ID: ${id}`);
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const success = await syncStudentData(id, student.codeforcesHandle);

    if (success) {
      // After manual sync, immediately check inactivity and send email if needed
      // Fetch the student again to ensure we have the very latest data (including updated ratings)
      const updatedStudent = await Student.findById(id);
      await checkInactivityAndSendEmail(updatedStudent.id, updatedStudent.name, updatedStudent.email);
      res.status(200).json({ message: 'Codeforces data synced successfully.', student: updatedStudent });
    } else {
      res.status(500).json({ message: 'Failed to sync Codeforces data.' });
    }
  } catch (error) {
    console.error(`[API ERROR] Error in triggerManualSync for student ID ${id}:`, error.message, error.stack);
    res.status(500).json({ message: 'Server error during sync.', error: error.message });
  }
};


module.exports = {
  syncStudentData,
  triggerManualSync,
};

