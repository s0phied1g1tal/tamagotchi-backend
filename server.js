// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const axios = require('axios');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Ensure this route exists

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
  origin: process.env.FRONTEND_URL || 'https://tamagotchi-backend.onrender.com', // Use your deployed frontend URL here
  credentials: true,
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

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || 'https://tamagotchi-backend.onrender.com/auth/google/callback',
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile); // Debugging log to check the profile data
    const userId = profile.id;
    const Tamagotchi = require('./models/Tamagotchi');
    
    // Check if user exists in the database
    let user = await Tamagotchi.findOne({ googleId: userId });

    if (!user) {
      // If user doesn't exist, create a new one
      user = await Tamagotchi.create({
        googleId: userId,
        userName: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        hunger: 100,
        fun: 100,
      });
    }

    return done(null, user); // Return the user for session
  } catch (error) {
    console.error('Error in Google OAuth:', error);
    return done(error);
  }
}));

// Route for Google OAuth login
app.post('/auth/google/callback', (req, res) => {
  const token = req.body.token; // Token from frontend

  if (!token) {
    return res.status(400).json({ message: 'Token missing' });
  }

  axios.post('https://oauth2.googleapis.com/tokeninfo', null, {
    params: {
      id_token: token,
    },
  }).then((response) => {
    const { sub: googleId, email, name } = response.data;

    res.json({ user: { googleId, email, name } });
  }).catch((err) => {
    console.error(err);
    res.status(400).json({ message: 'Google authentication failed' });
  });
});

// Define routes
app.use('/tamagotchi', tamagotchiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
