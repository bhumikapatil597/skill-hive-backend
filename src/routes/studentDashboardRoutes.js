const express = require('express');
const { getStudentOverview } = require('../controllers/studentDashboardController');

const router = express.Router();

// GET /api/student/overview
router.get('/overview', getStudentOverview);

module.exports = router;


