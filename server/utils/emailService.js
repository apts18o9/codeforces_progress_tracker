// server/utils/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config(); 

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    
  });
  console.log('Nodemailer transporter initialized. (Requires .env EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS)');
} catch (error) {
  console.error('Failed to initialize Nodemailer transporter:', error.message);
  console.error('Email sending will be simulated as configuration is missing or incorrect.');
  transporter = null; // Set to null to indicate failure
}


const sendEmail = async (to, subject, text, html = '') => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Student Progress System <no-reply@example.com>',
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error.message);
      // Fallback to simulation if real send fails
      simulateEmailSend(to, subject, text);
    }
  } else {
    // Simulate email sending if transporter failed to initialize
    simulateEmailSend(to, subject, text);
  }
};


const simulateEmailSend = (to, subject, text) => {
  console.log(`\n--- SIMULATING EMAIL SEND ---`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text}`);
  console.log(`------------------------------\n`);
};

module.exports = { sendEmail };

