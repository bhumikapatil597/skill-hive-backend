const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }, // select: false means password won't be returned by default
    phone: { type: String },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },
    gender: { type: String },
    age: { type: Number },
    enrolledCourses: { type: Number, default: 0 }, // for students
    courses: { type: Number, default: 0 }, // for teachers
    students: { type: Number, default: 0 }, // for teachers
    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'your-secret-key-change-this',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('User', userSchema);



