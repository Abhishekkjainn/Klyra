import { useState } from 'react'
import './App.css'
import Header from './components/header'

import Actions from './components/actions'

import Homepage from './homepage'
import { BrowserRouter, Routes, Route,Link } from 'react-router-dom';
import Signup from './pages/signup'
import Login from './pages/login'
import Dashboard from './pages/dashboard'

function App() {

  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        {/* Add more routes here as needed */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
