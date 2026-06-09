import React, { useState } from 'react'
import { Calendar, MapPin, Clock, Compass, BookOpen, Shield, Target } from 'lucide-react'

export default function TimetablePanel() {
  const [filter, setFilter] = useState('all')

  const daysData = [
    {
      day: 1,
      phase: 'Rural Immersion',
      title: 'Orientation & Village Transit',
      time: '08:00 AM - 05:00 PM',
      location: 'Base Campus to Rural Cluster',
      description: 'Pre-immersion briefing, travel to host village, community welcome, and local orientation.',
      color: '#10b981', // green
      icon: Compass
    },
    {
      day: 2,
      phase: 'Rural Immersion',
      title: 'Village Survey & Community Mapping',
      time: '09:00 AM - 04:30 PM',
      location: 'Village Panchayats & Farms',
      description: 'Conducting socio-economic surveys, mapping rural infrastructure, and visiting local agriculture sites.',
      color: '#10b981',
      icon: MapPin
    },
    {
      day: 3,
      phase: 'Rural Immersion',
      title: 'Agro-Ecology & School Interaction',
      time: '09:30 AM - 05:00 PM',
      location: 'Primary School & Field Sites',
      description: 'Hands-on farming experience, interact with local schools, and compile community reflection reports.',
      color: '#10b981',
      icon: BookOpen
    },
    {
      day: 4,
      phase: 'National Immersion',
      title: 'Delhi Tech Summit & Industry Visit',
      time: '09:00 AM - 06:00 PM',
      location: 'Delhi Innovation Hub & Corporate Office',
      description: 'Exclusive tour of high-tech manufacturing facility, followed by attendance at the Tech Leaders Summit.',
      color: '#2563eb', // blue
      icon: Target
    },
    {
      day: 5,
      phase: 'National Immersion',
      title: 'Indian Heritage Tour & Cultural Analysis',
      time: '09:30 AM - 05:30 PM',
      location: 'National Historical Monuments & Museum',
      description: 'Guided tour of historical architecture, research on national heritage, and evening cultural synthesis program.',
      color: '#2563eb',
      icon: Shield
    },
    {
      day: 6,
      phase: 'National Immersion',
      title: 'Governance & Public Policy Workshop',
      time: '10:00 AM - 04:00 PM',
      location: 'National Institute of Administration',
      description: 'Interactions with policy makers, seminars on public administration and socio-economic governance.',
      color: '#2563eb',
      icon: BookOpen
    },
    {
      day: 7,
      phase: 'National Immersion',
      title: 'Capstone Presentation & Feedback',
      time: '09:00 AM - 02:00 PM',
      location: 'Grand Seminar Hall',
      description: 'Squad-wise presentations of learnings, evaluation by external jury, and valedictory ceremony.',
      color: '#2563eb',
      icon: Calendar
    }
  ]

  const filteredDays = daysData.filter(d => {
    if (filter === 'rural') return d.phase === 'Rural Immersion'
    if (filter === 'national') return d.phase === 'National Immersion'
    return true
  })

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} style={{ color: '#2563eb' }} />
          Immersion Program Timetable
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Overview of the 7-day academic immersion including Rural and National segments.
        </p>
      </div>

      {/* Segment Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer',
            border: filter === 'all' ? 'none' : '1px solid #e2e8f0',
            background: filter === 'all' ? '#0a082c' : '#ffffff',
            color: filter === 'all' ? '#ffffff' : '#475569',
            transition: 'all 0.2s ease',
            boxShadow: filter === 'all' ? '0 4px 12px rgba(10, 8, 44, 0.15)' : 'none'
          }}
        >
          All 7 Days
        </button>
        <button 
          onClick={() => setFilter('rural')}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer',
            border: filter === 'rural' ? 'none' : '1px solid #10b981',
            background: filter === 'rural' ? '#10b981' : '#ffffff',
            color: filter === 'rural' ? '#ffffff' : '#10b981',
            transition: 'all 0.2s ease',
            boxShadow: filter === 'rural' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
          }}
        >
          Rural Immersion (Days 1-3)
        </button>
        <button 
          onClick={() => setFilter('national')}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer',
            border: filter === 'national' ? 'none' : '1px solid #2563eb',
            background: filter === 'national' ? '#2563eb' : '#ffffff',
            color: filter === 'national' ? '#ffffff' : '#2563eb',
            transition: 'all 0.2s ease',
            boxShadow: filter === 'national' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none'
          }}
        >
          National Immersion (Days 4-7)
        </button>
      </div>

      {/* Grid of Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredDays.map(item => {
          const IconComponent = item.icon
          return (
            <div 
              key={item.day}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${item.phase === 'Rural Immersion' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`,
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.02)'
              }}
            >
              {/* Colored side indicator */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: item.color }} />

              {/* Day & Phase Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Day {item.day}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: item.phase === 'Rural Immersion' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                  color: item.color
                }}>
                  {item.phase}
                </span>
              </div>

              {/* Title & Icon */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ background: item.phase === 'Rural Immersion' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.1)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComponent size={18} style={{ color: item.color }} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0, lineHeight: '1.3' }}>
                  {item.title}
                </h4>
              </div>

              {/* Time & Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} />
                  <span>{item.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={12} />
                  <span>{item.location}</span>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
