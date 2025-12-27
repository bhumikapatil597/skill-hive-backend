const express = require('express');
const { getTeacherOverview } = require('../controllers/teacherDashboardController');

const router = express.Router();

// GET /api/teacher/overview
router.get('/overview', getTeacherOverview);

module.exports = router;


