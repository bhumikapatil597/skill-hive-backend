const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true }, // e.g. "15:30"
    course: { type: String, required: true },
    views: { type: Number, default: 0 },
    uploadDate: { type: Date, default: Date.now },
    url: { type: String, required: true }, // video URL (could be YouTube, Vimeo, or CDN)
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);


