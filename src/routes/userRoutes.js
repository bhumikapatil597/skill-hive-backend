const express = require('express');
const { listUsers, createUser, getStats, getGrowthData } = require('../controllers/userController');

const router = express.Router();

router.get('/', listUsers); // /api/users?role=student or teacher
router.post('/', createUser);
router.get('/stats', getStats);
router.get('/growth', getGrowthData);

module.exports = router;


