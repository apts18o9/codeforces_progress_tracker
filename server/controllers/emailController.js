// server/controllers/emailController.js

const Student = require('../models/Student');
const Submission = require('../models/Submission');
const { sendEmail } = require('../utils/emailService');


const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const checkInactivityAndSendEmail = async (studentId, studentName, studentEmail) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      console.warn(`Inactivity check: Student with ID ${studentId} not found.`);
      return;
    }

    // Skip if reminders are disabled for this student
    if (student.disableEmailReminders) {
      console.log(`Inactivity check: Email reminders disabled for ${studentName}. Skipping.`);
      return;
    }

    const sevenDaysAgo = getDaysAgo(7);

    // Check for any successful submissions in the last 7 days
    const recentSubmission = await Submission.findOne({
      student: studentId,
      verdict: 'OK',
      submissionTime: { $gte: sevenDaysAgo },
    });

    if (!recentSubmission) {
      // No successful submissions in the last 7 days
      student.reminderEmailsSent = (student.reminderEmailsSent || 0) + 1;
      await student.save();

      const subject = `Time to get back to problem solving, ${studentName}!`;
      const text = `Hi ${studentName},\n\nWe noticed you haven't made any Codeforces submissions in the last 7 days. Time to get back into action and sharpen your skills!\n\nKeep practicing!\n\nThis is reminder number ${student.reminderEmailsSent}.\n\nYour Progress Management System`;
      const html = `
        <p>Hi ${studentName},</p>
        <p>We noticed you haven't made any Codeforces submissions in the last 7 days. Time to get back into action and sharpen your skills!</p>
        <p>Keep practicing!</p>
        <p>This is reminder number ${student.reminderEmailsSent}.</p>
        <p>Your Progress Management System</p>
      `;

      await sendEmail(studentEmail, subject, text, html);
      console.log(`Inactivity reminder processed for ${studentName}. Reminder count: ${student.reminderEmailsSent}`);
    } else {
      console.log(`${studentName} was active in the last 7 days. No inactivity email sent.`);
    }
  } catch (error) {
    console.error(`Error during inactivity check for student ID ${studentId}:`, error.message);
  }
};

module.exports = {
  checkInactivityAndSendEmail,
};

