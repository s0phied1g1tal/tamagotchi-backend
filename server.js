const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session'); // Keep this one
const MongoStore = require('connect-mongo'); // Use MongoDB for session storage
const dotenv = require('dotenv');
const cors = require('cors');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Adjust path if needed

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware
app.use(cors({
  origin: 'exp://localhost:19000', // Replace with your frontend's URL (Expo development URL)
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));


// Set up session middleware (no duplicate declaration)
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,  // Ensure this line is correct
    ttl: 14 * 24 * 60 * 60  // Optional: session time-to-live (TTL) in seconds
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

// Configure Passport Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google Profile:', profile);
    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value
    };
    return done(null, user); // Pass user to serializeUser
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    return done(error, null);
  }
}));

// Serialize user info into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user info from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Tamagotchi API!');
});

// Google OAuth callback route
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const user = req.user;
    console.log('Authenticated User:', user);

    // Dynamically set the redirect URI based on environment (local or production)
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://tamagotchi-backend.onrender.com'  // Production (Render URL)
      : 'http://localhost:19000'; // Local development (Expo)

    const userInfo = {
      id: user.id,
      displayName: user.displayName,
      email: user.email
    };

    const redirectUrl = `${redirectUri}?user=${encodeURIComponent(JSON.stringify(userInfo))}`;
    res.redirect(redirectUrl);
  }
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Use the Tamagotchi API routes
app.use('/tamagotchi', tamagotchiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
