const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    url: String,
    size: String,
  },
  { _id: false }
);

const placementSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    package: { type: String, required: true },
    date: { type: String, required: true }, // keep as string to match UI (e.g. 2024-04-15)
    time: { type: String, required: true }, // "10:00 AM"
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed'],
      default: 'Upcoming',
    },
    description: { type: String, required: true },
    procedure: { type: String },
    eligibility: { type: String },
    attachments: [attachmentSchema],
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Placement', placementSchema);
