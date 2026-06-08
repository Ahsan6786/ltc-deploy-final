import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, ArrowLeft, Mail, Lock, ChevronRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      navigate(`/${data.user.role}`)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-minimal-container" style={{ overflow: 'hidden' }}>
      {/* Background Watermarks */}
      <img src="/pattern2.png" alt="" style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', opacity: 0.05, pointerEvents: 'none' }} />
      <img src="/pattern2.png" alt="" style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '250px', opacity: 0.05, pointerEvents: 'none', transform: 'rotate(180deg)' }} />

      <Link to="/" style={{ position: 'fixed', top: '40px', left: '40px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '14px' }}>
        <ArrowLeft size={18} /> Back to Site
      </Link>
      
      <div className="login-minimal-card animate-fade-in" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/ltc.png" alt="LTC Logo" style={{ height: '60px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.5px' }}>Welcome Back</h1>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>LTC Management Portal</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '12px', color: '#b91c1c', marginBottom: '24px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
            <div className="pill-input-container">
              <Mail className="pill-input-icon" size={20} />
              <input 
                type="email" 
                className="pill-input" 
                placeholder="admin@ltc.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <a href="#" style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textDecoration: 'none', textTransform: 'uppercase' }}>Forgot?</a>
            </div>
            <div className="pill-input-container">
              <Lock className="pill-input-icon" size={20} />
              <input 
                type="password" 
                className="pill-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn-pill" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                Sign In <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Need Access? <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact System Admin</a>
          </p>
        </div>
      </div>
      
      <div style={{ position: 'fixed', bottom: '40px', width: '100%', textAlign: 'center' }}>
         <p style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
           © 2026 Life Transformation Centre
         </p>
      </div>
    </div>
  )
}
