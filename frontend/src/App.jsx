import React, { useState, useEffect } from 'react';
import { Bot, LogIn, LogOut, LayoutDashboard, Shield, Clipboard, GraduationCap, Menu, X } from 'lucide-react';
import StudentPortal from './components/StudentPortal';
import ChatbotWidget from './components/ChatbotWidget';
import Login from './components/Login';
import FacultyPortal from './components/FacultyPortal';
import AdminPortal from './components/AdminPortal';
import SuperAdminPortal from './components/SuperAdminPortal';
import logoImage from './assets/logo.png';
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').trim();
const API_URL = (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`).replace(/\/+$/, '');

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ems_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ems_user')) || null);
  const [currentView, setCurrentView] = useState('student'); // 'student', 'login', 'faculty', 'admin', 'superadmin'
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('ems_token', token);
      localStorage.setItem('ems_user', JSON.stringify(user));
      // Auto redirect to correct portal based on role
      if (user.role === 'super_admin') {
        setCurrentView('superadmin');
      } else if (user.role === 'admin') {
        setCurrentView('admin');
      } else if (user.role === 'faculty') {
        setCurrentView('faculty');
      }
    } else {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
    }
  }, [token, user]);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    setCurrentView('student');
  };

  return (
    <div className="min-vh-100 d-flex flex-column gradient-bg-main">

      {/* Global Navigation Bar */}
      <nav
        className="navbar navbar-dark shadow-sm py-2 py-md-3"
        style={{
          background: 'linear-gradient(90deg, #1ca9c9, #0047ab)',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <div className="container px-2 px-sm-3">
          <div className="d-flex align-items-center justify-content-between w-100">
            {/* Brand Logo & College Title */}
            <div
              onClick={() => { setCurrentView('student'); setIsNavOpen(false); }}
              className="navbar-brand d-flex align-items-center gap-2 gap-sm-3 m-0 text-white"
              style={{ cursor: 'pointer', maxWidth: 'calc(100% - 130px)', minWidth: 0 }}
            >
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 'clamp(42px, 8vw, 58px)',
                  height: 'clamp(42px, 8vw, 58px)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={logoImage}
                  alt="College Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                <span
                  className="text-white-50 text-uppercase fw-semibold font-monospace"
                  style={{ fontSize: 'clamp(0.6rem, 1.6vw, 0.78rem)', letterSpacing: '0.4px', lineHeight: 1.2 }}
                >
                  Rayat Shikshan Sanstha's
                </span>
                <span
                  className="text-warning fw-bold lh-sm text-truncate"
                  style={{ fontSize: 'clamp(0.85rem, 2.2vw, 1.15rem)' }}
                >
                  <span className="d-none d-lg-inline">Karmaveer Bhaurao Patil Institute Of Management Studies and Research</span>
                  <span className="d-none d-sm-inline d-lg-none">KBP Institute of Management Studies & Research</span>
                  <span className="d-inline d-sm-none">KBPIMSR, Satara</span>
                </span>
              </div>
            </div>

            {/* Right-Side Actions */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              {/* Desktop View Switchers for Staff */}
              {token && user && (
                <div className="d-none d-lg-flex align-items-center gap-2">
                  {user.role === 'super_admin' && (
                    <button
                      onClick={() => setCurrentView('superadmin')}
                      className={`btn btn-sm ${currentView === 'superadmin' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-1`}
                    >
                      <Shield size={14} /> Super Admin
                    </button>
                  )}

                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`btn btn-sm ${currentView === 'admin' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-1`}
                    >
                      <LayoutDashboard size={14} /> Analytics
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentView('faculty')}
                    className={`btn btn-sm ${currentView === 'faculty' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-1`}
                  >
                    <Clipboard size={14} /> Faculty Workspace
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 bg-white bg-opacity-10 border-danger text-white"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}

              {/* Login / Switch to Student Enquiry (Logged Out) */}
              {!token && (
                currentView === 'student' ? (
                  <button
                    onClick={() => setCurrentView('login')}
                    className="btn btn-nav-glass btn-sm d-flex align-items-center gap-1 px-2 px-sm-3 py-1"
                  >
                    <LogIn size={15} /> <span>Staff Sign In</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('student')}
                    className="btn btn-nav-gold btn-sm d-flex align-items-center gap-1 px-2 px-sm-3 py-1"
                  >
                    <GraduationCap size={15} /> <span>Student Enquiry</span>
                  </button>
                )
              )}

              {/* Mobile Menu Toggle Button (when logged in) */}
              {token && user && (
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="btn btn-nav-glass btn-sm d-lg-none d-flex align-items-center justify-content-center p-2"
                  aria-label="Toggle navigation menu"
                >
                  {isNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Collapsible Drawer for Staff */}
          {token && user && isNavOpen && (
            <div className="d-lg-none w-100 pt-3 pb-2 mt-2 border-top border-white border-opacity-25 animate-fade-in-up">
              <div className="d-flex flex-column gap-2">
                <div className="text-white-50 small mb-1 px-1">
                  Signed in as <strong className="text-white">{user.first_name || user.username}</strong> ({user.role})
                </div>

                {user.role === 'super_admin' && (
                  <button
                    onClick={() => { setCurrentView('superadmin'); setIsNavOpen(false); }}
                    className={`btn btn-sm w-100 text-start ${currentView === 'superadmin' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-2 py-2`}
                  >
                    <Shield size={16} /> Super Admin Portal
                  </button>
                )}

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <button
                    onClick={() => { setCurrentView('admin'); setIsNavOpen(false); }}
                    className={`btn btn-sm w-100 text-start ${currentView === 'admin' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-2 py-2`}
                  >
                    <LayoutDashboard size={16} /> Analytics Dashboard
                  </button>
                )}

                <button
                  onClick={() => { setCurrentView('faculty'); setIsNavOpen(false); }}
                  className={`btn btn-sm w-100 text-start ${currentView === 'faculty' ? 'btn-nav-gold' : 'btn-nav-glass'} d-flex align-items-center gap-2 py-2`}
                >
                  <Clipboard size={16} /> Faculty Workspace
                </button>

                <button
                  onClick={() => { handleSignOut(); setIsNavOpen(false); }}
                  className="btn btn-outline-danger btn-sm w-100 text-start d-flex align-items-center gap-2 py-2 mt-1 bg-white bg-opacity-10 border-danger text-white"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        {currentView === 'student' && <StudentPortal apiUrl={API_URL} />}
        {currentView === 'login' && <Login onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />}
        {currentView === 'faculty' && <FacultyPortal token={token} apiUrl={API_URL} />}
        {currentView === 'admin' && <AdminPortal token={token} apiUrl={API_URL} />}
        {currentView === 'superadmin' && <SuperAdminPortal token={token} apiUrl={API_URL} />}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-white" style={{ background: 'linear-gradient(90deg, #1ca9c9, #0047ab)' }}>
        <p className="m-0 text-muted small">
          © 2026 Karmaveer Bhaurao Patil Institute of Management Studies and Research, Satara.
        </p>
        <p className="m-0 text-muted small mt-1">
          Designed by Aditya Ajay Kamble. Powered by Django & React.
        </p>
      </footer>


      {/* Global Conversational Chatbot Widget */}
      <ChatbotWidget apiUrl={API_URL} />
    </div>
  );
}
