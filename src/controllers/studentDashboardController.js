// Student dashboard aggregates real data from Mongo collections so that
// the frontend can display live stats instead of static mocks.
const Video = require('../models/Video');
const SyllabusItem = require('../models/SyllabusItem');
const Resource = require('../models/Resource');
const Placement = require('../models/Placement');
const Activity = require('../models/Activity');

const parseDurationToMinutes = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const parts = duration.split(':').map((part) => parseInt(part, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 60 + minutes + seconds / 60;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes + seconds / 60;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

const formatRelativeTime = (date) => {
  if (!date) return 'Recently';
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    const value = Math.max(absMinutes, 1);
    return diffMinutes >= 0 ? `in ${value} min` : `${value} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours >= 0 ? `in ${absHours} hrs` : `${absHours} hrs ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  return diffDays >= 0 ? `in ${absDays} days` : `${absDays} days ago`;
};

const formatDateOnly = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const normalizeId = (value) => {
  if (!value) return value;
  return typeof value === 'object' && value.toString ? value.toString() : value;
};

const buildSyllabusOverview = (items) => {
  const grouped = items.reduce((acc, item) => {
    const courseName = item.course || 'General';
    if (!acc[courseName]) {
      acc[courseName] = [];
    }
    acc[courseName].push({
      id: normalizeId(item._id),
      name: item.topic,
      completed: item.status === 'Published',
      date: formatDateOnly(item.date || item.updatedAt),
    });
    return acc;
  }, {});

  return Object.entries(grouped).map(([course, topics], index) => ({
    id: index + 1,
    course,
    topics: topics.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    }),
  }));
};

