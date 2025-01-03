const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },

  password: {
    type: String,
    required: true,
  },
  // Add new settings fields
  sound: {
    type: String,
    enum: ['on', 'off'],
    default: 'on',
  },
  notifications: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'enabled',
  },
}, { timestamps: true });



// Hash password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash password if it's modified
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing password');
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
