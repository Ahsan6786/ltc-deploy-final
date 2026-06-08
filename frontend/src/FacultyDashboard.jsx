import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Calendar, CheckSquare, FileText, Activity, LayoutDashboard, ClipboardList, PenTool, Search, LogOut, MessageSquare, Users, Bell, Menu, Clock } from 'lucide-react'
import ScrollToTop from './ScrollToTop'
import TimetablePanel from './TimetablePanel'


export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [documents, setDocuments] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [facultyInfo, setFacultyInfo] = useState(null)
  const [squadLeader, setSquadLeader] = useState(null)
  const [squadStudents, setSquadStudents] = useState([])

  const [scheduleForm, setScheduleForm] = useState({ title: '', date: '', time: '', panel: 'PA' })
  const [evalForm, setEvalForm] = useState({ student_id: '', schedule_id: '', marks: '', remarks: '', marking_scheme: '' })
  const [evalSubmitting, setEvalSubmitting] = useState(false)
  const [submittingStudentId, setSubmittingStudentId] = useState(null)
  const [selectedMarkings, setSelectedMarkings] = useState({}) // pending selection per studentId
  const [savedEvals, setSavedEvals] = useState({})             // confirmed saved per studentId
  const [allEvaluations, setAllEvaluations] = useState([])     // all fetched evaluations
  const [studentSearch, setStudentSearch] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('General')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [readDocumentIds, setReadDocumentIds] = useState(() => {
    return JSON.parse(localStorage.getItem('readDocumentIds') || '[]')
  })
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [selectedEvalScheduleId, setSelectedEvalScheduleId] = useState('')
  const [selectedEvalStudent, setSelectedEvalStudent] = useState(null)
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

  const unreadDocuments = documents.filter(d => !readDocumentIds.includes(d.id))
  const unreadCount = unreadDocuments.length

  const markAsRead = (id) => {
    const updated = [...readDocumentIds, id]
    setReadDocumentIds(updated)
    localStorage.setItem('readDocumentIds', JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    const allIds = documents.map(d => d.id)
    setReadDocumentIds(allIds)
    localStorage.setItem('readDocumentIds', JSON.stringify(allIds))
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
            {documents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No documents available.
              </div>
            ) : (
              documents.map(d => {
                const isRead = readDocumentIds.includes(d.id)
                return (
                  <div
                    key={d.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      background: isRead ? 'transparent' : '#f8fafc',
                      position: 'relative'
                    }}
                  >
                    {!isRead && (
                      <div style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                    )}
                    <div style={{ flex: 1, paddingLeft: isRead ? '20px' : '0' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>{d.name}</p>
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>View Document</a>
                    </div>
                    {!isRead && (
                      <button
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => markAsRead(d.id)}
                      >
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

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.panel && s.panel.toLowerCase().includes(studentSearch.toLowerCase()))
  )

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isPrimary = currentUser.is_primary === true || currentUser.is_primary === 'true'

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

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'faculty') {
      navigate('/login')
      return
    }
    fetchDashboardData()

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedEvalScheduleId && allEvaluations.length > 0) {
      const currentSchedEvals = allEvaluations.filter(e => String(e.schedule_id) === String(selectedEvalScheduleId));
      const newSaved = {};
      currentSchedEvals.forEach(e => {
        newSaved[e.student_id] = e.marking_scheme;
      });
      setSavedEvals(newSaved);
    } else {
      setSavedEvals({});
    }
  }, [selectedEvalScheduleId, allEvaluations]);

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
    })
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')
      return null
    }
    return res
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch assigned students
      const res = await apiFetch('http://localhost:5001/api/faculty/dashboard')
      if (!res) return
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || [])
        setFacultyInfo(data.facultyInfo || null)
        setSquadLeader(data.squadLeader || null)
        setSquadStudents(data.squadStudents || [])
      }

      // Fetch Schedules
      const schedRes = await apiFetch('http://localhost:5001/api/schedules')
      if (!schedRes) return
      const schedData = await schedRes.json()
      if (schedRes.ok) setSchedules(schedData.schedules || [])

      // Fetch docs
      const docRes = await apiFetch('http://localhost:5001/api/documents')
      if (!docRes) return
      const docData = await docRes.json()
      if (docRes.ok) setDocuments(docData.documents || [])

      // Fetch attendance
      const attRes = await apiFetch('http://localhost:5001/api/faculty/attendance_records')
      if (!attRes) return
      const attData = await attRes.json()
      if (attRes.ok) setAttendanceRecords(attData.records || [])

      // Fetch evaluations
      const evalRes = await apiFetch('http://localhost:5001/api/faculty/evaluations')
      if (!evalRes) return
      const evalData = await evalRes.json()
      if (evalRes.ok) setAllEvaluations(evalData.evaluations || [])

    } catch (err) {
      console.error('Failed to fetch faculty data', err)
    }
  }

  // Primary Actions
  const handleAssignPanel = async (student_id, panel) => {
    try {
      const res = await fetch('http://localhost:5001/api/faculty/assign-panel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id, panel })
      })
      if (res.ok) {
        alert('Panel updated successfully')
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:5001/api/faculty/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(scheduleForm)
      })
      if (res.ok) {
        alert('Schedule created')
        setScheduleForm({ title: '', date: '', time: '', panel: 'PA' })
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleGenerate7DaySchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      alert("Please select a start date and time first.");
      return;
    }

    const startDate = new Date(scheduleForm.date);

    try {
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        let title = '';
        if (i < 3) {
          title = `RUIP - Day ${i + 1}`;
        } else {
          title = `LTC - Day ${i - 2}`;
        }

        await fetch('http://localhost:5001/api/faculty/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title,
            date: dateString,
            time: scheduleForm.time,
            panel: scheduleForm.panel
          })
        });
      }

      alert('7-Day Schedule successfully generated.');
      setScheduleForm({ title: '', date: '', time: '', panel: 'PA' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error generating 7-day schedule');
    }
  }

  const handleMarkAttendance = async (student_id, schedule_id, status) => {
    try {
      const res = await fetch('http://localhost:5001/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ schedule_id, student_id, status })
      })
      if (res.ok) {
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleMarkAllPresent = async () => {
    if (!selectedScheduleId) {
      alert('Please select an activity first.')
      return
    }

    const selectedSchedule = schedules.find(s => s.id === parseInt(selectedScheduleId))
    if (!selectedSchedule) return

    const unmarked = []
    filteredStudents.forEach(st => {
      if (selectedSchedule) {
        const existingRecord = attendanceRecords.find(a => a.student_id === st.id && a.schedule_id === selectedSchedule.id)
        if (!existingRecord) {
          unmarked.push({ student_id: st.id, schedule_id: selectedSchedule.id })
        }
      }
    })

    if (unmarked.length === 0) {
      alert('All students are already marked for this activity.')
      return
    }

    if (!window.confirm(`Mark ${unmarked.length} students as Present for "${selectedSchedule.title}"?`)) return

    for (const item of unmarked) {
      try {
        await fetch('http://localhost:5001/api/faculty/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ student_id: item.student_id, schedule_id: item.schedule_id, status: 'Present' })
        })
      } catch (err) { }
    }
    fetchDashboardData()
  }

  const handleToggleRedFlag = async (studentId) => {
    try {
      const res = await fetch('http://localhost:5001/api/faculty/toggle-red-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId })
      })
      const data = await res.json()
      if (res.ok) {
        setStudents(students.map(s => s.id === studentId ? { ...s, red_flag: data.red_flag } : s))
      } else {
        alert(data.message || 'Failed to toggle red flag')
      }
    } catch (err) {
      alert('Failed to toggle red flag')
    }
  }

  // Evaluation — save all pending
  const handleEvaluate = async () => {
    const studentIds = Object.keys(selectedMarkings).filter(id => selectedMarkings[id] && !savedEvals[id]);
    if (studentIds.length === 0) return;

    setEvalSubmitting(true);
    try {
      for (const studentId of studentIds) {
        const scheme = selectedMarkings[studentId];
        await fetch('http://localhost:5001/api/faculty/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            student_id: studentId,
            schedule_id: selectedEvalScheduleId,
            marking_scheme: scheme,
            marks: scheme === 'fully_done' ? 100 : scheme === 'partially_done' ? 50 : 0,
            remarks: scheme === 'fully_done' ? 'Fully completed' : scheme === 'partially_done' ? 'Partially completed' : 'Not done'
          })
        });
      }

      // Refresh evaluations
      const res = await apiFetch('http://localhost:5001/api/faculty/evaluations');
      if (res && res.ok) {
        const data = await res.json();
        setAllEvaluations(data.evaluations || []);
        setSelectedMarkings({}); // Clear pending
        alert('Evaluations saved and locked.');
      }
    } catch (err) {
      console.error('Evaluation failed', err);
      alert('Failed to save evaluations.');
    } finally {
      setEvalSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
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
          <p className="sidebar-portal-label">Faculty Portal</p>
          <p className="sidebar-sub-label">{isPrimary ? 'Primary Faculty' : 'Secondary Faculty'}</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Overview</p>
          <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsSidebarOpen(false); }}>
            <GraduationCap size={16} /> My Overview
          </button>
          <button className={`sidebar-item ${activeTab === 'nri' ? 'active' : ''}`} onClick={() => { setActiveTab('nri'); if (isMobile) setIsSidebarOpen(false); }}>
            <Users size={16} /> NRI Students
          </button>
          <button className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('timetable'); if (isMobile) setIsSidebarOpen(false); }}>
            <Clock size={16} /> Immersion Timetable
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">PERFORMANCE</p>
          <button className={`sidebar-item ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => { setActiveTab('schedules'); if (isMobile) setIsSidebarOpen(false); }}>
            <Calendar size={16} /> Activity Schedule
          </button>
          <button className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); if (isMobile) setIsSidebarOpen(false); }}>
            <ClipboardList size={16} /> My Attendance
          </button>
          <button className={`sidebar-item ${activeTab === 'evaluate' ? 'active' : ''}`} onClick={() => { setActiveTab('evaluate'); if (isMobile) setIsSidebarOpen(false); }}>
            <PenTool size={16} /> Evaluations & Marks
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">SUPPORT</p>
          <button className={`sidebar-item ${activeTab === 'guidelines' ? 'active' : ''}`} onClick={() => { setActiveTab('guidelines'); if (isMobile) setIsSidebarOpen(false); }}>
            <FileText size={16} /> Docs & Guidelines
          </button>
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
              <h1 style={{ fontSize: '18px', margin: 0 }}>Faculty Portal</h1>
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

        {activeTab === 'timetable' && (
          <TimetablePanel />
        )}

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            {/* Overview Detail Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
              
              {/* Faculty Profile Card */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faculty Profile</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{facultyInfo?.name || currentUser.name}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{facultyInfo?.email || currentUser.email}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px', fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>
                    <span>Department: <span style={{ color: '#475569', fontWeight: '500' }}>{facultyInfo?.department || currentUser.department || '-'}</span></span>
                    <span>School/Division: <span style={{ color: '#475569', fontWeight: '500' }}>{facultyInfo?.school || currentUser.school || '-'} / {facultyInfo?.division || currentUser.division || '-'}</span></span>
                    <span>Target Panel(s): <span style={{ color: '#475569', fontWeight: '500' }}>{facultyInfo?.panel || currentUser.panel || '-'}</span></span>
                  </div>
                </div>
              </div>

              {/* Squad Details Card */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocated Squad Details</span>
                </div>
                {facultyInfo?.squad ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{facultyInfo.squad}</span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>LTC Student Squad Allocation</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px', fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>
                      <span>Total Students: <span style={{ color: '#475569', fontWeight: '500' }}>{squadStudents.length}</span></span>
                      <span>Gender Ratio: <span style={{ color: '#475569', fontWeight: '500' }}>F: {squadStudents.filter(s => s.gender && s.gender.toLowerCase() === 'female').length} | M: {squadStudents.length - squadStudents.filter(s => s.gender && s.gender.toLowerCase() === 'female').length}</span></span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }}>
                      No Squad allocated yet.
                    </span>
                  </div>
                )}
              </div>

              {/* Squad Leader Card */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designated Squad Leader</span>
                </div>
                {squadLeader ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{squadLeader.name}</span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{squadLeader.email}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px', fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>
                      <span>PRN: <code style={{ color: '#0f172a', fontFamily: 'monospace' }}>{squadLeader.prn || '-'}</code></span>
                      <span>Phone: <code style={{ color: '#0f172a', fontFamily: 'monospace' }}>{squadLeader.phone || '-'}</code></span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }}>
                      No designated Squad Leader yet.
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Active Students Table Card */}
            <div className="glass-card">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap className="text-primary" /> Active Students
              </h2>

              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="input-field"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Panel</th><th>Type</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map(s => {
                      const isNri = s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes'
                      return (
                        <tr key={s.id}>
                          <td>#{s.id}</td>
                          <td>
                            {s.name}
                            {s.red_flag && (
                              <span style={{ marginLeft: '8px', color: '#e53e3e' }} title="Red Flagged">🚩</span>
                            )}
                          </td>
                          <td>{s.email}</td>
                          <td><strong>{s.panel || 'Unassigned'}</strong></td>
                          <td>
                            {isNri
                              ? <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>NRI</span>
                              : <span style={{ color: '#64748b', fontSize: '11px' }}>Regular</span>
                            }
                          </td>
                          <td>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', borderColor: s.red_flag ? '#e53e3e' : 'var(--border)', color: s.red_flag ? '#e53e3e' : 'var(--text-main)' }}
                              onClick={() => handleToggleRedFlag(s.id)}
                            >
                              {s.red_flag ? 'Remove Flag' : 'Red Flag'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {students.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nri' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users className="text-primary" /> NRI Students
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Filter view — NRI students appear in all other sections (attendance, evaluation, student list) as well.
            </p>

            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search NRI students..."
                className="input-field"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Panel</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredStudents.filter(s => s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes').map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{s.name}{s.red_flag && <span style={{ marginLeft: '8px', color: '#e53e3e' }}>🚩</span>}</td>
                      <td>{s.email}</td>
                      <td><strong>{s.panel || 'Unassigned'}</strong></td>
                      <td><span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>NRI</span></td>
                    </tr>
                  ))}
                  {filteredStudents.filter(s => s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes').length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No NRI students found. Upload students with <code>nri=yes</code> in the bulk upload.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar className="text-primary" /> Create Activity Schedule
            </h2>
            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '32px' }}>
              <input type="text" placeholder="Activity Title (Optional for 7-Day)" className="input-field" style={{ margin: 0 }} value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} />
              <input type="date" className="input-field" style={{ margin: 0 }} required value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
              <input type="time" className="input-field" style={{ margin: 0 }} required value={scheduleForm.time} onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} />
              <select className="input-field" style={{ margin: 0, width: isMobile ? '100%' : 'auto' }} value={scheduleForm.panel} onChange={e => setScheduleForm({ ...scheduleForm, panel: e.target.value })}>
                <option value="PA">Panel PA</option>
                <option value="PB">Panel PB</option>
                <option value="PC">Panel PC</option>
                <option value="PD">Panel PD</option>
                <option value="ALL">All Panels</option>
              </select>
              <button type="submit" className="btn" style={{ width: isMobile ? '100%' : 'auto' }}>Schedule</button>
              <button type="button" className="btn" style={{ background: 'var(--secondary)', width: isMobile ? '100%' : 'auto' }} onClick={handleGenerate7DaySchedule}>Generate 7-Days</button>
            </form>

            <h3 style={{ marginBottom: '16px' }}>Upcoming Activities</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Date</th><th>Time</th><th>Target Panel</th></tr></thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id}><td>{s.title}</td><td>{s.date}</td><td>{s.time}</td><td>{s.panel}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ClipboardList className="text-secondary" /> Mark Student Attendance
            </h2>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '24px', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <div style={{ flex: 1, minWidth: '200px', width: isMobile ? '100%' : 'auto' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Select Activity / Schedule</label>
                <select
                  className="input-field"
                  value={selectedScheduleId}
                  onChange={e => setSelectedScheduleId(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="">-- Choose Activity --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.date})</option>
                  ))}
                </select>
              </div>

              {selectedScheduleId && (
                <button className="btn btn-secondary" style={{ alignSelf: isMobile ? 'stretch' : 'flex-end', height: '42px' }} onClick={handleMarkAllPresent}>
                  Mark All Present
                </button>
              )}
            </div>

            {!selectedScheduleId ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <ClipboardList size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Please select an activity to mark attendance.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Student Name</th><th>Panel</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map(st => {
                      const selectedSchedule = schedules.find(s => s.id === parseInt(selectedScheduleId))
                      // Show all students regardless of panel
                      if (selectedSchedule) {
                        const existingRecord = attendanceRecords.find(a => a.student_id === st.id && a.schedule_id === selectedSchedule.id)
                        return (
                          <tr key={st.id}>
                            <td>{st.name}</td>
                            <td><span className={`badge badge-${st.panel ? st.panel.toLowerCase() : 'student'}`}>{st.panel || 'N/A'}</span></td>
                            <td>
                              {existingRecord ? (
                                <span className={`badge ${existingRecord.status === 'Present' ? 'badge-student' : 'badge-admin'}`}>
                                  {existingRecord.status}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Not Marked</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="btn"
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: '#10b981',
                                    opacity: existingRecord?.status === 'Present' ? 0.5 : 1
                                  }}
                                  onClick={() => handleMarkAttendance(st.id, selectedSchedule.id, 'Present')}
                                >
                                  P
                                </button>
                                <button
                                  className="btn"
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: '#ef4444',
                                    opacity: existingRecord?.status === 'Absent' ? 0.5 : 1
                                  }}
                                  onClick={() => handleMarkAttendance(st.id, selectedSchedule.id, 'Absent')}
                                >
                                  A
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }
                      return null
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evaluate' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PenTool className="text-primary" /> Student Evaluation
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Select markings for students and click "Save All Responses" at the top. Saved evaluations are locked.</p>

            {/* Schedule Selector */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>Select Activity / Schedule</label>
              <select
                className="input-field"
                value={selectedEvalScheduleId}
                onChange={e => {
                  setSelectedEvalScheduleId(e.target.value)
                  setSavedEvals({})
                  setSelectedMarkings({})
                }}
              >
                <option value="">-- Choose Event --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.date})</option>
                ))}
              </select>
            </div>

            {selectedEvalScheduleId && (() => {
              const OPTS = [
                { value: 'not_done', label: 'Not Done', icon: '✗', color: '#ef4444', activeBg: 'rgba(239,68,68,0.15)', activeBorder: '#ef4444' },
                { value: 'partially_done', label: 'Partial', icon: '◑', color: '#f59e0b', activeBg: 'rgba(245,158,11,0.15)', activeBorder: '#f59e0b' },
                { value: 'fully_done', label: 'Done', icon: '✓', color: '#10b981', activeBg: 'rgba(16,185,129,0.15)', activeBorder: '#10b981' },
              ]

              const evalStudents = filteredStudents.filter(st => {
                const sel = schedules.find(s => s.id === parseInt(selectedEvalScheduleId))
                return sel && (sel.panel === 'ALL' || sel.panel === st.panel)
              })

              const pendingCount = Object.keys(selectedMarkings).filter(id => selectedMarkings[id] !== undefined).length

              if (evalStudents.length === 0) {
                return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No students in this panel for this activity.</p>
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Top Bar with multi-save */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Showing {evalStudents.length} Students</span>
                      {pendingCount > 0 && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b' }}>({pendingCount} pending save)</span>}
                    </div>
                    <button
                      className="btn"
                      disabled={pendingCount === 0 || evalSubmitting}
                      onClick={handleEvaluate}
                      style={{
                        background: pendingCount > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: pendingCount > 0 ? 'white' : '#64748b',
                        borderColor: pendingCount > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        cursor: (pendingCount === 0 || evalSubmitting) ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      {evalSubmitting ? 'Saving…' : `Save ${pendingCount} Responses`}
                    </button>
                  </div>

                  {evalStudents.map(st => {
                    const pending = selectedMarkings[st.id]  // what user has toggled (not yet saved)
                    const saved = savedEvals[st.id]         // what is confirmed saved
                    const savedOpt = OPTS.find(o => o.value === saved)
                    const activeOpt = OPTS.find(o => o.value === (saved || pending))

                    return (
                      <div key={st.id} style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: saved ? `${savedOpt.activeBg}` : 'rgba(255,255,255,0.03)',
                        border: saved ? `1.5px solid ${savedOpt.activeBorder}44` : '1.5px solid rgba(255,255,255,0.07)',
                        transition: 'all 0.2s ease',
                        flexWrap: 'wrap',
                        opacity: saved ? 0.8 : 1
                      }}>

                        {/* Student Info */}
                        <div style={{ flex: isMobile ? '1 1 auto' : '0 0 180px', minWidth: '120px' }}>
                          <p style={{ fontWeight: '700', fontSize: '14px', margin: 0, color: 'var(--text-main)' }}>{st.name}</p>
                          <span style={{ fontSize: '11px', background: 'rgba(99,179,237,0.15)', color: '#63b3ed', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{st.panel}</span>
                        </div>

                        {/* Marking Toggle Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                          {OPTS.map(opt => {
                            const isSelected = (saved === opt.value) || (pending === opt.value)
                            return (
                              <button
                                key={opt.value}
                                disabled={!!saved}
                                onClick={() => setSelectedMarkings(prev => ({
                                  ...prev,
                                  [st.id]: prev[st.id] === opt.value ? undefined : opt.value
                                }))}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  border: `2px solid ${isSelected ? opt.color : 'rgba(255,255,255,0.1)'}`,
                                  background: isSelected ? opt.activeBg : 'transparent',
                                  color: isSelected ? opt.color : '#475569',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: (!!saved) ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease',
                                  boxShadow: (isSelected && !saved) ? `0 0 12px ${opt.color}55` : 'none',
                                  opacity: (!!saved && !isSelected) ? 0.3 : 1,
                                  whiteSpace: 'nowrap',
                                  flex: isMobile ? '1 1 auto' : 'none',
                                  justifyContent: isMobile ? 'center' : 'flex-start'
                                }}
                              >
                                <span>{opt.icon}</span> {opt.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Status Label */}
                        <div style={{ marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'right' : 'left' }}>
                          {saved ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: savedOpt.color, justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                              <span>{savedOpt.icon}</span> Locked
                            </span>
                          ) : pending ? (
                            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>Pending Save</span>
                          ) : null}
                        </div>

                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText className="text-primary" /> Notifications, SOPs & Guidelines
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Document Name</th><th>Link</th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td><a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View Document</a></td>
                    </tr>
                  ))}
                  {documents.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center' }}>No documents currently issued.</td></tr>}
                </tbody>
              </table>
            </div>
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

              <button type="submit" className="btn" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', alignSelf: isMobile ? 'stretch' : 'flex-start', width: isMobile ? '100%' : 'auto', background: '#0A082C', color: 'white' }}>
                Submit Feedback
              </button>
            </form>
          </div>
        )}

        <ScrollToTop />
      </div>
    </div>
  )
}
