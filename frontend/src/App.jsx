import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

// Lazy loaded page components
const Home = lazy(() => import('./Home'))
const Login = lazy(() => import('./Login'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const FacultyDashboard = lazy(() => import('./FacultyDashboard'))
const StudentDashboard = lazy(() => import('./StudentDashboard'))
const FoundersMessage = lazy(() => import('./FoundersMessage'))
const About = lazy(() => import('./About'))
const Programs = lazy(() => import('./Programs'))
const FivePillars = lazy(() => import('./FivePillars'))
const Campus = lazy(() => import('./Campus'))
const VerifySlip = lazy(() => import('./VerifySlip'))
const LtcMemberDashboard = lazy(() => import('./LtcMemberDashboard'))

// Error boundary to catch route loading issues (e.g., while offline)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Unable to load page</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Please check your internet connection and try reloading the page.</p>
          <button className="btn" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Simple fallback loading indicator
function LoadingFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

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
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
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
            </Suspense>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </>
  )
}
