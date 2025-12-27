const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload,
  generatePDF,
  uploadFile,
} = require('../controllers/resourceController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resources/')
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs only
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.get('/', listResources);
router.post('/', createResource);
router.post('/upload', upload.single('file'), uploadFile); // New file upload route
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
router.post('/:id/download', incrementDownload);
router.get('/:id/pdf', generatePDF);

module.exports = router;

