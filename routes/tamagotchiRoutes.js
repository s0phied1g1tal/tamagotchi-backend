const express = require('express');
const router = express.Router();
const Tamagotchi = require('../models/Tamagotchi');

// Middleware for checking if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.user) { // Passport attaches user to req
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Create a new Tamagotchi account (unused with Google Login)
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const existingTamagotchi = await Tamagotchi.findOne({ userId: req.user.userId });
    if (existingTamagotchi) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newTamagotchi = new Tamagotchi({
      userId: req.user.userId,
      hunger: 100,
      fun: 100,
    });
    const savedTamagotchi = await newTamagotchi.save();
    res.status(201).json(savedTamagotchi);
  } catch (error) {
    console.error("Account creation error:", error);
    res.status(500).json({ message: "Account creation failed" });
  }
});

// Login an existing Tamagotchi account
router.post('/login', isAuthenticated, async (req, res) => {
  try {
    const user = await Tamagotchi.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user); // Return user data
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
