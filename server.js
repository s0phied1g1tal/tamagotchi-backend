const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Your Tamagotchi-specific routes

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Security headers setup using Helmet
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"], // Only allow resources from the same origin
    imgSrc: ["'self'", "data:", "https://example.com"], // Allow images from data URIs and external sources
    scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if necessary
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
    connectSrc: ["'self'"], // Allow connections to the same origin
  },
}));

// CORS setup for frontend
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:19000', credentials: true }));

// Session setup using Mongo store
app.use(session({
  secret: process.env.SESSION_SECRET || 'bT8$^gL7mXw2@!oCkYfZp',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 14 * 24 * 60 * 60 // Session TTL
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }  
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google Auth strategy setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
}, (accessToken, refreshToken, profile, done) => {
  // Optionally, handle user creation or updating in the database here
  return done(null, profile); 
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth callback route
app.post('/auth/google/callback', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send('No token provided');
  }

  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID, // Ensure this matches your Google client ID
  })
  .then(ticket => {
    const payload = ticket.getPayload();
    console.log('Google payload:', payload); // Log the payload for debugging
    // Optionally create/update user in the database here
    res.json({ success: true, user: payload });
  })
  .catch(error => {
    console.error('Token verification failed:', error);
    res.status(400).send('Invalid token');
  });
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

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
