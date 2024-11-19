const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const MongoStore = require('connect-mongo');  // Import connect-mongo
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Adjust path if needed

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for CORS
app.use(cors());

// Middleware for Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:;");
  next();
});

// Connect to MongoDB using the environment variable
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the app if the connection fails
  });

// Set up session middleware with Mongo store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret', // Secure secret
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Set the mongo URI here
    ttl: 14 * 24 * 60 * 60 // Optional: session time-to-live (TTL) in seconds
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production', // Secure cookie in production
    httpOnly: true
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google Auth configuration using passport-google-oauth20
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, (accessToken, refreshToken, profile, done) => {
  console.log('Google Profile:', profile);
  return done(null, profile); // Pass the Google profile to serializeUser
}));

// Serialize user info into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user info from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Tamagotchi API!');
});

// Google Auth callback route
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/',
}), (req, res) => {
  // Successful authentication, redirect to the homepage or desired page
  res.redirect('/');
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send('Logout error');
    }
    res.redirect('/');
  });
});

// Use the Tamagotchi routes
app.use('/tamagotchi', tamagotchiRoutes); // Use the Tamagotchi routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
