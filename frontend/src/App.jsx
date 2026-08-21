import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Route protector for authenticated sessions
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('vibebench_token')
  return token ? children : <Navigate to="/login" replace />
}

// Route protector for anonymous sessions
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('vibebench_token')
  return token ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
