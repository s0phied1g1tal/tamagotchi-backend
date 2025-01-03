// routes/tamagotchiRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route for login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please create an account.' });
    }

    res.status(200).json({ message: 'User logged in successfully', user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Route for creating a new user
router.post('/create', async (req, res) => {
  try {
    const { userName, email } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists. Please log in.' });
    }

    // Create a new user
    const userId = email.toLowerCase(); // Use email as userId
    user = await User.create({
      userId,
      userName: userName || 'Default User', // Fallback to default username if not provided
      email,
      avatar: 'default-avatar.png',
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

module.exports = router;
