const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const { db } = require('./firebase');
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

    return res.status(201).json({
      apikey,
      email,
      name,
      password // Note: In production, do not return the password in the response!
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
