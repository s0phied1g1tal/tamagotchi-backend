const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const tamagotchiRoutes = require('./routes/tamagotchiRoutes'); // Adjust path if needed

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Set up session middleware
app.use(session({
  secret: 'your-session-secret', // Replace with a secure secret in production
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport Google OAuth strategy
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

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Tamagotchi API!');
});

// Google Auth routes
app.post('/auth/google/callback', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send('No token provided');
  }

  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  // Verify the token sent from the frontend
  client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID, // Ensure your client ID is correct
  })
  .then(ticket => {
    const payload = ticket.getPayload();
    console.log('Authenticated User:', payload);  // Optionally store user in your DB here
    res.json({ success: true, user: payload });
  })
  .catch(error => {
    console.error('Token verification failed:', error);
    res.status(400).send('Invalid token');
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Use the Tamagotchi API routes
app.use('/tamagotchi', tamagotchiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
