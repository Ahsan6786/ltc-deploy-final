import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, UploadCloud, GraduationCap, BookOpen, CheckCircle, AlertCircle, LayoutDashboard, FileText, Search, LogOut, Menu, Scan, Printer, X, Trash2, ClipboardList, Lock, Unlock, Clock } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import ScrollToTop from './ScrollToTop'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import TimetablePanel from './TimetablePanel'


export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('faculty')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedUser, setScannedUser] = useState(null)
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false)
  const [slipStudent, setSlipStudent] = useState(null)
  const [scanMode, setScanMode] = useState('camera')
  const [scanFileImage, setScanFileImage] = useState(null)

  const processCode = async (decodedText, scannerInstance) => {
    try {
      let actualBarcode = decodedText;
      try {
         const urlObj = new URL(decodedText);
         if (urlObj.searchParams.has('barcode')) {
             actualBarcode = urlObj.searchParams.get('barcode');
         }
      } catch(e) {}
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/user-by-barcode?barcode=${actualBarcode}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (res.ok) {
        setScannedUser(data.user)
      } else {
        alert(data.message || 'Invalid QR')
        if (scannerInstance) scannerInstance.resume();
      }
    } catch(err) {
      alert('Error: ' + err.message)
      if (scannerInstance) scannerInstance.resume();
    }
  };

  useEffect(() => {
    let scanner;
    if (isScannerOpen && scanMode === 'camera' && !scannedUser) {
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] }, false);
      scanner.render(async (decodedText) => {
        scanner.pause();
        await processCode(decodedText, scanner);
      }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e => console.error(e)) };
  }, [isScannerOpen, scanMode, scannedUser]);

  const handleFileScan = async () => {
    if (!scanFileImage) return;
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file-dummy");
      const decodedText = await html5QrCode.scanFile(scanFileImage, true);
      processCode(decodedText, null);
    } catch(err) {
      alert('Could not find a valid QR Code in this image.');
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false)
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', department: '', division: '', school: '', panel: '', is_primary: false, gender: '' })

  const [isLtcModalOpen, setIsLtcModalOpen] = useState(false)
  const [ltcForm, setLtcForm] = useState({ name: '', email: '', role_type: 'member' })

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({ name: '', email: '', prn: '', department: '', semester: '', division: '', school: '', panel: '', gender: '' })

  const [squadData, setSquadData] = useState({ locked: false, students: [], faculties: [], squadLeaders: [] });
  const [squadLeaders, setSquadLeaders] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState('Surya');
  const [squadViewTab, setSquadViewTab] = useState('master');
  const [squadStudentSearch, setSquadStudentSearch] = useState('');

  const fetchSquadState = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/squad-allocation-state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSquadData(data);
      }
    } catch (err) {
      console.error('Failed to fetch squad allocation state', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'squads') {
      fetchSquadState();
    }
  }, [activeTab]);

  const handleShuffleSquads = async () => {
    if (squadData.locked) {
      alert("Squad allocation is locked. Unlock it first to shuffle.");
      return;
    }
    if (!window.confirm("Are you sure you want to shuffle students and faculty randomly into squads?")) {
      return;
    }
    setIsShuffling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/shuffle-squads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        fetchSquadState();
        fetchUsers();
      }
    } catch (err) {
      alert('Error shuffling squads: ' + err.message);
    } finally {
      setIsShuffling(false);
    }
  };

  const handleToggleSquadLock = async () => {
    const action = squadData.locked ? 'unlock' : 'lock';
    if (!window.confirm(`Are you sure you want to ${action} squad allocations?`)) {
      return;
    }
    try {
      const endpoint = squadData.locked ? 'unlock-squads' : 'lock-squads';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        fetchSquadState();
      }
    } catch (err) {
      alert('Error toggling lock status: ' + err.message);
    }
  };

  const [bulkData, setBulkData] = useState({ faculty: [], students: [], errors: [] })
  const [bulkInsuranceData, setBulkInsuranceData] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingInsurance, setIsUploadingInsurance] = useState(false)

  const [docForm, setDocForm] = useState({ name: '', url: '', target_role: 'all' })
  const [facultySearch, setFacultySearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')
  const [selectedPanel, setSelectedPanel] = useState('')
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [feedbackList, setFeedbackList] = useState([])
  const [currentBatchSearch, setCurrentBatchSearch] = useState('')
  const [isUploadingBatch, setIsUploadingBatch] = useState(false)
  const [selectedStudentForms, setSelectedStudentForms] = useState(null)
  const [isFormsModalOpen, setIsFormsModalOpen] = useState(false)

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const processBatchData = async (data) => {
    if (!data || data.length === 0) {
      alert('The file appears to be empty or could not be read.');
      return;
    }
    
    const identifiers = [];
    data.forEach(row => {
      let value = '';
      for (let k in row) {
        if (!k) continue;
        const cleanKey = k.replace(/^\uFEFF/, '').toLowerCase().trim().replace(/['"]+/g, '');
        if (cleanKey === 'prn' || cleanKey === 'email' || cleanKey === 'student_id' || cleanKey === 'student id' || cleanKey === 'identifier') {
          value = String(row[k]).trim();
          break;
        }
      }
      if (!value) {
        for (let k in row) {
          const valStr = String(row[k]).trim();
          if (valStr.includes('@') || /^[A-Za-z0-9]{5,20}$/.test(valStr)) {
            value = valStr;
            break;
          }
        }
      }
      if (value) {
        identifiers.push(value);
      }
    });

    if (identifiers.length === 0) {
      alert('No valid student identifiers (PRN or Email) found in the file. Ensure the headers include "prn" or "email".');
      return;
    }

    const firstVal = identifiers[0] || '';
    const matchType = firstVal.includes('@') ? 'email' : 'prn';

    setIsUploadingBatch(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/set-current-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ identifiers, matchType })
      });
      const resData = await res.json();
      alert(resData.message);
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      alert('Error updating batch: ' + err.message);
    } finally {
      setIsUploadingBatch(false);
    }
  };

  const handleBatchFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => processBatchData(results.data),
        error: () => alert('Error parsing CSV file.')
      })
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result
          const workbook = XLSX.read(bstr, { type: 'binary' })
          const wsname = workbook.SheetNames[0]
          const ws = workbook.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json(ws)
          processBatchData(data)
        } catch (err) {
          alert('Error parsing Excel file.')
        }
      }
      reader.onerror = () => alert('Error reading Excel file.')
      reader.readAsBinaryString(file)
    } else {
      alert('Unsupported format. Please upload CSV or XLSX.')
    }
    e.target.value = null;
  };

  const handleClearBatch = async () => {
    if (!window.confirm("Are you sure you want to clear all students from the current active LTC batch?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/clear-current-batch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      alert(resData.message);
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      alert('Error clearing batch: ' + err.message);
    }
  };

  const handleToggleStudentBatch = async (userId, inBatch) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/toggle-student-batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, in_batch: inBatch })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update student batch status');
      }
    } catch (err) {
      alert('Error updating batch status: ' + err.message);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL students, faculties, LTC members, insurance policies, feedback, schedules, evaluations, attendance records, and documents from the database (the Admin account will remain). This action cannot be undone. Do you wish to proceed?")) {
      return;
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/reset-database`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
        fetchDocuments();
      } else {
        alert(data.message || 'Failed to reset database');
      }
    } catch (err) {
      alert('Error resetting database: ' + err.message);
    }
  };

  const handleViewFeedback = async (userId, userName) => {
    setSelectedUserForFeedback({ id: userId, name: userName })
    setIsFeedbackModalOpen(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/feedback?user_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setFeedbackList(data.feedback || [])
      }
    } catch (err) {
      alert('Failed to fetch feedback.')
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchUsers()
    fetchDocuments()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
        setSquadLeaders(data.squadLeaders || [])
      }
    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }
      const data = await res.json()
      if (res.ok) setDocuments(data.documents || [])
    } catch (err) {
      console.error('Failed to fetch documents', err)
    }
  }

  const faculties = users.filter(u => u.role === 'faculty' &&
    (u.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      u.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(facultySearch.toLowerCase()))))

  const availableSchools = Array.from(new Set(users.filter(u => u.role === 'student' && u.school).map(u => u.school))).sort();
  
  const availableDepartments = Array.from(new Set(
    users.filter(u => u.role === 'student' && u.department && (!selectedSchool || u.school === selectedSchool))
      .map(u => u.department)
  )).sort();

  const availableDivisions = Array.from(new Set(
    users.filter(u => u.role === 'student' && u.division && (!selectedSchool || u.school === selectedSchool) && (!selectedDepartment || u.department === selectedDepartment))
      .map(u => u.division)
  )).sort();

  const availablePanels = Array.from(new Set(
    users.filter(u => u.role === 'student' && u.panel).map(u => u.panel)
  )).sort();

  const students = users.filter(u => {
    if (u.role !== 'student') return false;
    
    const matchesSearch = u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(studentSearch.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    if (selectedSchool && u.school !== selectedSchool) return false;
    
    if (selectedDepartment && u.department !== selectedDepartment) return false;
    
    if (selectedDivision && u.division !== selectedDivision) return false;
    
    if (selectedPanel && u.panel !== selectedPanel) return false;
    
    return true;
  });

  const currentBatchStudents = users.filter(u => u.role === 'student' && u.in_current_batch);
  
  const filteredCurrentBatch = currentBatchStudents.filter(u => 
    u.name.toLowerCase().includes(currentBatchSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(currentBatchSearch.toLowerCase()) ||
    (u.prn && u.prn.toLowerCase().includes(currentBatchSearch.toLowerCase()))
  );

  const ltcMembers = users.filter(u => u.role === 'ltc_member')

  const handleAddFaculty = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(facultyForm)
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setIsFacultyModalOpen(false)
        setFacultyForm({ name: '', email: '', department: '', division: '', school: '', panel: '', is_primary: false, gender: '' })
        fetchUsers()
      } else {
        alert(data.message || 'Failed to add faculty')
      }
    } catch (err) {
      alert('Error adding faculty')
    }
  }

  const handleAutoAllocate = async () => {
    if (!window.confirm("This will randomly shuffle and assign ALL students to Squads (60 max) and Rooms (40 max, separated by gender). Proceed?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/auto-allocate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert('Failed to auto allocate. ' + (data.message || ''));
      }
    } catch (err) {
      alert('Error during auto allocation.');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(studentForm)
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setIsStudentModalOpen(false)
        setStudentForm({ name: '', email: '', prn: '', department: '', semester: '', division: '', school: '', panel: '', gender: '' })
        fetchUsers()
      } else {
        alert(data.message || 'Failed to add student')
      }
    } catch (err) {
      alert('Error adding student')
    }
  }

  const handleAddLtcMember = async (e) => {
    e.preventDefault()
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/bulk-upload`;
      const actualRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ users: [{ name: ltcForm.name, email: ltcForm.email, role: 'ltc_member', department: ltcForm.role_type }] })
      })
      const data = await actualRes.json()
      if (actualRes.ok) {
        alert("LTC Member added successfully.")
        setIsLtcModalOpen(false)
        setLtcForm({ name: '', email: '', role_type: 'member' })
        fetchUsers()
      } else {
        alert(data.message || 'Failed to add LTC Member')
      }
    } catch (err) {
      alert('Error adding LTC member')
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(docForm)
      })
      if (res.ok) {
        alert('Document uploaded specifically for ' + docForm.target_role)
        setDocForm({ name: '', url: '', target_role: 'all' })
        fetchDocuments()
      }
    } catch (err) { }
  }

  const handleUpdatePanel = async (userId, newPanel) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/update-panel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, panel: newPanel })
      })
      if (res.ok) {
        alert('Panel assignment updated!')
        fetchUsers()
      } else {
        alert('Failed to update panel.')
      }
    } catch (err) {
      alert('Error updating panel')
    }
  }

  const handleUpdateDivision = async (userId, newDivision) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/update-division`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, division: newDivision })
      })
      if (res.ok) fetchUsers()
      else alert('Failed to update division.')
    } catch (err) {
      alert('Error updating division')
    }
  }

  const handleUpdateInsurance = async (userId, insuranceValue) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/insurance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, insurance: insuranceValue === 'true' })
      })
      if (res.ok) {
        alert('Insurance state updated successfully!')
        fetchUsers()
      } else {
        alert('Failed to update insurance status.')
      }
    } catch (err) {
      alert('Error updating insurance')
    }
  }

  const parseData = (parsedData) => {
    const parsedFaculties = []
    const parsedStudents = []
    const parseErrors = []

    parsedData.forEach((row, index) => {
      const normalizedRow = {}
      for (const key in row) {
        const cleanKey = key.replace(/^\uFEFF/, '').toLowerCase().trim()
        normalizedRow[cleanKey] = row[key]
      }

      const role = (normalizedRow.role || '').toLowerCase()
      const name = normalizedRow.name || normalizedRow.full_name
      if (!name || !normalizedRow.email || !role) {
        parseErrors.push(`Row ${index + 1}: Missing name/full_name, email, or role.`)
        return
      }
      normalizedRow.name = name

      if (role === 'faculty') {
        parsedFaculties.push(normalizedRow)
      } else if (role === 'student') {
        parsedStudents.push(normalizedRow)
      } else {
        parseErrors.push(`Row ${index + 1}: Invalid role "${role}". Expected 'faculty' or 'student'.`)
      }
    })

    setBulkData({ faculty: parsedFaculties, students: parsedStudents, errors: parseErrors })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBulkData({ faculty: [], students: [], errors: [] })
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => parseData(results.data),
        error: () => alert('Error parsing CSV file.')
      })
    } else if (fileName.endsWith('.xlsx')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const bstr = evt.target.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        parseData(data)
      }
      reader.onerror = () => alert('Error parsing XLSX file.')
      reader.readAsBinaryString(file)
    } else {
      alert('Unsupported file format. Please upload a CSV or XLSX file.')
    }
  }

  const submitBulkUpload = async () => {
    const allUsersToUpload = [...bulkData.faculty, ...bulkData.students]
    if (allUsersToUpload.length === 0) return alert('No valid data to upload.')

    setIsUploading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ users: allUsersToUpload })
      })
      const data = await res.json()
      alert(data.message)
      if (res.ok) {
        setBulkData({ faculty: [], students: [], errors: [] })
        fetchUsers()
        setActiveTab('faculty')
      }
    } catch (err) {
      alert('Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const processInsuranceData = (data) => {
    if (!data || data.length === 0) {
      alert('The file appears to be empty or could not be read.');
      return;
    }
    const formatted = data.map(row => {
      const lowerRow = {}
      for (let k in row) {
        if (!k) continue;
        const cleanKey = k.replace(/^\uFEFF/, '').toLowerCase().trim().replace(/['"]+/g, '')
        lowerRow[cleanKey] = row[k]
      }
      return lowerRow
    })
    setBulkInsuranceData(formatted)
  }

  const handleInsuranceFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBulkInsuranceData([])
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => processInsuranceData(results.data),
        error: () => alert('Error parsing CSV file.')
      })
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result
          const workbook = XLSX.read(bstr, { type: 'binary' })
          const wsname = workbook.SheetNames[0]
          const ws = workbook.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json(ws)
          processInsuranceData(data)
        } catch (err) {
          alert('Error parsing Excel file.')
        }
      }
      reader.onerror = () => alert('Error reading Excel file.')
      reader.readAsBinaryString(file)
    } else {
      alert('Unsupported format. Please upload CSV or XLSX for Insurance data.')
    }
    // reset input so the exact same file can be clicked again
    e.target.value = null;
  }

  const submitBulkInsurance = async () => {
    if (bulkInsuranceData.length === 0) return alert('No valid insurance data to upload.')
    setIsUploadingInsurance(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/bulk-insurance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ users: bulkInsuranceData })
      })
      const data = await res.json()
      alert(data.message)
      if (res.ok) {
        setBulkInsuranceData([])
        fetchUsers()
      }
    } catch (err) {
      alert('Insurance upload failed.')
    } finally {
      setIsUploadingInsurance(false)
    }
  }

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
          <p className="sidebar-portal-label">Admin Portal</p>
          <p className="sidebar-sub-label">{currentUser?.name || 'Administrator'}</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Management</p>
          <button
            className={`sidebar-item ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => { setActiveTab('faculty'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <BookOpen size={16} /> Manage Faculty
          </button>
          <button
            className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <GraduationCap size={16} /> Manage Students
          </button>
          <button
            className={`sidebar-item ${activeTab === 'current_batch' ? 'active' : ''}`}
            onClick={() => { setActiveTab('current_batch'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <ClipboardList size={16} /> Current LTC Batch
          </button>
          <button
            className={`sidebar-item ${activeTab === 'ltcmembers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ltcmembers'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <Users size={16} /> LTC Members
          </button>           <button
            className={`sidebar-item ${activeTab === 'squads' ? 'active' : ''}`}
            onClick={() => { setActiveTab('squads'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <Users size={16} /> Squad Allocation
          </button>
          <button
            className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => { setActiveTab('timetable'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <Clock size={16} /> Immersion Timetable
          </button>
          <button
            className={`sidebar-item ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bulk'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <UploadCloud size={16} /> Bulk Upload
          </button>
          <button
            className={`sidebar-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => { setActiveTab('documents'); if (isMobile) setIsSidebarOpen(false); }}
          >
            <FileText size={16} /> Documents & SOPs
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="sidebar-item logout" style={{ color: '#ef4444' }} onClick={handleResetDatabase}>
            <Trash2 size={16} /> Reset Database
          </button>
          <button className="sidebar-item logout" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, padding: isMobile ? '10px' : '30px' }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '18px', margin: 0 }}>Admin Portal</h1>
          </div>
        )}

        {activeTab === 'timetable' && (
          <TimetablePanel />
        )}

        {activeTab === 'faculty' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen className="text-primary" />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Faculty Database</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Manage and assign faculty members to panels.</p>
                </div>
              </div>
              <button className="btn" style={{ width: isMobile ? '100%' : 'auto' }} onClick={() => setIsFacultyModalOpen(true)}>
                <Plus size={20} /> Assign Faculty
              </button>
            </div>

            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search faculty..."
                className="input-field"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Division</th><th>School</th><th>Department</th><th>Assigned Panels</th><th>Role Type</th><th>Batch Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {faculties.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td><td>{u.name}</td><td>{u.email}</td>
                      <td>{u.division || '-'}</td><td>{u.school || '-'}</td><td>{u.department || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select className="input-field" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', width: 'auto' }}
                            value={u.panel || ''} onChange={(e) => handleUpdatePanel(u.id, e.target.value)}>
                            <option value="">Unassigned</option>
                            <option value="PA">PA</option>
                            <option value="PB">PB</option>
                            <option value="PC">PC</option>
                            <option value="PD">PD</option>
                          </select>
                        </div>
                      </td>
                      <td><span className={`badge ${u.is_primary ? 'badge-primary' : 'badge-secondary'}`}>{u.is_primary ? 'Primary' : 'Secondary'}</span></td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px', 
                            background: u.in_current_batch ? '#22c55e' : 'transparent',
                            borderColor: u.in_current_batch ? '#22c55e' : '#cbd5e1',
                            color: u.in_current_batch ? '#ffffff' : '#64748b',
                            width: '100px',
                            margin: 0
                          }} 
                          onClick={() => handleToggleStudentBatch(u.id, !u.in_current_batch)}
                        >
                          {u.in_current_batch ? 'In Batch' : '+ Add Batch'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleViewFeedback(u.id, u.name)}>
                          Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                  {faculties.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center' }}>No faculty found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap className="text-primary" />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Student Database</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>View and onboard students.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                <button className="btn btn-outline" style={{ width: isMobile ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setIsScannerOpen(true)}>
                  <Scan size={18} /> Scan Slip
                </button>
                <button className="btn btn-outline" style={{ width: isMobile ? '100%' : 'auto' }} onClick={handleAutoAllocate}>
                  Auto Allocate
                </button>
                <button className="btn" style={{ width: isMobile ? '100%' : 'auto' }} onClick={() => setIsStudentModalOpen(true)}>
                  <Plus size={20} /> Onboard Student
                </button>
              </div>
            </div>

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

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Filter by School</label>
                <select 
                  className="input-field" 
                  style={{ margin: 0, width: '100%', height: '42px' }}
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setSelectedDepartment('');
                    setSelectedDivision('');
                  }}
                >
                  <option value="">All Schools</option>
                  {availableSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Filter by Department</label>
                <select 
                  className="input-field" 
                  style={{ margin: 0, width: '100%', height: '42px' }}
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedDivision('');
                  }}
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Filter by Division</label>
                <select 
                  className="input-field" 
                  style={{ margin: 0, width: '100%', height: '42px' }}
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  <option value="">All Divisions</option>
                  {availableDivisions.map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Filter by Panel</label>
                <select 
                  className="input-field" 
                  style={{ margin: 0, width: '100%', height: '42px' }}
                  value={selectedPanel}
                  onChange={(e) => setSelectedPanel(e.target.value)}
                >
                  <option value="">All Panels</option>
                  {availablePanels.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {(selectedSchool || selectedDepartment || selectedDivision || selectedPanel) && (
                <button 
                  className="btn btn-outline" 
                  style={{ alignSelf: 'flex-end', height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedSchool('');
                    setSelectedDepartment('');
                    setSelectedDivision('');
                    setSelectedPanel('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Division</th><th>School</th><th>Panel</th><th>Squad</th><th>Room</th><th>Barcode</th><th>Onboarding</th><th>Batch Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {students.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        {u.name}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select className="input-field" style={{ margin: 0, padding: '4px 8px', width: 'auto' }}
                          value={u.division || ''} onChange={(e) => handleUpdateDivision(u.id, e.target.value)}>
                          <option value="">-</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="F">F</option>
                          <option value="DIV 1">DIV 1</option>
                          <option value="DIV 2">DIV 2</option>
                          <option value="DIV 3">DIV 3</option>
                        </select>
                      </td>
                      <td>{u.school || '-'}</td>
                      <td>
                        <select className="input-field" style={{ margin: 0, padding: '4px 8px', width: 'auto' }}
                          value={u.panel || ''} onChange={(e) => handleUpdatePanel(u.id, e.target.value)}>
                          <option value="">Unassigned</option>
                          <option value="PA">PA</option>
                          <option value="PB">PB</option>
                          <option value="PC">PC</option>
                          <option value="PD">PD</option>
                        </select>
                      </td>
                      <td>
                        {u.squad ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>{u.squad}</div>
                            {(() => {
                              const leader = squadLeaders.find(sl => sl.squad_name === u.squad);
                              return leader ? (
                                <div style={{ fontSize: '10px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>
                                  👤 {leader.name}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        ) : '-'}
                      </td>
                      <td>{u.room || '-'}</td>
                      <td>{u.barcode || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', color: u.insured ? '#22c55e' : '#64748b', fontWeight: '600' }}>
                            🛡️ {u.insured ? 'Insured' : 'Pending'}
                          </span>
                          <span style={{ fontSize: '11px', color: u.undertaking_submitted ? '#22c55e' : '#64748b', fontWeight: '600' }}>
                            📝 {u.undertaking_submitted ? 'Undertaking' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px', 
                            background: u.in_current_batch ? '#22c55e' : 'transparent',
                            borderColor: u.in_current_batch ? '#22c55e' : '#cbd5e1',
                            color: u.in_current_batch ? '#ffffff' : '#64748b',
                            width: '100px',
                            margin: 0
                          }} 
                          onClick={() => handleToggleStudentBatch(u.id, !u.in_current_batch)}
                        >
                          {u.in_current_batch ? 'In Batch' : '+ Add Batch'}
                        </button>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        {(u.insured || u.undertaking_submitted) && (
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', borderColor: '#6366f1', color: '#6366f1' }} onClick={() => { setSelectedStudentForms(u); setIsFormsModalOpen(true); }}>
                            Forms
                          </button>
                        )}
                        {u.barcode && (
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => { setSlipStudent(u); setIsSlipModalOpen(true); }}>
                            <Printer size={14} /> Slip
                          </button>
                        )}
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleViewFeedback(u.id, u.name)}>
                          Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan="12" style={{ textAlign: 'center' }}>No students found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'current_batch' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClipboardList className="text-primary" />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Current LTC Batch</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Load and manage students currently attending LTC in the active batch.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
                  <button className="btn btn-outline" style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <UploadCloud size={16} /> {isUploadingBatch ? 'Uploading...' : 'Upload Batch File'}
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      onChange={handleBatchFileUpload}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      disabled={isUploadingBatch}
                    />
                  </button>
                </div>
                {currentBatchStudents.length > 0 && (
                  <button className="btn" style={{ background: '#ef4444', borderColor: '#ef4444', width: isMobile ? '100%' : 'auto' }} onClick={handleClearBatch}>
                    Clear Current Batch
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', margin: 0, color: '#334155' }}>
                <strong>Active Batch Size:</strong> {currentBatchStudents.length} students currently registered.
              </p>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#64748b' }}>
                Tip: You can upload a list containing <strong>PRN</strong> or <strong>Email</strong> headers to set a new batch automatically. You can also manually add/remove students here and in the general student list.
              </p>
            </div>

            <div className="search-wrapper" style={{ marginBottom: '20px' }}>
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search within current batch..."
                className="input-field"
                value={currentBatchSearch}
                onChange={(e) => setCurrentBatchSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>PRN</th><th>School</th><th>Department</th><th>Panel</th><th>Squad</th><th>Room</th><th>Onboarding</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredCurrentBatch.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.prn || '-'}</td>
                      <td>{u.school || '-'}</td>
                      <td>{u.department || '-'}</td>
                      <td>{u.panel || '-'}</td>
                      <td>{u.squad || '-'}</td>
                      <td>{u.room || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', color: u.insured ? '#22c55e' : '#64748b', fontWeight: '600' }}>
                            🛡️ {u.insured ? 'Insured' : 'Pending'}
                          </span>
                          <span style={{ fontSize: '11px', color: u.undertaking_submitted ? '#22c55e' : '#64748b', fontWeight: '600' }}>
                            📝 {u.undertaking_submitted ? 'Undertaking' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(u.insured || u.undertaking_submitted) && (
                            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', borderColor: '#6366f1', color: '#6366f1' }} onClick={() => { setSelectedStudentForms(u); setIsFormsModalOpen(true); }}>
                              Forms
                            </button>
                          )}
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleToggleStudentBatch(u.id, false)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCurrentBatch.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No students found in the current batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: Users Data */}
            <div className="glass-card animate-fade-in" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <UploadCloud className="text-primary" size={24} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Bulk Import Users Data</h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Import faculty and students via CSV or Excel.</p>
                </div>
              </div>

              {/* Modern Upload Box */}
              <div 
                style={{ 
                  border: '2px dashed #cbd5e1', 
                  borderRadius: '16px', 
                  padding: '40px 20px', 
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onClick={() => document.getElementById('bulk-file-input').click()}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Support for .csv, .xlsx files</p>
                </div>
                <input 
                  id="bulk-file-input"
                  type="file" 
                  accept=".csv, .xlsx" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ marginTop: '24px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px' }}>
                  Required columns: <strong>name, email, role, department, semester, division, school, panel, is_primary, nri</strong>.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  📌 <strong>nri</strong>: Set to <code>yes</code> or <code>true</code> to mark a student as NRI.
                </p>
              </div>

              {bulkData.errors.length > 0 && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Errors in file:</h3>
                  <ul style={{ paddingLeft: '20px', fontSize: '12px' }}>
                    {bulkData.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}

              {(bulkData.faculty.length > 0 || bulkData.students.length > 0) && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#0f172a' }}>
                    Found <strong>{bulkData.faculty.length}</strong> faculties and <strong>{bulkData.students.length}</strong> students ready.
                  </p>
                  <button className="btn" onClick={submitBulkUpload} disabled={isUploading}>
                    {isUploading ? 'Allocating...' : 'Confirm & Ingest Structure'}
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Insurance Data */}
            <div className="glass-card animate-fade-in" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <UploadCloud className="text-primary" size={24} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Bulk Import Insurance Data</h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Update insurance status via CSV or Excel.</p>
                </div>
              </div>

              {/* Modern Upload Box */}
              <div 
                style={{ 
                  border: '2px dashed #cbd5e1', 
                  borderRadius: '16px', 
                  padding: '40px 20px', 
                  background: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onClick={() => document.getElementById('insurance-file-input').click()}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Support for .csv, .xlsx files</p>
                </div>
                <input 
                  id="insurance-file-input"
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={handleInsuranceFileUpload} 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ marginTop: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Required columns: <strong>email</strong> and optionally <strong>insurance</strong> (yes/no).
                </p>
              </div>

              {bulkInsuranceData.length > 0 && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#0f172a' }}>
                    Found <strong>{bulkInsuranceData.length}</strong> insurance records ready.
                  </p>
                  <button className="btn" style={{ background: 'var(--secondary)' }} onClick={submitBulkInsurance} disabled={isUploadingInsurance}>
                    {isUploadingInsurance ? 'Uploading...' : 'Confirm & Ingest Insurance'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ltcmembers' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users className="text-primary" />
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>LTC Members Database</h2>
              </div>
              <button className="btn" style={{ width: isMobile ? '100%' : 'auto' }} onClick={() => setIsLtcModalOpen(true)}>
                <Plus size={20} /> Add Member
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Role/Type</th></tr>
                </thead>
                <tbody>
                  {ltcMembers.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.department || 'LTC Member'}</td>
                    </tr>
                  ))}
                  {ltcMembers.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No LTC members found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'squads' && (
          <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
            
            {/* Header & Meta & Compact Actions */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Squad Allocation & Registry Workspace</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                    Allocate active batch students and faculty mentors randomly into squads with optimal gender balancing.
                  </p>
                </div>
              </div>
              
              {/* Header Right Action Buttons (Trigger Shuffle & Lock) */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                {squadData.locked && (
                  <span style={{ fontSize: '12px', color: '#0f172a', background: '#f1f5f9', padding: '6px 12px', borderRadius: '50px', fontWeight: '700', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} /> Locked
                  </span>
                )}
                <button 
                  className="btn" 
                  onClick={handleShuffleSquads} 
                  disabled={squadData.locked || isShuffling}
                  style={{
                    background: squadData.locked ? '#f1f5f9' : '#0f172a',
                    color: squadData.locked ? '#94a3b8' : '#ffffff',
                    cursor: squadData.locked ? 'not-allowed' : 'pointer',
                    padding: '8px 16px',
                    fontSize: '12px',
                    margin: 0,
                    borderRadius: '50px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: 'none',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <Users size={14} />
                  {isShuffling ? 'Allocating...' : 'Trigger Shuffle'}
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={handleToggleSquadLock}
                  style={{
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    padding: '8px 16px',
                    fontSize: '12px',
                    margin: 0,
                    borderRadius: '50px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {squadData.locked ? <Unlock size={14} /> : <Lock size={14} />}
                  {squadData.locked ? 'Unlock' : 'Lock Allocations'}
                </button>
              </div>
            </div>

            {/* MASTER REGISTRY OVERVIEW SECTION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Master Registry Overview</h3>
              </div>
              
              <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px' }}>
                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Squad Name</th>
                      <th style={{ width: '35%' }}>Faculty Mentors</th>
                      <th style={{ width: '25%' }}>Designated Squad Leader</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Total Students</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Gender Ratio</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Surya', 'Aditya', 'Ravi', 'Divakar', 'Mitra', 'Martand', 'Dinkar', 'Prabhakar', 'Bhaskar', 'Tejonidhi'].map(squadName => {
                      const squadStudents = squadData.students.filter(s => s.squad === squadName);
                      const squadFaculties = squadData.faculties.filter(f => f.squad === squadName);
                      const girlCount = squadStudents.filter(s => s.gender && s.gender.toLowerCase() === 'female').length;
                      const boyCount = squadStudents.length - girlCount;
                      const squadLeader = (squadData.squadLeaders || []).find(sl => sl.squad_name === squadName);

                      return (
                        <tr key={squadName} style={{ transition: 'all 0.2s' }}>
                          <td style={{ verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                              {squadName}
                            </span>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {squadFaculties.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {squadFaculties.map((f) => (
                                  <span key={f.id} style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                    {f.name} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>({f.department || 'Faculty'})</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', fontWeight: '500' }}>
                                No Mentors Allocated
                              </span>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {squadLeader ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                                  {squadLeader.name}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                  {squadLeader.prn || '-'}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12.5px', color: '#64748b', fontStyle: 'italic' }}>
                                Not Designated
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle', fontSize: '13.5px', color: '#0f172a' }}>
                            {squadStudents.length}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <span style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                F: {girlCount}
                              </span>
                              <span style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                M: {boyCount}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: '700' }}
                              onClick={() => {
                                setSelectedSquad(squadName);
                                document.getElementById('detailed-squad-workspace')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              Inspect Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEPARATOR */}
            <div style={{ borderTop: '2px dashed #e2e8f0', margin: '10px 0' }} />

            {/* DETAILED SQUAD WORKSPACE SECTION */}
            <div id="detailed-squad-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Detailed Squad Workspace</h3>
              </div>

              {/* Dropdown Control Row */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap' }}>Select Squad:</span>
                  <select 
                    value={selectedSquad} 
                    onChange={e => { setSelectedSquad(e.target.value); setSquadStudentSearch(''); }}
                    className="input-field" 
                    style={{ margin: 0, width: isMobile ? '100%' : '240px', padding: '10px 20px', borderRadius: '50px' }}
                  >
                    {['Surya', 'Aditya', 'Ravi', 'Divakar', 'Mitra', 'Martand', 'Dinkar', 'Prabhakar', 'Bhaskar', 'Tejonidhi'].map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                {selectedSquad && (() => {
                  const squadStudents = squadData.students.filter(s => s.squad === selectedSquad);
                  const squadFaculties = squadData.faculties.filter(f => f.squad === selectedSquad);
                  const girlCount = squadStudents.filter(s => s.gender && s.gender.toLowerCase() === 'female').length;
                  const boyCount = squadStudents.length - girlCount;
                  return (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                        Mentors: <span style={{ color: '#0f172a', fontWeight: '400' }}>{squadFaculties.length}</span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                        Students: <span style={{ color: '#0f172a', fontWeight: '400' }}>{squadStudents.length}</span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                        Girls: <span style={{ color: '#0f172a', fontWeight: '400' }}>{girlCount}</span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                        Boys: <span style={{ color: '#0f172a', fontWeight: '400' }}>{boyCount}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Main Workspace Split Layout */}
              {selectedSquad ? (() => {
                const squadName = selectedSquad;
                const squadStudents = squadData.students.filter(s => s.squad === squadName);
                const squadFaculties = squadData.faculties.filter(f => f.squad === squadName);
                const squadLeader = (squadData.squadLeaders || []).find(sl => sl.squad_name === squadName);
                
                // Filter students within the squad based on search box input
                const filteredSquadStudents = squadStudents.filter(s => 
                  s.name.toLowerCase().includes(squadStudentSearch.toLowerCase()) ||
                  (s.prn || '').toLowerCase().includes(squadStudentSearch.toLowerCase()) ||
                  s.email.toLowerCase().includes(squadStudentSearch.toLowerCase())
                );

                return (
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'stretch' }}>
                    
                    {/* Left Column: Mentors & Leader Cards */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '280px' }}>
                      
                      {/* Leader Card */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designated Squad Leader</span>
                        </div>
                        {squadLeader ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{squadLeader.name}</span>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{squadLeader.email}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px', fontSize: '12.5px', color: '#0f172a', fontWeight: '600' }}>
                              <span>PRN: <code style={{ color: '#0f172a', fontFamily: 'monospace' }}>{squadLeader.prn || '-'}</code></span>
                              {squadLeader.phone && <span>Phone: <code style={{ color: '#0f172a', fontFamily: 'monospace' }}>{squadLeader.phone}</code></span>}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', fontWeight: '500' }}>
                            No Squad Leader designated by LTC coordinators yet.
                          </span>
                        )}
                      </div>

                      {/* Mentors Card */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faculty Mentors</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {squadFaculties.length > 0 ? (
                            squadFaculties.map(fac => (
                              <div key={fac.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fac.name}</span>
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{fac.email}</span>
                                <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', marginTop: '4px', fontWeight: '700' }}>
                                  {fac.department || 'Faculty'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                              No Mentors allocated.
                            </span>
                          )}
                          {squadFaculties.length < 2 && (
                            <div style={{ border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Pending Faculty Mentor</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Squad Members Registry Table */}
                    <div style={{ flex: '2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Search and Table Title Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                          Allocated Students Registry ({filteredSquadStudents.length})
                        </h4>
                        {/* Quick Squad Registry Search */}
                        <div style={{ position: 'relative', width: isMobile ? '100%' : '260px' }}>
                          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input 
                            type="text" 
                            placeholder="Search squad members..." 
                            value={squadStudentSearch}
                            onChange={e => setSquadStudentSearch(e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px 12px 8px 34px', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '50px', 
                              fontSize: '13px',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0f172a'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                        </div>
                      </div>

                      {/* Members Table */}
                      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff' }}>
                        <table className="data-table" style={{ margin: 0, width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '40%' }}>Student Name</th>
                              <th style={{ width: '25%' }}>PRN</th>
                              <th style={{ width: '25%' }}>Email Address</th>
                              <th style={{ width: '10%', textAlign: 'center' }}>Gender</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSquadStudents.map(student => {
                              const isFemale = student.gender && student.gender.toLowerCase() === 'female';
                              return (
                                <tr key={student.id}>
                                  <td style={{ fontWeight: '700', color: '#1e293b', fontSize: '13.5px' }}>
                                    {student.name}
                                  </td>
                                  <td style={{ fontSize: '12.5px', color: '#64748b', fontFamily: 'monospace' }}>{student.prn || '-'}</td>
                                  <td style={{ fontSize: '12.5px', color: '#64748b' }}>{student.email}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span 
                                      style={{ 
                                        fontSize: '10.5px', 
                                        background: '#f1f5f9', 
                                        color: '#0f172a', 
                                        border: '1px solid #cbd5e1', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontWeight: '800'
                                      }}
                                    >
                                      {isFemale ? 'FEMALE' : 'MALE'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredSquadStudents.length === 0 && (
                              <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '24px', fontSize: '13px' }}>
                                  {squadStudentSearch ? 'No matching students found in this squad.' : 'No students allocated to this squad.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                );
              })() : (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: '#64748b' }}>Please select a squad from the dropdown to continue.</h3>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'documents' && (
          <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText className="text-primary" />
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Document & SOP Hub</h2>
              </div>
            </div>

            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '32px' }}>
              <input type="text" placeholder="Doc Name (e.g., LTC SOP)" className="input-field" style={{ margin: 0 }} required value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} />
              <input type="text" placeholder="URL Link" className="input-field" style={{ margin: 0 }} required value={docForm.url} onChange={e => setDocForm({ ...docForm, url: e.target.value })} />
              <select className="input-field" style={{ margin: 0, width: isMobile ? '100%' : 'auto' }} value={docForm.target_role} onChange={e => setDocForm({ ...docForm, target_role: e.target.value })}>
                <option value="all">All Roles</option>
                <option value="faculty">Faculty Only</option>
                <option value="student">Students Only</option>
              </select>
              <button type="submit" className="btn" style={{ width: isMobile ? '100%' : 'auto' }}>Share Document</button>
            </form>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Document Title</th><th>Link</th><th>Target Roles</th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>#{d.id}</td><td>{d.name}</td><td><a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View File</a></td><td>{d.target_role}</td>
                    </tr>
                  ))}
                  {documents.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No documents found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isFacultyModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setIsFacultyModalOpen(false)}>&times;</button>
            <h2 style={{ marginBottom: '24px' }}>Assign Faculty</h2>
            <form onSubmit={handleAddFaculty}>
              <input type="text" placeholder="Full Name" className="input-field" required value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} />
              <input type="email" placeholder="Email Address" className="input-field" required value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} />

              <h3 style={{ fontSize: '14px', margin: '16px 0 8px' }}>Organizational Structure</h3>
              <select className="input-field" required value={facultyForm.gender} onChange={e => setFacultyForm({ ...facultyForm, gender: e.target.value })} style={{ marginBottom: '16px' }}>
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" placeholder="Division (e.g. DIV I)" className="input-field" value={facultyForm.division} onChange={e => setFacultyForm({ ...facultyForm, division: e.target.value })} />
              <input type="text" placeholder="School (e.g. SoCSE)" className="input-field" value={facultyForm.school} onChange={e => setFacultyForm({ ...facultyForm, school: e.target.value })} />
              <input type="text" placeholder="Department" className="input-field" required value={facultyForm.department} onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })} />
              <select className="input-field" value={facultyForm.panel} onChange={e => setFacultyForm({ ...facultyForm, panel: e.target.value })}>
                <option value="">-- Select Panel --</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PC">PC</option>
                <option value="PD">PD</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0' }}>
                <input type="checkbox" id="is_primary" checked={facultyForm.is_primary} onChange={e => setFacultyForm({ ...facultyForm, is_primary: e.target.checked })} />
                <label htmlFor="is_primary">Is this a Primary Faculty Member?</label>
              </div>

              <button type="submit" className="btn" style={{ width: '100%' }}>Create Faculty Record</button>
            </form>
          </div>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setIsStudentModalOpen(false)}>&times;</button>
            <h2 style={{ marginBottom: '24px' }}>Onboard Student</h2>
            <form onSubmit={handleAddStudent}>
              <input type="text" placeholder="Full Name" className="input-field" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
              <input type="email" placeholder="Email Address" className="input-field" required value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
              <input type="text" placeholder="PRN (Optional, auto-generated if blank)" className="input-field" value={studentForm.prn} onChange={e => setStudentForm({ ...studentForm, prn: e.target.value })} />
              <input type="text" placeholder="Semester (e.g. 1st)" className="input-field" required value={studentForm.semester} onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })} />

              <h3 style={{ fontSize: '14px', margin: '16px 0 8px' }}>Organizational Structure</h3>
              <select className="input-field" required value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })} style={{ marginBottom: '16px' }}>
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" placeholder="Division (e.g. DIV I)" className="input-field" value={studentForm.division} onChange={e => setStudentForm({ ...studentForm, division: e.target.value })} />
              <input type="text" placeholder="School" className="input-field" value={studentForm.school} onChange={e => setStudentForm({ ...studentForm, school: e.target.value })} />
              <input type="text" placeholder="Department" className="input-field" value={studentForm.department} onChange={e => setStudentForm({ ...studentForm, department: e.target.value })} />
              <select className="input-field" required value={studentForm.panel} onChange={e => setStudentForm({ ...studentForm, panel: e.target.value })}>
                <option value="">-- Select Panel --</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PC">PC</option>
                <option value="PD">PD</option>
              </select>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }}>Onboard to Program</button>
            </form>
          </div>
        </div>
      )}

      {isLtcModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setIsLtcModalOpen(false)}>&times;</button>
            <h2 style={{ marginBottom: '24px' }}>Add LTC Member</h2>
            <form onSubmit={handleAddLtcMember}>
              <input type="text" placeholder="Full Name" className="input-field" required value={ltcForm.name} onChange={e => setLtcForm({ ...ltcForm, name: e.target.value })} />
              <input type="email" placeholder="Email Address" className="input-field" required value={ltcForm.email} onChange={e => setLtcForm({ ...ltcForm, email: e.target.value })} />
              <input type="text" placeholder="Member Type / Role" className="input-field" value={ltcForm.role_type} onChange={e => setLtcForm({ ...ltcForm, role_type: e.target.value })} />
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }}>Add Member</button>
            </form>
          </div>
        </div>
      )}

      {isFeedbackModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setIsFeedbackModalOpen(false)}>&times;</button>

            <div id="feedback-report" style={{ padding: '40px', background: 'white', color: '#333', borderRadius: '8px', border: '1px solid #ddd', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '1px solid #e2e8f0', pointerEvents: 'none' }}></div>

              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #1a365d', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <img src="/ltc.png" alt="LTC Logo" style={{ height: '60px' }} />
                </div>
                <p style={{ color: '#d97706', fontSize: '16px', fontWeight: 'bold' }}>आत्मानं विद्धि</p>
                <h2 style={{ fontSize: '20px', marginTop: '15px', color: '#333', textTransform: 'uppercase' }}>Official Feedback Report</h2>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
                <div>
                  <p><strong>Subject Name:</strong> {selectedUserForFeedback?.name}</p>
                  <p><strong>Subject ID:</strong> #{selectedUserForFeedback?.id}</p>
                  <p><strong>Role:</strong> {selectedUserForFeedback?.role}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> Confidential</p>
                </div>
              </div>

              {feedbackList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                  No feedback records found for this subject.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {feedbackList.map(f => (
                    <div key={f.id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <span><strong>Category:</strong> {f.category || 'General'}</span>
                        <span>{new Date(f.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: '#1e293b', marginBottom: '12px' }}>{f.feedback_text}</p>
                      {f.additional_notes && (
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '13px', color: '#475569' }}>
                          <strong>Additional Notes:</strong> {f.additional_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                <div>
                  <div style={{ width: '200px', borderTop: '1px solid #94a3b8', marginBottom: '5px' }}></div>
                  <p>Authorized Signature</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>© Life Transformation Centre</p>
                  <p>This is a system generated report.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setIsFeedbackModalOpen(false)}>Close</button>
              <button className="btn" onClick={() => window.print()}>
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Scan Room Slip</h3>
               <button onClick={() => { setIsScannerOpen(false); setScannedUser(null); setScanFileImage(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            
            {!scannedUser && (
               <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                 <button className={`btn ${scanMode === 'camera' ? '' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setScanMode('camera')}>Camera</button>
                 <button className={`btn ${scanMode === 'file' ? '' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setScanMode('file')}>Image File</button>
               </div>
            )}

            {!scannedUser && scanMode === 'camera' && (
              <div id="qr-reader" style={{ width: '100%' }}></div>
            )}

            {!scannedUser && scanMode === 'file' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', border: '2px dashed #cbd5e1', padding: '30px', borderRadius: '12px', background: '#f8fafc' }}>
                <div id="qr-reader-file-dummy" style={{ display: 'none' }}></div>
                <UploadCloud size={32} color="#64748b" />
                <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Upload a QR Code image here.</p>
                <input type="file" accept="image/*" onChange={(e) => setScanFileImage(e.target.files[0])} style={{ fontSize: '13px', width: '100%' }} />
                {scanFileImage && (
                  <button className="btn" style={{ width: '100%', marginTop: '8px' }} onClick={handleFileScan}>
                    Scan Uploaded Image
                  </button>
                )}
              </div>
            )}
            {scannedUser && (
               <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                 <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                 <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{scannedUser.name}</h4>
                 <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Email: {scannedUser.email}</p>
                 <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Dept: {scannedUser.department || '-'}</p>
                 
                 <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                   <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold' }}>
                      Squad<br/>{scannedUser.squad || 'Unassigned'}
                   </div>
                   <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold' }}>
                      Room<br/>{scannedUser.room || 'Unassigned'}
                   </div>
                 </div>
                 
                 <button className="btn" style={{ marginTop: '24px', width: '100%' }} onClick={() => {
                     setScannedUser(null);
                     setScanFileImage(null);
                 }}>
                   Scan Another
                 </button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Room Slip Print Modal */}
      {isSlipModalOpen && slipStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Room Slip</h3>
                <button onClick={() => setIsSlipModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
             </div>
             
             <div id="printable-slip" style={{ border: '2px dashed #cbd5e1', padding: '30px', borderRadius: '12px', marginBottom: '24px', background: 'white' }}>
                <img src="/ltc.png" alt="LTC" style={{ height: '40px', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{slipStudent.name}</h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Dept: {slipStudent.department || '-'}</p>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <QRCodeSVG value={`${window.location.protocol}//${window.location.host}/verify?barcode=${slipStudent.barcode}`} size={150} />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                   <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '45%' }}>
                      <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Squad</p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{slipStudent.squad || '-'}</p>
                   </div>
                   <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '45%' }}>
                      <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Room</p>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{slipStudent.room || '-'}</p>
                   </div>
                </div>
             </div>
             
             <button className="btn" style={{ width: '100%' }} onClick={() => {
                const doc = document.getElementById('printable-slip').outerHTML;
                const win = window.open('', '', 'width=800,height=600');
                win.document.write('<html><head><title>Print Slip</title><style>body { font-family: sans-serif; text-align: center; padding: 40px; } </style></head><body>' + doc + '<script>window.print(); setTimeout(()=>window.close(), 1000);</script></body></html>');
                win.document.close();
             }}>
               <Printer size={18} /> Print Slip
             </button>
          </div>
        </div>
      )}
      {/* Student Onboarding Forms Modal */}
      {isFormsModalOpen && selectedStudentForms && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '32px', background: 'white', borderRadius: '16px', color: '#1e293b', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Onboarding Forms: {selectedStudentForms.name}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsFormsModalOpen(false)}><X /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Insurance */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#6366f1', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>🛡️ Insurance Details</h4>
                {selectedStudentForms.insured ? (
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                    <p style={{ margin: '4px 0' }}><strong>Provider:</strong> {selectedStudentForms.provider || 'N/A'}</p>
                    <p style={{ margin: '4px 0' }}><strong>Policy Number:</strong> {selectedStudentForms.policy_number || 'N/A'}</p>
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ef4444' }}>Not Submitted Yet</p>
                )}
              </div>

              {/* Undertaking */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#6366f1', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>📝 Signed Undertaking</h4>
                {selectedStudentForms.undertaking_submitted ? (
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                    <p style={{ margin: '4px 0' }}><strong>Signed Name:</strong> {selectedStudentForms.undertaking_signed_name || 'N/A'}</p>
                    <p style={{ margin: '4px 0' }}><strong>Signed Date:</strong> {selectedStudentForms.undertaking_signed_date || 'N/A'}</p>
                    <div style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '8px', borderRadius: '6px' }}>
                      "I hereby solemnly declare and undertake that I will adhere to all the rules, guidelines, and disciplinary standard practices set forth by the LTC program coordinators..."
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ef4444' }}>Not Signed Yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <ScrollToTop />
    </div>
  )
}
