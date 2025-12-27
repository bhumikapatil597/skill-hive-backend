const express = require('express');
const { getChallenges, getAIAssistance } = require('../controllers/codingPlaygroundController');

const router = express.Router();

// GET /api/playground/challenges
router.get('/challenges', getChallenges);

// POST /api/playground/ai-assist
router.post('/ai-assist', getAIAssistance);

module.exports = router;


