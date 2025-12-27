const express = require('express');
const {
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementViews,
} = require('../controllers/videoController');

const router = express.Router();

// Public: list videos for students
router.get('/', getVideos);

// Teacher/admin: CRUD (auth can be added later)
router.post('/', createVideo);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);

// Increment view count
router.post('/:id/views', incrementViews);

module.exports = router;


