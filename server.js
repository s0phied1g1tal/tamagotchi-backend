const express = require('express');
const mongoose = require('mongoose');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Adjust the path if needed

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json()); // Allow Express to parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb+srv://sophievanschil1:Sopheline2@cluster0.2e8co.mongodb.net/tamagotchiDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// Use the Tamagotchi routes
app.use('/tamagotchi', tamagotchiRoutes); // Use the routes

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
