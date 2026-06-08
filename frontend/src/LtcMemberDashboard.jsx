import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, LayoutDashboard, ClipboardList, Search, LogOut, MessageSquare, Bell, Menu, Scan, CheckCircle, AlertCircle, FileText, X, Clock } from 'lucide-react'
import ScrollToTop from './ScrollToTop'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import TimetablePanel from './TimetablePanel'


export default function LtcMemberDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSquads: 0,
    totalRooms: 0,
    nriCount: 0,
    redFlagCount: 0
  })
  const [documents, setDocuments] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all, nri, red_flag
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('General')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedUser, setScannedUser] = useState(null)
  const [scanMode, setScanMode] = useState('camera')
  const [scanFileImage, setScanFileImage] = useState(null)
  const [manualBarcode, setManualBarcode] = useState('')

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const [selectedSquad, setSelectedSquad] = useState('Surya')
  const [squadLeaders, setSquadLeaders] = useState([])
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    email: '',
    prn: '',
    phone: ''
  })

  const currentLeader = squadLeaders.find(sl => sl.squad_name === selectedSquad)

  useEffect(() => {
    if (currentLeader) {
      setLeaderForm({
        name: currentLeader.name || '',
        email: currentLeader.email || '',
        prn: currentLeader.prn || '',
        phone: currentLeader.phone || ''
      })
    } else {
      setLeaderForm({
        name: '',
        email: '',
        prn: '',
        phone: ''
      })
    }
  }, [selectedSquad, squadLeaders])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ltc_member') {
      navigate('/login')
      return
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/ltc/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        setStudents(data.students || [])
        setStats(data.stats || {
          totalStudents: 0,
          totalSquads: 0,
          totalRooms: 0,
          nriCount: 0,
          redFlagCount: 0
        })
        setDocuments(data.documents || [])
        setSquadLeaders(data.squadLeaders || [])
      }
    } catch (err) {
      console.error('Failed to fetch LTC data', err)
    }
  }

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
        alert('Feedback submitted successfully to Administrator!')
        setFeedbackText('')
        setFeedbackCategory('General')
        setAdditionalNotes('')
      }
    } catch (err) {
      alert('Failed to submit feedback.')
    }
  }

  // QR Processing logic
  const processCode = async (decodedText, scannerInstance) => {
    try {
      let actualBarcode = decodedText;
      try {
        const urlObj = new URL(decodedText);
        if (urlObj.searchParams.has('barcode')) {
          actualBarcode = urlObj.searchParams.get('barcode');
        }
      } catch (e) {}

      const res = await fetch(`http://localhost:5001/api/admin/user-by-barcode?barcode=${actualBarcode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setScannedUser(data.user)
      } else {
        alert(data.message || 'Invalid QR Code or User not found.')
        if (scannerInstance) scannerInstance.resume();
      }
    } catch (err) {
      alert('Error during scanning: ' + err.message)
      if (scannerInstance) scannerInstance.resume();
    }
  }

  useEffect(() => {
    let scanner;
    if (isScannerOpen && scanMode === 'camera' && !scannedUser) {
      scanner = new Html5QrcodeScanner("ltc-qr-reader", { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] }, false);
      scanner.render(async (decodedText) => {
        scanner.pause();
        await processCode(decodedText, scanner);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)) };
  }, [isScannerOpen, scanMode, scannedUser])

  const handleFileScan = async () => {
    if (!scanFileImage) return;
    try {
      const html5QrCode = new Html5Qrcode("ltc-qr-reader-file-dummy");
      const decodedText = await html5QrCode.scanFile(scanFileImage, true);
      processCode(decodedText, null);
    } catch (err) {
      alert('Could not find a valid QR Code in this image.');
    }
  }

  const handleManualScan = () => {
    if (!manualBarcode.trim()) return alert('Please enter a barcode number.')
    processCode(manualBarcode.trim(), null)
  }

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.squad && s.squad.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.room && s.room.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.barcode && s.barcode.toLowerCase().includes(studentSearch.toLowerCase()))

    if (!matchesSearch) return false

    if (filterType === 'nri') {
      return s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes'
    }
    if (filterType === 'red_flag') {
      return s.red_flag === true || s.red_flag === 1 || String(s.red_flag).toLowerCase() === 'true' || String(s.red_flag).toLowerCase() === 'yes'
    }
    return true
  })

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
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px 20px', gap: '4px' }}>
          {isMobile && (
            <button className="sidebar-close-btn" style={{ alignSelf: 'flex-end', position: 'absolute', top: '10px', right: '10px' }} onClick={() => setIsSidebarOpen(false)}>×</button>
          )}
          <img src="/ltc.png" alt="LTC Logo" style={{ width: '180px', height: '180px', objectFit: 'contain', marginBottom: '12px', marginLeft: '-5px' }} />
          <p style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>LTC Member</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontWeight: '500' }}>Coordinator Portal</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Overview</p>
          <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsSidebarOpen(false); }}>
            <LayoutDashboard size={16} /> Student Directory
          </button>
          <button className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('timetable'); if (isMobile) setIsSidebarOpen(false); }}>
            <Clock size={16} /> Immersion Timetable
          </button>
          <button className={`sidebar-item ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => { setActiveTab('scanner'); if (isMobile) setIsSidebarOpen(false); }}>
            <Scan size={16} /> QR / Slip Verification
          </button>
          <button className={`sidebar-item ${activeTab === 'manage_squad' ? 'active' : ''}`} onClick={() => { setActiveTab('manage_squad'); if (isMobile) setIsSidebarOpen(false); }}>
            <Users size={16} /> Manage Squad
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">Resources</p>
          <button className={`sidebar-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => { setActiveTab('documents'); if (isMobile) setIsSidebarOpen(false); }}>
            <FileText size={16} /> Shared Guidelines
          </button>

          <div className="sidebar-separator" />
          <p className="sidebar-section-label">SUPPORT</p>
          <button className={`sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => { setActiveTab('feedback'); if (isMobile) setIsSidebarOpen(false); }}>
            <MessageSquare size={16} /> Coordinator Feedback
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
              <h1 style={{ fontSize: '18px', margin: 0 }}>LTC Portal</h1>
            </div>
            <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/verify')}>
              <Scan size={20} />
            </button>
          </div>
        )}
        <div className="dashboard-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Life Transformation Centre Dashboard</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Coordinator: {currentUser.name} | Email: {currentUser.email} | Role Type: {currentUser.department || 'General'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #e0e7ff, #ffffff)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Total Students</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>{stats.totalStudents}</h3>
            </div>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7, #ffffff)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Active Squads</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#d97706', marginTop: '8px' }}>{stats.totalSquads}</h3>
            </div>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #d1fae5, #ffffff)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Rooms</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', marginTop: '8px' }}>{stats.totalRooms}</h3>
            </div>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #fee2e2, #ffffff)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Red Flag Alerts</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--danger)', marginTop: '8px' }}>{stats.redFlagCount}</h3>
            </div>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #e0f2fe, #ffffff)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>NRI Students</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#0284c7', marginTop: '8px' }}>{stats.nriCount}</h3>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <TimetablePanel />
        )}

        {activeTab === 'dashboard' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users className="text-primary" /> Student Directory
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Quickly search and view student rosters, squads, and rooms.</p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                <button className={`btn btn-outline ${filterType === 'all' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '12px', borderColor: filterType === 'all' ? 'var(--primary)' : 'var(--border)' }} onClick={() => setFilterType('all')}>All</button>
                <button className={`btn btn-outline ${filterType === 'nri' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '12px', borderColor: filterType === 'nri' ? '#0284c7' : 'var(--border)', color: filterType === 'nri' ? '#0284c7' : 'var(--text-main)' }} onClick={() => setFilterType('nri')}>NRI Only</button>
                <button className={`btn btn-outline ${filterType === 'red_flag' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '12px', borderColor: filterType === 'red_flag' ? 'var(--danger)' : 'var(--border)', color: filterType === 'red_flag' ? 'var(--danger)' : 'var(--text-main)' }} onClick={() => setFilterType('red_flag')}>Red Flagged</button>
              </div>
            </div>

            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, squad, room or barcode..."
                className="input-field"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Division</th>
                    <th>Panel</th>
                    <th>Squad</th>
                    <th>Room</th>
                    <th>Barcode</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const isNri = s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes'
                    return (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td style={{ fontWeight: '600' }}>
                          {s.name}
                          {s.is_squad_leader && <span style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>SQUAD LEADER</span>}
                          {s.red_flag && <span style={{ marginLeft: '8px' }} title="Red Flag Alert">🚩</span>}
                        </td>
                        <td>{s.email}</td>
                        <td>{s.division || '-'}</td>
                        <td><span className={`badge badge-${s.panel ? s.panel.toLowerCase() : 'student'}`}>{s.panel || 'Unassigned'}</span></td>
                        <td><strong style={{ color: '#4338ca' }}>{s.squad || '-'}</strong></td>
                        <td><strong style={{ color: '#15803d' }}>{s.room || '-'}</strong></td>
                        <td><code style={{ fontSize: '12px' }}>{s.barcode || '-'}</code></td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isNri && <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: '700' }}>NRI</span>}
                            {s.red_flag && <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: '700' }}>RED FLAG</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No student records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'scanner' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scan className="text-primary" /> Room Slip & QR Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Verify a student's authenticity, squad assignment, and room number instantly by scanning their barcode or entering it manually.</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button className={`btn ${scanMode === 'camera' ? '' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => { setScanMode('camera'); setIsScannerOpen(true); setScannedUser(null); }}>Camera Scanner</button>
              <button className={`btn ${scanMode === 'manual' ? '' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => { setScanMode('manual'); setIsScannerOpen(false); setScannedUser(null); }}>Manual Barcode</button>
            </div>

            {scanMode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {!isScannerOpen ? (
                  <button className="btn" style={{ width: '100%' }} onClick={() => setIsScannerOpen(true)}>Start Camera Scanner</button>
                ) : (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <div id="ltc-qr-reader" style={{ width: '100%' }}></div>
                    <button className="btn btn-outline" style={{ marginTop: '12px', width: '100%' }} onClick={() => setIsScannerOpen(false)}>Stop Camera</button>
                  </div>
                )}
              </div>
            )}

            {scanMode === 'manual' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Enter barcode (e.g. LTC-12-3456)..."
                  className="input-field"
                  style={{ margin: 0 }}
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <button className="btn" onClick={handleManualScan}>Verify</button>
              </div>
            )}

            {scannedUser && (
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center', marginTop: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: '#0f172a' }}>{scannedUser.name}</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Email: {scannedUser.email}</p>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Dept: {scannedUser.department || '-'}</p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '16px', borderRadius: '12px', fontWeight: 'bold', width: '45%' }}>
                    <p style={{ fontSize: '11px', color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px' }}>Squad Assignment</p>
                    <p style={{ fontSize: '18px' }}>{scannedUser.squad || 'Unassigned'}</p>
                  </div>
                  <div style={{ background: '#dcfce7', color: '#15803d', padding: '16px', borderRadius: '12px', fontWeight: 'bold', width: '45%' }}>
                    <p style={{ fontSize: '11px', color: '#22c55e', textTransform: 'uppercase', marginBottom: '4px' }}>Room Number</p>
                    <p style={{ fontSize: '18px' }}>{scannedUser.room || 'Unassigned'}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Barcode: <code>{scannedUser.barcode || 'N/A'}</code></span>
                  <span>Role: <strong>{scannedUser.role}</strong></span>
                </div>

                <button className="btn" style={{ marginTop: '24px', width: '100%', background: '#0A082C' }} onClick={() => {
                  setScannedUser(null)
                  setManualBarcode('')
                  if (isScannerOpen && scanMode === 'camera') {
                    // reset camera scanner logic handled inside HTML5 library automatically or via state change
                  }
                }}>
                  Verify Another Student
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents/Shared Tab */}
        {activeTab === 'documents' && (
          <div className="glass-card animate-fade-in">
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText className="text-primary" /> LTC Guidelines & SOP Materials
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Access official documents, rubrics, guides, and SOP materials shared by the Administrator.</p>

            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>No guidelines or documents have been shared yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Material Title</th>
                      <th>Format</th>
                      <th>Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d, index) => (
                      <tr key={d.id}>
                        <td>#{index + 1}</td>
                        <td style={{ fontWeight: '600' }}>{d.name}</td>
                        <td><span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>Official File</span></td>
                        <td>
                          <a href={d.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            View Material
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Manage Squad Tab */}
        {activeTab === 'manage_squad' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'stretch' }}>
            {/* Left Column: Squads List */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '260px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                Active Squads
              </h4>
              {['Surya', 'Aditya', 'Ravi', 'Divakar', 'Mitra', 'Martand', 'Dinkar', 'Prabhakar', 'Bhaskar', 'Tejonidhi'].map(squadName => {
                const squadStudents = students.filter(s => s.squad === squadName);
                const squadLeader = squadLeaders.find(sl => sl.squad_name === squadName);
                const isSelected = selectedSquad === squadName;

                return (
                  <div
                    key={squadName}
                    onClick={() => setSelectedSquad(squadName)}
                    style={{
                      padding: '16px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.75)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 2px 4px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? 'var(--primary)' : '#1e293b', margin: 0 }}>
                        {squadName}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px', display: 'inline-block' }}>
                        Leader: {squadLeader ? squadLeader.name : 'Not Assigned'}
                      </span>
                    </div>
                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                      {squadStudents.length} Students
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Squad Leader Management */}
            <div style={{ flex: '2', minWidth: '320px' }}>
              <div className="glass-card animate-fade-in" style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div>
                  <span style={{ fontSize: '10px', background: 'var(--primary)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                    Squad Leader Management
                  </span>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>
                    {selectedSquad} Squad
                  </h3>
                </div>

                {/* Leader Details Form */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch('http://localhost:5001/api/ltc/squad-leader', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        squadName: selectedSquad,
                        name: leaderForm.name,
                        email: leaderForm.email,
                        prn: leaderForm.prn,
                        phone: leaderForm.phone
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Squad Leader details updated successfully!');
                      fetchDashboardData();
                    } else {
                      alert(data.message || 'Failed to update Squad Leader details.');
                    }
                  } catch (err) {
                    alert('Error updating details.');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', margin: 0 }}>
                    Squad Leader Details (Outside School)
                  </h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ marginBottom: 0 }}
                      required
                      placeholder="e.g. John Doe"
                      value={leaderForm.name}
                      onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      style={{ marginBottom: 0 }}
                      required
                      placeholder="e.g. leader@external.com"
                      value={leaderForm.email}
                      onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>PRN / ID Code</label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ marginBottom: 0 }}
                        placeholder="e.g. EXT-101"
                        value={leaderForm.prn}
                        onChange={(e) => setLeaderForm({ ...leaderForm, prn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Phone Number</label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ marginBottom: 0 }}
                        placeholder="e.g. 9876543210"
                        value={leaderForm.phone}
                        onChange={(e) => setLeaderForm({ ...leaderForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn" style={{ background: '#0A082C', color: 'white', marginTop: '8px' }}>
                    Save Details & Update Globally
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Coordinator Feedback */}
        {activeTab === 'feedback' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare className="text-primary" /> Coordinator Feedback Loop
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              Submit immediate session reports, coordinate squad status updates, or log issues directly with the Life Transformation Centre Super Admin.
            </p>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Report Category</label>
                <select
                  className="input-field"
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="General">General Coordinator Report</option>
                  <option value="Squad Allocation">Squad Allocation Update</option>
                  <option value="Room Issue">Room Allocation Issue</option>
                  <option value="Student Conduct">Student Conduct Log</option>
                  <option value="Program Rubric">LTC Program Rubrics</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Session Notes / Feedback Message</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '150px', borderRadius: '12px', padding: '16px', marginBottom: 0 }}
                  placeholder="Enter detailed logs, student details, squad states, or program challenges..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Additional Coordinator Notes</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  placeholder="e.g. Squad 12 Lead, SOCSE 4th sem"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn" style={{ padding: '12px 24px', alignSelf: 'flex-start', background: '#0A082C', color: 'white' }}>
                Submit to Super Admin
              </button>
            </form>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  )
}
