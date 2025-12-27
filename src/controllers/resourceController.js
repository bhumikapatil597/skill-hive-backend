const Resource = require('../models/Resource');

// Student view: list resources
exports.listResources = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });
    const payload = resources.map((r) => ({
      id: r._id,
      title: r.title,
      subject: r.subject,
      type: r.type,
      size: r.size,
      author: r.author,
      notes: r.notes,
      uploadDate: r.uploadDate.toISOString().split('T')[0],
      url: r.url,
      downloadCount: r.downloadCount,
      topic: r.topic,
      description: r.description,
      content: r.content,
      explanation: r.explanation,
      examples: r.examples || [],
      bulletPoints: r.bulletPoints || [],
      questions: r.questions || [],
    }));

    res.json(payload);
  } catch (err) {
    console.error('Error listing resources', err);
    res.status(500).json({ message: 'Failed to list resources' });
  }
};

// Teacher/admin: create resource metadata
exports.createResource = async (req, res) => {
  try {
    const { title, type, url } = req.body;
    const teacherId = req.user?.id || req.body?.teacherId; // Get teacher ID from auth or body

    if (!title || !type || !url) {
      return res
        .status(400)
        .json({ message: 'Title, type, and url are required' });
    }

    const resource = await Resource.create(req.body);

    // Log teacher activity if teacherId is provided
    if (teacherId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: teacherId,
          userRole: 'teacher',
          activityType: 'resource_upload',
          resourceId: resource._id,
          resourceModel: 'Resource',
          resourceTitle: resource.title,
          metadata: {
            subject: resource.subject,
            type: resource.type,
            topic: resource.topic
          }
        });
      } catch (activityErr) {
        console.error('Error logging teacher activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.status(201).json(resource);
  } catch (err) {
    console.error('Error creating resource', err);
    res.status(500).json({ message: 'Failed to create resource' });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const resource = await Resource.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (err) {
    console.error('Error updating resource', err);
    res.status(500).json({ message: 'Failed to update resource' });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findByIdAndDelete(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    console.error('Error deleting resource', err);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

exports.incrementDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id || req.body?.studentId; // Get student ID from auth or body

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Log activity if studentId is provided
    if (studentId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: studentId,
          userRole: 'student',
          activityType: 'resource_download',
          resourceId: id,
          resourceModel: 'Resource',
          resourceTitle: resource.title,
          metadata: {
            subject: resource.subject,
            type: resource.type
          }
        });
      } catch (activityErr) {
        console.error('Error logging activity:', activityErr);
        // Don't fail the request if activity logging fails
      }
    }

    res.json({ downloadCount: resource.downloadCount });
  } catch (err) {
    console.error('Error incrementing download count', err);
    res.status(500).json({ message: 'Failed to increment download count' });
  }
};

// Generate PDF for a resource
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to add section header
    const addSectionHeader = (title) => {
      doc.fontSize(16).fillColor('#2563eb').text(title, { underline: true });
      doc.moveDown(0.5);
      doc.fillColor('#000000');
    };

    // Title Page
    doc.fontSize(24).fillColor('#1e40af').text(resource.title, { align: 'center' });
    doc.moveDown(0.5);

    if (resource.topic) {
      doc.fontSize(14).fillColor('#6b7280').text(resource.topic, { align: 'center' });
    }

    if (resource.subject) {
      doc.fontSize(12).fillColor('#9ca3af').text(`Subject: ${resource.subject}`, { align: 'center' });
    }

    doc.moveDown(2);
    doc.strokeColor('#e5e7eb').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Description
    if (resource.description) {
      doc.fontSize(12).fillColor('#374151').text(resource.description, { align: 'justify' });
      doc.moveDown(1.5);
    }

    // Explanation Section
    if (resource.explanation) {
      addSectionHeader('📖 Explanation');
      doc.fontSize(11).fillColor('#1f2937').text(resource.explanation, { align: 'justify', lineGap: 3 });
      doc.moveDown(1.5);
    }

    // Examples Section
    if (resource.examples && resource.examples.length > 0) {
      addSectionHeader('💡 Examples');
      resource.examples.forEach((example, index) => {
        doc.fontSize(11).fillColor('#059669').text(`Example ${index + 1}:`, { continued: false });
        doc.fontSize(10).fillColor('#1f2937').text(example, { indent: 20, lineGap: 2 });
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Key Points Section
    if (resource.bulletPoints && resource.bulletPoints.length > 0) {
      addSectionHeader('🔑 Key Points');
      resource.bulletPoints.forEach((point) => {
        doc.fontSize(10).fillColor('#1f2937').list([point], { bulletRadius: 2, indent: 20 });
      });
      doc.moveDown(1.5);
    }

    // Questions Section
    if (resource.questions && resource.questions.length > 0) {
      doc.addPage();
      doc.fontSize(20).fillColor('#1e40af').text('Questions & Answers', { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#e5e7eb').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Group questions by marks
      const questionsByMarks = { 2: [], 4: [], 8: [] };
      resource.questions.forEach(q => {
        if (questionsByMarks[q.marks]) {
          questionsByMarks[q.marks].push(q);
        }
      });

      // Display questions by marks
      [2, 4, 8].forEach(marks => {
        const questions = questionsByMarks[marks];
        if (questions.length > 0) {
          addSectionHeader(`${marks} Marks Questions`);

          questions.forEach((q, index) => {
            // Question
            doc.fontSize(11).fillColor('#dc2626').text(`Q${index + 1}. `, { continued: true });
            doc.fillColor('#1f2937').text(q.question);
            doc.moveDown(0.5);

            // Answer
            doc.fontSize(10).fillColor('#059669').text('Answer: ', { continued: true });
            doc.fillColor('#374151').text(q.answer, { align: 'justify', lineGap: 2 });
            doc.moveDown(1);
          });

          doc.moveDown(0.5);
        }
      });
    }

    // Footer
    doc.fontSize(8).fillColor('#9ca3af').text(
      `Generated on ${new Date().toLocaleDateString()} | ${resource.title}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

// Handle file upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, subject, author, notes, type } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Get file info
    const fileUrl = `/uploads/resources/${req.file.filename}`;
    const fileSize = (req.file.size / 1024).toFixed(2) + ' KB'; // Convert to KB

    // Create resource in database
    const resource = await Resource.create({
      title,
      subject: subject || '',
      type: type || 'PDF',
      size: fileSize,
      author: author || '',
      notes: notes || '',
      url: fileUrl,
      uploadDate: new Date()
    });

    // Log teacher activity if teacherId is provided
    const teacherId = req.user?.id || req.body?.teacherId;
    if (teacherId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          userId: teacherId,
          userRole: 'teacher',
          activityType: 'resource_upload',
          resourceId: resource._id,
          resourceModel: 'Resource',
          resourceTitle: resource.title,
          metadata: {
            subject: resource.subject,
            type: resource.type,
            size: resource.size
          }
        });
      } catch (activityErr) {
        console.error('Error logging teacher activity:', activityErr);
      }
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      resource: {
        id: resource._id,
        title: resource.title,
        subject: resource.subject,
        type: resource.type,
        size: resource.size,
        author: resource.author,
        notes: resource.notes,
        url: resource.url,
        uploadDate: resource.uploadDate
      }
    });
  } catch (err) {
    console.error('Error uploading file', err);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

