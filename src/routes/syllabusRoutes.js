const express = require('express');
const {
  listSyllabi,
  getSyllabusById,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  addIAUnit,
  addSemesterUnit,
  addMaterial,
  getStudentSyllabi,
} = require('../controllers/syllabusController');

const router = express.Router();

// Student routes
router.get('/student', getStudentSyllabi);

// Teacher routes - CRUD
router.get('/', listSyllabi);
router.get('/:id', getSyllabusById);
router.post('/', createSyllabus);
router.put('/:id', updateSyllabus);
router.delete('/:id', deleteSyllabus);

// Add units and materials
router.post('/:id/ia-unit', addIAUnit);
router.post('/:id/sem-unit', addSemesterUnit);
router.post('/:id/material', addMaterial);

module.exports = router;
