

const mongoose = require('mongoose');


const ContestSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Reference to the Student model
      required: true,
      index: true, // Index for faster queries by student
    },
    contestId: {
      type: Number,
      required: true,
    },
    contestName: {
      type: String,
      required: true,
    },
    ratingChange: {
      type: Number,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    oldRating: {
      type: Number,
      required: true,
    },
    newRating: {
      type: Number,
      required: true,
    },
    // Note: 'unsolvedProblemsCount' is not directly available from user.rating API.
    // It would require deeper analysis of user.status vs. contest problems,
    // which is complex. For simplicity, we can default it or omit.
    unsolvedProblemsCount: {
      type: Number,
      default: 0, // Placeholder, actual calculation is complex
    },
    submissionTime: { // Represents contest end time (rating update time)
      type: Date,
      required: true,
      index: true, // Index for time-based filtering
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

ContestSchema.index({ student: 1, contestId: 1 }, { unique: true });

module.exports = mongoose.model('Contest', ContestSchema);

