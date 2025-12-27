const Video = require('../models/Video');
const Resource = require('../models/Resource');
const SyllabusItem = require('../models/SyllabusItem');
const User = require('../models/User');

// Helper function to format time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  return Math.floor(seconds) + ' second' + (Math.floor(seconds) > 1 ? 's' : '') + ' ago';
};

exports.getTeacherOverview = async (req, res) => {
  try {
    // Fetch real statistics from database
    const totalCourses = await SyllabusItem.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalVideos = await Video.countDocuments();
    const totalContent = await Resource.countDocuments();

    const stats = {
      totalCourses,
      totalStudents,
      totalVideos,
      totalContent,
    };

    // Fetch recent activities from database
    const recentActivities = [];

    // Get latest syllabus items
    const recentSyllabus = await SyllabusItem.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentSyllabus.forEach((item) => {
      recentActivities.push({
        id: `syllabus-${item._id}`,
        type: 'course',
        message: `Updated syllabus for "${item.course}" - ${item.topic}`,
        time: getTimeAgo(item.createdAt),
        timestamp: new Date(item.createdAt),
      });
    });

    // Get latest videos
    const recentVideos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentVideos.forEach((video) => {
      recentActivities.push({
        id: `video-${video._id}`,
        type: 'video',
        message: `Uploaded new video: "${video.title}"`,
        time: getTimeAgo(video.createdAt),
        timestamp: new Date(video.createdAt),
      });
    });

    // Get latest resources
    const recentResources = await Resource.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    recentResources.forEach((resource) => {
      recentActivities.push({
        id: `content-${resource._id}`,
        type: 'content',
        message: `Added study material: "${resource.title}"`,
        time: getTimeAgo(resource.createdAt),
        timestamp: new Date(resource.createdAt),
      });
    });

    // Sort all activities by timestamp (most recent first) and take top 10
    recentActivities.sort((a, b) => b.timestamp - a.timestamp);
    const sortedActivities = recentActivities.slice(0, 10).map(({ timestamp, ...rest }) => rest);

    res.json({ stats, recentActivities: sortedActivities });
  } catch (err) {
    console.error('Error in teacher overview', err);
    res.status(500).json({ message: 'Failed to load teacher overview' });
  }
};


