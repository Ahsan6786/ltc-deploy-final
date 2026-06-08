import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './Home'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import FacultyDashboard from './FacultyDashboard'
import StudentDashboard from './StudentDashboard'
import Navbar from './Navbar'
import FoundersMessage from './FoundersMessage'
import About from './About'
import Programs from './Programs'
import FivePillars from './FivePillars'
import Campus from './Campus'
import VerifySlip from './VerifySlip'
import LtcMemberDashboard from './LtcMemberDashboard'

function ScrollToTopOnRoute() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(window.location.pathname === '/')
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!showSplash) return

    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setShowSplash(false)
      }, 500)
    }, 1500)
    return () => clearTimeout(timer)
  }, [showSplash])

  return (
    <>
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0A082C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: fadeOut ? 'none' : 'auto'
        }}>
          <picture>
            <source media="(max-width: 768px) and (orientation: portrait)" srcSet="/splamob.png" />
            <img src="/spla.png" alt="Splash Logo" style={{ width: '100vw', height: '100vh', objectFit: 'cover' }} />
          </picture>
        </div>
      )}
      <BrowserRouter>
        <ScrollToTopOnRoute />
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/five-pillars" element={<FivePillars />} />
            <Route path="/campus" element={<Campus />} />
            <Route path="/founders-message" element={<FoundersMessage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/ltc_member" element={<LtcMemberDashboard />} />
            <Route path="/verify" element={<VerifySlip />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  )
}
