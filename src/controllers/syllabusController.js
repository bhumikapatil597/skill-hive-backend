const Syllabus = require('../models/SyllabusItem');

// Get all syllabi (for teacher)
exports.listSyllabi = async (req, res) => {
  try {
    const syllabi = await Syllabus.find().sort({ createdAt: -1 });
    res.json(syllabi.map(s => ({
      id: s._id,
      courseName: s.courseName,
      semester: s.semester,
      academicYear: s.academicYear,
      status: s.status,
      createdAt: s.createdAt,
      iaCount: s.iaSyllabus?.length || 0,
      semUnitsCount: s.semesterSyllabus?.length || 0
    })));
  } catch (err) {
    console.error('Error listing syllabi', err);
    res.status(500).json({ message: 'Failed to list syllabi' });
  }
};

// Get syllabus by ID (detailed view)
exports.getSyllabusById = async (req, res) => {
  try {
    const { id } = req.params;
    const syllabus = await Syllabus.findById(id);

    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    res.json(syllabus);
  } catch (err) {
    console.error('Error fetching syllabus', err);
    res.status(500).json({ message: 'Failed to fetch syllabus' });
  }
};

// Create new syllabus
exports.createSyllabus = async (req, res) => {
  try {
    const { courseId, courseName, semester, academicYear, iaSyllabus, semesterSyllabus, materials, status } = req.body;
    const teacherId = req.user?.id || req.body?.teacherId; // Get teacher ID from auth or body

    if (!courseId || !courseName || !semester || !academicYear) {
      return res.status(400).json({
        message: 'Course ID, course name, semester, and academic year are required'
      });
    }

    const syllabus = await Syllabus.create({
      courseId,
      courseName,
      semester,
      academicYear,
      iaSyllabus: iaSyllabus || [],
      semesterSyllabus: semesterSyllabus || [],
      materials: materials || [],
      status: status || 'Draft',
      createdBy: req.user?._id || teacherId
    });

    // Log teacher activity if teacherId is provided
    if (teacherId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: teacherId,
          userRole: 'teacher',
          activityType: 'syllabus_create',
          resourceId: syllabus._id,
          resourceModel: 'SyllabusItem',
          resourceTitle: syllabus.courseName,
          metadata: {
            semester: syllabus.semester,
            academicYear: syllabus.academicYear,
            status: syllabus.status
          }
        });
      } catch (activityErr) {
        console.error('Error logging teacher activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.status(201).json(syllabus);
  } catch (err) {
    console.error('Error creating syllabus', err);
    res.status(500).json({ message: 'Failed to create syllabus', error: err.message });
  }
};

// Update syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const teacherId = req.user?.id || req.body?.teacherId; // Get teacher ID from auth or body

    const syllabus = await Syllabus.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Log teacher activity if teacherId is provided
    if (teacherId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: teacherId,
          userRole: 'teacher',
          activityType: 'syllabus_update',
          resourceId: syllabus._id,
          resourceModel: 'SyllabusItem',
          resourceTitle: syllabus.courseName,
          metadata: {
            semester: syllabus.semester,
            academicYear: syllabus.academicYear,
            status: syllabus.status
          }
        });
      } catch (activityErr) {
        console.error('Error logging teacher activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.json(syllabus);
  } catch (err) {
    console.error('Error updating syllabus', err);
    res.status(500).json({ message: 'Failed to update syllabus' });
  }
};

// Delete syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const syllabus = await Syllabus.findByIdAndDelete(id);

    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    res.json({ message: 'Syllabus deleted successfully' });
  } catch (err) {
    console.error('Error deleting syllabus', err);
    res.status(500).json({ message: 'Failed to delete syllabus' });
  }
};

// Add IA Unit
exports.addIAUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { examType, unit } = req.body;

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Find or create IA exam section
    let iaSection = syllabus.iaSyllabus.find(ia => ia.examType === examType);
    if (!iaSection) {
      iaSection = { examType, units: [] };
      syllabus.iaSyllabus.push(iaSection);
    }

    // Add unit
    iaSection.units.push(unit);
    await syllabus.save();

    res.json(syllabus);
  } catch (err) {
    console.error('Error adding IA unit', err);
    res.status(500).json({ message: 'Failed to add IA unit' });
  }
};

// Add Semester Unit
exports.addSemesterUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = req.body;

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    syllabus.semesterSyllabus.push(unit);
    await syllabus.save();

    res.json(syllabus);
  } catch (err) {
    console.error('Error adding semester unit', err);
    res.status(500).json({ message: 'Failed to add semester unit' });
  }
};

// Add Study Material
exports.addMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = req.body;

    const syllabus = await Syllabus.findById(id);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    syllabus.materials.push(material);
    await syllabus.save();

    res.json(syllabus);
  } catch (err) {
    console.error('Error adding material', err);
    res.status(500).json({ message: 'Failed to add material' });
  }
};

// Student view: Get published syllabi
exports.getStudentSyllabi = async (req, res) => {
  try {
    const syllabi = await Syllabus.find({ status: 'Published' }).sort({ semester: 1 });
    res.json(syllabi);
  } catch (err) {
    console.error('Error fetching student syllabi', err);
    res.status(500).json({ message: 'Failed to fetch syllabi' });
  }
};
