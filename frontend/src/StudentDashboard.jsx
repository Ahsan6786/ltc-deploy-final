import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ClipboardList, PenTool, LayoutDashboard, Flag, Search, LogOut, MessageSquare, Bell, Menu, Clock } from 'lucide-react'
import ScrollToTop from './ScrollToTop'
import TimetablePanel from './TimetablePanel'


export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [myData, setMyData] = useState({})
  const [schedules, setSchedules] = useState([])
  const [attendance, setAttendance] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [scheduleSearch, setScheduleSearch] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('General')
  const [additionalNotes, setAdditionalNotes] = useState('')
  
  const filteredSchedules = schedules.filter(s => 
    s.title.toLowerCase().includes(scheduleSearch.toLowerCase()) || 
    s.date.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
    s.time.toLowerCase().includes(scheduleSearch.toLowerCase())
  )

  const [readScheduleIds, setReadScheduleIds] = useState(() => {
    return JSON.parse(localStorage.getItem('readScheduleIds') || '[]')
  })
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const unreadSchedules = schedules.filter(s => !readScheduleIds.includes(s.id))
  const unreadCount = unreadSchedules.length

  const markAsRead = (id) => {
    const updated = [...readScheduleIds, id]
    setReadScheduleIds(updated)
    localStorage.setItem('readScheduleIds', JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    const allIds = schedules.map(e => e.id)
    setReadScheduleIds(allIds)
    localStorage.setItem('readScheduleIds', JSON.stringify(allIds))
  }

  const getCountdown = (dateStr, timeStr) => {
    try {
      const eventDate = new Date(`${dateStr}T${timeStr}`)
      const now = new Date()
      const diff = eventDate - now
      
      if (diff <= 0) return 'Started'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    } catch (e) {
      return 'N/A'
    }
  }

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackText.trim()) return alert('Please enter feedback.')
    try {
      const res = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          feedback_text: feedbackText,
          category: feedbackCategory,
          additional_notes: additionalNotes
        })
      })
      if (res.ok) {
        alert('Feedback submitted successfully!')
        setFeedbackText('')
        setFeedbackCategory('General')
        setAdditionalNotes('')
      }
    } catch (err) {
      alert('Failed to submit feedback.')
    }
  }

  const renderNotifications = () => (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsNotifOpen(!isNotifOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
            {unreadCount}
          </span>
        )}
      </button>
      {isNotifOpen && (
        <div style={{ position: 'absolute', top: '45px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {currentUser.red_flag && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#fef2f2', position: 'relative' }}>
                <div style={{ width: '8px', height: '8px', background: '#e53e3e', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#e53e3e', margin: '0 0 4px 0' }}>Alert</p>
                  <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0 }}>You are red flagged by faculty.</p>
                </div>
              </div>
            )}
            {schedules.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No upcoming events.
              </div>
            ) : (
              schedules.map(e => {
                const isRead = readScheduleIds.includes(e.id)
                return (
                  <div key={e.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'flex-start', background: isRead ? 'transparent' : '#f8fafc', position: 'relative' }}>
                    {!isRead && (
                      <div style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                    )}
                    <div style={{ flex: 1, paddingLeft: isRead ? '20px' : '0' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>{e.title || 'Event'}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{e.date} at {e.time}</p>
                      <p style={{ fontSize: '11px', color: '#e53e3e', fontWeight: '700', marginTop: '4px' }}>
                        ⏳ Starts in: {getCountdown(e.date, e.time)}
                      </p>
                    </div>
                    {!isRead && (
                      <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }} onClick={() => markAsRead(e.id)}>
                        Read
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login')
      return
    }
    fetchDashboardData()

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/student/dashboard', { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }
      const data = await res.json()
      if (res.ok) setMyData(data.data || {})

      const schedRes = await fetch('http://localhost:5001/api/student/schedules', { headers: { 'Authorization': `Bearer ${token}` } })
      const schedData = await schedRes.json()
      if (schedRes.ok) setSchedules(schedData.schedules || [])

      const attRes = await fetch('http://localhost:5001/api/student/attendance', { headers: { 'Authorization': `Bearer ${token}` } })
      const attData = await attRes.json()
      if (attRes.ok) setAttendance(attData.attendance || [])

      const evalRes = await fetch('http://localhost:5001/api/student/evaluations', { headers: { 'Authorization': `Bearer ${token}` } })
      const evalData = await evalRes.json()
      if (evalRes.ok) setEvaluations(evalData.evaluations || [])

    } catch (err) {
      console.error('Failed to fetch student data', err)
    }
  }

  const needsGate = myData.in_current_batch && (!myData.undertaking_submitted || !myData.insured);

  if (needsGate) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '650px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '40px',
          color: '#ffffff'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', marginBottom: '16px' }}>
              <ClipboardList size={32} style={{ color: '#6366f1' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>LTC Onboarding Gate</h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.5', margin: '8px 0 0 0' }}>
              Congratulations! You have been selected for the active LTC batch. Before you can access your dashboard, you must submit your insurance details and sign the undertaking form.
            </p>
          </div>

          {/* Progress / Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ 
              background: myData.insured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.05)', 
              border: myData.insured ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 4px 0' }}>Insurance Status</p>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: myData.insured ? '#22c55e' : '#ef4444' }}>
                {myData.insured ? 'Completed ✓' : 'Pending Action'}
              </h4>
            </div>
            <div style={{ 
              background: myData.undertaking_submitted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.05)', 
              border: myData.undertaking_submitted ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: '16px', padding: '16px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: '0 0 4px 0' }}>Undertaking Status</p>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: myData.undertaking_submitted ? '#22c55e' : '#ef4444' }}>
                {myData.undertaking_submitted ? 'Completed ✓' : 'Pending Action'}
              </h4>
            </div>
          </div>

          {/* Form 1: Insurance Details */}
          {!myData.insured ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                Submit Insurance Details
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const provider = e.target.elements.provider.value.trim();
                const policyNumber = e.target.elements.policyNumber.value.trim();
                if (!provider || !policyNumber) return alert('Please enter both Insurance Provider and Policy Number.');
                try {
                  const res = await fetch('http://localhost:5001/api/student/submit-insurance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ provider, policy_number: policyNumber })
                  });
                  if (res.ok) {
                    alert('Insurance details submitted successfully!');
                    fetchDashboardData();
                  } else {
                    const errD = await res.json();
                    alert(errD.message || 'Failed to submit insurance details.');
                  }
                } catch (err) {
                  alert('Error submitting insurance details.');
                }
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Insurance Provider</label>
                  <input type="text" name="provider" placeholder="e.g. Star Health / LIC / HDFC Ergo" required 
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Policy / Certificate Number</label>
                  <input type="text" name="policyNumber" placeholder="e.g. POL123456789" required
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
                <button type="submit" className="btn" style={{ background: '#6366f1', color: 'white', width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  Save & Submit Insurance
                </button>
              </form>
            </div>
          ) : null}

          {/* Form 2: Undertaking */}
          {myData.insured && !myData.undertaking_submitted ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                Sign LTC Undertaking Form
              </h3>
              <div style={{ 
                maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', 
                borderRadius: '8px', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '700' }}>UNDERTAKING & CODE OF CONDUCT FOR LTC</p>
                <p style={{ margin: 0 }}>
                  I hereby solemnly declare and undertake that I will adhere to all the rules, guidelines, and disciplinary standard practices set forth by the LTC program coordinators. I acknowledge that I am solely responsible for my conduct, health, and belongings during the LTC batch. Any acts of insubordination or violation of rules will lead to immediate expulsion from the course and red flagging in the student database.
                </p>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const signedName = e.target.elements.signedName.value.trim();
                const agreed = e.target.elements.agreed.checked;
                if (!agreed) return alert('You must check the box to agree to the terms.');
                if (!signedName) return alert('Please enter your full name as signature.');
                
                try {
                  const res = await fetch('http://localhost:5001/api/student/submit-undertaking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ signedName, signedDate: new Date().toLocaleDateString() })
                  });
                  if (res.ok) {
                    alert('Undertaking signed and submitted successfully!');
                    fetchDashboardData();
                  } else {
                    const errD = await res.json();
                    alert(errD.message || 'Failed to submit undertaking.');
                  }
                } catch (err) {
                  alert('Error submitting undertaking.');
                }
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                  <input type="checkbox" name="agreed" id="agreed" required style={{ marginTop: '3px' }} />
                  <label htmlFor="agreed" style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                    I agree to the LTC undertaking, rules, and code of conduct.
                  </label>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Full Name (Digital Signature)</label>
                  <input type="text" name="signedName" placeholder="Type your full name to sign" required
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                </div>
                <button type="submit" className="btn" style={{ background: '#6366f1', color: 'white', width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  Sign & Submit Undertaking
                </button>
              </form>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }} onClick={handleLogout}>
              Logout
            </button>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Step {myData.insured ? '2 of 2' : '1 of 2'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      {isMobile && isSidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="sidebar" style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, bottom: 0, zIndex: 1000,
        transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh'
      }}>
        {/* Header */}
        <div className="sidebar-header">
          {isMobile && (
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
          )}
          <img src="/ltc.png" alt="LTC Logo" className="sidebar-logo" />
          <p className="sidebar-portal-label">Student Portal</p>
          <p className="sidebar-sub-label">{currentUser?.panel ? `Panel ${currentUser.panel}` : 'Student'}</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">My Space</p>
          <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsSidebarOpen(false); }}>
            <Flag size={16} /> My Overview
          </button>
          <button className={`sidebar-item ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => { setActiveTab('schedules'); if (isMobile) setIsSidebarOpen(false); }}>
            <Calendar size={16} /> Activity Schedule
          </button>
          <button className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('timetable'); if (isMobile) setIsSidebarOpen(false); }}>
            <Clock size={16} /> Immersion Timetable
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">Performance</p>
          <button className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); if (isMobile) setIsSidebarOpen(false); }}>
            <ClipboardList size={16} /> My Attendance
          </button>
          <button className={`sidebar-item ${activeTab === 'evaluations' ? 'active' : ''}`} onClick={() => { setActiveTab('evaluations'); if (isMobile) setIsSidebarOpen(false); }}>
            <PenTool size={16} /> Evaluations & Marks
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">Support</p>
          <button className={`sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => { setActiveTab('feedback'); if (isMobile) setIsSidebarOpen(false); }}>
            <MessageSquare size={16} /> Submit Feedback
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-item logout" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, padding: isMobile ? '10px' : '30px' }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setIsSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 style={{ fontSize: '18px', margin: 0 }}>Student Portal</h1>
            </div>
            {renderNotifications()}
          </div>
        )}
        <div className="dashboard-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>
              {currentUser.division ? `Division: ${currentUser.division} | ` : ''} 
              {currentUser.school ? `School: ${currentUser.school} | ` : ''} 
              Department: {currentUser.department}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {!isMobile && renderNotifications()}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Flag className="text-secondary" /> Academic Profile
            </h2>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Name</p>
                <h3 style={{ fontSize: '18px', marginTop: '4px' }}>{currentUser.name}</h3>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Panel Designation</p>
                <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginTop: '4px' }}>{currentUser.panel || 'Unassigned'}</h3>
              </div>
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Semester</p>
                <h3 style={{ fontSize: '18px', marginTop: '4px' }}>{myData.semester || 'N/A'}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <TimetablePanel />
        )}

        {activeTab === 'schedules' && (

          <div className="glass-card animate-fade-in">
             <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar className="text-primary" /> My Activity Schedule
            </h2>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Date</th><th>Time</th></tr></thead>
              <tbody>
                {filteredSchedules.map(s => (
                  <tr key={s.id}><td>{s.title}</td><td>{s.date}</td><td>{s.time}</td></tr>
                ))}
                {schedules.length === 0 && <tr><td colSpan="3" style={{textAlign:'center'}}>No activities scheduled.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="glass-card animate-fade-in">
             <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ClipboardList className="text-secondary" /> Attendance Records
            </h2>
            <table className="data-table">
              <thead><tr><th>Activity Title</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i}>
                    <td>{a.title}</td>
                    <td>{a.date}</td>
                    <td>
                      <span className={`badge ${a.status === 'Present' ? 'badge-student' : 'badge-admin'}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan="3" style={{textAlign:'center'}}>No attendance recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div className="glass-card animate-fade-in">
             <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PenTool className="text-primary" /> My Evaluations / Rubric Results
            </h2>
            <table className="data-table">
              <thead><tr><th>Activity</th><th>Marks (0-100)</th><th>Remarks / Feedback</th><th>Report File</th><th>Photo Evidence</th></tr></thead>
              <tbody>
                {evaluations.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.activity_title || 'N/A'}</strong></td>
                    <td><strong>{e.marks}</strong></td>
                    <td>{e.remarks}</td>
                    <td>{e.report_url ? <a href={e.report_url} target="_blank" rel="noreferrer" style={{color:'var(--primary)'}}>View Report</a> : 'No Report'}</td>
                    <td>{e.photo_url ? <a href={e.photo_url} target="_blank" rel="noreferrer" style={{color:'var(--primary)'}}>View Photo</a> : 'No Photo'}</td>
                  </tr>
                ))}
                {evaluations.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No evaluations found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageSquare className="text-primary" size={28} /> Share Your Feedback
            </h2>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>
              Your feedback is valuable and helps us improve the platform.
            </p>
            
            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="input-field" 
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    style={{ paddingLeft: '40px', marginBottom: 0 }}
                  >
                    <option value="General">General Feedback</option>
                    <option value="Academics">Academic Programs</option>
                    <option value="Facilities">Campus Facilities</option>
                    <option value="Support">Student Support</option>
                  </select>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Message</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '160px', borderRadius: '12px', padding: '16px', marginBottom: 0 }}
                  placeholder="Tell us what you think, suggest improvements, or report issues..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Additional Notes</label>
                <input 
                  type="text"
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  placeholder="Any extra details or quick notes..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', alignSelf: 'flex-start', background: '#0A082C', color: 'white' }}>
                Submit Feedback
              </button>
            </form>
          </div>
        )}

      </div>
      <ScrollToTop />
    </div>
  )
}
