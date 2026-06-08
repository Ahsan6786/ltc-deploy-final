import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, BarChart3, Globe, Leaf, Dumbbell, Flag, Sparkles } from 'lucide-react'
import ScrollToTop from './ScrollToTop'

export default function Home() {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div className="animate-fade-in" style={{ fontFamily: '"Inter", sans-serif', background: '#f8fafc' }}>
      
      {/* INJECTED CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .premium-card {
          position: relative;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3) !important;
        }
        .gradient-text-gold {
          background: linear-gradient(135deg, #e59a2a 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gradient-text-blue {
          background: linear-gradient(135deg, #2b76b9 0%, #34a8f3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .translate-btn:hover {
          background: #2b76b9 !important;
          color: white !important;
        }
        .animated-pill {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .animated-pill:hover {
          transform: translateY(-5px) scale(1.02);
        }
        .pill-green:hover { box-shadow: 0 15px 30px rgba(112, 179, 67, 0.4); }
        .pill-orange:hover { box-shadow: 0 15px 30px rgba(217, 94, 58, 0.4); }
        .pill-blue:hover { box-shadow: 0 15px 30px rgba(52, 168, 243, 0.4); }
        .pill-yellow:hover { box-shadow: 0 15px 30px rgba(245, 158, 11, 0.4); }
        .pill-purple:hover { box-shadow: 0 15px 30px rgba(168, 85, 247, 0.4); }
        
        @media (max-width: 768px) {
          .join-btn {
            padding: 10px 25px !important;
            font-size: 14px !important;
          }
          .nowrap-desktop {
            white-space: normal !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .mobile-auto-height {
            height: auto !important;
          }
          .popout-image-container {
            position: static !important;
            margin-top: 20px;
            display: flex;
            justify-content: center;
          }
          .popout-image {
            position: static !important;
            height: 300px !important;
            width: auto !important;
          }
          .footer-newsletter {
            grid-column: span 1 !important;
          }
        }
      `}</style>

      {/* RESTORED: Original Video Hero Section */}
      <div className="hero-section" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <video autoPlay loop muted playsInline className="hero-video" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <source src="/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}></div>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '20px',
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 10
        }}>
          <p style={{ fontSize: '28px', fontWeight: '700', marginBottom: '15px', color: '#f59e0b', width: '100%', textAlign: 'center' }}>"मितं हितं"</p>
          
          <div className="nowrap-desktop" style={{ 
            background: 'transparent', 
            border: 'none', 
            padding: '15px 30px', 
            borderRadius: '12px', 
            maxWidth: '1000px', 
            marginBottom: '20px', 
            fontSize: '14px',
            color: '#f59e0b',
            fontWeight: '600',
            margin: '0 auto 20px auto',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap'
          }}>
            Embracing minimalism and inquiry-based learning to stimulate sustainable development
          </div>

          <p style={{ fontSize: '16px', marginBottom: '10px', width: '100%', textAlign: 'center' }}>
            Transforming students to empower Bharat and the World
          </p>

          <h1 className="nowrap-desktop" style={{ fontSize: isMobile ? '24px' : '42px', fontWeight: '800', marginBottom: '20px', maxWidth: 'none', margin: '0 auto 20px auto', width: '100%', textAlign: 'center', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
            Life Transformation Centre Boribel Pune
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '15px', marginTop: '40px' }}>
            <Link to="/login" className="animated-pill join-btn" style={{ 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: 'white', 
              padding: '26px 50px', 
              borderRadius: '50px', 
              textDecoration: 'none', 
              fontWeight: '800', 
              fontSize: '18px', 
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
              display: 'inline-block'
            }}>
              Join the Life Realisation Program
            </Link>
          </div>

          <p style={{ fontSize: '18px', color: 'white', width: '100%', textAlign: 'center', fontWeight: '500', marginTop: '10px' }}>
            'First such initiative for education in Bharat'
          </p>
        </div>
      </div>

      {/* Vision & Mission Section */}
      <div style={{ backgroundColor: '#f8fafc', padding: isMobile ? '80px 20px' : '120px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Vision Card */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: isMobile ? '30px' : '50px', 
            borderRadius: '24px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)', 
            border: '1px solid rgba(0,0,0,0.03)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Pattern Accent */}
            <img src="/pattern2.png" alt="" style={{ position: 'absolute', top: '20px', left: '20px', height: '60px', opacity: 0.8 }} />
            
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '3px' }}>Our Direction</span>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '10px 0 20px' }}>Vision</h2>
            <div style={{ width: '60px', height: '4px', background: '#f59e0b', margin: '0 auto 30px' }}></div>
            
            <p style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#1d4ed8', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.6' }}>
              “Transforming students to empower Bharat and the World”
            </p>
            <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1d4ed8', fontStyle: 'italic', lineHeight: '1.6' }}>
              “सशक्त भारत और विश्व के निर्माण के लिए हर युवा का परिवर्तन”
            </p>
          </div>

          {/* Mission Card */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: isMobile ? '30px' : '50px', 
            borderRadius: '24px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)', 
            border: '1px solid rgba(0,0,0,0.03)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Pattern Accent */}
            <img src="/pattern2.png" alt="" style={{ position: 'absolute', top: '20px', left: '20px', height: '60px', opacity: 0.8 }} />
            
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '3px' }}>Our Purpose</span>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '10px 0 20px' }}>Mission</h2>
            <div style={{ width: '60px', height: '4px', background: '#f59e0b', margin: '0 auto 30px' }}></div>
            
            <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1d4ed8', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto 15px' }}>
              “Transforming lives by shaping experiences in Agriculture & Nature, Physical Fitness & Sports, Team Building & Leadership, Patriotism & Nation Building, & Spirituality and Peace.”
            </p>
            <p style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1d4ed8', fontStyle: 'italic', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto' }}>
              “कृषि और प्रकृति, शारीरिक स्वास्थ्य और खेल, संघ निर्माण और नेतृत्व, देशभक्ति और राष्ट्र निर्माण, तथा आध्यात्मिक और शांति के विशेष अनुभव द्वारा जीवन का परिवर्तन”
            </p>
          </div>

        </div>
      </div>



      {/* OUT OF THE WORLD CARDS SECTION */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '80px' }}>
        
        {/* Card 1: INSPIRATION */}
        <div className="premium-card" style={{ 
          background: 'linear-gradient(135deg, #0a0f1d 0%, #1a233a 100%)', /* Dark gradient */
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : 'row',
          gridTemplateColumns: isMobile ? 'none' : '1.1fr 1.9fr',
          alignItems: 'center',
          position: 'relative',
          marginTop: isMobile ? '20px' : '40px'
        }}>
          {/* Image Container - Floating & Popping Out */}
          <div style={{ 
            padding: isMobile ? '20px 20px 0 20px' : '0', 
            height: isMobile ? '350px' : '110%', 
            width: isMobile ? '100%' : 'auto',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            left: isMobile ? '0' : '-40px', 
            zIndex: 10
          }}>
            <div style={{ 
              width: isMobile ? '100%' : '100%', 
              height: '100%', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.25)', /* Heavy shadow for depth */
              background: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.6)',
              position: 'relative'
            }}>
              <img 
                src="/vishwanathsir.png" 
                alt="Prof. Dr. Vishwanath D. Karad" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=Inspiration'; }} 
              />
              {/* Glossy reflection overlay */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%)',
                pointerEvents: 'none'
              }}></div>
            </div>
          </div>

          {/* Content Container */}
          <div style={{ padding: isMobile ? '20px 20px' : '40px 50px 40px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '800', 
              color: '#f59e0b', /* Yellow Label */
              textTransform: 'uppercase', 
              letterSpacing: '3px',
              marginBottom: '10px',
              display: 'block'
            }}>
              INSPIRATION
            </span>
            
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '25px', lineHeight: 1.2, color: '#ffffff' }}>
              Blessed and Inspired By:
            </h2>
            
            {/* Profile 1 */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: 0, fontWeight: '800', color: '#f59e0b', fontSize: '22px' }}>Prof. Dr. Vishwanath D. Karad</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>Founder & Chief Patron, MAEER's MIT, Pune</p>
              <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8' }}>President, MIT World Peace University</p>
            </div>

            {/* Profile 2 */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ margin: 0, fontWeight: '800', color: '#f59e0b', fontSize: '22px' }}>Late Smt. Urmilatai Karad</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>Senior Poetess and Writer</p>
            </div>

            {/* Quote/Text */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-25px', left: '-15px', fontSize: '70px', color: 'rgba(255,255,255,0.05)', fontFamily: 'serif' }}>“</span>
              <p style={{ 
                color: '#cbd5e1', /* Light gray text */
                fontSize: '16px', 
                lineHeight: '1.8', 
                fontWeight: '500',
                position: 'relative',
                zIndex: 1,
                textAlign: 'justify'
              }}>
                Inspired by Vision. Rooted in Compassion. Moved by a deep commitment to holistic education and cultural enrichment, their vision shaped an ecosystem where learning is accessible, value-based, and transformative. This collective inspiration laid the foundation for institutions that nurture intellect, character, and service to society — contributing significantly to India’s educational journey.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: VISIONARY */}
        <div className="premium-card" style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', /* Deep blue to purple-black */
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : 'row',
          gridTemplateColumns: isMobile ? 'none' : '1.1fr 1.9fr',
          alignItems: 'center',
          position: 'relative',
          marginTop: isMobile ? '20px' : '40px'
        }}>
          {/* Image Container - Floating & Popping Out (Like Card 1) */}
          <div style={{ 
            padding: isMobile ? '20px 20px 0 20px' : '0', 
            height: isMobile ? '350px' : '110%', 
            width: isMobile ? '100%' : 'auto',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            left: isMobile ? '0' : '-40px', 
            zIndex: 10
          }}>
            <div style={{ 
              width: isMobile ? '100%' : '100%', 
              height: '100%', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.25)', 
              background: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.6)', 
              position: 'relative'
            }}>
              <img 
                src="/rahulsir.png" 
                alt="Dr. Rahul V. Karad" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=Visionary'; }} 
              />
              {/* Glossy reflection overlay */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%)',
                pointerEvents: 'none'
              }}></div>
            </div>
          </div>

          {/* Content Container (Padding reduced to shrink card) */}
          <div style={{ padding: isMobile ? '20px 20px' : '25px 35px 25px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '800', 
              color: '#60a5fa', /* Light Blue Label */
              textTransform: 'uppercase', 
              letterSpacing: '3px',
              marginBottom: '10px',
              display: 'block'
            }}>
              VISIONARY
            </span>
            
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '25px', lineHeight: 1.2, color: '#ffffff' }}>
              Vision of LTC by:
            </h2>
            
            {/* Profile */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: 0, fontWeight: '800', color: '#f59e0b', fontSize: '24px' }}>Dr. Rahul V. Karad</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>Educationist</p>
              <p style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Founder, Life Transformation Centre</p>
              
              <Link to="/founders-message" className="animated-pill" style={{ 
                display: 'inline-block',
                marginTop: '20px',
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '700',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.3s'
              }}>
                Read founder's message <ArrowRight size={16} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </Link>
            </div>

            {/* Sanskrit Quote with Translate Button */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '15px 25px',
              borderRadius: '10px',
              marginBottom: '20px',
              borderLeft: '4px solid #60a5fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px'
            }}>
              <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0, flex: 1 }}>
                {showTranslation ? '"Mother and motherland are superior even to heaven."' : '"जननी जन्मभूमिश्च स्वर्गादपि गरीयसी...!"'}
              </p>
              <button 
                className="translate-btn"
                onClick={() => setShowTranslation(!showTranslation)}
                style={{
                  background: 'transparent',
                  border: '1px solid #60a5fa',
                  color: '#60a5fa',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Globe size={14} />
                {showTranslation ? 'Original' : 'Translate'}
              </button>
            </div>

            {/* Text area styled cleanly */}
            <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', fontWeight: '500', textAlign: 'justify' }}>
              <p style={{ marginBottom: '12px' }}>
                Inspired from the vision of my mother, Late Smt. Urmilatai Karad, a distinguished poet, writer and pioneer who believed that education blossoms when it nourishes the whole being, at LTC, we honour her legacy by creating vibrant and transformative spaces where experiential learning meets timeless wisdom, youth are empowered to discover their infinite potential while reconnecting them with community life and nature.
              </p>
              <p style={{ marginBottom: '12px' }}>
                We at LTC, believe that the integration of agriculture and nature, physical fitness and sports, leadership and team building, spirituality and wisdom and patriotism and nation building, with mainstream education is essential for transforming one's life towards making it meaningful and rewarding for oneself and all.
              </p>
              <p style={{ marginBottom: '12px', fontWeight: '700', color: '#ffffff' }}>
                Be open in mind and at heart to the journey that awaits you. A journey to dream of a better future and build it too.
              </p>
              <p style={{ fontWeight: '700', color: '#60a5fa', fontStyle: 'italic' }}>
                Let us walk this path together with resolve, reverence, and responsibility.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Video Section */}
      <div style={{ background: '#f8fafc', padding: '140px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Video Title */}
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#0f172a', 
            marginBottom: '40px', 
            textAlign: 'center',
            lineHeight: 1.2
          }}>
            Life Transformation Centre Concept Film
          </h2>

          <div style={{ 
            background: 'white', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe 
                src="https://www.youtube.com/embed/mK1Oa4dsf8c?start=5" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div style={{ background: 'white', padding: '140px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          {/* Pattern Accent */}
          <img src="/pattern2.png" alt="" style={{ position: 'absolute', top: '-40px', left: '0', height: '60px', opacity: 0.8 }} />
          
          <p style={{ 
            color: '#1d4ed8', /* Vibrant Blue */
            fontSize: '22px', 
            fontWeight: '700', 
            fontStyle: 'italic',
            lineHeight: '1.6',
            marginBottom: '15px'
          }}>
            “The Self is the real book. You can glance anywhere in that book; nobody can take it away from you. Whenever you are free, turn towards the Self. Thereafter you may read whatever you like.”
          </p>
          <div style={{ textAlign: 'right', paddingRight: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '16px', display: 'inline-block' }}>— Ramana Maharishi</p>
          </div>
        </div>
      </div>

      {/* Main Content Section (Soul to Soil) */}
      <div style={{ 
        background: 'white',
        padding: '160px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Heading - Centered */}
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '900', 
            color: '#0f172a', 
            marginBottom: '20px',
            lineHeight: 1.2,
            textAlign: 'center'
          }}>
            Connecting the <span className="gradient-text-blue">Soul</span> to the <span className="gradient-text-gold">Soil</span>
          </h1>

          {/* Paragraph 1 - Full Width */}
          <p style={{ color: '#1e293b', fontSize: '16px', lineHeight: '1.8', marginBottom: '40px', textAlign: 'justify' }}>
            LTC envisions nurturing <strong>Vijigīṣū Jīvanavādī Yuvān (विजिगीषु जीवनवादी युवा)</strong> Young seekers who are life affirming, victory oriented, and driven by a luminous inner purpose to inspire meaningful, positive change in the world. The five day residential LRP inspires a deeper awakening in young minds by enriching multiple dimensions of life ranging from a harmonious connection with Agriculture and Nature, the revitalizing force of Physical Fitness and Sports, and the passionate drive for Patriotism and Nation Building, to the collaborative strength of Teamwork and Leadership, and the serene depth of Spirituality.
          </p>

          {/* Grid Layout below */}
          <div className="responsive-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '60px',
            alignItems: 'center'
          }}>
            
            {/* Left Side - Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ color: '#1e293b', fontSize: '16px', lineHeight: '1.8', textAlign: 'justify' }}>
                At the heart of Life Transformation Centre is our guiding principle: <strong>“Connecting the Soul to the Soil”</strong>, A deep commitment to nurturing resilient, mindful individuals who discover their dharma and contribute meaningfully to the world.
              </p>
              <p style={{ color: '#1e293b', fontSize: '16px', lineHeight: '1.8', textAlign: 'justify' }}>
                Rooted in the timeless wisdom of Bhartiya values, LTC seeks to integrate ancient insight with modern life, empowering individuals to grow into compassionate, self-aware leaders.
              </p>
              <p style={{ color: '#1e293b', fontSize: '16px', lineHeight: '1.8', textAlign: 'justify' }}>
                Together, we envision a more harmonious and awakened society where deep connection sparks a legacy of purposeful action and lasting change.
              </p>
            </div>

            {/* Right Side - Colored Blocks (Animated & Interactive) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Green Block */}
              <div className="animated-pill pill-green" style={{ background: '#70b343', color: 'white', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}><Leaf size={18} /></span>
                <span>A harmonious connection with Agriculture and Nature</span>
              </div>

              {/* Orange Block */}
              <div className="animated-pill pill-orange" style={{ background: '#d95e3a', color: 'white', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}><Dumbbell size={18} /></span>
                <span>The revitalizing power of Physical Fitness and Traditional Sports</span>
              </div>

              {/* Blue Block */}
              <div className="animated-pill pill-blue" style={{ background: '#34a8f3', color: 'white', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}><Users size={18} /></span>
                <span>The strength of Teamwork and Empathetic Leadership</span>
              </div>

              {/* Yellow Block */}
              <div className="animated-pill pill-yellow" style={{ background: '#f59e0b', color: 'white', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}><Flag size={18} /></span>
                <span>A deep sense of Patriotism and Nation-Building</span>
              </div>

              {/* Purple Block */}
              <div className="animated-pill pill-purple" style={{ background: '#a855f7', color: 'white', padding: '16px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}><Sparkles size={18} /></span>
                <span>And the calming depth of Spirituality and Inner Awareness</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Pop-out Quote Section (Prof. Dr. Vishwanath D. Karad) */}
      <div style={{ position: 'relative', background: 'white', padding: '80px 0' }}>
        
        {/* Orange Band */}
        <div style={{ 
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', 
          height: isMobile ? 'auto' : '320px', 
          padding: isMobile ? '40px 0' : '0',
          display: 'flex', 
          alignItems: 'center',
          position: 'relative'
        }}>
          
          <div className="responsive-grid" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: isMobile ? 'flex' : 'grid', flexDirection: isMobile ? 'column' : 'row', gridTemplateColumns: isMobile ? 'none' : '1.8fr 1.2fr', alignItems: 'center' }}>
            
            {/* Left: Quote */}
            <div style={{ color: 'white', padding: isMobile ? '20px' : '0 0 0 60px', textAlign: isMobile ? 'center' : 'left' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', fontStyle: 'italic', marginBottom: '15px', lineHeight: 1.4 }}>
                “History is changed not by power, but by passion guided with purpose”
              </p>
              <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>
                — Prof. Dr. Vishwanath D. Karad
              </p>
            </div>

            {/* Right: Image Container */}
            <div className="mobile-auto-height" style={{ position: 'relative', height: isMobile ? '350px' : '320px', width: isMobile ? '100%' : 'auto', marginTop: isMobile ? '20px' : '0' }}>
              
              {/* Absolute Image popping out */}
              <div className="popout-image-container" style={{ 
                position: isMobile ? 'relative' : 'absolute', 
                bottom: isMobile ? '0' : '-80px', 
                right: isMobile ? '0' : '40px',
                height: isMobile ? '350px' : '550px', 
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                width: isMobile ? '100%' : 'auto'
              }}>
                <img className="popout-image"
                  src="/Prof-Dr-Vishwanath-Karad.png" 
                  alt="Prof. Dr. Vishwanath D. Karad" 
                  style={{ height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Leaves Graphic (Simulated) */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', opacity: 0.3, display: 'flex', gap: '5px', transform: 'rotate(-45deg)' }}>
                <Leaf size={24} color="white" />
                <Leaf size={24} color="white" />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer style={{ background: '#000', color: 'white', padding: '60px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Grid Pattern Background */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.5
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Top Row: Logo and Socials */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
            {/* Logo area */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/ltc.png" alt="LTC Logo" style={{ height: '50px', objectFit: 'contain' }} />
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '20px', color: '#94a3b8' }}>
              <Globe size={20} style={{ cursor: 'pointer' }} />
              <span style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>FB</span>
              <span style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>IG</span>
              <span style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>X</span>
              <span style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>YT</span>
              <span style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>IN</span>
            </div>
          </div>

          {/* Grid Row: Columns and Newsletter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '40px' }}>
            
            {/* About Us */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>About Us</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
                <li style={{ cursor: 'pointer' }}>What is LTC</li>
                <li style={{ cursor: 'pointer' }}>Roots at MIT-WPU</li>
                <li style={{ cursor: 'pointer' }}>Philosophy: Soil to Soul</li>
                <li style={{ cursor: 'pointer' }}>The Sacred Yajña</li>
                <li style={{ cursor: 'pointer' }}>What Makes LTC Unique</li>
                <li style={{ cursor: 'pointer' }}>Anubhavāmṛta Sevita</li>
                <li style={{ cursor: 'pointer' }}>Rooted in Bharat</li>
                <li style={{ cursor: 'pointer' }}>The Birth of a Movement</li>
                <li style={{ cursor: 'pointer' }}>NEP 2020</li>
              </ul>
            </div>

            {/* Program */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Program</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
                <li style={{ cursor: 'pointer' }}>What is LRP</li>
                <li style={{ cursor: 'pointer' }}>Program Pedagogy</li>
                <li style={{ cursor: 'pointer' }}>Experiential Learning</li>
                <li style={{ cursor: 'pointer' }}>Code of Conduct</li>
              </ul>
            </div>

            {/* Five Pillars */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Five Pillars</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
                <li style={{ cursor: 'pointer' }}>Agriculture & Nature</li>
                <li style={{ cursor: 'pointer' }}>Physical Fitness & Sports</li>
                <li style={{ cursor: 'pointer' }}>Team Building & Leadership</li>
                <li style={{ cursor: 'pointer' }}>Patriotism & Nation Building</li>
                <li style={{ cursor: 'pointer' }}>Spirituality & Peace</li>
              </ul>
            </div>

            {/* Campus */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Campus</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
                <li style={{ cursor: 'pointer' }}>Learning & Reflection Spaces</li>
                <li style={{ cursor: 'pointer' }}>Spaces for Inner & Outer Growth</li>
                <li style={{ cursor: 'pointer' }}>Living & Wellness Facilities</li>
                <li style={{ cursor: 'pointer' }}>Map Zone 2</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact</h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
                <li style={{ cursor: 'pointer' }}>Send Us a Message</li>
                <li style={{ cursor: 'pointer' }}>FAQs</li>
                <li style={{ cursor: 'pointer' }}>Address Details</li>
                <li style={{ cursor: 'pointer' }}>Google Map</li>
              </ul>
            </div>

            {/* Newsletter */}
            <div style={{ gridColumn: 'span 2' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '15px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>Newsletter Signup</h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px', lineHeight: '1.6' }}>By subscribing to our mailing list you will always be updated with the latest news from us.</p>
              <div style={{ display: 'flex', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
                <input type="email" placeholder="Enter your Email" style={{ flex: 1, padding: '10px 15px', border: 'none', outline: 'none', color: '#000', fontSize: '14px' }} />
                <button style={{ background: '#000', border: 'none', padding: '0 15px', cursor: 'pointer', color: '#fff' }}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '40px', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            &copy; {new Date().getFullYear()} Life Transformation Centre Daund. All rights reserved.
          </div>

        </div>
      </footer>
      </div>
      <ScrollToTop />
    </>
  )
}
