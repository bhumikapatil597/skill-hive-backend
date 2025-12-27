const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
      index: true
    },
    activityType: {
      type: String,
      enum: [
        // Student activities
        'video_view', 
        'resource_download', 
        'syllabus_access', 
        'placement_registration', 
        'login',
        // Teacher activities
        'video_upload',
        'resource_upload',
        'syllabus_create',
        'syllabus_update'
      ],
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resourceModel',
      required: false
    },
    resourceModel: {
      type: String,
      enum: ['Video', 'Resource', 'SyllabusItem', 'Placement'],
      required: false
    },
    resourceTitle: {
      type: String,
      required: false
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for faster queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userRole: 1, createdAt: -1 });
activitySchema.index({ activityType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

// Legacy support: keep studentId for backward compatibility
activitySchema.virtual('studentId').get(function() {
  return this.userRole === 'student' ? this.userId : null;
});

module.exports = mongoose.model('Activity', activitySchema);

