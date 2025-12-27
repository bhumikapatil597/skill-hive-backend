const mongoose = require('mongoose');

// Sub-schema for Completed Units
const completedUnitSchema = new mongoose.Schema({
    unitNumber: { type: Number, required: true },
    completedTopics: [{ type: String }],
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedAt: { type: Date, default: Date.now }
}, { _id: false });

// Sub-schema for Bookmarked Topics
const bookmarkedTopicSchema = new mongoose.Schema({
    unitNumber: { type: Number, required: true },
    topic: { type: String, required: true },
    bookmarkedAt: { type: Date, default: Date.now }
}, { _id: false });

// Main Syllabus Progress Schema
const syllabusProgressSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus', required: true },

        completedUnits: [completedUnitSchema],
        bookmarkedTopics: [bookmarkedTopicSchema],

        overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    },
    { timestamps: true }
);

// Index for faster queries
syllabusProgressSchema.index({ studentId: 1, syllabusId: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusProgress', syllabusProgressSchema);
