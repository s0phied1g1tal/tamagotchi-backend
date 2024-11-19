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
  .catch((err) => console.log(err));

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

// Google Auth configuration
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
app.post('/auth/google/callback', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send('No token provided');
  }
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID, // Ensure your client ID is correct
  })
  .then(ticket => {
    const payload = ticket.getPayload();
    console.log('Authenticated User:', payload);
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

// Use the Tamagotchi routes
app.use('/tamagotchi', tamagotchiRoutes); // Use the Tamagotchi routes

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
