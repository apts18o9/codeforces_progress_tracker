

const mongoose = require('mongoose');


const SubmissionSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Reference to the Student model
      required: true,
      index: true, // Index for faster queries by student
    },
    submissionId: {
      type: Number,
      required: true,
    },
    problemId: { // Unique identifier for the problem (e.g., "123A", "456B")
      type: String,
      required: true,
    },
    problemName: {
      type: String,
      required: true,
    },
    problemRating: { // Problem difficulty rating
      type: Number,
      default: 0,
    },
    verdict: { // e.g., "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED"
      type: String,
      required: true,
    },
    submissionTime: {
      type: Date,
      required: true,
      index: true, // Index for time-based filtering and heatmap
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

SubmissionSchema.index({ student: 1, submissionId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);

