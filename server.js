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
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Your Tamagotchi-specific routes

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

// CORS setup for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:19000', // Make sure your frontend URL matches this
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
  },
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google Auth strategy setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || 'https://tamagotchi-backend.onrender.com/auth/google/callback',  // Ensure this is correct in production
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile); // Debugging log to check the profile data
    const userId = profile.id;
    const Tamagotchi = require('./models/Tamagotchi');
    
    // Check if user exists in the database
    let user = await Tamagotchi.findOne({ userId });
    if (!user) {
      // If user doesn't exist, create a new one
      user = await Tamagotchi.create({ userId, hunger: 100, fun: 100 });
    }
    return done(null, user); // Successfully authenticate the user
  } catch (error) {
    console.error('Error in Google strategy:', error);
    return done(error, null); // Handle errors gracefully
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.userId); // Store only userId in session
});

passport.deserializeUser(async (userId, done) => {
  const Tamagotchi = require('./models/Tamagotchi');
  try {
    const user = await Tamagotchi.findOne({ userId }); // Retrieve user from database
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
// Step 1: Redirect user to Google OAuth
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'], // Add required scopes here
}));

// Step 2: After Google redirects, fetch the user profile
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
  console.log('Google authentication successful'); // Debugging message
  res.redirect('/dashboard'); // Redirect to the dashboard after successful login
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send('Logout failed');
    res.redirect('/'); // Redirect to home after logout
  });
});

// Tamagotchi routes
app.use('/tamagotchi', tamagotchiRoutes);

// Dashboard route (you can change this route as per your app's flow)
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/'); // If user is not authenticated, redirect to the homepage
  }
  res.json({ message: 'Welcome to your dashboard!', user: req.user });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
