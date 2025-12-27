const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String },
    type: { type: String, required: true }, // PDF, DOC, PPT, etc.
    size: { type: String },
    author: { type: String },
    notes: { type: String }, // optional short description or study notes summary
    uploadDate: { type: Date, default: Date.now },
    url: { type: String, required: true }, // file URL
    downloadCount: { type: Number, default: 0 },
    // New fields for detailed topic information
    topic: { type: String }, // Main topic/category
    description: { type: String }, // Brief description
    content: { type: String }, // Detailed topic content/information

    // Structured educational content
    explanation: { type: String }, // Simple explanation in easy language
    examples: [{ type: String }], // Array of examples
    bulletPoints: [{ type: String }], // Key points as bullet list

    // Questions and answers for different marks
    questions: [{
      marks: { type: Number, enum: [2, 4, 8], required: true },
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);


