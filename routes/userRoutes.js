const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId); // Assuming you're using session
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Route to login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Store userId in session for future requests
    req.session.userId = user._id;

    // Log the user settings to the terminal in a readable format
    console.log('User Settings:');
    console.log(`sound: ${user.sound}`);
    console.log(`notifications: ${user.notifications}`);
    console.log(`avatar: ${user.avatar}`);
    console.log(`userName: ${user.userName}`);

    res.status(200).json({
      message: 'User logged in successfully',
      user: {
        userId: user._id,
        email: user.email,
        userName: user.userName,
        avatar: user.avatar || 'default-avatar.png',
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


router.put('/profile', async (req, res) => {
  const { userName, email, password, sound, notifications } = req.body;

  try {
    const user = await User.findById(req.session.userId); // Use the session's userId to fetch the user
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only the fields that are provided
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Update sound and notifications if provided
    if (sound) user.sound = sound;
    if (notifications) user.notifications = notifications;

    await user.save();
    
    // Log the updated settings in the terminal
    console.log('Updated User Settings:');
    console.log(`sound: ${user.sound}`);
    console.log(`notifications: ${user.notifications}`);
    console.log(`avatar: ${user.avatar}`);
    console.log(`userName: ${user.userName}`);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
