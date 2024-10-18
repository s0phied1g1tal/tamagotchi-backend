const express = require('express');
const router = express.Router();
const Tamagotchi = require('../models/Tamagotchi');

// Create a new Tamagotchi account
router.post('/create', async (req, res) => {
    const { userId } = req.body;

    try {
        const newTamagotchi = new Tamagotchi({
            userId,
            hunger: 100,
            fun: 100,
        });
        const savedTamagotchi = await newTamagotchi.save();
        res.status(201).json(savedTamagotchi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Account creation failed" });
    }
});

// Login an existing Tamagotchi account
router.post('/login', async (req, res) => {
    const { userId } = req.body; // Get userId from request body
    console.log("Login attempt for userId:", userId); // Log the login attempt

    try {
        // Check if the user exists in the database
        const existingTamagotchi = await Tamagotchi.findOne({ userId });
        console.log("Found Tamagotchi:", existingTamagotchi); // Log the found user

        if (!existingTamagotchi) {
            return res.status(404).json({ message: "User not found" }); // If not found, send a 404 error
        }

        res.status(200).json(existingTamagotchi); // Return the user data if found
    } catch (error) {
        console.error("Login error:", error); // Log any errors
        res.status(500).json({ message: "Login failed" }); // If an error occurs, send a 500 error
    }
});

module.exports = router;
