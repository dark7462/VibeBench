import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Route protector for authenticated sessions
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('vibebench_token')
  return token ? children : <Navigate to="/login" replace />
}

// Route protector for anonymous sessions (redirects authenticated users away from Login)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('vibebench_token')
  return token ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <Router>
      <div className="background-glows">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
