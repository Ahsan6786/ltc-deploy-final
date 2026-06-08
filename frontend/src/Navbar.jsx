import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu, Sun, X } from 'lucide-react'

const navLinksData = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about', dropdown: [
    { title: 'What is LTC', anchor: '#What-is-LTC' },
    { title: 'Roots at MIT-WPU', anchor: '#Root-at-MIT-WPU' },
    { title: 'Philosophy: Soil to Soul', anchor: '#Philosophy-Soil-to-Soul' },
    { title: 'The Sacred Yajña', anchor: '#The-Sacred-Yajna' },
    { title: 'Anubhavāmṛta Sevita', anchor: '#Anubhavamrta-Sevita' },
    { title: 'Rooted in Bharat', anchor: '#Rooted-in-Bharat' },
    { title: 'The Birth of a Movement', anchor: '#The-Birth-of-Movement' },
    { title: 'NEP 2020', anchor: '#NEP-2020' }
  ]},
  { name: 'Program', path: '/programs', dropdown: [
    { title: 'What is LRP', anchor: '#What-is-LRP' },
    { title: 'Program Pedagogy', anchor: '#Program-Pedagogy' },
    { title: 'Experiential Learning', anchor: '#Experiential-Learning' }
  ]},
  { name: 'Five Pillars', path: '/five-pillars', dropdown: [
    { title: 'Agriculture & Nature', anchor: '#Agriculture-Nature' },
    { title: 'Physical Fitness & Sports', anchor: '#Physical-Fitness-Sports' },
    { title: 'Team Building & Leadership', anchor: '#Team-Building-Leadership' },
    { title: 'Patriotism & Nation Building', anchor: '#Patriotism-Nation-Building' },
    { title: 'Spirituality & Peace', anchor: '#Spirituality-Peace' }
  ]},
  { name: 'Campus', path: '/campus', dropdown: [
    { title: 'Learning & Reflection Spaces', anchor: '#Learning-Reflection-Spaces' },
    { title: 'Spaces for Inner & Outer Growth', anchor: '#Spaces-Inner-Outer-Growth' },
    { title: 'Living & Wellness Facilities', anchor: '#Living-Wellness-Facilities' },
    { title: 'Map Zone 2', anchor: '#Map-Zone-2' }
  ]}
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (token && user) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      fetch(`${apiBase}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          throw new Error('API error');
        }
        return res.json();
      })
      .then(data => {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(err => {
        console.error('Auth verification failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
  }, [token]);

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.substring(1));
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    return `/${user.role}`
  }

  const NavLinks = ({ mobile = false }) => (
    <div className={`nav-links ${mobile ? 'active' : ''}`}>
      {navLinksData.map(link => (
        <div key={link.name} className="nav-item-wrapper" style={{ position: 'relative' }}>
          <Link to={link.path} className="nav-link-item" onClick={() => mobile && setIsMenuOpen(false)}>
            {link.name}
          </Link>
          {link.dropdown && !mobile && (
            <div className="dropdown-menu">
              {link.dropdown.map(item => (
                <Link 
                  key={item.title} 
                  to={`${link.path}${item.anchor}`} 
                  className="dropdown-item"
                  onClick={() => mobile && setIsMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {user ? (
        <>
          <Link to={getDashboardLink()} className="nav-link-item" onClick={() => mobile && setIsMenuOpen(false)}>Dashboard</Link>
          <button onClick={handleLogout} className="btn-logout-icon" title="Logout">
            <LogOut size={18} />
          </button>
        </>
      ) : (
        <Link to="/login" className="nav-login-btn" onClick={() => mobile && setIsMenuOpen(false)}>Login</Link>
      )}
    </div>
  );

  const allowedPaths = ['/', '/about', '/programs', '/five-pillars', '/campus'];
  if (!allowedPaths.includes(location.pathname)) {
    return null
  }

  return (
    <>
      {/* Dark Overlay when menu is open */}
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 999, 
          opacity: isMenuOpen ? 1 : 0,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease'
        }} 
        onClick={() => setIsMenuOpen(false)} 
      />

      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="navbar-brand">
            <img src="/ltc.png" alt="LTC Logo" style={{ height: '40px' }} />
          </div>
        </Link>

        {/* Desktop Links */}
        {!isMobile && <NavLinks />}

        <div className="menu-icon" style={{ zIndex: 2001, position: 'relative' }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} color="#ffffff" /> : <Menu size={24} color="#0f172a" />}
        </div>
      </nav>

      {/* Mobile Links */}
      {isMobile && isMenuOpen && <NavLinks mobile={true} />}
    </>
  )
}
