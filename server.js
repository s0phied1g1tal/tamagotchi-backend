const express = require('express');
const mongoose = require('mongoose');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Adjust the path if needed

const app = express();
const PORT = 5000;

// Middleware for Content Security Policy (CSP)
app.use((req, res, next) => {
  // Allow images from the same origin and data URIs (base64 encoded images)
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:;");
  next();
});

// Middleware to parse JSON bodies
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect('mongodb+srv://sophievanschil1:Sopheline2@cluster0.2e8co.mongodb.net/tamagotchiDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// Add a default route for '/'
app.get('/', (req, res) => {
    res.send('Welcome to the Tamagotchi API!');
});

// Use the Tamagotchi routes
app.use('/tamagotchi', tamagotchiRoutes); // Use the routes

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
