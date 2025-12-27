const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const videoRoutes = require('./routes/videoRoutes');
const userRoutes = require('./routes/userRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const placementRoutes = require('./routes/placementRoutes');
const studentDashboardRoutes = require('./routes/studentDashboardRoutes');
const codingPlaygroundRoutes = require('./routes/codingPlaygroundRoutes');
const teacherDashboardRoutes = require('./routes/teacherDashboardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files for downloadable resources (PDFs, etc.)
app.use('/files', express.static(path.join(__dirname, 'files')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/student', studentDashboardRoutes);
app.use('/api/playground', codingPlaygroundRoutes);
app.use('/api/teacher', teacherDashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'E_Learning backend is running' });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e_learning';
const PORT = process.env.PORT || 8000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


