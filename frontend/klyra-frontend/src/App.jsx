import { useEffect, useState } from 'react';
import './App.css';
import Homepage from './homepage';
import { BrowserRouter, Routes, Route,Link } from 'react-router-dom';
import Signup from './pages/signup';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import { useUserJourneyAnalytics, sendDeviceInfoAnalytics, useActiveUserTracker } from './functions';
import usePageAnalytics from './functions';
import AddFunctions from './pages/addfunctions';
import Documentation from './pages/documentation';


function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);


  const refreshSession = () => {
    setSessionLoading(true);
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      setUser(null);
      setSessionLoading(false);
      return;
    }
    fetch('https://klyra-backend.vercel.app/check-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.name) {
          setUser({ ...data.user, sessionId });
        } else {
          setUser(null);
        }
        setSessionLoading(false);
      })
      .catch(() => {
        setUser(null);
        setSessionLoading(false);
      });
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // useUserJourneyAnalytics({ apikey: user?.apikey, enabled: !!user });
  // useEffect(() => {
  //   if (user?.apikey) {
  //     sendDeviceInfoAnalytics({ apikey: user.apikey, getLocation: true });
  //   }
  // }, [user?.apikey]);

  // useActiveUserTracker({
  //   apikey: user?.apikey,
  //   enabled: !!user
  // });

  

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Homepage user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />} />
        <Route path="/signup" element={<Signup user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />}/>
        <Route path="/login" element={<Login user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />}/>
        <Route path="/dashboard" element={<Dashboard user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />}/>
        <Route path="/addfunctions" element={<AddFunctions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />}/>
        <Route path="/documentation" element={<Documentation user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />}/>
        {/* Add more routes here as needed */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
