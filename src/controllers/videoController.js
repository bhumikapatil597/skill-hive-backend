const Video = require('../models/Video');
const sampleVideos = require('../data/sampleVideos');

// Get all published videos
exports.getVideos = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: 'Published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });

    if (!videos.length) {
      return res.json(sampleVideos);
    }

    res.json(
      videos.map((v) => ({
        id: v._id,
        title: v.title,
        description: v.description,
        duration: v.duration,
        course: v.course,
        views: v.views,
        uploadDate: v.uploadDate.toISOString().split('T')[0],
        url: v.url,
      }))
    );
  } catch (err) {
    console.error('Error fetching videos', err);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
};

// Teacher/admin: create video
exports.createVideo = async (req, res) => {
  try {
    const { title, description, duration, course, url, status } = req.body;
    const teacherId = req.user?.id || req.body?.teacherId; // Get teacher ID from auth or body

    if (!title || !description || !duration || !course || !url) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const video = await Video.create({
      title,
      description,
      duration,
      course,
      url,
      status: status || 'Draft',
    });

    // Log teacher activity if teacherId is provided
    if (teacherId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: teacherId,
          userRole: 'teacher',
          activityType: 'video_upload',
          resourceId: video._id,
          resourceModel: 'Video',
          resourceTitle: video.title,
          metadata: {
            course: video.course,
            duration: video.duration,
            status: video.status
          }
        });
      } catch (activityErr) {
        console.error('Error logging teacher activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.status(201).json(video);
  } catch (err) {
    console.error('Error creating video', err);
    res.status(500).json({ message: 'Failed to create video' });
  }
};

// Teacher/admin: update video
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const video = await Video.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (err) {
    console.error('Error updating video', err);
    res.status(500).json({ message: 'Failed to update video' });
  }
};

// Teacher/admin: delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ message: 'Video deleted' });
  } catch (err) {
    console.error('Error deleting video', err);
    res.status(500).json({ message: 'Failed to delete video' });
  }
};

// Increment view count (optional)
exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id || req.body?.studentId; // Get student ID from auth or body
    
    const video = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Log activity if studentId is provided
    if (studentId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: studentId,
          userRole: 'student',
          activityType: 'video_view',
          resourceId: id,
          resourceModel: 'Video',
          resourceTitle: video.title,
          metadata: {
            course: video.course,
            duration: video.duration
          }
        });
      } catch (activityErr) {
        console.error('Error logging activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.json({ views: video.views });
  } catch (err) {
    console.error('Error incrementing video views', err);
    res.status(500).json({ message: 'Failed to increment views' });
  }
};


