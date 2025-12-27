const User = require('../models/User');

// List users by role (students/teachers)
exports.listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        gender: u.gender,
        age: u.age,
        enrolledCourses: u.enrolledCourses,
        courses: u.courses,
        students: u.students,
        joinDate: u.joinDate.toISOString().split('T')[0],
        status: u.status,
      }))
    );
  } catch (err) {
    console.error('Error listing users', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
};

// Create user (admin-only typically)
exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Simple aggregate stats for admin dashboard
exports.getStats = async (req, res) => {
  try {
    const SyllabusItem = require('../models/SyllabusItem');
    const Resource = require('../models/Resource');
    const Placement = require('../models/Placement');

    const [studentsCount, teachersCount, syllabusCount, resourceCount, placementCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      SyllabusItem.countDocuments({ status: 'Published' }),
      Resource.countDocuments(),
      Placement.countDocuments(),
    ]);

    res.json({
      totalStudents: studentsCount,
      totalTeachers: teachersCount,
      activeCourses: syllabusCount,
      totalEnrollments: resourceCount,
      totalPlacements: placementCount,
    });
  } catch (err) {
    console.error('Error fetching user stats', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get growth and activity data for students and teachers
exports.getGrowthData = async (req, res) => {
  try {
    const Video = require('../models/Video');
    const Resource = require('../models/Resource');
    const SyllabusItem = require('../models/SyllabusItem');
    const Activity = require('../models/Activity');

    // Get last 6 months of data
    const months = 6;
    const now = new Date();
    const data = [];

    // Generate data for each month
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Count students registered up to this month
      const studentsCount = await User.countDocuments({
        role: 'student',
        createdAt: { $lt: nextDate }
      });

      // Count teachers registered up to this month
      const teachersCount = await User.countDocuments({
        role: 'teacher',
        createdAt: { $lt: nextDate }
      });

      // Count students registered in this month
      const studentsThisMonth = await User.countDocuments({
        role: 'student',
        createdAt: { $gte: date, $lt: nextDate }
      });

      // Count teachers registered in this month
      const teachersThisMonth = await User.countDocuments({
        role: 'teacher',
        createdAt: { $gte: date, $lt: nextDate }
      });

      // Fetch individual student activities from Activity collection for this month
      const studentActivities = await Activity.find({
        userRole: 'student',
        activityType: { $in: ['video_view', 'resource_download', 'syllabus_access', 'placement_registration'] },
        createdAt: { $gte: date, $lt: nextDate }
      }).lean();

      // Count unique students who were active this month
      const uniqueActiveStudents = new Set(
        studentActivities.map(a => a.userId?.toString()).filter(Boolean)
      ).size;

      // Count activities by type
      const videoViews = studentActivities.filter(a => a.activityType === 'video_view').length;
      const resourceDownloads = studentActivities.filter(a => a.activityType === 'resource_download').length;
      const syllabusAccess = studentActivities.filter(a => a.activityType === 'syllabus_access').length;
      const placementRegistrations = studentActivities.filter(a => a.activityType === 'placement_registration').length;
      const totalStudentActivity = studentActivities.length;

      // Get detailed activity breakdown by student
      const studentActivityBreakdown = {};
      studentActivities.forEach(activity => {
        const studentId = activity.userId?.toString();
        if (studentId) {
          if (!studentActivityBreakdown[studentId]) {
            studentActivityBreakdown[studentId] = {
              videoViews: 0,
              resourceDownloads: 0,
              syllabusAccess: 0,
              placementRegistrations: 0,
              total: 0
            };
          }
          if (activity.activityType === 'video_view') {
            studentActivityBreakdown[studentId].videoViews++;
          } else if (activity.activityType === 'resource_download') {
            studentActivityBreakdown[studentId].resourceDownloads++;
          } else if (activity.activityType === 'syllabus_access') {
            studentActivityBreakdown[studentId].syllabusAccess++;
          } else if (activity.activityType === 'placement_registration') {
            studentActivityBreakdown[studentId].placementRegistrations++;
          }
          studentActivityBreakdown[studentId].total++;
        }
      });

      // Fetch individual teacher activities from Activity collection for this month
      const teacherActivities = await Activity.find({
        userRole: 'teacher',
        activityType: { $in: ['video_upload', 'resource_upload', 'syllabus_create', 'syllabus_update'] },
        createdAt: { $gte: date, $lt: nextDate }
      }).lean();

      // Count unique teachers who were active this month
      const uniqueActiveTeachers = new Set(
        teacherActivities.map(a => a.userId?.toString()).filter(Boolean)
      ).size;

      // Count teacher activities by type
      const videosUploaded = teacherActivities.filter(a => a.activityType === 'video_upload').length;
      const resourcesUploaded = teacherActivities.filter(a => a.activityType === 'resource_upload').length;
      const syllabusCreated = teacherActivities.filter(a => a.activityType === 'syllabus_create').length;
      const syllabusUpdated = teacherActivities.filter(a => a.activityType === 'syllabus_update').length;
      const totalTeacherActivity = teacherActivities.length;

      // Get detailed activity breakdown by teacher
      const teacherActivityBreakdown = {};
      teacherActivities.forEach(activity => {
        const teacherId = activity.userId?.toString();
        if (teacherId) {
          if (!teacherActivityBreakdown[teacherId]) {
            teacherActivityBreakdown[teacherId] = {
              videosUploaded: 0,
              resourcesUploaded: 0,
              syllabusCreated: 0,
              syllabusUpdated: 0,
              total: 0
            };
          }
          if (activity.activityType === 'video_upload') {
            teacherActivityBreakdown[teacherId].videosUploaded++;
          } else if (activity.activityType === 'resource_upload') {
            teacherActivityBreakdown[teacherId].resourcesUploaded++;
          } else if (activity.activityType === 'syllabus_create') {
            teacherActivityBreakdown[teacherId].syllabusCreated++;
          } else if (activity.activityType === 'syllabus_update') {
            teacherActivityBreakdown[teacherId].syllabusUpdated++;
          }
          teacherActivityBreakdown[teacherId].total++;
        }
      });

      data.push({
        month: monthName,
        date: date.toISOString(),
        students: {
          total: studentsCount,
          new: studentsThisMonth,
          active: uniqueActiveStudents,
          activity: {
            videoViews,
            resourceDownloads,
            syllabusAccess,
            placementRegistrations,
            totalActivity: totalStudentActivity
          },
          activityBreakdown: studentActivityBreakdown
        },
        teachers: {
          total: teachersCount,
          new: teachersThisMonth,
          active: uniqueActiveTeachers,
          activity: {
            videosUploaded,
            resourcesUploaded,
            syllabusCreated,
            syllabusUpdated,
            totalActivity: totalTeacherActivity
          },
          activityBreakdown: teacherActivityBreakdown
        }
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching growth data', err);
    res.status(500).json({ message: 'Failed to fetch growth data' });
  }
};


