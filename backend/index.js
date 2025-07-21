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

// User Authentication

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
    const createdAt = new Date();
    const endAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
    await sessionsRef.doc(sessionId).set({
      sessionId,
      email,
      createdAt: createdAt.toISOString(),
      endAt: endAt.toISOString(),
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
    const createdAt = new Date();
    const endAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
    await sessionsRef.doc(sessionId).set({
      sessionId,
      email,
      createdAt: createdAt.toISOString(),
      endAt: endAt.toISOString(),
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
    const { email, endAt } = sessionDoc.data();
    // Check session expiry
    if (!endAt || new Date(endAt) < new Date()) {
      // Session expired, delete it
      await sessionRef.delete();
      return res.status(401).json({ error: 'Session is invalid or expired.' });
    }
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

//Page View Calculation
app.post('/updatePageViewCount', async (req , res) =>{
  try{
    const {apikey, pagename, startTime, duration} = req.body;
    if (!apikey || !pagename || !startTime || !duration) {
      return res.status(400).json({ error: 'apikey, pagename, startTime, and duration are required.' });
    }
    // Find user by apikey
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const email = userData.email;

    // Prepare analytics doc ref: analytics/{apikey}/pages/{pagename}
    const pageDocRef = db.collection('analytics').doc(apikey).collection('pages').doc(pagename);
    // Prepare the visit object
    const visit = {
      email,
      duration,
      timestamp: startTime,
      createdAt: new Date().toISOString(),
    };
    // Get the current visits array (if any)
    const pageDoc = await pageDocRef.get();
    let visits = [];
    if (pageDoc.exists && Array.isArray(pageDoc.data().visits)) {
      visits = pageDoc.data().visits;
    }
    visits.push(visit);
    // Write the updated visits array back
    await pageDocRef.set({ visits }, { merge: true });
    return res.status(200).json({ message: 'Page view recorded.' });
  } catch (error) {
    console.error('updatePageViewCount error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
