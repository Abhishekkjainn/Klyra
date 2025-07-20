const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const { db } = require('./firebase');
const { v4: uuidv4 } = require('uuid');
app.use(express.json()); // Add this to parse JSON bodies
app.use(cors()); // Enable CORS

app.get('/', (req, res) => {
  res.send('Welcome to the Klyra API!' );
});

app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    // Generate a unique 12-character alphanumeric API key
    const generateApiKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let apiKey = '';
      for (let i = 0; i < 12; i++) {
        apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return apiKey;
    };
    const apikey = generateApiKey();

    // Create user document
    await userRef.set({
      apikey,
      email,
      name,
      password, // Note: In production, hash the password before storing!
    });

    // Remove any existing session for this email
    const sessionsRef = db.collection('sessions');
    const existingSessions = await sessionsRef.where('email', '==', email).get();
    const batch = db.batch();
    existingSessions.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Auto-login: create session
    const sessionId = uuidv4();
    await sessionsRef.doc(sessionId).set({
      sessionId,
      email,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      apikey,
      email,
      name,
      sessionId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    // Validate presence and type
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be strings.' });
    }

    email = email.trim();
    password = password.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required and cannot be empty.' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    const userData = userDoc.data();
    if (!userData.password) {
      return res.status(500).json({ error: 'User record is corrupted. Please contact support.' });
    }

    if (userData.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Remove password from response for security
    const { password: _, ...userWithoutPassword } = userData;

    // Remove any existing session for this email
    const sessionsRef = db.collection('sessions');
    const existingSessions = await sessionsRef.where('email', '==', email).get();
    const batch = db.batch();
    existingSessions.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Create session
    const sessionId = uuidv4();
    await sessionsRef.doc(sessionId).set({
      sessionId,
      email,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: userWithoutPassword,
      sessionId,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log('Logout requested for sessionId:', sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId is required.' });
    }
    // Validate session
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      console.log('Session not found for sessionId:', sessionId);
      return res.status(400).json({ error: 'Invalid session.' });
    }
    // Delete session
    await sessionRef.delete();
    console.log('Session deleted for sessionId:', sessionId);
    return res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/check-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId is required.' });
    }
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      return res.status(401).json({ error: 'Session is invalid or expired.' });
    }
    const { email } = sessionDoc.data();
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userData = userDoc.data();
    const { password: _, ...userWithoutPassword } = userData;
    return res.status(200).json({
      message: 'Session is valid.',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Check session error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/forgot-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await userRef.update({ password });
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
