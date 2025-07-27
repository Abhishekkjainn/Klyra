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

//Page View and duration of each page Calculation
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

// Button Click Analytics
app.post('/updateButtonClickAnalytics', async (req, res) => {
  try {
    const { apikey, buttonName, timestamp } = req.body;
    if (!apikey || !buttonName || !timestamp) {
      return res.status(400).json({ error: 'apikey, buttonName, and timestamp are required.' });
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

    // Prepare analytics doc ref: analytics/{apikey}/clicks/{buttonName}
    const clickDocRef = db.collection('analytics').doc(apikey).collection('clicks').doc(buttonName);
    // Prepare the click event object
    const clickEvent = {
      email,
      timestamp,
      createdAt: new Date().toISOString(),
    };
    // Get the current clicks array and count (if any)
    const clickDoc = await clickDocRef.get();
    let clicks = [];
    let clickCount = 0;
    if (clickDoc.exists) {
      const data = clickDoc.data();
      if (Array.isArray(data.clicks)) {
        clicks = data.clicks;
      }
      if (typeof data.clickCount === 'number') {
        clickCount = data.clickCount;
      }
    }
    clicks.push(clickEvent);
    clickCount += 1;
    // Write the updated clicks array and count back
    await clickDocRef.set({ clicks, clickCount }, { merge: true });
    return res.status(200).json({ message: 'Button click recorded.' });
  } catch (error) {
    console.error('updateButtonClickAnalytics error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//create user journey analytics
app.post('/userJourneyAnalytics', async (req, res) => {
  try {
    const { apikey, routes, startTime, duration } = req.body;
    if (!apikey || !Array.isArray(routes) || !startTime || typeof duration !== 'number') {
      return res.status(400).json({ error: 'apikey, routes (array), startTime, and duration (number) are required.' });
    }
    // Find user by apikey
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    // Find the next available index for this user's journeys
    const journeyColRef = db.collection('analytics').doc(apikey).collection('userjourney');
    const journeysSnap = await journeyColRef.get();
    let maxIndex = -1;
    journeysSnap.forEach(doc => {
      const idx = parseInt(doc.id, 10);
      if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
    });
    const nextIndex = maxIndex + 1;
    // Prepare the journey object
    const journey = {
      routes,
      startTime,
      duration,
      createdAt: new Date().toISOString(),
    };
    // Store the journey under the next index
    await journeyColRef.doc(String(nextIndex)).set(journey);
    return res.status(201).json({ message: 'User journey recorded.', index: nextIndex });
  } catch (error) {
    console.error('userJourneyAnalytics error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Device, Browser, OS & Location Analytics
app.post('/deviceInfoAnalytics', async (req, res) => {
  try {
    const { apikey, deviceInfo, location } = req.body;
    if (!apikey || !deviceInfo) {
      return res.status(400).json({ error: 'apikey and deviceInfo are required.' });
    }
    // Validate API key
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    // Find the next available index for this user's device info
    const deviceInfoColRef = db.collection('analytics').doc(apikey).collection('deviceinfo');
    const deviceInfoSnap = await deviceInfoColRef.get();
    let maxIndex = -1;
    deviceInfoSnap.forEach(doc => {
      const idx = parseInt(doc.id, 10);
      if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
    });
    const nextIndex = maxIndex + 1;
    // Prepare the device info object
    const timestamp = new Date().toISOString();
    const docData = {
      ...deviceInfo,
      location: location || null,
      createdAt: timestamp,
    };
    await deviceInfoColRef.doc(String(nextIndex)).set(docData);
    return res.status(201).json({ message: 'Device info recorded.', index: nextIndex });
  } catch (error) {
    console.error('deviceInfoAnalytics error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Active User Heartbeat
app.post('/activeUserHeartbeat', async (req, res) => {
  try {
    const { apikey, tabId, timestamp } = req.body;
    console.log(`[Heartbeat] Received: apikey=${apikey}, tabId=${tabId}, timestamp=${timestamp}`);
    if (!apikey || !tabId || !timestamp) {
      console.log('[Heartbeat] Missing required fields');
      return res.status(400).json({ error: 'apikey, tabId, and timestamp are required.' });
    }
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      console.log('[Heartbeat] Invalid API key');
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    const realtimeDocRef = db.collection('analytics').doc(apikey).collection('realtime').doc('activeUsers');
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(realtimeDocRef);
      let sessions = {};
      if (doc.exists) {
        const data = doc.data();
        if (typeof data.sessions === 'object' && data.sessions !== null) {
          sessions = data.sessions;
        }
      }
      // Set/update lastSeen for this tabId
      sessions[tabId] = { lastSeen: timestamp };
      // Remove sessions older than 70 seconds
      const now = Date.now();
      let removed = [];
      for (const [id, info] of Object.entries(sessions)) {
        if (!info.lastSeen || (now - new Date(info.lastSeen).getTime()) > 70000) {
          removed.push(id);
          delete sessions[id];
        }
      }
      const count = Object.keys(sessions).length;
      transaction.set(realtimeDocRef, { sessions, count }, { merge: true });
      console.log(`[Heartbeat] Updated sessions. Active: ${count}, Removed: [${removed.join(', ')}]`);
    });
    return res.status(200).json({ message: 'Heartbeat recorded.' });
  } catch (error) {
    console.error('activeUserHeartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update increment to set lastSeen
app.post('/activeUserIncrement', async (req, res) => {
  try {
    const { apikey, tabId } = req.body;
    console.log(`[Increment] Received: apikey=${apikey}, tabId=${tabId}`);
    if (!apikey || !tabId) {
      console.log('[Increment] Missing required fields');
      return res.status(400).json({ error: 'apikey and tabId are required.' });
    }
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      console.log('[Increment] Invalid API key');
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    const realtimeDocRef = db.collection('analytics').doc(apikey).collection('realtime').doc('activeUsers');
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(realtimeDocRef);
      let sessions = {};
      if (doc.exists) {
        const data = doc.data();
        if (typeof data.sessions === 'object' && data.sessions !== null) {
          sessions = data.sessions;
        } else {
          sessions = {};
        }
      }
      // Set lastSeen for this tabId
      sessions[tabId] = { lastSeen: new Date().toISOString() };
      // Remove sessions older than 70 seconds
      const now = Date.now();
      let removed = [];
      for (const [id, info] of Object.entries(sessions)) {
        if (!info.lastSeen || (now - new Date(info.lastSeen).getTime()) > 70000) {
          removed.push(id);
          delete sessions[id];
        }
      }
      const count = Object.keys(sessions).length;
      transaction.set(realtimeDocRef, { sessions, count }, { merge: true });
      console.log(`[Increment] Updated sessions. Active: ${count}, Removed: [${removed.join(', ')}]`);
    });
    return res.status(200).json({ message: 'Active user incremented.' });
  } catch (error) {
    console.error('activeUserIncrement error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update decrement to delete the session
app.post('/activeUserDecrement', async (req, res) => {
  try {
    const { apikey, tabId } = req.body;
    console.log(`[Decrement] Received: apikey=${apikey}, tabId=${tabId}`);
    if (!apikey || !tabId) {
      console.log('[Decrement] Missing required fields');
      return res.status(400).json({ error: 'apikey and tabId are required.' });
    }
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      console.log('[Decrement] Invalid API key');
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    const realtimeDocRef = db.collection('analytics').doc(apikey).collection('realtime').doc('activeUsers');
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(realtimeDocRef);
      let sessions = {};
      if (doc.exists) {
        const data = doc.data();
        if (typeof data.sessions === 'object' && data.sessions !== null) {
          sessions = data.sessions;
        } else {
          sessions = {};
        }
      }
      let removed = [];
      if (sessions[tabId]) {
        delete sessions[tabId];
        removed.push(tabId);
      }
      // Remove sessions older than 70 seconds
      const now = Date.now();
      for (const [id, info] of Object.entries(sessions)) {
        if (!info.lastSeen || (now - new Date(info.lastSeen).getTime()) > 70000) {
          removed.push(id);
          delete sessions[id];
        }
      }
      const count = Object.keys(sessions).length;
      transaction.set(realtimeDocRef, { sessions, count }, { merge: true });
      console.log(`[Decrement] Updated sessions. Active: ${count}, Removed: [${removed.join(', ')}]`);
    });
    return res.status(200).json({ message: 'Active user decremented.' });
  } catch (error) {
    console.error('activeUserDecrement error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET all analytics for a given API key
app.get('/analytics/:apikey', async (req, res) => {
  try {
    const { apikey } = req.params;
    if (!apikey) {
      return res.status(400).json({ error: 'API key is required.' });
    }
    // Validate API key
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }
    // Reference to analytics/{apikey}
    const analyticsRef = db.collection('analytics').doc(apikey);
    // List all subcollections
    const subcollections = await analyticsRef.listCollections();
    const analyticsData = {};
    for (const subcol of subcollections) {
      const subcolSnap = await subcol.get();
      analyticsData[subcol.id] = {};
      subcolSnap.forEach(doc => {
        analyticsData[subcol.id][doc.id] = doc.data();
      });
    }
    return res.status(200).json({ apikey, analytics: analyticsData });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET comprehensive analytics analysis for a given API key
app.get('/analytics/:apikey/analysis', async (req, res) => {
  try {
    const { apikey } = req.params;
    if (!apikey) {
      return res.status(400).json({ error: 'API key is required.' });
    }

    // Validate API key
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('apikey', '==', apikey).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    // Get all analytics data
    const analyticsRef = db.collection('analytics').doc(apikey);
    const subcollections = await analyticsRef.listCollections();
    const analyticsData = {};
    
    for (const subcol of subcollections) {
      const subcolSnap = await subcol.get();
      analyticsData[subcol.id] = {};
      subcolSnap.forEach(doc => {
        analyticsData[subcol.id][doc.id] = doc.data();
      });
    }

    // Comprehensive Analysis
    const analysis = {
      overview: analyzeOverview(analyticsData),
      pageAnalytics: analyzePages(analyticsData.pages || {}),
      clickAnalytics: analyzeClicks(analyticsData.clicks || {}),
      userJourney: analyzeUserJourney(analyticsData.userjourney || {}),
      deviceAnalytics: analyzeDevices(analyticsData.deviceinfo || {}),
      realtimeAnalytics: analyzeRealtime(analyticsData.realtime || {}),
      userBehavior: analyzeUserBehavior(analyticsData),
      performance: analyzePerformance(analyticsData),
      timePatterns: analyzeTimePatterns(analyticsData),
      geographicData: analyzeGeographicData(analyticsData),
      sessionPatterns: analyzeSessionPatterns(analyticsData),
      conversionFunnel: analyzeConversionFunnel(analyticsData),
      insights: generateInsights(analyticsData)
    };

    return res.status(200).json({
      apikey,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics analysis error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Analysis Helper Functions
function analyzeOverview(data) {
  const totalPages = Object.keys(data.pages || {}).length;
  const totalClicks = Object.keys(data.clicks || {}).length;
  const totalJourneys = Object.keys(data.userjourney || {}).length;
  const totalDevices = Object.keys(data.deviceinfo || {}).length;
  
  let totalPageVisits = 0;
  let totalClickEvents = 0;
  let totalJourneyDuration = 0;
  
  // Calculate totals
  Object.values(data.pages || {}).forEach(page => {
    if (page.visits) totalPageVisits += page.visits.length;
  });
  
  Object.values(data.clicks || {}).forEach(click => {
    if (click.clickCount) totalClickEvents += click.clickCount;
  });
  
  Object.values(data.userjourney || {}).forEach(journey => {
    if (journey.duration) totalJourneyDuration += journey.duration;
  });

  return {
    totalPages,
    totalClicks,
    totalJourneys,
    totalDevices,
    totalPageVisits,
    totalClickEvents,
    totalJourneyDuration,
    averageJourneyDuration: totalJourneys > 0 ? Math.round(totalJourneyDuration / totalJourneys) : 0,
    averagePageVisits: totalPages > 0 ? Math.round(totalPageVisits / totalPages) : 0
  };
}

function analyzePages(pagesData) {
  const pages = Object.keys(pagesData);
  const pageAnalytics = {};
  
  pages.forEach(pageName => {
    const page = pagesData[pageName];
    const visits = page.visits || [];
    
    if (visits.length > 0) {
      const totalDuration = visits.reduce((sum, visit) => sum + (visit.duration || 0), 0);
      const averageDuration = Math.round(totalDuration / visits.length);
      
      // Group by date
      const visitsByDate = {};
      visits.forEach(visit => {
        const date = new Date(visit.timestamp).toDateString();
        if (!visitsByDate[date]) visitsByDate[date] = [];
        visitsByDate[date].push(visit);
      });
      
      pageAnalytics[pageName] = {
        totalVisits: visits.length,
        totalDuration,
        averageDuration,
        visitsByDate,
        lastVisit: visits[visits.length - 1]?.timestamp,
        firstVisit: visits[0]?.timestamp
      };
    }
  });
  
  return pageAnalytics;
}

function analyzeClicks(clicksData) {
  const clicks = Object.keys(clicksData);
  const clickAnalytics = {};
  
  clicks.forEach(clickName => {
    const click = clicksData[clickName];
    const clickEvents = click.clicks || [];
    
    if (clickEvents.length > 0) {
      // Group by date
      const clicksByDate = {};
      clickEvents.forEach(clickEvent => {
        const date = new Date(clickEvent.timestamp).toDateString();
        if (!clicksByDate[date]) clicksByDate[date] = [];
        clicksByDate[date].push(clickEvent);
      });
      
      clickAnalytics[clickName] = {
        totalClicks: click.clickCount || clickEvents.length,
        clicksByDate,
        lastClick: clickEvents[clickEvents.length - 1]?.timestamp,
        firstClick: clickEvents[0]?.timestamp,
        clickRate: clickEvents.length > 0 ? Math.round((clickEvents.length / clickEvents.length) * 100) : 0
      };
    }
  });
  
  return clickAnalytics;
}

function analyzeUserJourney(journeyData) {
  const journeys = Object.values(journeyData);
  
  if (journeys.length === 0) {
    return {
      totalJourneys: 0,
      averageDuration: 0,
      commonRoutes: [],
      journeyPatterns: []
    };
  }
  
  const totalDuration = journeys.reduce((sum, journey) => sum + (journey.duration || 0), 0);
  const averageDuration = Math.round(totalDuration / journeys.length);
  
  // Analyze routes
  const routeFrequency = {};
  journeys.forEach(journey => {
    const routes = journey.routes || [];
    routes.forEach(route => {
      routeFrequency[route] = (routeFrequency[route] || 0) + 1;
    });
  });
  
  const commonRoutes = Object.entries(routeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));
  
  // Journey patterns
  const journeyPatterns = journeys.map(journey => ({
    routes: journey.routes || [],
    duration: journey.duration || 0,
    startTime: journey.startTime,
    routeCount: (journey.routes || []).length
  }));
  
  return {
    totalJourneys: journeys.length,
    averageDuration,
    commonRoutes,
    journeyPatterns,
    longestJourney: Math.max(...journeys.map(j => j.duration || 0)),
    shortestJourney: Math.min(...journeys.map(j => j.duration || 0))
  };
}

function analyzeDevices(deviceData) {
  const devices = Object.values(deviceData);
  
  if (devices.length === 0) {
    return {
      totalDevices: 0,
      platforms: {},
      browsers: {},
      screenSizes: {},
      locations: []
    };
  }
  
  const platforms = {};
  const browsers = {};
  const screenSizes = {};
  const locations = [];
  
  devices.forEach(device => {
    // Platform analysis
    const platform = device.platform || 'Unknown';
    platforms[platform] = (platforms[platform] || 0) + 1;
    
    // Browser analysis
    const userAgent = device.userAgent || '';
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    browsers[browser] = (browsers[browser] || 0) + 1;
    
    // Screen size analysis
    const screenSize = `${device.screenWidth || 0}x${device.screenHeight || 0}`;
    screenSizes[screenSize] = (screenSizes[screenSize] || 0) + 1;
    
    // Location analysis
    if (device.location && device.location.latitude && device.location.longitude) {
      locations.push({
        latitude: device.location.latitude,
        longitude: device.location.longitude,
        timestamp: device.createdAt
      });
    }
  });
  
  return {
    totalDevices: devices.length,
    platforms,
    browsers,
    screenSizes,
    locations,
    averageMemory: Math.round(devices.reduce((sum, d) => sum + (d.deviceMemory || 0), 0) / devices.length),
    averageCores: Math.round(devices.reduce((sum, d) => sum + (d.hardwareConcurrency || 0), 0) / devices.length)
  };
}

function analyzeRealtime(realtimeData) {
  const activeUsers = realtimeData.activeUsers || {};
  const sessions = activeUsers.sessions || {};
  const currentCount = activeUsers.count || 0;
  
  return {
    currentActiveUsers: currentCount,
    totalSessions: Object.keys(sessions).length,
    sessionDetails: sessions
  };
}

function analyzeUserBehavior(data) {
  const pages = data.pages || {};
  const clicks = data.clicks || {};
  const journeys = data.userjourney || {};
  
  // Engagement analysis
  const totalEngagement = Object.values(pages).reduce((sum, page) => {
    return sum + (page.visits ? page.visits.reduce((pageSum, visit) => pageSum + (visit.duration || 0), 0) : 0);
  }, 0);
  
  // Click engagement
  const totalClicks = Object.values(clicks).reduce((sum, click) => {
    return sum + (click.clickCount || 0);
  }, 0);
  
  // Session analysis
  const sessionDurations = Object.values(journeys).map(journey => journey.duration || 0);
  const averageSessionDuration = sessionDurations.length > 0 ? 
    Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length) : 0;
  
  return {
    totalEngagement,
    totalClicks,
    averageSessionDuration,
    engagementRate: totalEngagement > 0 ? Math.round((totalClicks / totalEngagement) * 100) : 0,
    sessionCount: Object.keys(journeys).length
  };
}

function analyzePerformance(data) {
  const pages = data.pages || {};
  const journeys = data.userjourney || {};
  
  // Performance metrics
  const pageLoadTimes = [];
  const sessionDurations = Object.values(journeys).map(j => j.duration || 0);
  
  Object.values(pages).forEach(page => {
    if (page.visits) {
      page.visits.forEach(visit => {
        if (visit.duration) pageLoadTimes.push(visit.duration);
      });
    }
  });
  
  const averagePageLoadTime = pageLoadTimes.length > 0 ? 
    Math.round(pageLoadTimes.reduce((sum, time) => sum + time, 0) / pageLoadTimes.length) : 0;
  
  const averageSessionDuration = sessionDurations.length > 0 ? 
    Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length) : 0;
  
  return {
    averagePageLoadTime,
    averageSessionDuration,
    fastestPageLoad: pageLoadTimes.length > 0 ? Math.min(...pageLoadTimes) : 0,
    slowestPageLoad: pageLoadTimes.length > 0 ? Math.max(...pageLoadTimes) : 0,
    totalPageLoads: pageLoadTimes.length
  };
}

// Enhanced Analytics Functions
function analyzeTimePatterns(data) {
  const timeSlots = {
    '00-06': 0, '06-12': 0, '12-18': 0, '18-24': 0
  };
  
  // Analyze page visits by time
  Object.values(data.pages || {}).forEach(page => {
    page.visits?.forEach(visit => {
      const hour = new Date(visit.timestamp).getHours();
      if (hour >= 0 && hour < 6) timeSlots['00-06']++;
      else if (hour >= 6 && hour < 12) timeSlots['06-12']++;
      else if (hour >= 12 && hour < 18) timeSlots['12-18']++;
      else timeSlots['18-24']++;
    });
  });
  
  // Analyze clicks by time
  Object.values(data.clicks || {}).forEach(click => {
    click.clicks?.forEach(clickEvent => {
      const hour = new Date(clickEvent.timestamp).getHours();
      if (hour >= 0 && hour < 6) timeSlots['00-06']++;
      else if (hour >= 6 && hour < 12) timeSlots['06-12']++;
      else if (hour >= 12 && hour < 18) timeSlots['12-18']++;
      else timeSlots['18-24']++;
    });
  });
  
  return {
    timeSlots,
    peakHour: Object.entries(timeSlots).reduce((max, [hour, count]) => 
      count > max.count ? { hour, count } : max, { hour: '', count: 0 }
    )
  };
}

function analyzeGeographicData(data) {
  const locations = [];
  
  Object.values(data.deviceinfo || {}).forEach(device => {
    if (device.location) {
      locations.push({
        lat: device.location.latitude,
        lng: device.location.longitude,
        timestamp: device.createdAt
      });
    }
  });
  
  return {
    totalLocations: locations.length,
    uniqueLocations: [...new Set(locations.map(l => `${l.lat},${l.lng}`))].length,
    locations
  };
}

function analyzeSessionPatterns(data) {
  const sessions = {};
  
  Object.values(data.userjourney || {}).forEach(journey => {
    const date = new Date(journey.startTime).toDateString();
    if (!sessions[date]) sessions[date] = [];
    sessions[date].push(journey);
  });
  
  return {
    totalSessions: Object.values(data.userjourney || {}).length,
    sessionsByDate: sessions,
    averageSessionsPerDay: Object.keys(sessions).length > 0 ? 
      Object.values(data.userjourney || {}).length / Object.keys(sessions).length : 0
  };
}

function analyzeConversionFunnel(data) {
  const routes = [];
  
  Object.values(data.userjourney || {}).forEach(journey => {
    routes.push(...journey.routes);
  });
  
  const routeFrequency = {};
  routes.forEach(route => {
    routeFrequency[route] = (routeFrequency[route] || 0) + 1;
  });
  
  return {
    mostCommonEntryPoint: Object.entries(routeFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A',
    routeFrequency,
    totalRouteTransitions: routes.length
  };
}

function generateInsights(data) {
  const insights = [];
  
  // Page insights
  const pages = data.pages || {};
  if (Object.keys(pages).length > 0) {
    const mostVisitedPage = Object.entries(pages).reduce((max, [page, data]) => {
      return (data.visits?.length || 0) > (max.visits?.length || 0) ? { page, ...data } : max;
    }, { page: '', visits: [] });
    
    if (mostVisitedPage.page) {
      insights.push({
        type: 'page',
        message: `Most visited page: ${mostVisitedPage.page} with ${mostVisitedPage.visits?.length || 0} visits`,
        priority: 'high'
      });
    }
  }
  
  // Click insights
  const clicks = data.clicks || {};
  if (Object.keys(clicks).length > 0) {
    const mostClickedButton = Object.entries(clicks).reduce((max, [button, data]) => {
      return (data.clickCount || 0) > (max.clickCount || 0) ? { button, ...data } : max;
    }, { button: '', clickCount: 0 });
    
    if (mostClickedButton.button) {
      insights.push({
        type: 'click',
        message: `Most clicked button: ${mostClickedButton.button} with ${mostClickedButton.clickCount} clicks`,
        priority: 'medium'
      });
    }
  }
  
  // Device insights
  const devices = data.deviceinfo || {};
  if (Object.keys(devices).length > 0) {
    const deviceEntries = Object.values(devices);
    const platforms = {};
    deviceEntries.forEach(device => {
      const platform = device.platform || 'Unknown';
      platforms[platform] = (platforms[platform] || 0) + 1;
    });
    
    const mostCommonPlatform = Object.entries(platforms).reduce((max, [platform, count]) => {
      return count > max.count ? { platform, count } : max;
    }, { platform: '', count: 0 });
    
    if (mostCommonPlatform.platform) {
      insights.push({
        type: 'device',
        message: `Most common platform: ${mostCommonPlatform.platform} (${mostCommonPlatform.count} users)`,
        priority: 'low'
      });
    }
  }
  
  // Journey insights
  const journeys = data.userjourney || {};
  if (Object.keys(journeys).length > 0) {
    const journeyEntries = Object.values(journeys);
    const averageJourneyDuration = Math.round(
      journeyEntries.reduce((sum, journey) => sum + (journey.duration || 0), 0) / journeyEntries.length
    );
    
    insights.push({
      type: 'journey',
      message: `Average user journey duration: ${averageJourneyDuration} seconds`,
      priority: 'medium'
    });
  }
  
  return insights;
}


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