exports.getStudentOverview = async (req, res) => {
  try {
    // Get student ID from query params or request body (for now, we'll get it from query)
    const studentId = req.query.studentId || req.body.studentId;

    const [syllabusItems, videos, resources, placements] = await Promise.all([
      SyllabusItem.find().lean(),
      Video.find().lean(),
      Resource.find().lean(),
      Placement.find().lean(),
    ]);

    // Get User-specific stats
    const User = require('../models/User');
    const user = await User.findById(studentId);
    const enrolledCourses = user ? (user.enrolledCourses || 0) : 0;

    // Calculate watched videos and study hours from Activity
    let watchedVideoCount = 0;
    let studyHours = 0;

    if (studentId) {
      // Get unique videos watched by student
      const watchedActivities = await Activity.find({
        userId: studentId,
        userRole: 'student',
        activityType: 'video_view'
      }).lean();

      const uniqueVideoIds = [...new Set(watchedActivities.map(a => a.resourceId ? a.resourceId.toString() : null).filter(id => id))];
      watchedVideoCount = uniqueVideoIds.length;

      // Calculate study hours from unique videos watched
      if (uniqueVideoIds.length > 0) {
        const watchedVideosList = await Video.find({ _id: { $in: uniqueVideoIds } }).lean();
        const totalMinutes = watchedVideosList.reduce(
          (sum, video) => sum + parseDurationToMinutes(video.duration),
          0
        );
        studyHours = Number((totalMinutes / 60).toFixed(1));
      }
    }

    const watchedVideos = watchedVideoCount;

    // Calculate completed (accessed) lessons from unique resource download activities
    let completedLessonsCount = 0;
    if (studentId) {
      // We use 'resource_download' as a proxy for completed lessons/resources
      const accessedResourceIds = await Activity.find({
        userId: studentId,
        userRole: 'student',
        activityType: 'resource_download'
      }).distinct('resourceId');

      // Filter out nulls just in case
      completedLessonsCount = accessedResourceIds.filter(id => id).length;
    }
    const completedLessons = completedLessonsCount;


    // Get recently watched videos for "Continue Learning"
    let recentCourses = [];
    if (studentId) {
      try {
        // Get video view activities for this student
        const videoActivities = await Activity.find({
          userId: studentId,
          userRole: 'student',
          activityType: 'video_view'
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Get unique video IDs from activities
        const videoIds = [...new Set(videoActivities.map(a => a.resourceId))];

        // Fetch video details for these IDs
        const watchedVideoDetails = await Video.find({
          _id: { $in: videoIds }
        }).lean();

        // Map to continue learning format with progress
        recentCourses = watchedVideoDetails.slice(0, 5).map((video) => {
          const activity = videoActivities.find(a => a.resourceId.toString() === video._id.toString());
          // Simulate progress (you can enhance this with actual progress tracking)
          const progress = Math.floor(Math.random() * 70) + 10; // 10-80% for demo

          return {
            id: normalizeId(video._id),
            title: video.title,
            progress,
            instructor: video.course || 'Self-paced',
            lastAccessed: activity ? formatRelativeTime(activity.createdAt) : 'Recently',
            url: video.url,
            duration: video.duration
          };
        });
      } catch (err) {
        console.error('Error fetching watched videos:', err);
        // Fallback to empty array
        recentCourses = [];
      }
    }

    // If no watched videos, show some recent published videos as suggestions
    if (recentCourses.length === 0) {
      recentCourses = videos
        .filter(v => v.status === 'Published')
        .slice(0, 3)
        .map((video, idx) => ({
          id: normalizeId(video._id),
          title: video.title,
          progress: 0,
          instructor: video.course || 'Self-paced',
          lastAccessed: 'Not started',
          url: video.url,
          duration: video.duration
        }));
    }

    const today = new Date();
    const upcomingDeadlines = syllabusItems
      .filter((item) => item.date && new Date(item.date) >= today)
      .slice(0, 4)
      .map((item, idx) => {
        const daysLeft = Math.ceil(
          (new Date(item.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: idx + 1,
          title: item.topic,
          course: item.course,
          date: new Date(item.date).toISOString().split('T')[0],
          daysLeft,
        };
      });

    const syllabusOverview = buildSyllabusOverview(syllabusItems);

    const videosList = videos.map((video) => ({
      id: normalizeId(video._id),
      title: video.title,
      description: video.description,
      duration: video.duration,
      course: video.course,
      views: video.views || 0,
      uploadDate: formatDateOnly(video.uploadDate || video.createdAt),
      url: video.url,
      status: video.status,
    }));

    const resourceList = resources.map((resource) => ({
      id: normalizeId(resource._id),
      title: resource.title,
      subject: resource.subject,
      type: resource.type,
      size: resource.size,
      author: resource.author,
      notes: resource.notes,
      uploadDate: formatDateOnly(resource.uploadDate || resource.createdAt),
      url: resource.url,
      downloadCount: resource.downloadCount || 0,
    }));

    const placementList = placements.map((placement) => ({
      id: normalizeId(placement._id),
      company: placement.company,
      role: placement.role,
      package: placement.package,
      date: placement.date,
      time: placement.time,
      location: placement.location,
      status: placement.status,
      description: placement.description,
      procedure: placement.procedure,
      eligibility: placement.eligibility,
      attachments: placement.attachments || [],
    }));

    // Fetch recent activities for the student
    let recentActivities = [];
    if (studentId) {
      try {
        const activities = await Activity.find({
          userId: studentId,
          userRole: 'student'
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        recentActivities = activities.map((activity) => {
          const timeAgo = formatRelativeTime(activity.createdAt);
          let message = '';
          let icon = '📌';

          switch (activity.activityType) {
            case 'video_view':
              message = `Watched video: ${activity.resourceTitle || 'Video'}`;
              icon = '▶️';
              break;
            case 'resource_download':
              message = `Downloaded resource: ${activity.resourceTitle || 'Resource'}`;
              icon = '📥';
              break;
            case 'syllabus_access':
              message = `Accessed syllabus: ${activity.resourceTitle || 'Syllabus'}`;
              icon = '📚';
              break;
            case 'placement_registration':
              message = `Registered for placement: ${activity.resourceTitle || 'Placement'}`;
              icon = '💼';
              break;
            default:
              message = 'Activity recorded';
          }

          return {
            id: normalizeId(activity._id),
            type: activity.activityType,
            message,
            icon,
            time: timeAgo,
            timestamp: activity.createdAt,
            resourceId: activity.resourceId ? normalizeId(activity.resourceId) : null,
            resourceModel: activity.resourceModel,
            metadata: activity.metadata || {}
          };
        });
      } catch (activityErr) {
        console.error('Error fetching recent activities:', activityErr);
        // Continue without activities if there's an error
      }
    }

    const payload = {
      stats: {
        enrolledCourses,
        watchedVideos,
        completedLessons,
        studyHours,
      },
      recentCourses,
      upcomingDeadlines,
      recentActivities,
      syllabus: syllabusOverview,
      videos: videosList,
      resources: resourceList,
      placements: placementList,
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in student overview', err);
    res.status(500).json({
      message: 'Failed to load student overview',
      stats: {
        enrolledCourses: 0,
        watchedVideos: 0,
        completedLessons: 0,
        studyHours: 0,
      },
      recentCourses: [],
      upcomingDeadlines: [],
      recentActivities: [],
      syllabus: [],
      videos: [],
      resources: [],
      placements: [],
    });
  }
};

