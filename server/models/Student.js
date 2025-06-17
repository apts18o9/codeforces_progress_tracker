

const mongoose = require('mongoose');

const StudentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true, // Remove whitespace from both ends of a string
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Ensures email addresses are unique across all students
      match: [/.+@.+\..+/, 'Please enter a valid email address'], 
    },
    phoneNumber: {
      type: String,
      default: '', // Optional field
      trim: true,
    },
    codeforcesHandle: {
      type: String,
      required: [true, 'Codeforces handle is required'],
      unique: true, // Ensures Codeforces handles are unique
      trim: true,
      index: true, // Create an index for faster lookups on this field
    },
    currentRating: {
      type: Number,
      default: 0, // Default rating before first sync
    },
    maxRating: {
      type: Number,
      default: 0, // Default max rating before first sync
    },
    lastSyncDate: {
      type: Date,
      default: null, // Null until first successful sync
    },
    reminderEmailsSent: {
      type: Number,
      default: 0, // Counter for inactivity reminder emails
    },
    disableEmailReminders: {
      type: Boolean,
      default: false, // Flag to disable automatic inactivity emails
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('Student', StudentSchema);

