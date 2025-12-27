const mongoose = require('mongoose');

// Sub-schema for Important Questions
const importantQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  marks: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
}, { _id: false });

// Sub-schema for IA Unit
const iaUnitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  unitName: { type: String, required: true },
  topics: [{ type: String }],
  marksWeightage: { type: Number, default: 0 },
  importantQuestions: [importantQuestionSchema],
  questionPattern: { type: String },
  estimatedHours: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema for IA Syllabus
const iaSyllabusSchema = new mongoose.Schema({
  examType: { type: String, enum: ['IA1', 'IA2', 'IA3'], required: true },
  examDate: { type: Date },
  units: [iaUnitSchema]
}, { _id: false });

// Sub-schema for Semester Chapter
const chapterSchema = new mongoose.Schema({
  chapterNumber: { type: Number, required: true },
  chapterName: { type: String, required: true },
  topics: [{ type: String }],
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  repeatedInPreviousYears: { type: Boolean, default: false },
  referenceBooks: [{ type: String }]
}, { _id: false });

// Sub-schema for Semester Unit
const semesterUnitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  unitName: { type: String, required: true },
  chapters: [chapterSchema],
  totalMarks: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema for Study Materials
const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['PDF', 'Video', 'Notes', 'Link'], default: 'PDF' },
  url: { type: String, required: true },
  unitNumber: { type: Number },
  uploadDate: { type: Date, default: Date.now }
}, { _id: false });

// Main Syllabus Schema
const syllabusSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true },

    // IA Syllabus
    iaSyllabus: [iaSyllabusSchema],

    // Semester Exam Syllabus
    semesterSyllabus: [semesterUnitSchema],

    // Study Materials
    materials: [materialSchema],

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  },
  { timestamps: true }
);

// Index for faster queries
syllabusSchema.index({ courseId: 1, semester: 1, academicYear: 1 });

module.exports = mongoose.model('Syllabus', syllabusSchema);
