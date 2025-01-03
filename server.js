// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');  // Adjust the path as needed

dotenv.config(); // Load environment variables

const app = express();

// Port for your backend to run
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Security headers setup using Helmet
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'"],
  },
}));

// CORS configuration
app.use(cors({
  origin: 'http://192.168.129.6:19006', // Adjust for your local frontend URL or deploy URL
  credentials: true, // Allow credentials (cookies) to be sent
}));

// Session setup using Mongo store
app.use(session({
  secret: process.env.SESSION_SECRET || 'bT8$^gL7mXw2@!oCkYfZp',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // MongoDB URI from your environment variables
    ttl: 14 * 24 * 60 * 60, // Session TTL (14 days)
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // For security reasons
    sameSite: 'Strict', // Add SameSite for better security
  },
}));

// Routes
app.use('/api/user', userRoutes);
app.use('/tamagotchi', tamagotchiRoutes);

// Update profile route
app.put('/tamagotchi/update-profile', async (req, res) => {
  const { email, userName } = req.body;

  // Validate input
  if (!email || !userName) {
    return res.status(400).send({ error: 'Email and username are required.' });
  }

  try {
    // Find the user by email and update the username
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { userName },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ error: 'User not found.' });
    }

    // Update session if needed
    req.session.user = {
      email: updatedUser.email,
      userName: updatedUser.userName,
    };

    res.status(200).send({
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send({ error: 'Failed to update user profile.' });
  }
});

// MongoDB Connection with improved error handling
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on database connection error
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
