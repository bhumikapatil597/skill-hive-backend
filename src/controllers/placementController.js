const Placement = require('../models/Placement');
const User = require('../models/User');

// Student view: list placements
exports.listPlacements = async (req, res) => {
  try {
    const placements = await Placement.find().sort({ date: -1 });
    res.json(
      placements.map((p) => ({
        id: p._id,
        company: p.company,
        role: p.role,
        package: p.package,
        date: p.date,
        time: p.time,
        location: p.location,
        status: p.status,
        description: p.description,
        procedure: p.procedure,
        eligibility: p.eligibility,
        attachments: p.attachments,
        registeredStudents: p.registeredStudents,
      }))
    );
  } catch (err) {
    console.error('Error listing placements', err);
    res.status(500).json({ message: 'Failed to list placements' });
  }
};

// Teacher/admin: create placement
exports.createPlacement = async (req, res) => {
  try {
    const {
      company,
      role,
      package: salaryPackage,
      date,
      time,
      location,
      description,
      procedure,
      eligibility,
      attachments,
      status,
    } = req.body;

    if (
      !company ||
      !role ||
      !salaryPackage ||
      !date ||
      !time ||
      !location ||
      !description
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const placement = await Placement.create({
      company,
      role,
      package: salaryPackage,
      date,
      time,
      location,
      description,
      procedure,
      eligibility,
      attachments,
      status: status || 'Upcoming',
    });

    res.status(201).json(placement);
  } catch (err) {
    console.error('Error creating placement', err);
    res.status(500).json({ message: 'Failed to create placement' });
  }
};

exports.updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const placement = await Placement.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    res.json(placement);
  } catch (err) {
    console.error('Error updating placement', err);
    res.status(500).json({ message: 'Failed to update placement' });
  }
};

exports.deletePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const placement = await Placement.findByIdAndDelete(id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }
    res.json({ message: 'Placement deleted' });
  } catch (err) {
    console.error('Error deleting placement', err);
    res.status(500).json({ message: 'Failed to delete placement' });
  }
};

// Student: register for a placement
exports.registerForPlacement = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the placement
    // NOTE: In a real app, the user ID would come from authentication middleware, e.g., req.user.id
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ message: 'User ID is required to register' });
    }

    // Use $addToSet to add the userId to the 'registeredStudents' array, preventing duplicates.
    // This assumes your Placement model has a 'registeredStudents' field (e.g., [mongoose.Schema.Types.ObjectId]).
    const placement = await Placement.findByIdAndUpdate(
      id,
      { $addToSet: { registeredStudents: userId } },
      { new: true, runValidators: true }
    );

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    res.json({ message: 'Successfully registered for placement.', user: { id: user._id, name: user.name } });
  } catch (err) {
    console.error('Error registering for placement', err);
    res.status(500).json({ message: 'Failed to register for placement' });
  }
};
